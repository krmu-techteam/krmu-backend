import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FacultyService } from './faculty.service';
import { CreateFacultyDto } from './create-faculty.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateFacultyDto } from './update-faculty.dto';

@Controller('faculty')
export class FacultyController {
  constructor(private readonly facultyService: FacultyService) {}

  /**
   * Get paginated faculty list.
   *
   * @param page - Current page number.
   * @param limit - Number of records per page.
   * @returns Paginated list of active faculty members.
   */
  @Get()
  async getFacultyCards(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('status') status?: 'published' | 'draft',
  ) {
    return this.facultyService.getFacultyCards(
      Number(page),
      Number(limit),
      search,
      status,
    );
  }

  /**
   * Create a new faculty member.
   *
   * @param body - Faculty data from the request body.
   * @param file - Uploaded faculty image.
   * @returns The newly created faculty record.
   */
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  createFaculty(
    @Body() body: CreateFacultyDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.facultyService.createFaculty(body, file);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image'))
  updateFaculty(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateFacultyDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.facultyService.updateFaculty(id, body, file);
  }

  /**
   * Permanently delete a faculty member.
   *
   * This removes the faculty record permanently from the database.
   * The record cannot be restored after this operation.
   *
   * @param id - Faculty ID.
   * @returns Permanent deletion result.
   */
  @Delete(':id/permanent-delete')
  permanentDeleteFaculty(@Param('id', ParseIntPipe) id: number) {
    return this.facultyService.permanentDeleteFaculty(id);
  }

  /**
   * Soft delete a faculty member.
   *
   * Moves the faculty member to trash by setting `deleted_at`.
   * The record remains in the database and can be restored later.
   *
   * @param id - Faculty ID.
   * @returns Soft deletion result.
   */
  @Delete(':id')
  deleteFaculty(@Param('id', ParseIntPipe) id: number) {
    return this.facultyService.deleteFaculty(id);
  }

  /**
   * Get all faculty members in trash.
   *
   * Returns faculty records where `deleted_at` is not null.
   *
   * @returns List of soft-deleted faculty members.
   */
  @Get('trash')
  getTrash() {
    return this.facultyService.getTrash();
  }

  /**
   * Restore a faculty member from trash.
   *
   * Restores a soft-deleted faculty member by setting
   * `deleted_at` back to null.
   *
   * @param id - Faculty ID.
   * @returns Faculty restoration result.
   */
  @Patch(':id/restore')
  restoreFaculty(@Param('id', ParseIntPipe) id: number) {
    return this.facultyService.restoreFaculty(id);
  }

  /**
   *
   * @param id
   * @returns
   */
  @Patch(':id/draft')
  draftFaculty(@Param('id', ParseIntPipe) id: number) {
    return this.facultyService.draftFaculty(id);
  }

  /**
   *
   * @param id
   * @returns
   */
  @Patch(':id/publish')
  publishFaculty(@Param('id', ParseIntPipe) id: number) {
    return this.facultyService.publishFaculty(id);
  }
}
