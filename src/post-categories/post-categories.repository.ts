import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService } from '../database/database.service';
import { withTransaction } from '../database/transaction';
import { CreatePostCategoryDto } from './create-post-category.dto';
import { SlugService } from '../common/services/slug.service';

@Injectable()
export class PostCategoriesRepository {
  private readonly table = 'post_categories';

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly slugService: SlugService,
  ) {}

  async createPostCategory(dto: CreatePostCategoryDto) {
    return withTransaction(async (client: PoolClient) => {
      const slug = await this.slugService.generateUniqueSlug(
        dto.slug,
        (candidate) => this.slugExists(candidate, client),
      );
      const payload: Record<string, unknown> = {
        name: dto.name,
        slug,
        description: dto.description ?? null,

        // Backend-managed fields
        taxonomy: 'category',
        category_url: this.generateCategoryUrl(dto.slug),

        parent_id: dto.parent_id ?? 0,

        // Optional SEO fields
        seo_title: dto.seo_title ?? null,
        seo_description: dto.seo_description ?? null,
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
        throw new Error('Created post category could not be retrieved.');
      }

      return category;
    });
  }
  private generateCategoryUrl(slug: string): string {
    return `https://www.krmangalam.edu.in/blog/category/${encodeURIComponent(slug)}/`;
  }

  async create(
    data: Record<string, unknown>,
    client?: PoolClient,
  ): Promise<number | string | undefined> {
    return this.databaseService.insert(this.table, data, client);
  }
  // async create(data: Record<string, any>, client?: PoolClient) {
  //   return this.databaseService.insert(this.table, data, client);
  // }

  async findById(id: number, client?: PoolClient) {
    return this.databaseService.findById(this.table, id, client);
  }

  // async findBySlug(slug: string, client?: PoolClient) {
  //   return this.databaseService.findOne(this.table, 'slug', slug, client);
  // }

  async slugExists(slug: string, client?: PoolClient) {
    return this.databaseService.exists(this.table, 'slug', slug, client);
  }

  async findAll(client?: PoolClient) {
    return this.databaseService.findAll(this.table, 'id', 'DESC', client, true);
  }

  async updatePostCategory(
    id: number,
    data: Record<string, any>,
    client?: PoolClient,
  ) {
    return this.databaseService.update(this.table, id, data, client);
  }

  // async delete(id: number, client?: PoolClient) {
  //   return this.databaseService.delete(this.table, id, client);
  // }

  async softDelete(id: number): Promise<boolean> {
    return this.databaseService.update(this.table, id, {
      deleted_at: new Date(),
    });
  }

  // async findTrash() {
  //   return this.databaseService.findTrash(this.table);
  // }

  // async restore(id: number) {
  //   return this.databaseService.restore(this.table, id);
  // }

  // async permanentDelete(id: number) {
  //   return this.databaseService.delete(this.table, id);
  // }

  // async draft(id: number): Promise<boolean> {
  //   return this.databaseService.update(this.table, id, {
  //     status: 'draft',
  //   });
  // }

  // async publish(id: number): Promise<boolean> {
  //   return this.databaseService.update(this.table, id, {
  //     status: 'published',
  //   });
  // }
}
