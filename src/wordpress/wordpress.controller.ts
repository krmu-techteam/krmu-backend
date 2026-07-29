import { Controller, Get, Param } from '@nestjs/common';
import { WordpressService } from './wordpress.service';

@Controller('wordpress')
export class WordpressController {
  constructor(private readonly wordpressService: WordpressService) {}

  // @Get('test-image/:id')
  // async test(@Param('id') id: string) {
  //   return this.wordpressService.testImageUpload(Number(id));
  // }

  @Get('faculty')
  async migrateFaculty() {
    return this.wordpressService.getWPData({
      type: 'faculty',
      table: 'faculties',
      mapping: {
        wp_id: 'id',
        name: 'title.rendered',
        slug: 'slug',
        description: 'content.rendered',
        qualification: 'acf.staff-qualification',
        designation: 'acf.staff_designation',
        image_url: 'featured_media',
      },
      uploadFields: [
        {
          dbColumn: 'image_url',
          wpField: 'featured_media',
        },
      ],
    });
  }
  @Get('school-categories')
  async migrateSchoolCategories() {
    return this.wordpressService.getSchoolCategories();
  }

  @Get('news-events')
  async migrateNewsEvents() {
    return this.wordpressService.getWPData({
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
        image_url: 'featured_media',
        featured_images: 'acf.event_images'
      },
      uploadFields: [
        {
          dbColumn: 'image_url',
          wpField: ['acf.event_images'],
        },
      ],
    });
  }
}
