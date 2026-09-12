import { Module } from '@nestjs/common';
import { CloudflareModule } from '../cloudfare/cloudflare.module';
import { DatabaseModule } from '../database/database.module';
import { DriveCalendarController } from './drive-calendar.controller';
import { DriveCalendarService } from './drive-calendar.service';
import { DriveCalendarRepository } from './drive-calendar.repository';

@Module({
  imports: [CloudflareModule, DatabaseModule],

  controllers: [DriveCalendarController],

  providers: [DriveCalendarService, DriveCalendarRepository],

  exports: [DriveCalendarService],
})
export class DriveCalendarModule {}
