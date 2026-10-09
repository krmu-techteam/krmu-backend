import { Module } from '@nestjs/common';
import { PostCategoriesController } from './post-categories.controller';
import { PostCategoriesService } from './post-categories.service';
import { PostCategoriesRepository } from './post-categories.repository';
import { DatabaseModule } from '../database/database.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [PostCategoriesController],
  providers: [PostCategoriesService, PostCategoriesRepository],
  exports: [PostCategoriesService],
})
export class PostCategoriesModule {}
