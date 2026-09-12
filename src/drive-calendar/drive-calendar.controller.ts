import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { DriveCalendarService } from './drive-calendar.service';
import { CreateDriveCalendarDto } from './drive-calendar.team';

@Controller('drive-calendar')
export class DriveCalendarController {
  constructor(private readonly driveCalendarService: DriveCalendarService) {}

  /**
   * Get paginated faculty list.
   *
   * @param page - Current page number.
   * @param limit - Number of records per page.
   * @returns Paginated list of active faculty members.
   */
  @Get()
  async getDriveCalendars(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search = '',
    @Query('status') status?: 'published' | 'draft',
    @Query('id') id?: number,
  ) {
    return this.driveCalendarService.getDriveCalendar(
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
   * @returns The newly created faculty record.
   */
  @Post()
  createCDCTeam(@Body() body: CreateDriveCalendarDto) {
    return this.driveCalendarService.createDriveCalendar(body);
  }
}
