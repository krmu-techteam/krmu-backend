import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../database/database';
import { CountResult, FacultyCard, FacultyCardResponse } from './faculty.types';
import { CreateFacultyDto } from './create-faculty.dto';
import { validateImage } from '../helper/file-validation.helper';
import { FacultyRepository } from './faculty.repository';
import { generateUniqueSlug } from '../helper/slug.helper';
import { UploadResult } from '../common/interfaces/upload-result.interface';
import { CloudflareService } from '../cloudfare/cloudflare.service';
import { DatabaseService } from '../database/database.service';
import { PoolConnection } from 'mysql2/promise';
import { UpdateFacultyDto } from './update-faculty.dto';

@Injectable()
export class FacultyService {
  constructor(
    private readonly facultyRepository: FacultyRepository,
    private readonly cloudflareService: CloudflareService,
    private readonly databaseService: DatabaseService,
  ) {}

  async getFacultyCards(
    page = 1,
    limit = 10,
    search = '',
    status?: 'published' | 'draft',
  ): Promise<FacultyCardResponse> {
    /**
     * Validate pagination values.
     */
    page = Math.max(1, Number(page));
    limit = Math.min(100, Math.max(1, Number(limit)));

    const offset = (page - 1) * limit;

    /**
     * Base WHERE condition.
     *
     * Soft-deleted faculty should never appear
     * in the normal faculty list.
     */
    let whereClause = `
    WHERE deleted_at IS NULL
  `;

    const params: (string | number)[] = [];

    /**
     * Filter by status.
     */
    if (status) {
      whereClause += `
      AND status = ?
    `;

      params.push(status);
    }

    /**
     * Search faculty.
     */
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;

      whereClause += `
      AND (
        name LIKE ?
        OR designation LIKE ?
        OR qualification LIKE ?
      )
    `;

      params.push(searchTerm, searchTerm, searchTerm);
    }

    /**
     * Run count and faculty queries simultaneously.
     */
    const [countResult, facultyResult] = await Promise.all([
      db.query(
        `
      SELECT COUNT(*) AS total
      FROM faculties
      ${whereClause}
      `,
        params,
      ),

      db.query(
        `
      SELECT
        id,
        name,
        slug,
        designation,
        image_url,
        qualification,
        status
      FROM faculties
      ${whereClause}
      ORDER BY name ASC
      LIMIT ? OFFSET ?
      `,
        [...params, limit, offset],
      ),
    ]);

    const [countRows] = countResult;
    const [facultyRows] = facultyResult;

    const total = (countRows as CountResult[])[0].total;

    return {
      data: facultyRows as FacultyCard[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async createFaculty(dto: CreateFacultyDto, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please upload at least one image.');
    }
    validateImage(file);
    const slug = await generateUniqueSlug(dto.name, (slug) =>
      this.facultyRepository.slugExists(slug),
    );

    const uploadedImage = await this.uploadImage(file, 'faculty');
    const payload = this.preparePayload(dto, slug, uploadedImage);

    try {
      const createFaculty = await this.databaseService.transaction(
        async (connection: PoolConnection) => {
          const insertId = await this.facultyRepository.create(
            payload,
            connection,
          );

          return this.facultyRepository.findById(insertId, connection);
        },
      );

      return {
        success: true,
        message: 'Faculty created successfully.',
        data: createFaculty,
      };
    } catch (error) {
      await this.rollbackImage(uploadedImage.key);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create Faculty.');
    }
  }

  async updateFaculty(
    id: number,
    dto: UpdateFacultyDto,
    file?: Express.Multer.File,
  ) {
    /**
     * Check faculty exists.
     */
    const existingFaculty = await this.facultyRepository.findById(id);

    if (!existingFaculty) {
      throw new NotFoundException('Faculty not found.');
    }

    /**
     * Validate new image if provided.
     */
    if (file) {
      validateImage(file);
    }

    let uploadedImage: { key: string; url: string } | null = null;

    try {
      /**
       * Prepare update payload.
       */
      const payload: Record<string, any> = {
        ...dto,
      };

      /**
       * Generate new slug only when name changes.
       */
      if (dto.name && dto.name !== existingFaculty.name) {
        const slug = await generateUniqueSlug(dto.name, (slug) =>
          this.facultyRepository.slugExists(slug),
        );

        payload.slug = slug;
      }

      /**
       * Upload new image if provided.
       */
      if (file) {
        uploadedImage = await this.uploadImage(file, 'faculty');

        payload.image_url = uploadedImage.url;
      }
      console.log('image url', uploadedImage);

      /**
       * Update faculty inside transaction.
       */
      const updatedFaculty = await this.databaseService.transaction(
        async (connection: PoolConnection) => {
          const updated = await this.facultyRepository.update(
            id,
            payload,
            connection,
          );

          if (!updated) {
            throw new BadRequestException('Failed to update faculty.');
          }

          return this.facultyRepository.findById(id, connection);
        },
      );

      return {
        success: true,
        message: 'Faculty updated successfully.',
        data: updatedFaculty,
      };
    } catch (error) {
      /**
       * If a new image was uploaded but database update failed,
       * remove the newly uploaded image.
       */
      if (uploadedImage) {
        await this.rollbackImage(uploadedImage.key);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update Faculty.');
    }
  }

  async deleteFaculty(id: number) {
    const deleted = await this.facultyRepository.softDelete(id);

    if (!deleted) {
      throw new NotFoundException('Faculty not found');
    }
    return {
      success: true,
      message: 'Faculty deleted successfully',
    };
  }

  /**
   * Permanent Delete
   *
   * @param id
   * @returns
   */
  async permanentDeleteFaculty(id: number) {
    const deleted = await this.facultyRepository.permanentDelete(id);
    if (!deleted) {
      throw new NotFoundException('Faculty not found');
    }
    return {
      success: true,
      message: 'Faculty permanently deleted',
    };
  }

  /**
   * Get Trash
   */
  async getTrash() {
    return this.facultyRepository.findTrash();
  }

  /**
   * Restore Faculty
   * @param id
   * @returns
   */
  async restoreFaculty(id: number) {
    return this.facultyRepository.restore(id);
  }

  async draftFaculty(id: number) {
    return this.facultyRepository.draft(id);
  }
  async publishFaculty(id: number) {
    return this.facultyRepository.publish(id);
  }

  /**
   * Delete uploaded image
   * Used when SQL transaction fails
   */
  private async rollbackImage(key?: string | null): Promise<void> {
    if (!key) {
      return;
    }

    try {
      await this.cloudflareService.deleteFiles([key]);
    } catch (error) {
      /**
       * Don't throw another exception.
       * Database failure is more important.
       *
       * Just log the error.
       */
      console.error('Failed to rollback uploaded image.', error);
    }
  }
  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    try {
      return await this.cloudflareService.uploadFile(file, folder);
    } catch (error) {
      console.error('Image upload failed:', error);

      throw new InternalServerErrorException('Image upload failed.');
    }
  }

  /**
   * Prepare faculty payload for database
   */
  private preparePayload(
    dto: CreateFacultyDto,
    slug: string,
    uploadedImage: UploadResult | null,
  ) {
    return {
      school_category_id: dto.school_category_id ?? null,

      name: dto.name,

      slug,

      designation: dto.designation,

      qualifications: dto.qualifications,

      image_url: uploadedImage?.url ?? null,

      emails: JSON.stringify(dto.emails ?? []),

      linkedin_profiles: JSON.stringify(dto.linkedin_profiles ?? []),

      interest_areas: JSON.stringify(dto.interest_areas ?? []),

      profile: dto.profile ?? null,

      education: dto.education ?? null,

      experience: dto.experience ?? null,

      research: dto.research ?? null,

      projects_achievements: dto.projects_achievements ?? null,

      conferences: dto.conferences ?? null,

      publications: dto.publications ?? null,

      status: dto.status ?? 'published',

      sort_order: dto.sort_order ?? 0,
    };
  }
}
