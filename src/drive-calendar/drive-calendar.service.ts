import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateDriveCalendarDto } from './drive-calendar.team';
import { DatabaseService } from '../database/database.service';
import { CloudflareService } from '../cloudfare/cloudflare.service';
import { DriveCalendarRepository } from './drive-calendar.repository';
import { PoolConnection } from 'mysql2/promise';
import {
  CountResult,
  DriveCalendar,
  DriveCalendarResponse,
} from './drive-calendar.types';
import { db } from '../database/database';

@Injectable()
export class DriveCalendarService {
  constructor(
    private readonly driveCalendarRepository: DriveCalendarRepository,
    private readonly cloudflareService: CloudflareService,
    private readonly databaseService: DatabaseService,
  ) {}

  async getDriveCalendar(
    page = 1,
    limit = 10,
    search = '',
    status?: 'published' | 'draft',
    id?: number,
  ): Promise<DriveCalendarResponse> {
    /**
     * Validate pagination values.
     */
    page = Math.max(1, Number(page));
    limit = Math.min(100, Math.max(1, Number(limit)));

    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];

    /**
     * Soft-deleted drive calendars
     * should never appear in the normal list.
     */
    conditions.push('deleted_at IS NULL');

    /**
     * Filter by drive calendar ID.
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
     * Search drive calendar.
     *
     * Search by:
     * - Drive ID
     * - Company
     * - Drive Type
     * - Schools Eligible
     * - Engagement Type
     * - Job Roles
     */
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;

      conditions.push(`
      (
        drive_id LIKE ?
        OR company LIKE ?
        OR drive_type LIKE ?
        OR schools_eligible LIKE ?
        OR engagement_type LIKE ?
        OR job_roles LIKE ?
      )
    `);

      params.push(
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
        searchTerm,
      );
    }

    /**
     * Build WHERE clause.
     */
    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    /**
     * Run count and data queries simultaneously.
     */
    const [countResult, driveCalendarResult] = await Promise.all([
      db.query(
        `
        SELECT COUNT(*) AS total
        FROM drive_calendar
        ${whereClause}
      `,
        params,
      ),

      db.query(
        `
        SELECT
          id,
          drive_id,
          company,
          float_date,
          drive_date,
          drive_type,
          schools_eligible,
          engagement_type,
          job_roles,
          jd_link,
          detailed_ctc_offered,
          ctc_offered_lpa,
          students_registered,
          students_appeared,
          selected,
          created_at,
          updated_at,
          status,
          deleted_at
        FROM drive_calendar
        ${whereClause}
        ORDER BY
          drive_date IS NULL ASC,
          drive_date DESC
        LIMIT ? OFFSET ?
      `,
        [...params, limit, offset],
      ),
    ]);

    const [countRows] = countResult;
    const [driveCalendarRows] = driveCalendarResult;

    const total = (countRows as CountResult[])[0].total;

    return {
      data: driveCalendarRows as DriveCalendar[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createDriveCalendar(dto: CreateDriveCalendarDto) {
    try {
      const payload = {
        drive_id: dto.drive_id,
        company: dto.company,
        float_date: dto.float_date || null,
        drive_date: dto.drive_date || null,
        drive_type: dto.drive_type,
        schools_eligible: dto.schools_eligible || null,
        engagement_type: dto.engagement_type,
        job_roles: dto.job_roles || null,
        jd_link: dto.jd_link || null,
        detailed_ctc_offered: dto.detailed_ctc_offered || null,
        ctc_offered_lpa: dto.ctc_offered_lpa || null,
        students_registered: dto.students_registered ?? 0,
        students_appeared: dto.students_appeared ?? 0,
        selected: dto.selected ?? 0,
        status: dto.status ?? 'published',
      };

      const createDriveCalendar = await this.databaseService.transaction(
        async (connection: PoolConnection) => {
          const insertId = await this.driveCalendarRepository.create(
            payload,
            connection,
          );

          return this.driveCalendarRepository.findById(insertId, connection);
        },
      );

      return {
        success: true,
        message: 'Drive Calendar created successfully.',
        data: createDriveCalendar,
      };
    } catch (error) {
      console.error('CREATE DRIVE CALENDAR ERROR:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : 'Failed to create Drive Calendar.',
      );
    }
  }
}
