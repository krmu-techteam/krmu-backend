import { Module } from '@nestjs/common';

import { NewsEventsController } from './news_events.controller';
import { NewsEventsService } from './news_events.service';
import { NewsEventsRepository } from './news_events.repository';
import { CloudflareModule } from 'src/cloudfare/cloudflare.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule, CloudflareModule],
  controllers: [NewsEventsController],
  providers: [NewsEventsService, NewsEventsRepository],
  exports: [NewsEventsService],
})
export class NewsEventsModule {}
