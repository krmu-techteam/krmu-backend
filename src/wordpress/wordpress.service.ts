import { Injectable, Logger } from '@nestjs/common';
import { db } from '../database/database';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import * as path from 'path';
import { CloudflareService } from '../cloudfare/cloudflare.service';
import { getFolderFromMimeType } from '../helper/media.helper';

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

  // async getWPData({
  //   type,
  //   table,
  //   mapping,
  //   uploadFields = [],
  // }: {
  //   type: string;
  //   table: string;
  //   mapping: Record<string, string>;
  //   uploadFields?: {
  //     dbColumn: string;
  //     wpField: string | string[];
  //     filename?: (record: any) => string;
  //   }[];
  // }) {
  //   let page = 1;
  //   const perPage = 100;
  //   let totalInserted = 0;

  //   while (true) {
  //     console.log(`Fetching ${type} - Page ${page}`);

  //     const response = await fetch(
  //       `https://wp.krmangalam.edu.in/wp-json/wp/v2/${type}?page=${page}&per_page=${perPage}`,
  //     );

  //     if (!response.ok) {
  //       break;
  //     }

  //     const records = await response.json();

  //     if (!records.length) {
  //       break;
  //     }

  //     // Database columns
  //     const columns = Object.keys(mapping);

  //     // SQL placeholders (?, ?, ?, ...)
  //     const placeholders = columns.map(() => '?').join(',');

  //     // ON DUPLICATE KEY UPDATE
  //     const updates = columns
  //       .filter((c) => c !== 'id')
  //       .map((c) => `${c}=VALUES(${c})`)
  //       .join(',');

  //     const sql = `
  //     INSERT INTO ${table}
  //     (${columns.join(',')})
  //     VALUES (${placeholders})
  //     ON DUPLICATE KEY UPDATE
  //     ${updates}
  //   `;

  //     for (const record of records) {
  //       const row: Record<string, any> = {};

  //       for (const column of columns) {
  //         row[column] = this.getNestedValue(record, mapping[column]);
  //       }
  //       for (const uploadField of uploadFields) {
  //         const mediaId = this.getNestedValue(record, uploadField.wpField);

  //         if (!mediaId) continue;

  //         try {
  //           const filename = uploadField.filename
  //             ? uploadField.filename(record)
  //             : `${record.id}-${record.slug}`;

  //           row[uploadField.dbColumn] = await this.uploadWordpressAsset(
  //             type,
  //             mediaId,
  //             filename,
  //           );
  //         } catch (err) {
  //           console.error(
  //             `Failed uploading ${uploadField.dbColumn} for ${record.slug}`,
  //             err,
  //           );

  //           row[uploadField.dbColumn] = null;
  //         }
  //       }

  //       const values = columns.map((column) => row[column]);

  //       await db.execute(sql, values);

  //       totalInserted++;
  //     }

  //     console.log(
  //       `Page ${page}: ${records.length} records inserted into ${table}.`,
  //     );

  //     page++;
  //   }

  //   return {
  //     message: `${type} migration completed.`,
  //     totalInserted,
  //   };
  // }


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
    wpField: string | string[];
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
      console.log(
        `Stopped fetching ${type}. Status: ${response.status}`,
      );
      break;
    }

    const records = await response.json();

    if (!records.length) {
      break;
    }

    /**
     * Include:
     * 1. Normal mapping columns
     * 2. Upload field columns
     */
    const columns = [
      ...new Set([
        ...Object.keys(mapping),
        ...uploadFields.map((field) => field.dbColumn),
      ]),
    ];

    // SQL placeholders (?, ?, ?, ...)
    const placeholders = columns.map(() => '?').join(',');

    // ON DUPLICATE KEY UPDATE
    const updates = columns
      .filter((column) => column !== 'id')
      .map((column) => `${column}=VALUES(${column})`)
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

      /**
       * ----------------------------------------
       * NORMAL WORDPRESS FIELDS
       * ----------------------------------------
       */
      for (const [column, wpPath] of Object.entries(mapping)) {
        row[column] = this.getNestedValue(record, wpPath);
      }

      /**
       * ----------------------------------------
       * UPLOAD WORDPRESS MEDIA TO R2
       * ----------------------------------------
       */
      for (const uploadField of uploadFields) {
        try {
          /**
           * Normalize wpField.
           *
           * "featured_media"
           *
           * becomes:
           *
           * ["featured_media"]
           *
           * while:
           *
           * ["featured_media", "acf.event_images"]
           *
           * stays the same.
           */
          const wpFields = Array.isArray(uploadField.wpField)
            ? uploadField.wpField
            : [uploadField.wpField];

          /**
           * Collect all media IDs.
           *
           * Supports:
           *
           * featured_media: 114925
           *
           * event_images: [
           *   114925,
           *   114931
           * ]
           */
          const mediaIds: (string | number)[] = [];

          for (const wpField of wpFields) {
            const value = this.getNestedValue(record, wpField);

            if (
              value === null ||
              value === undefined ||
              value === ''
            ) {
              continue;
            }

            /**
             * WP field contains array
             *
             * Example:
             * [114925, 114931]
             */
            if (Array.isArray(value)) {
              for (const id of value) {
                if (id !== null && id !== undefined && id !== '') {
                  mediaIds.push(id);
                }
              }
            } else {
              /**
               * WP field contains single ID
               *
               * Example:
               * 114925
               */
              mediaIds.push(value);
            }
          }

          /**
           * No media found
           */
          if (!mediaIds.length) {
            row[uploadField.dbColumn] = null;
            continue;
          }

          /**
           * Upload all media
           */
          const uploadedUrls: string[] = [];

          for (let i = 0; i < mediaIds.length; i++) {
            const mediaId = mediaIds[i];

            const baseFilename = uploadField.filename
              ? uploadField.filename(record)
              : `${record.id}-${record.slug}`;

            /**
             * Avoid same filename when multiple
             * images exist.
             *
             * Example:
             *
             * 123-event-1
             * 123-event-2
             * 123-event-3
             */
            const filename =
              mediaIds.length > 1
                ? `${baseFilename}-${i + 1}`
                : baseFilename;

            try {
              const uploadedUrl =
                await this.uploadWordpressAsset(
                  type,
                  mediaId,
                  filename,
                );

              if (uploadedUrl) {
                uploadedUrls.push(uploadedUrl);
              }
            } catch (error) {
              console.error(
                `Failed uploading media ${mediaId} for ${record.slug}`,
                error,
              );
            }
          }

          /**
           * Nothing successfully uploaded
           */
          if (!uploadedUrls.length) {
            row[uploadField.dbColumn] = null;
            continue;
          }

          /**
           * Single image:
           *
           * https://cdn.../image.webp
           *
           * Multiple images:
           *
           * [
           *   "https://cdn.../1.webp",
           *   "https://cdn.../2.webp"
           * ]
           */
          row[uploadField.dbColumn] =
            uploadedUrls.length === 1
              ? uploadedUrls[0]
              : JSON.stringify(uploadedUrls);
        } catch (error) {
          console.error(
            `Failed processing ${uploadField.dbColumn} for ${record.slug}`,
            error,
          );

          row[uploadField.dbColumn] = null;
        }
      }

      /**
       * ----------------------------------------
       * CREATE VALUES IN COLUMN ORDER
       * ----------------------------------------
       */
      const values = columns.map(
        (column) => row[column] ?? null,
      );

      /**
       * ----------------------------------------
       * INSERT / UPDATE DATABASE
       * ----------------------------------------
       */
      try {
        await db.execute(sql, values);

        totalInserted++;
      } catch (error) {
        console.error(
          `Failed inserting ${record.slug} into ${table}`,
          error,
        );
      }
    }

    console.log(
      `Page ${page}: ${records.length} records processed into ${table}.`,
    );

    page++;
  }

  console.log(
    `Migration completed: ${totalInserted} records processed into ${table}.`,
  );

  return {
    success: true,
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
    imgId: number | string,
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
  mediaId: number | string,
  filename: string,
): Promise<string | null> {
  const media = await this.getMediaById(mediaId);

  if (!media) return null;

  const mimeType = getFolderFromMimeType(media.mimeType);
  const extension = path.extname(media.url);

  const key = `${mimeType}/${type}/${filename}${extension}`;

  // Check if file already exists in R2
  const exists = await this.cloudflareService.fileExists(key);

  if (exists) {
    console.log(`Skipping existing image: ${key}`);

    // Return same URL/path without uploading again
    return this.cloudflareService.getPublicUrl(key);
  }

  // Only download from WordPress when R2 doesn't have it
  const buffer = await this.downloadMedia(media.url);

  return this.cloudflareService.uploadWordpressMedia(key, buffer);
}

//   async uploadWordpressAsset(
//     type: string,
//     mediaId: number,
//     filename: string,
//   ): Promise<string | null> {
//     const media = await this.getMediaById(mediaId);

//     if (!media) return null;

//     const mimeType = getFolderFromMimeType(media.mimeType);

//     const extension = path.extname(media.url);

//     const buffer = await this.downloadMedia(media.url);

//     return this.cloudflareService.uploadWordpressMedia(
//       `${mimeType}/${type}/${filename}${extension}`,
//       buffer,
//     );
//   }
// }
}