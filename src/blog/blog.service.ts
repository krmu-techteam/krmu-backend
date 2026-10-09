import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Blog, BlogResponse, CountResult } from './blog.type';
import { DatabaseService } from '../database/database.service';
import { CreateBlogDto } from './create-blog.dto';
import { BlogRepository } from './blog.repository';

@Injectable()
export class BlogService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly postRepository: BlogRepository,
  ) {}

  async getBlogs(
    page = 1,
    limit = 10,
    search = '',
    status?: 'published' | 'draft',
    id?: number,
  ): Promise<BlogResponse> {
    // Validate pagination
    page = Math.max(1, Math.floor(Number(page) || 1));
    limit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 10)));

    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    // Filter by blog ID
    if (id !== undefined) {
      params.push(id);
      conditions.push(`id = $${params.length}`);
    }

    // Filter by status
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    // Search blogs
    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      const searchParam = `$${params.length}`;

      conditions.push(`
      (
        title ILIKE ${searchParam}
        OR slug ILIKE ${searchParam}
        OR content ILIKE ${searchParam}
        OR excerpt ILIKE ${searchParam}
      )
    `);
    }

    // Build WHERE clause
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch count and blogs concurrently
    const [countResult, blogResult] = await Promise.all([
      this.databaseService.query(
        `
        SELECT COUNT(*)::int AS total
        FROM posts
        ${whereClause}
      `,
        params,
      ),

      this.databaseService.query(
        `
        SELECT
          id,
          wp_id,
          title,
          slug,
          excerpt,
          content,
          categories,
          seo_title,
          seo_description,
          status,
          created_at,
          updated_at
        FROM posts
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `,
        [...params, limit, offset],
      ),
    ]);

    const total = Number((countResult.rows[0] as CountResult).total);

    return {
      data: blogResult.rows as Blog[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createBlogPost(
    dto: CreateBlogDto,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const category = await this.postRepository.createPost(dto);

      return {
        success: true,
        message: 'Post created successfully.',
        data: category,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create post category.');
    }
  }
}
