import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { db } from '../database/database';
import { CountResult, FacultyCard, FacultyCardResponse } from './faculty.types';
import { CreateFacultyDto } from './create-faculty.dto';
import { ResultSetHeader } from 'mysql2';
// import { MySqlError } from '../common/mysql-error.type';

export type MySqlError = {
  code?: string;
  errno?: number;
  sqlMessage?: string;
};

@Injectable()
export class FacultyService {
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
  async createFaculty(dto: CreateFacultyDto) {
    try {
      const [result] = await db.execute<ResultSetHeader>(
        `
          INSERT INTO faculties (
            school_category_id,
            name,
            slug,
            designation,
            qualification,
            image_url,
            emails,
            linkedin_profiles,
            interest_areas,
            profile,
            education,
            experience,
            research,
            projects_achievements,
            conferences,
            publications,
            status,
            sort_order
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          dto.school_category_id ?? null,
          dto.name,
          dto.slug,
          dto.designation,
          dto.qualification,
          dto.image_url ?? null,

          JSON.stringify(dto.emails ?? []),
          JSON.stringify(dto.linkedin_profiles ?? []),
          JSON.stringify(dto.interest_areas ?? []),

          dto.profile ?? null,
          dto.education ?? null,
          dto.experience ?? null,
          dto.research ?? null,
          dto.projects_achievements ?? null,
          dto.conferences ?? null,
          dto.publications ?? null,

          dto.status ?? 'published',
          dto.sort_order ?? 0,
        ],
      );

      return {
        success: true,
        message: 'Faculty created successfully',
        data: {
          id: result.insertId,
        },
      };
    } catch (error: unknown) {
      const dbError = error as MySqlError;

      // Duplicate UNIQUE column
      if (dbError.code === 'ER_DUP_ENTRY') {
        throw new ConflictException({
          success: false,
          message: 'Faculty already exists',
          errors: {
            slug: 'This slug is already in use',
          },
        });
      }

      // Log actual error only on server
      console.error('Create faculty database error:', error);

      throw new InternalServerErrorException({
        success: false,
        message: 'Failed to create faculty',
      });
    }
  }
}
