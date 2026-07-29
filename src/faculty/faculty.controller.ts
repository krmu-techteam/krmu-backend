import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FacultyService } from './faculty.service';

@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  async getFacultyCards(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.facultyService.getFacultyCards(Number(page), Number(limit));
  }

  @Post()
  createFaculty(@Body() body: { name: string }) {
    console.log('BODY:', body);

    return this.facultyService.createFaculty(body);
  }
}
