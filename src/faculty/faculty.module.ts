import { Module } from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { FacultyController } from './faculty.controller';
import { FacultyRepository } from './faculty.repository';
import { DatabaseModule } from '../database/database.module';
import { CloudflareModule } from '../cloudfare/cloudflare.module';

@Module({
   imports: [DatabaseModule, CloudflareModule],
  providers: [FacultyService, FacultyRepository],
  controllers: [FacultyController],
})
export class FacultyModule {}
