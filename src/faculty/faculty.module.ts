import { Module } from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { FacultyController } from './faculty.controller';

@Module({
  providers: [FacultyService],
  controllers: [FacultyController]
})
export class FacultyModule {}
