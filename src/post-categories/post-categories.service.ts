import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import {
  CountResult,
  PostCategory,
  PostCategoryResponse,
} from './post-categories.type';

// import { PostCategoriesRepository } from './post-categories.repository';
import { DatabaseService } from '../database/database.service';
import { CreatePostCategoryDto } from './create-post-category.dto';
import { PostCategoriesRepository } from './post-categories.repository';
import { UpdatePostCategoryDto } from './update-post-category.dto';

@Injectable()
export class PostCategoriesService {
  constructor(
    private readonly postCategoryRepository: PostCategoriesRepository,
    private readonly databaseService: DatabaseService,
  ) {}

  async getPostCategories(
    page = 1,
    limit = 10,
    search = '',
    taxonomy?: string,
    id?: number,
    status?: 'published' | 'draft',
  ): Promise<PostCategoryResponse> {
    // Validate pagination
    page = Math.max(1, Math.floor(Number(page) || 1));
    limit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 10)));

    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: unknown[] = [];

    // Filter by category ID
    if (id !== undefined) {
      params.push(id);
      conditions.push(`id = $${params.length}`);
    }

    // Filter by taxonomy
    if (taxonomy) {
      params.push(taxonomy);
      conditions.push(`taxonomy = $${params.length}`);
    }

    // Filter by status
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    // Search categories
    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      const searchParam = `$${params.length}`;

      conditions.push(`
      (
        name ILIKE ${searchParam}
        OR slug ILIKE ${searchParam}
        OR description ILIKE ${searchParam}
      )
    `);
    }

    // Build WHERE clause
    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Fetch count and categories concurrently
    const [countResult, categoryResult] = await Promise.all([
      this.databaseService.query(
        `
        SELECT COUNT(*)::int AS total
        FROM post_categories
        ${whereClause}
      `,
        params,
      ),

      this.databaseService.query(
        `
        SELECT
          id,
          name,
          slug,
          description,
          category_url,
          taxonomy,
          parent_id,
          seo_title,
          seo_description,
          status
        FROM post_categories
        ${whereClause}
        ORDER BY name ASC
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `,
        [...params, limit, offset],
      ),
    ]);

    const total = Number((countResult.rows[0] as CountResult).total);

    return {
      data: categoryResult.rows as PostCategory[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getPostCategoryOptions(fields = 'id,name') {
    const allowedFields = ['id', 'name', 'slug', 'parent_id'];

    const requestedFields = fields.split(',').map((field) => field.trim());

    const selectedFields = requestedFields.filter((field) =>
      allowedFields.includes(field),
    );

    if (selectedFields.length === 0) {
      throw new BadRequestException('Invalid fields');
    }

    const result = await this.databaseService.query(
      `
      SELECT ${selectedFields.join(', ')}
      FROM post_categories
      WHERE deleted_at IS NULL
      ORDER BY name ASC
    `,
    );

    return result.rows;
  }
  async createPostCategory(dto: CreatePostCategoryDto) {
    try {
      const category =
        await this.postCategoryRepository.createPostCategory(dto);

      return {
        success: true,
        message: 'Post category created successfully.',
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

  async getPostCategoryById(id: number) {
    const category = await this.postCategoryRepository.findById(id);

    if (!category) {
      throw new NotFoundException(`Post category with ID ${id} not found`);
    }
    return {
      success: true,
      data: category,
    };
  }

  async updatePostCategory(id: number, dto: UpdatePostCategoryDto) {
    try {
      const category = await this.postCategoryRepository.updatePostCategory(
        id,
        dto,
      );

      console.log('category', category);

      return {
        success: true,
        message: 'Post Updated created successfully.',
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

  async remove(id: number) {
    const deleted = await this.postCategoryRepository.softDelete(id);

    if (!deleted) {
      throw new NotFoundException(
        `Post category with ID ${id} not found or already deleted`,
      );
    }

    return {
      success: true,
      message: 'Post category deleted successfully',
    };
  }
}
