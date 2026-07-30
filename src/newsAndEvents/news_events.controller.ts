import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';

import { CreateNewsEventsDto } from './dto/create-news_events.dto';
import { NewsEventsService } from './news_events.service';

@Controller('news-events')
export class NewsEventsController {
  constructor(private readonly newsEventsService: NewsEventsService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('featured_images', 10))
  async create(
    @Body() dto: CreateNewsEventsDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.newsEventsService.create(dto, files);
  }
}
