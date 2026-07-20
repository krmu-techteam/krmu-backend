import { Injectable } from '@nestjs/common';
import { db } from '../database/database';

@Injectable()
export class MigrationService {
  async getFaculty() {
    let page = 1;
    const perPage = 100;
    let totalInserted = 0;

    while (true) {
      console.log(`Fetching page ${page}...`);
      const response = await fetch(
        `https://wp.krmangalam.edu.in/wp-json/wp/v2/faculty?page=${page}&per_page=${perPage}&_fields=title`,
      );
      // Stop if page doesn't exist
      if (!response.ok) {
        break;
      }
      const faculties = await response.json();
      // No more data
      if (faculties.length === 0) {
        break;
      }

      for (const faculty of faculties) {
        await db.execute(`INSERT INTO faculties (name) VALUES (?)`, [
          faculty.title.rendered,
        ]);
        totalInserted++;
      }
      console.log(`Page ${page}: ${faculties.length} records inserted.`);

      page++;
    }
    return {
      message: 'Migration completed.',
      totalInserted,
    };
  }
}
