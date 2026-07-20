import { Controller, Get } from '@nestjs/common';
import { MigrationService } from './migration.service';

@Controller('migration')
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Get()
  async migrate() {
    return this.migrationService.getFaculty();
  }

  @Get('faculty')
  async migrateFaculty() {
    return this.migrationService.getWPData({
      type: 'faculty',
      table: 'faculties',
      mapping: {
        id: 'id',
        name: 'title.rendered',
      },
    });
  }
  @Get('schools')
  async migrateSchools() {
    return this.migrationService.getWPData({
      type: 'schools',
      table: 'schools',
      mapping: {
        id: 'id',
        name: 'title.rendered',
      },
    });
  }
  @Get('news-events')
  async migrateNewsEvents() {
    return this.migrationService.getWPData({
      type: 'events-and-news',
      table: 'news_events',
      mapping: {
        id: 'id',
        title: 'title.rendered',
        slug: 'slug',
        content: 'content.rendered',
        excerpt: 'excerpt.rendered',
        link: 'link',
        published_at: 'date',
      },
    });
  }
}
