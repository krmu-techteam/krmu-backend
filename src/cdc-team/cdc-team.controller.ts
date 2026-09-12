import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCdcTeamDto } from './create.cdc-team';
import { CdcTeamService } from './cdc-team.service';

@Controller('cdc-team')
export class CdcTeamController {
  constructor(private readonly cdcTeamService: CdcTeamService) {}

  /** 
   * Get paginated CDC Team list.
   *
   * @param page - Current page number.
   * @param limit - Number of records per page.
   * @param search - Search by name, designation, or email.
   * @param status - Filter by published/draft status.
   * @param id - Filter by CDC Team ID.
   */
  @Get()
  async getCDCTeamCards(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('status') status?: 'published' | 'draft',
    @Query('id') id?: number,
  ) {
    return this.cdcTeamService.getCDCTeamCards(
      Number(page),
      Number(limit),
      search,
      status,
      id ? Number(id) : undefined,
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
  createCDCTeam(
    @Body() body: CreateCdcTeamDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.cdcTeamService.createCdcTeam(body, file);
  }
}
