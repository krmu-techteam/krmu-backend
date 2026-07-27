import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WordpressService } from './wordpress.service';
import { WordpressController } from './wordpress.controller';
import { CloudflareModule } from '../cloudfare/cloudflare.module';

@Module({
  imports: [
    HttpModule,
    CloudflareModule, // ✅
  ],
  controllers: [WordpressController],
  providers: [WordpressService],
  exports: [WordpressService],
})
export class WordpressModule {}
