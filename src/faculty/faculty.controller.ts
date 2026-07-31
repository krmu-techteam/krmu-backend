import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { CreateFacultyDto } from './create-faculty.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  @Get()
  async getFacultyCards(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.facultyService.getFacultyCards(Number(page), Number(limit));
  }

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  createFaculty(
    @Body() body: CreateFacultyDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.facultyService.createFaculty(body, file);
  }
}
