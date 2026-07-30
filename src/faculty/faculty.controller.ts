import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { CreateFacultyDto } from './create-faculty.dto';

@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  async getFacultyCards(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.facultyService.getFacultyCards(Number(page), Number(limit));
  }

  @Post()
  createFaculty(@Body() body: CreateFacultyDto) {
    return this.facultyService.createFaculty(body);
  }
}
