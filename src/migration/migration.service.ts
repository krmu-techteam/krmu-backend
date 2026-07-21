import { Injectable } from '@nestjs/common';
import { db } from '../database/database';

@Injectable()
export class MigrationService {
  private getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }

  async getWPData({
    type,
    table,
    mapping,
  }: {
    type: string;
    table: string;
    mapping: Record<string, string>;
  }) {
    let page = 1;
    const perPage = 100;
    let totalInserted = 0;

    while (true) {
      console.log(`Fetching ${type} - Page ${page}`);

      const response = await fetch(
        `https://wp.krmangalam.edu.in/wp-json/wp/v2/${type}?page=${page}&per_page=${perPage}`,
      );

      if (!response.ok) {
        break;
      }

      const records = await response.json();

      if (!records.length) {
        break;
      }

      // Database columns
      const columns = Object.keys(mapping);

      // SQL placeholders (?, ?, ?, ...)
      const placeholders = columns.map(() => '?').join(',');

      // ON DUPLICATE KEY UPDATE
      const updates = columns
        .filter((c) => c !== 'id')
        .map((c) => `${c}=VALUES(${c})`)
        .join(',');

      const sql = `
      INSERT INTO ${table}
      (${columns.join(',')})
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE
      ${updates}
    `;

      for (const record of records) {
        const values = columns.map((column) =>
          this.getNestedValue(record, mapping[column]),
        );

        await db.execute(sql, values);

        totalInserted++;
      }

      console.log(
        `Page ${page}: ${records.length} records inserted into ${table}.`,
      );

      page++;
    }

    return {
      message: `${type} migration completed.`,
      totalInserted,
    };
  }
}
