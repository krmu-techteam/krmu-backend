import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { db } from '../database/database';
import { CountResult, FacultyCard, FacultyCardResponse } from './faculty.types';
import { CreateFacultyDto } from './create-faculty.dto';
import { ResultSetHeader } from 'mysql2';
import { CreateNewsEventsDto } from '../newsAndEvents/dto/create-news_events.dto';
import {
  validateImage,
  validateImages,
} from '../helper/file-validation.helper';
import { FacultyRepository } from './faculty.repository';
import { generateUniqueSlug } from '../helper/slug.helper';
import { UploadResult } from '../common/interfaces/upload-result.interface';
import { CloudflareService } from '../cloudfare/cloudflare.service';
import { DatabaseService } from '../database/database.service';
import { PoolConnection } from 'mysql2/promise';
// import { MySqlError } from '../common/mysql-error.type
//
//
// ';

export type MySqlError = {
  code?: string;
  errno?: number;
  sqlMessage?: string;
};

@Injectable()
export class FacultyService {
  constructor(
    private readonly facultyRepository: FacultyRepository,
    private readonly cloudflareService: CloudflareService,
    private readonly databaseService: DatabaseService,
  ) {}

  async getFacultyCards(page = 1, limit = 10): Promise<FacultyCardResponse> {
    // Ensure valid values
    page = Math.max(1, Number(page));
    limit = Math.min(100, Math.max(1, Number(limit)));

    const offset = (page - 1) * limit;

    const [countResult, facultyResult] = await Promise.all([
      db.query(`SELECT COUNT(*) AS total FROM faculties`),
      db.query(
        `
        SELECT
          id,
          name,
          slug,
          designation,
          image_url,
          qualification
        FROM faculties
        ORDER BY name ASC
        LIMIT ? OFFSET ?
        `,
        [limit, offset],
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
    const slug = await generateUniqueSlug(
      dto.name,
      (slug) => this.facultyRepository.slugExists(slug),
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
        message: 'News/Event created successfully.',
        data: createFaculty,
      };
    } catch (error) {
      await this.rollbackImage(uploadedImage.key);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create News/Event.');
    }
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
