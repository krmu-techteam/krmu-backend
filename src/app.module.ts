import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatsController } from './cats.controller';

import { CloudflareModule } from './cloudfare/cloudflare.module';
import { DatabaseController } from './database-controller/database-controller.controller';
import { DatabaseService } from './database/database.service';
import { PostCategoriesController } from './post-categories/post-categories.controller';
import { PostCategoriesService } from './post-categories/post-categories.service';
import { DatabaseModule } from './database/database.module';
import { PostCategoriesModule } from './post-categories/post-categories.module';
import { BlogModule } from './blog/blog.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    CloudflareModule,
    DatabaseModule,
    PostCategoriesModule,
    BlogModule,
  ],

  controllers: [AppController, CatsController, DatabaseController],

  providers: [AppService],
})
export class AppModule {}
