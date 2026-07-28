import { Injectable, Logger } from '@nestjs/common';
import { db } from '../database/database';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { CloudflareService } from 'src/cloudfare/cloudflare.service';
import * as path from 'path';
import { getFolderFromMimeType } from 'src/helper/media.helper';

interface MediaResponse {
  guid: {
    rendered: string;
  };
  mime_type: string;
}

@Injectable()
export class WordpressService {
  private readonly logger = new Logger(WordpressService.name);

  constructor(
    private readonly http: HttpService,
    private readonly cloudflareService: CloudflareService,
  ) {}

  private getNestedValue(obj: any, path: string) {
    return path.split('.').reduce((acc, key) => acc?.[key], obj);
  }

  async getWPData({
    type,
    table,
    mapping,
    uploadFields = [],
  }: {
    type: string;
    table: string;
    mapping: Record<string, string>;
    uploadFields?: {
      dbColumn: string;
      wpField: string;
      filename?: (record: any) => string;
    }[];
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
        const row: Record<string, any> = {};

        for (const column of columns) {
          row[column] = this.getNestedValue(record, mapping[column]);
        }

        for (const uploadField of uploadFields) {
          const mediaId = this.getNestedValue(record, uploadField.wpField);

          if (!mediaId) continue;

          try {
            const filename = uploadField.filename
              ? uploadField.filename(record)
              : `${record.id}-${record.slug}`;

            row[uploadField.dbColumn] = await this.uploadWordpressAsset(
              type,
              mediaId,
              filename,
            );
          } catch (err) {
            console.error(
              `Failed uploading ${uploadField.dbColumn} for ${record.slug}`,
              err,
            );

            row[uploadField.dbColumn] = null;
          }
        }

        const values = columns.map((column) => row[column]);

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

  async getSchoolCategories() {
    const response = await fetch(
      'https://truthful-cabbage-82fd27e8f6.strapiapp.com/api/school-categories',
    );

    if (!response.ok) {
      throw new Error('Failed to fetch school categories');
    }

    const { data } = await response.json();

    let totalInserted = 0;

    for (const school of data) {
      await db.execute(
        `
      INSERT INTO school_categories (id, school_name, slug)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        school_name = VALUES(school_name),
        slug = VALUES(slug)
      `,
        [school.id, school.name, school.slug],
      );

      totalInserted++;
    }

    return {
      message: 'School categories migrated successfully.',
      totalInserted,
    };
  }

  async getMediaById(
    imgId: number,
  ): Promise<{ url: string; mimeType: string } | null> {
    if (!imgId) return null;

    try {
      const { data } = await firstValueFrom(
        this.http.get<MediaResponse>(
          `https://wp.krmangalam.edu.in/wp-json/wp/v2/media/${imgId}?_fields=guid,mime_type`,
        ),
      );

      return {
        url: data.guid.rendered,
        mimeType: data.mime_type,
      };
    } catch (error) {
      this.logger.warn(`Media not found for ID ${imgId}`);
      return null;
    }
  }

  async downloadMedia(url: string): Promise<Buffer> {
    const { data } = await firstValueFrom(
      this.http.get(url, {
        responseType: 'arraybuffer',
      }),
    );

    return Buffer.from(data);
  }

  async uploadWordpressAsset(
    type: string,
    mediaId: number,
    filename: string,
  ): Promise<string | null> {
    const media = await this.getMediaById(mediaId);

    if (!media) return null;

    const mimeType = getFolderFromMimeType(media.mimeType);

    const extension = path.extname(media.url);

    const buffer = await this.downloadMedia(media.url);

    return this.cloudflareService.uploadWordpressMedia(
      `${mimeType}/${type}/${filename}${extension}`,
      buffer,
    );
  }
}
