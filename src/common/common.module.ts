import { Module } from '@nestjs/common';
import { SlugService } from './services/slug.service';

@Module({
  providers: [SlugService],
  exports: [SlugService],
})
export class CommonModule {}
