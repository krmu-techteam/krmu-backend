import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './create-blog.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateBlogDto } from './update-blog.dto';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  async getBlogPosts(
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search = '',
    @Query('status') status?: 'published' | 'draft',
    @Query('id') id?: string,
  ) {
    return this.blogService.getBlogs(
      Number(page),
      Number(limit),
      search,
      status,
      id ? Number(id) : undefined,
    );
  }

  @Post()
  @UseInterceptors(FileInterceptor('featured_image'))
  createBlogPost(
    @Body() dto: CreateBlogDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // console.log('========== CREATE BLOG ==========');

    // console.log('BLOG DTO:', dto);

    // console.log('BLOG FILE:', file);

    // if (file) {
    //   console.log('FILE NAME:', file.originalname);
    //   console.log('FILE SIZE:', file.size);
    //   console.log('FILE MIME TYPE:', file.mimetype);
    //   console.log('FILE BUFFER:', file.buffer);
    // } else {
    //   console.log('NO FILE RECEIVED');
    // }

    return this.blogService.createBlogPost(dto, file);
  }

  /**
   * Soft delete a faculty member.
   *
   * Moves the faculty member to trash by setting `deleted_at`.
   * The record remains in the database and can be restored later.
   *
   * @param id - Faculty ID.
   * @returns Soft deletion result.
   */
  @Delete(':id')
  deleteBlogPost(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.softDeleteBlog(id);
  }

  @Get(':id')
  async getBlogById(@Param('id') id: string) {
    return this.blogService.getBlogById(Number(id));
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('featured_image'))
  UpdateBlog(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateBlogDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.blogService.updateBlog(id, body, file);
  }
}
