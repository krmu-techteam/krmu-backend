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
        old_content: 'content.rendered',
        qualifications: 'acf.staff-qualification',
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
        featured_images: 'acf.event_images',
      },
      uploadFields: [
        {
          dbColumn: 'image_url',
          wpField: ['acf.event_images'],
        },
      ],
    });
  }

  @Get('posts')
  async migratePosts() {
    return this.wordpressService.getWPData({
      type: 'posts',
      table: 'posts',

      mapping: {
        wp_id: 'id',
        title: 'title.rendered',
        slug: 'slug',
        content: 'content.rendered',
        excerpt: 'excerpt.rendered',
        date: 'date',
        date_gmt: 'date_gmt',
        status: 'status',
        type: 'type',
        link: 'link',
        author: 'author',
        featured_media: 'featured_media',
        comment_status: 'comment_status',
        ping_status: 'ping_status',
        sticky: 'sticky',
        template: 'template',
        format: 'format',
        categories: 'categories',
        tags: 'tags',
      },

      // TEMPORARILY REMOVE THIS
      uploadFields: [],
    });
  } 

  // @Get('posts')
  // async migratePosts() {
  //   return this.wordpressService.getWPData({
  //     type: 'posts',
  //     table: 'posts',

  //     mapping: {
  //       wp_id: 'id',

  //       title: 'title.rendered',

  //       slug: 'slug',

  //       content: 'content.rendered',

  //       excerpt: 'excerpt.rendered',

  //       date: 'date',

  //       date_gmt: 'date_gmt',

  //       status: 'status',

  //       type: 'type',

  //       link: 'link',

  //       author: 'author',

  //       featured_media: 'featured_media',

  //       comment_status: 'comment_status',

  //       ping_status: 'ping_status',

  //       sticky: 'sticky',

  //       template: 'template',

  //       format: 'format',

  //       categories: 'categories',

  //       tags: 'tags',
  //     },

  //     uploadFields: [
  //       {
  //         dbColumn: 'featured_image',

  //         wpField: 'featured_media',

  //         filename: (record) => `${record.id}-${record.slug}`,
  //       },
  //     ],
  //   });
  // }
}
