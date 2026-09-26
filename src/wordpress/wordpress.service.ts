import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as path from 'path';

import { db } from '../database/database';
import { CloudflareService } from '../cloudfare/cloudflare.service';
import { getFolderFromMimeType } from '../helper/media.helper';

interface MediaResponse {
  source_url: string;
  mime_type: string;
}

@Injectable()
export class WordpressService {
  private readonly logger = new Logger(
    WordpressService.name,
  );

  constructor(
    private readonly http: HttpService,
    private readonly cloudflareService: CloudflareService,
  ) {}

  /**
   * =========================================================
   * GET NESTED VALUE
   * =========================================================
   *
   * Example:
   *
   * getNestedValue(record, 'title.rendered')
   *
   * returns:
   *
   * record.title.rendered
   */
  private getNestedValue(
    obj: any,
    objectPath: string,
  ): any {
    return objectPath
      .split('.')
      .reduce(
        (acc, key) => acc?.[key],
        obj,
      );
  }

  /**
   * =========================================================
   * FETCH WITH TIMEOUT
   * =========================================================
   */
  private async fetchWithTimeout(
    url: string,
    timeout = 30000,
  ): Promise<Response> {
    const controller =
      new AbortController();

    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeout);

    try {
      return await fetch(url, {
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * =========================================================
   * WORDPRESS POSTS MIGRATION
   * =========================================================
   */
  async getWPData({
    type,
    table,
    mapping,
    uploadFields = [],
  }: {
    type: string;
    table: string;

    mapping: Record<
      string,
      string
    >;

    uploadFields?: {
      dbColumn: string;

      wpField:
        | string
        | string[];

      filename?: (
        record: any,
      ) => string;
    }[];
  }) {
    const perPage = 100;

    let page = 1;
    let totalPages = 1;
    let totalProcessed = 0;

    /**
     * =======================================================
     * DATABASE COLUMNS
     * =======================================================
     *
     * Mapping columns:
     *
     * wp_id
     * title
     * slug
     * content
     * ...
     *
     * Upload columns:
     *
     * featured_image
     */
    const columns = [
      ...new Set([
        ...Object.keys(mapping),

        ...uploadFields.map(
          (field) =>
            field.dbColumn,
        ),
      ]),
    ];

    console.log(
      '========================================',
    );

    console.log(
      'STARTING WORDPRESS MIGRATION',
    );

    console.log(
      'TYPE:',
      type,
    );

    console.log(
      'TABLE:',
      table,
    );

    console.log(
      'COLUMNS:',
      columns,
    );

    console.log(
      '========================================',
    );

    /**
     * =======================================================
     * SQL PLACEHOLDERS
     * =======================================================
     */
    const placeholders = columns
      .map(() => '?')
      .join(',');

    /**
     * =======================================================
     * ON DUPLICATE KEY UPDATE
     * =======================================================
     *
     * Don't update:
     *
     * id
     * wp_id
     */
    const updates = columns
      .filter(
        (column) =>
          column !== 'id' &&
          column !== 'wp_id',
      )
      .map(
        (column) =>
          `\`${column}\` = VALUES(\`${column}\`)`,
      )
      .join(',');

    /**
     * =======================================================
     * SQL QUERY
     * =======================================================
     */
    const sql = `
      INSERT INTO \`${table}\`
      (
        ${columns
          .map(
            (column) =>
              `\`${column}\``,
          )
          .join(',')}
      )
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE
      ${updates}
    `;

    console.log(
      'SQL:',
      sql,
    );

    /**
     * =======================================================
     * PAGINATION
     * =======================================================
     */
    while (page <= totalPages) {
      console.log('');
      console.log(
        '========================================',
      );

      console.log(
        `FETCHING PAGE ${page}`,
      );

      console.log(
        '========================================',
      );

      /**
       * WordPress API URL
       */
      const wpUrl =
        `https://wp.krmangalam.edu.in/blog/wp-json/wp/v2/${type}` +
        `?page=${page}&per_page=${perPage}`;

      console.log(
        'WP URL:',
        wpUrl,
      );

      /**
       * =====================================================
       * FETCH WORDPRESS PAGE
       * =====================================================
       */
      let response: Response;

      try {
        response =
          await this.fetchWithTimeout(
            wpUrl,
            30000,
          );
      } catch (error: any) {
        console.error(
          `Failed fetching page ${page}`,
        );

        console.error(
          error?.message ||
            error,
        );

        break;
      }

      /**
       * =====================================================
       * WORDPRESS ERROR
       * =====================================================
       */
      if (!response.ok) {
        const errorText =
          await response.text();

        console.error(
          'WordPress API failed',
        );

        console.error(
          'STATUS:',
          response.status,
        );

        console.error(
          'RESPONSE:',
          errorText,
        );

        break;
      }

      /**
       * =====================================================
       * GET PAGINATION INFORMATION
       * =====================================================
       */
      const wpTotal =
        response.headers.get(
          'X-WP-Total',
        );

      const wpTotalPages =
        response.headers.get(
          'X-WP-TotalPages',
        );

      if (wpTotal) {
        console.log(
          'TOTAL WORDPRESS POSTS:',
          wpTotal,
        );
      }

      if (wpTotalPages) {
        totalPages =
          Number(
            wpTotalPages,
          );

        console.log(
          'TOTAL WORDPRESS PAGES:',
          totalPages,
        );
      }

      /**
       * =====================================================
       * PARSE JSON
       * =====================================================
       */
      let records: any[];

      try {
        records =
          await response.json();
      } catch (error: any) {
        console.error(
          'Failed parsing WordPress JSON',
        );

        console.error(
          error?.message ||
            error,
        );

        break;
      }

      /**
       * =====================================================
       * NO RECORDS
       * =====================================================
       */
      if (
        !Array.isArray(
          records,
        ) ||
        records.length === 0
      ) {
        console.log(
          `No records found on page ${page}`,
        );

        break;
      }

      console.log(
        `Page ${page}: ${records.length} records`,
      );

      /**
       * =====================================================
       * PROCESS EACH WORDPRESS POST
       * =====================================================
       */
      for (const record of records) {
        console.log('');
        console.log(
          '----------------------------------------',
        );

        console.log(
          `PROCESSING WP POST: ${record.id}`,
        );

        console.log(
          `SLUG: ${record.slug}`,
        );

        console.log(
          `FEATURED MEDIA: ${record.featured_media}`,
        );

        console.log(
          '----------------------------------------',
        );

        /**
         * Row that will eventually
         * become DB values.
         */
        const row: Record<
          string,
          any
        > = {};

        /**
         * ===================================================
         * NORMAL WORDPRESS FIELDS
         * ===================================================
         */
        for (const [
          column,
          wpPath,
        ] of Object.entries(
          mapping,
        )) {
          const value =
            this.getNestedValue(
              record,
              wpPath,
            );

          /**
           * Convert arrays to JSON.
           *
           * Example:
           *
           * categories:
           * [1, 5, 10]
           *
           * becomes:
           *
           * "[1,5,10]"
           */
          row[column] =
            Array.isArray(value)
              ? JSON.stringify(
                  value,
                )
              : value;
        }

        console.log(
          'Normal mapping completed:',
          record.id,
        );

        /**
         * ===================================================
         * MEDIA / IMAGE UPLOAD
         * ===================================================
         */
        for (const uploadField of uploadFields) {
          console.log(
            `Processing media field: ${uploadField.dbColumn}`,
          );

          try {
            /**
             * Normalize wpField
             *
             * string:
             *
             * "featured_media"
             *
             * becomes:
             *
             * ["featured_media"]
             */
            const wpFields =
              Array.isArray(
                uploadField.wpField,
              )
                ? uploadField.wpField
                : [
                    uploadField.wpField,
                  ];

            /**
             * All media IDs
             */
            const mediaIds: (
              | string
              | number
            )[] = [];

            /**
             * =================================================
             * COLLECT MEDIA IDS
             * =================================================
             */
            for (const wpField of wpFields) {
              const value =
                this.getNestedValue(
                  record,
                  wpField,
                );

              console.log(
                `WP FIELD ${wpField}:`,
                value,
              );

              /**
               * No value
               */
              if (
                value === null ||
                value ===
                  undefined ||
                value === ''
              ) {
                continue;
              }

              /**
               * Array of media IDs
               */
              if (
                Array.isArray(
                  value,
                )
              ) {
                for (const id of value) {
                  if (
                    id !==
                      null &&
                    id !==
                      undefined &&
                    id !== '' &&
                    Number(id) !== 0
                  ) {
                    mediaIds.push(
                      id,
                    );
                  }
                }
              } else {
                /**
                 * Single media ID
                 */
                if (
                  Number(
                    value,
                  ) !== 0
                ) {
                  mediaIds.push(
                    value,
                  );
                }
              }
            }

            console.log(
              'MEDIA IDS:',
              mediaIds,
            );

            /**
             * =================================================
             * NO MEDIA
             * =================================================
             */
            if (
              mediaIds.length ===
              0
            ) {
              row[
                uploadField.dbColumn
              ] = null;

              console.log(
                'No media found.',
              );

              continue;
            }

            /**
             * =================================================
             * UPLOAD MEDIA
             * =================================================
             */
            const uploadedUrls: string[] =
              [];

            for (
              let i = 0;
              i <
              mediaIds.length;
              i++
            ) {
              const mediaId =
                mediaIds[i];

              /**
               * Filename
               */
              const baseFilename =
                uploadField.filename
                  ? uploadField.filename(
                      record,
                    )
                  : `${record.id}-${record.slug}`;

              /**
               * Multiple images
               *
               * image-1
               * image-2
               * image-3
               */
              const filename =
                mediaIds.length >
                1
                  ? `${baseFilename}-${i + 1}`
                  : baseFilename;

              console.log(
                `Uploading media ${mediaId}`,
              );

              console.log(
                `Filename: ${filename}`,
              );

              try {
                /**
                 * IMPORTANT
                 *
                 * type is passed here because
                 * uploadWordpressAsset uses it
                 * in the R2 key.
                 */
                const uploadedUrl =
                  await this.uploadWordpressAsset(
                    type,
                    mediaId,
                    filename,
                  );

                if (
                  uploadedUrl
                ) {
                  uploadedUrls.push(
                    uploadedUrl,
                  );

                  console.log(
                    'UPLOAD SUCCESS:',
                    uploadedUrl,
                  );
                }
              } catch (error) {
                console.error(
                  `Media ${mediaId} upload failed:`,
                  error,
                );
              }
            }

            /**
             * =================================================
             * SAVE UPLOADED URL
             * =================================================
             */
            if (
              uploadedUrls.length ===
              0
            ) {
              row[
                uploadField.dbColumn
              ] = null;
            } else if (
              uploadedUrls.length ===
              1
            ) {
              /**
               * Single image
               */
              row[
                uploadField.dbColumn
              ] =
                uploadedUrls[0];
            } else {
              /**
               * Multiple images
               */
              row[
                uploadField.dbColumn
              ] =
                JSON.stringify(
                  uploadedUrls,
                );
            }
          } catch (error) {
            console.error(
              `Media processing failed for ${record.id}:`,
              error,
            );

            row[
              uploadField.dbColumn
            ] = null;
          }
        }

        /**
         * ===================================================
         * CREATE VALUES IN COLUMN ORDER
         * ===================================================
         *
         * Example:
         *
         * columns:
         *
         * [
         *   "wp_id",
         *   "title",
         *   "slug",
         *   "featured_image"
         * ]
         *
         * values:
         *
         * [
         *   14622,
         *   "Entrepreneurship Skills",
         *   "entrepreneurship-skills",
         *   "https://cdn..."
         * ]
         */
        const values =
          columns.map(
            (column) =>
              row[column] ??
              null,
          );

        console.log(
          'VALUES PREPARED:',
          record.id,
        );

        /**
         * ===================================================
         * DATABASE INSERT / UPDATE
         * ===================================================
         */
        try {
          console.log(
            `BEFORE DB INSERT: ${record.id}`,
          );

          await db.execute(
            sql,
            values,
          );

          totalProcessed++;

          console.log(
            `AFTER DB INSERT: ${record.id}`,
          );

          console.log(
            `SUCCESS WP ID: ${record.id}`,
          );
        } catch (error) {
          console.error(
            `DATABASE ERROR for WP ID ${record.id}`,
          );

          console.error(
            error,
          );

          console.error(
            'ROW:',
            row,
          );
        }

        console.log(
          `FINISHED WP POST: ${record.id}`,
        );
      }

      /**
       * =====================================================
       * PAGE COMPLETE
       * =====================================================
       */
      console.log('');

      console.log(
        `PAGE ${page}/${totalPages} COMPLETED`,
      );

      page++;
    }

    /**
     * =======================================================
     * MIGRATION COMPLETE
     * =======================================================
     */
    console.log('');
    console.log(
      '========================================',
    );

    console.log(
      'WORDPRESS MIGRATION COMPLETED',
    );

    console.log(
      'TOTAL PROCESSED:',
      totalProcessed,
    );

    console.log(
      'TOTAL PAGES:',
      totalPages,
    );

    console.log(
      '========================================',
    );

    return {
      success: true,
      totalProcessed,
      totalPages,
    };
  }

  /**
   * =========================================================
   * SCHOOL CATEGORIES
   * =========================================================
   */
  async getSchoolCategories() {
    const response =
      await fetch(
        'https://truthful-cabbage-82fd27e8f6.strapiapp.com/api/school-categories',
      );

    if (!response.ok) {
      throw new Error(
        'Failed to fetch school categories',
      );
    }

    const { data } =
      await response.json();

    let totalInserted = 0;

    for (const school of data) {
      await db.execute(
        `
        INSERT INTO school_categories
        (
          id,
          school_name,
          slug
        )
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE
          school_name = VALUES(school_name),
          slug = VALUES(slug)
        `,
        [
          school.id,
          school.name,
          school.slug,
        ],
      );

      totalInserted++;
    }

    return {
      message:
        'School categories migrated successfully.',
      totalInserted,
    };
  }

  /**
   * =========================================================
   * GET WORDPRESS MEDIA BY ID
   * =========================================================
   *
   * IMPORTANT:
   *
   * Uses:
   *
   * /wp-json/wp/v2/media/{id}
   *
   * NOT:
   *
   * /posts/{id}
   */
  async getMediaById(
    imgId: number | string,
  ): Promise<{
    url: string;
    mimeType: string;
  } | null> {
    if (
      !imgId ||
      Number(imgId) === 0
    ) {
      return null;
    }

    const url =
      `https://wp.krmangalam.edu.in/blog/wp-json/wp/v2/media/${imgId}` +
      `?_fields=source_url,mime_type`;

    try {
      console.log(
        `Fetching WordPress media API: ${imgId}`,
      );

      const { data } =
        await firstValueFrom(
          this.http.get<MediaResponse>(
            url,
            {
              timeout: 30000,
            },
          ),
        );

      if (
        !data ||
        !data.source_url
      ) {
        this.logger.warn(
          `No source_url found for media ${imgId}`,
        );

        return null;
      }

      console.log(
        `Media API success: ${imgId}`,
      );

      console.log(
        `SOURCE URL: ${data.source_url}`,
      );

      console.log(
        `MIME TYPE: ${data.mime_type}`,
      );

      return {
        url: data.source_url,
        mimeType:
          data.mime_type,
      };
    } catch (error: any) {
      this.logger.error(
        `Media API failed for ${imgId}`,
        error?.message ||
          error,
      );

      return null;
    }
  }

  /**
   * =========================================================
   * DOWNLOAD WORDPRESS MEDIA
   * =========================================================
   */
  async downloadMedia(
    url: string,
  ): Promise<Buffer> {
    try {
      console.log(
        `Downloading media: ${url}`,
      );

      const { data } =
        await firstValueFrom(
          this.http.get(
            url,
            {
              responseType:
                'arraybuffer',

              timeout: 30000,

              maxContentLength:
                50 *
                1024 *
                1024,

              maxBodyLength:
                50 *
                1024 *
                1024,
            },
          ),
        );

      const buffer =
        Buffer.from(data);

      console.log(
        `Downloaded media: ${buffer.length} bytes`,
      );

      return buffer;
    } catch (error: any) {
      this.logger.error(
        `Media download failed: ${url}`,
        error?.message ||
          error,
      );

      throw error;
    }
  }

  /**
   * =========================================================
   * UPLOAD WORDPRESS ASSET
   * =========================================================
   */
  async uploadWordpressAsset(
    type: string,
    mediaId: number | string,
    filename: string,
  ): Promise<string | null> {
    try {
      console.log('');
      console.log(
        '========================================',
      );

      console.log(
        `START MEDIA: ${mediaId}`,
      );

      console.log(
        `TYPE: ${type}`,
      );

      console.log(
        `FILENAME: ${filename}`,
      );

      console.log(
        '========================================',
      );

      /**
       * =====================================================
       * GET MEDIA INFORMATION
       * =====================================================
       */
      const media =
        await this.getMediaById(
          mediaId,
        );

      if (!media) {
        console.error(
          `Media not found: ${mediaId}`,
        );

        return null;
      }

      console.log(
        `Media found: ${mediaId}`,
      );

      console.log(
        `Media URL: ${media.url}`,
      );

      console.log(
        `MIME Type: ${media.mimeType}`,
      );

      /**
       * =====================================================
       * MIME FOLDER
       * =====================================================
       */
      const mimeFolder =
        getFolderFromMimeType(
          media.mimeType,
        );

      console.log(
        `MIME Folder: ${mimeFolder}`,
      );

      /**
       * =====================================================
       * FILE EXTENSION
       * =====================================================
       */
      let extension = '';

      try {
        extension =
          path.extname(
            new URL(
              media.url,
            ).pathname,
          );
      } catch {
        extension =
          path.extname(
            media.url,
          );
      }

      /**
       * If URL has no extension
       */
      if (!extension) {
        extension =
          this.getExtensionFromMimeType(
            media.mimeType,
          );
      }

      console.log(
        `Extension: ${extension}`,
      );

      /**
       * =====================================================
       * CLEAN FILENAME
       * =====================================================
       */
      const cleanFilename =
        filename
          .replace(
            /[^a-zA-Z0-9_-]/g,
            '-',
          )
          .replace(
            /-+/g,
            '-',
          );

      /**
       * =====================================================
       * R2 KEY
       * =====================================================
       *
       * Example:
       *
       * image/posts/14622-entrepreneurship-skills.jpg
       */
      const key =
        `${mimeFolder}/${type}/${cleanFilename}${extension}`;

      console.log(
        `R2 KEY: ${key}`,
      );

      /**
       * =====================================================
       * CHECK R2
       * =====================================================
       */
      console.log(
        `Checking R2 file: ${key}`,
      );

      let exists = false;

      try {
        exists =
          await this.cloudflareService.fileExists(
            key,
          );
      } catch (error) {
        console.error(
          `R2 fileExists failed for ${key}`,
          error,
        );

        /**
         * If checking existence fails,
         * don't crash entire migration.
         *
         * Continue with upload.
         */
        exists = false;
      }

      console.log(
        `R2 exists: ${exists}`,
      );

      /**
       * =====================================================
       * FILE ALREADY EXISTS
       * =====================================================
       */
      if (exists) {
        console.log(
          `Skipping existing image: ${key}`,
        );

        const publicUrl =
          this.cloudflareService.getPublicUrl(
            key,
          );

        console.log(
          `Existing public URL: ${publicUrl}`,
        );

        return publicUrl;
      }

      /**
       * =====================================================
       * DOWNLOAD FROM WORDPRESS
       * =====================================================
       */
      console.log(
        `Downloading from WordPress...`,
      );

      const buffer =
        await this.downloadMedia(
          media.url,
        );

      if (
        !buffer ||
        buffer.length === 0
      ) {
        console.error(
          `Empty buffer for media ${mediaId}`,
        );

        return null;
      }

      console.log(
        `Download completed: ${buffer.length} bytes`,
      );

      /**
       * =====================================================
       * UPLOAD TO R2
       * =====================================================
       */
      console.log(
        `Uploading to R2: ${key}`,
      );

      const uploadedUrl =
        await this.cloudflareService.uploadWordpressMedia(
          key,
          buffer,
        );

      console.log(
        `R2 upload completed: ${key}`,
      );

      console.log(
        `PUBLIC URL: ${uploadedUrl}`,
      );

      return uploadedUrl;
    } catch (error: any) {
      console.error(
        `Failed processing WordPress media ${mediaId}`,
      );

      console.error(
        error?.message ||
          error,
      );

      return null;
    }
  }

  /**
   * =========================================================
   * MIME TYPE -> EXTENSION
   * =========================================================
   */
  private getExtensionFromMimeType(
    mimeType: string,
  ): string {
    const mimeExtensions: Record<
      string,
      string
    > = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'image/svg+xml': '.svg',
      'image/avif': '.avif',

      'video/mp4': '.mp4',
      'video/webm': '.webm',

      'application/pdf': '.pdf',
    };

    return (
      mimeExtensions[
        mimeType
      ] || ''
    );
  }
}