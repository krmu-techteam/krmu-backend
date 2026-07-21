import { Controller, Get, Query } from '@nestjs/common';
import { FacultyService } from './faculty.service';

@Controller('faculties')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  async getFacultyCards(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.facultyService.getFacultyCards(Number(page), Number(limit));
  }
}
