import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './create-blog.dto';
import { FileInterceptor } from '@nestjs/platform-express';

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
  @UseInterceptors(FileInterceptor('image'))
  createBlogPost(
    @Body() dto: CreateBlogDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('Received DTO:', dto);
    console.log('Received File:', file);
    // return 'Blog post creation logic goes here';
    return this.blogService.createBlogPost(dto);
  }
}
