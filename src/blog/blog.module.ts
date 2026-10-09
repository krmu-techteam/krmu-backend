import { Module } from '@nestjs/common';

import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';
import { BlogRepository } from './blog.repository';

import { DatabaseModule } from '../database/database.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [DatabaseModule, CommonModule],
  controllers: [BlogController],
  providers: [BlogService, BlogRepository],
})
export class BlogModule {}
