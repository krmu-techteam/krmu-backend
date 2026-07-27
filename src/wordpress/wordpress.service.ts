import { Injectable, Logger } from '@nestjs/common';
import { db } from '../database/database';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { CloudflareService } from 'src/cloudfare/cloudflare.service';

interface MediaIdResponse {
  guid: {
    rendered: string;
  };
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
        const row: any = {};

        for (const column of columns) {
          row[column] = this.getNestedValue(record, mapping[column]);
        }

        if (record.featured_media) {
          row.image = await this.uploadWordpressMedia(
            record.featured_media,
            `${record.slug}.jpg`,
          );
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

  async getMediaById(imgId: number): Promise<string | null> {
    if (!imgId) return null;

    try {
      const { data } = await firstValueFrom(
        this.http.get<MediaIdResponse>(
          `https://wp.krmangalam.edu.in/wp-json/wp/v2/media/${imgId}?_fields=guid`,
        ),
      );

      return data?.guid?.rendered ?? null;
    } catch (error) {
      this.logger.warn(`Image not found for ID ${imgId}`);
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

  async uploadWordpressMedia(
    mediaId: number,
    filename: string,
  ): Promise<string | null> {
    const mediaUrl = await this.getMediaById(mediaId);

    if (!mediaUrl) {
      return null;
    }

    const buffer = await this.downloadMedia(mediaUrl);

    return await this.cloudflareService.uploadWordpressMedia(filename, buffer);
  }

  async testImageUpload(mediaId: number) {
    console.log('Step 1: Fetching media URL...');

    const mediaUrl = await this.getMediaById(mediaId);

    console.log('Media URL:', mediaUrl);

    if (!mediaUrl) {
      throw new Error('Media URL not found');
    }

    console.log('Step 2: Downloading image...');

    const buffer = await this.downloadMedia(mediaUrl);

    console.log('Downloaded Buffer Size:', buffer.length);

    console.log('Step 3: Uploading to Cloudflare...');

    const cloudflareUrl = await this.cloudflareService.uploadWordpressMedia(
      `${mediaId}.jpg`,
      buffer,
    );

    console.log('Cloudflare URL:', cloudflareUrl);

    return {
      mediaUrl,
      cloudflareUrl,
    };
  }
}
