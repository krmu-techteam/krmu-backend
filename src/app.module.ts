import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatsController } from './cats.controller';

import { WordpressModule } from './wordpress/wordpress.module';
import { FacultyModule } from './faculty/faculty.module';
import { CloudflareModule } from './cloudfare/cloudflare.module';
import { NewsEventsModule } from './newsAndEvents/news_events.module';
import { CdcTeamModule } from './cdc-team/cdc-team.module';
import { DriveCalendarModule } from './drive-calendar/drive-calendar.module';
import { DatabaseController } from './database-controller/database-controller.controller';
import { DatabaseService } from './database/database.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    WordpressModule,
    FacultyModule,
    CdcTeamModule,
    CloudflareModule,
    NewsEventsModule,
    DriveCalendarModule,
  ],

  controllers: [AppController, CatsController, DatabaseController],

  providers: [AppService, DatabaseService],
})
export class AppModule {}
