import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PostCategoriesService } from './post-categories.service';
import { CreatePostCategoryDto } from './create-post-category.dto';
import { UpdatePostCategoryDto } from './update-post-category.dto';

@Controller('post-category')
export class PostCategoriesController {
  constructor(private readonly postCategoryService: PostCategoriesService) {}

  @Get()
  async getPostCategories(
    @Query('page') page = '1',
    @Query('limit') limit = '30',
    @Query('search') search = '',
    @Query('taxonomy') taxonomy?: string,
    @Query('id') id?: string,
  ) {
    return this.postCategoryService.getPostCategories(
      Number(page),
      Number(limit),
      search,
      taxonomy,
      id ? Number(id) : undefined,
    );
  }

  @Get('options')
  async getPostCategoryOptions(@Query('fields') fields?: string) {
    return this.postCategoryService.getPostCategoryOptions(fields);
  }

  @Post()
  createPostCategory(@Body() dto: CreatePostCategoryDto) {
    return this.postCategoryService.createPostCategory(dto);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.postCategoryService.getPostCategoryById(id);
  }
  /**
   * PATCH /post-category/:id
   * Update an existing category.
   */
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePostCategoryDto,
  ) {
    return this.postCategoryService.updatePostCategory(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.postCategoryService.remove(id);
  }
}
