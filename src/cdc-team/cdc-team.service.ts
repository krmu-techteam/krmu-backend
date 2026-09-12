import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CloudflareService } from '../cloudfare/cloudflare.service';
import { CdcTeamRepository } from './cdc-team.repository';
import { CreateCdcTeamDto } from './create.cdc-team';
import { UploadResult } from '../common/interfaces/upload-result.interface';
import { validateImage } from '../helper/file-validation.helper';
import { PoolConnection } from 'mysql2/promise';
import { CountResult } from '../faculty/faculty.types';
import { CdcTeamCard, CdcTeamCardResponse } from './cdc-team.types';
import { db } from '../database/database';

@Injectable()
export class CdcTeamService {
  constructor(
    private readonly cdcTeamRepository: CdcTeamRepository,
    private readonly cloudflareService: CloudflareService,
    private readonly databaseService: DatabaseService,
  ) {}
  async getCDCTeamCards(
    page = 1,
    limit = 10,
    search = '',
    status?: 'published' | 'draft',
    id?: number,
  ): Promise<CdcTeamCardResponse> {
    /**
     * Validate pagination values.
     */
    page = Math.max(1, Number(page));
    limit = Math.min(100, Math.max(1, Number(limit)));

    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    /**
     * Filter by CDC Team ID.
     */
    if (id !== undefined) {
      conditions.push('id = ?');
      params.push(id);
    }

    /**
     * Filter by status.
     */
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    /**
     * Search CDC Team.
     */
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;

      conditions.push(`
      (
        name LIKE ?
        OR designation LIKE ?
        OR email LIKE ?
      )
    `);

      params.push(searchTerm, searchTerm, searchTerm);
    }

    /**
     * Build WHERE clause.
     */
    const whereClause = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    /**
     * Run count and CDC Team queries simultaneously.
     */
    const [countResult, cdcTeamResult] = await Promise.all([
      db.query(
        `
        SELECT COUNT(*) AS total
        FROM cdc_team
        ${whereClause}
      `,
        params,
      ),

      db.query(
        `
        SELECT
          id,
          name,
          designation,
          email,
          image,
          sort_order,
          status
        FROM cdc_team
        ${whereClause}
        ORDER BY sort_order ASC, name ASC
        LIMIT ? OFFSET ?
      `,
        [...params, limit, offset],
      ),
    ]);

    const [countRows] = countResult;
    const [cdcTeamRows] = cdcTeamResult;

    const total = (countRows as CountResult[])[0].total;

    return {
      data: cdcTeamRows as CdcTeamCard[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async createCdcTeam(dto: CreateCdcTeamDto, file?: Express.Multer.File) {
    let uploadedImage: UploadResult | null = null;

    try {
      // 1. Validate and upload image
      if (file) {
        validateImage(file);

        uploadedImage = await this.uploadImage(file, 'cdc-team');
      }

      // 2. Prepare DB payload
      const payload = {
        name: dto.name,
        designation: dto.designation,
        email: dto.email || null,
        image: uploadedImage?.url ?? dto.image ?? null,
        sort_order: dto.sort_order ?? 0,
        status: dto.status ?? 'published', // ✅ add this
      };

   

      // 3. Insert into database
      const createCdcTeam = await this.databaseService.transaction(
        async (connection: PoolConnection) => {
          const insertId = await this.cdcTeamRepository.create(
            payload,
            connection,
          );

        

          return this.cdcTeamRepository.findById(insertId, connection);
        },
      );

      // 4. Success
      return {
        success: true,
        message: 'CDC Team member created successfully.',
        data: createCdcTeam,
      };
    } catch (error) {
      // 5. If DB fails after image upload,
      // remove uploaded image
      if (uploadedImage) {
        await this.rollbackImage(uploadedImage.key);
      }

      console.error('CREATE CDC TEAM ERROR:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to create CDC Team member.',
      );
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
}
