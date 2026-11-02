import { Module } from '@nestjs/common';
import { SlugService } from './services/slug.service';
import { UploadService } from './services/upload.service';
import { CloudflareModule } from '../cloudfare/cloudflare.module';

@Module({
  imports: [CloudflareModule],
  providers: [SlugService, UploadService],
  exports: [SlugService, UploadService],
})
export class CommonModule {}
