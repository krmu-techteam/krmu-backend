import { Injectable } from '@nestjs/common';
import { SlugService } from '../common/services/slug.service';
import { DatabaseService } from '../database/database.service';
import { CreateBlogDto } from './create-blog.dto';
import { PoolClient } from 'pg';
import { withTransaction } from '../database/transaction';
import { UpdateBlogDto } from './update-blog.dto';

@Injectable()
export class BlogRepository {
  private readonly table = 'posts';

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly slugService: SlugService,
  ) {}

  async createPost(dto: CreateBlogDto) {
    return withTransaction(async (client: PoolClient) => {
      const slug = await this.slugService.generateUniqueSlug(
        dto.slug,
        (candidate) => this.slugExists(candidate, client),
      );
      const payload: Record<string, unknown> = {
        title: dto.title,
        slug,
        content: dto.content ?? null,

        featured_image: dto.featured_image ?? null,
        // Backend-managed fields
        categories: JSON.stringify(dto.category_ids),

        // Optional SEO fields
        seo_title: dto.seo_title ?? null,
        seo_description: dto.seo_description ?? null,
        seo_keywords: dto.seo_keywords ?? null,
        seo_robots_index: dto.seo_robots_index ?? null,
        seo_robots_follow: dto.seo_robots_follow ?? null,
        // Status
        status: dto.status ?? 'draft',
      };

      const insertId = await this.create(payload, client);

      if (insertId === undefined || insertId === null) {
        throw new Error('Post category insert did not return an ID.');
      }

      const category = await this.databaseService.findById(
        this.table,
        insertId,
        client,
      );

      if (!category) {
        throw new Error('Created post could not be retrieved.');
      }

      return category;
    });
  }
  async create(
    data: Record<string, unknown>,
    client?: PoolClient,
  ): Promise<number | string | undefined> {
    return this.databaseService.insert(this.table, data, client);
  }
  async slugExists(slug: string, client?: PoolClient) {
    return this.databaseService.exists(this.table, 'slug', slug, client);
  }

  async softDelete(id: number): Promise<boolean> {
    return this.databaseService.update(this.table, id, {
      deleted_at: new Date(),
    });
  }

  /**
   * Find faculty by ID
   */
  async findById(id: number, connection?: PoolClient) {
    return this.databaseService.findById(this.table, id, connection);
  }

  /**
   * Update blog.
   */
  async update(id: number, data: UpdateBlogDto, connection?: PoolClient) {
    const updateData: Record<string, unknown> = {
      ...data,
    };

    /**
     * Convert category_ids to categories JSON.
     */
    if (data.category_ids !== undefined) {
      updateData.categories = JSON.stringify(data.category_ids);

      delete updateData.category_ids;
    }

    return this.databaseService.update(this.table, id, updateData, connection);
  }
}
