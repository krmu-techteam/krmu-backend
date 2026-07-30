import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { PoolConnection } from 'mysql2/promise';

import { DatabaseService } from 'src/database/database.service';

import { generateSlug } from 'src/helper/slug.helper';
import { validateImages } from 'src/helper/file-validation.helper';

import { CreateNewsEventsDto } from './dto/create-news_events.dto';
import { NewsEventsRepository } from './news_events.repository';
import { CloudflareService } from 'src/cloudfare/cloudflare.service';
import { UploadResult } from 'src/common/interfaces/upload-result.interface';

@Injectable()
export class NewsEventsService {
  constructor(
    private readonly newsRepository: NewsEventsRepository,
    private readonly cloudflareService: CloudflareService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Create News/Event
   */
  async create(dto: CreateNewsEventsDto, files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Please upload at least one image.');
    }

    validateImages(files);

    const slug = await this.generateUniqueSlug(dto.title);

    const uploadedImages = await this.uploadImages(files);

    const payload = this.preparePayload(dto, slug, uploadedImages);

    try {
      const createdNews = await this.databaseService.transaction(
        async (connection: PoolConnection) => {
          const insertId = await this.newsRepository.create(
            payload,
            connection,
          );

          return this.newsRepository.findById(insertId, connection);
        },
      );

      return {
        success: true,
        message: 'News/Event created successfully.',
        data: createdNews,
      };
    } catch (error) {
      await this.rollbackImages(uploadedImages.map((image) => image.key));

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create News/Event.');
    }
  }
  /**
   * Generate a unique WordPress-style slug
   *
   * Example:
   * AI Workshop
   * ai-workshop
   * ai-workshop-2
   * ai-workshop-3
   */
  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = generateSlug(title);

    let slug = baseSlug;

    let counter = 2;

    while (await this.newsRepository.slugExists(slug)) {
      slug = `${baseSlug}-${counter}`;

      counter++;
    }

    return slug;
  }

  /**
   * Upload multiple images to Cloudflare R2
   *
   * Returns:
   * [
   *   {
   *      key,
   *      url
   *   }
   * ]
   */
  private async uploadImages(
    files: Express.Multer.File[],
  ): Promise<UploadResult[]> {
    const uploadedImages: UploadResult[] = [];

    try {
      for (const file of files) {
        const uploaded = await this.cloudflareService.uploadFile(
          file,
          'news-events',
        );

        uploadedImages.push(uploaded);
      }

      return uploadedImages;
    } catch (error) {
      /**
       * Rollback already uploaded files
       */

      if (uploadedImages.length > 0) {
        await this.cloudflareService.deleteFiles(
          uploadedImages.map((item) => item.key),
        );
      }

      throw new InternalServerErrorException('Image upload failed.');
    }
  }

  /**
   * Delete uploaded images
   * Used when SQL transaction fails
   */
  private async rollbackImages(keys: string[]): Promise<void> {
    if (!keys.length) {
      return;
    }

    try {
      await this.cloudflareService.deleteFiles(keys);
    } catch (error) {
      /**
       * Don't throw another exception.
       * Database failure is more important.
       *
       * Just log the error.
       */
      console.error('Failed to rollback uploaded images.', error);
    }
  }

  /**
   * Prepare payload for database
   */
  private preparePayload(
    dto: CreateNewsEventsDto,
    slug: string,
    uploadedImages: UploadResult[],
  ) {
    return {
      title: dto.title,

      slug,

      content: dto.content ?? '',

      excerpt: dto.excerpt ?? '',

      link: dto.link ?? null,

      image_url: JSON.stringify(uploadedImages.map((image) => image.url)),

      featured_images: JSON.stringify(uploadedImages.map((image) => image.key)),

      published_at: dto.published_at,

      modified_at: dto.modified_at ?? null,

      event_date: dto.event_date ?? null,

      event_location: dto.event_location ?? null,
    };
  }
}
