import { Injectable } from '@nestjs/common';
import { db } from '../database/database';
import {
  CountResult,
  FacultyCard,
  FacultyCardResponse,
} from './faculty.types';

@Injectable()
export class FacultyService {
  async getFacultyCards(
    page = 1,
    limit = 10,
  ): Promise<FacultyCardResponse> {
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
}