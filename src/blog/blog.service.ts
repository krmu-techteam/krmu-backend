import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Blog, BlogResponse, CountResult } from './blog.type';
import { DatabaseService } from '../database/database.service';
import { CreateBlogDto } from './create-blog.dto';
import { BlogRepository } from './blog.repository';
import { UpdateBlogDto } from './update-blog.dto';
import { validateImage } from '../helper/file-validation.helper';
import { generateUniqueSlug } from '../helper/slug.helper';
import { PoolClient } from 'pg';
import { UploadResult } from '../common/interfaces/upload-result.interface';
import { UploadService } from '../common/services/upload.service';

@Injectable()
export class BlogService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly postRepository: BlogRepository,
    private readonly uploadService: UploadService,
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

    // Always exclude soft-deleted blogs
    const conditions: string[] = ['deleted_at IS NULL'];
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
    const whereClause = `WHERE ${conditions.join(' AND ')}`;

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

  async getBlogById(id: number) {
    const result = await this.databaseService.query(
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
        featured_image,
        seo_description,
        seo_keywords,
        seo_robots_index,
        seo_robots_follow,
        status,
        created_at,
        updated_at
      FROM posts
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
      [id],
    );

    const blog = result.rows[0] as Blog;

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return {
      data: blog,
    };
  }

  async createBlogPost(
    dto: CreateBlogDto,
    file?: Express.Multer.File,
  ): Promise<{ success: boolean; message: string; data?: any }> {
    let uploadedImage: UploadResult | null = null;

    try {
      // Upload image to Cloudflare R2
      if (file) {
        validateImage(file);

        uploadedImage = await this.uploadService.uploadImage(file, 'blog');
      }

      // Prepare payload
      const payload = {
        ...dto,
        featured_image: uploadedImage?.url,
      };

      // Create blog post
      const postData = await this.postRepository.createPost(payload);

      return {
        success: true,
        message: 'Post created successfully.',
        data: postData,
      };
    } catch (error) {
      // If DB creation fails, delete uploaded image from R2
      if (uploadedImage) {
        await this.uploadService.rollbackImages([uploadedImage.key]);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to create post.');
    }
  }

  async softDeleteBlog(id: number) {
    const deleted = await this.postRepository.softDelete(id);

    if (!deleted) {
      throw new NotFoundException('Blog not found');
    }
    return {
      success: true,
      message: 'Blog deleted successfully',
    };
  }

  async updateBlog(id: number, dto: UpdateBlogDto, file?: Express.Multer.File) {
    console.log('\n========== UPDATE BLOG START ==========');
    console.log('Blog ID:', id);
    console.log('DTO:', dto);
    console.log('FILE:', file?.originalname);

    /**
     * Check blog exists.
     */
    const existingBlog = await this.postRepository.findById(id);

    if (!existingBlog) {
      throw new NotFoundException('Blog not found.');
    }

    let uploadedImage: UploadResult | null = null;

    try {
      /**
       * Prepare update payload.
       */
      const payload: Record<string, any> = {
        ...dto,
      };

      /**
       * Upload new image if provided.
       */
      if (file) {
        validateImage(file);

        uploadedImage = await this.uploadService.uploadImage(file, 'blog');

        payload.featured_image = uploadedImage.url;
      }

      /**
       * Generate new slug only when title changes.
       */
      if (dto.title && dto.title !== existingBlog.title) {
        const slug = await generateUniqueSlug(dto.title, async (slug) => {
          return this.postRepository.slugExists(slug);
        });

        payload.slug = slug;
      }

      console.log('Final update payload:', payload);

      /**
       * Update blog inside transaction.
       */
      const updatedBlog = await this.databaseService.transaction(
        async (connection: PoolClient) => {
          const updated = await this.postRepository.update(
            id,
            payload,
            connection,
          );

          if (!updated) {
            throw new BadRequestException('Failed to update blog.');
          }

          return this.postRepository.findById(id, connection);
        },
      );

      /**
       * DB update successful.
       *
       * Delete old image only after successful DB update.
       */
      if (file && uploadedImage && existingBlog.featured_image) {
        // You need the old R2 key here.
        // See explanation below.
      }

      return {
        success: true,
        message: 'Blog updated successfully.',
        data: updatedBlog,
      };
    } catch (error) {
      /**
       * DB update failed.
       *
       * Delete newly uploaded image from R2.
       */
      if (uploadedImage) {
        await this.uploadService.rollbackImages([uploadedImage.key]);
      }

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to update blog.');
    }
  }
}
