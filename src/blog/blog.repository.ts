import { Injectable } from '@nestjs/common';
import { SlugService } from '../common/services/slug.service';
import { DatabaseService } from '../database/database.service';
import { CreateBlogDto } from './create-blog.dto';
import { PoolClient } from 'pg';
import { withTransaction } from '../database/transaction';

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

        // Backend-managed fields
        categories: dto.category_ids,

        // Optional SEO fields
        seo_title: dto.seo_title ?? null,
        seo_description: dto.seo_description ?? null,
        seo_robots_index: dto.robot_index ?? null,
        seo_robots_follow: dto.robot_follow ?? null,
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
        throw new Error('Created post category could not be retrieved.');
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
}
