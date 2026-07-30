import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CatsController } from './cats.controller';
import { ConfigModule } from '@nestjs/config';
import { WordpressModule } from './wordpress/wordpress.module';
import { FacultyModule } from './faculty/faculty.module';
import { CloudflareModule } from './cloudfare/cloudflare.module';
import { NewsEventsModule } from './newsAndEvents/news_events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    WordpressModule,
    FacultyModule,
    CloudflareModule,
    NewsEventsModule,
  ],
  controllers: [AppController, CatsController],
  providers: [AppService],
})
export class AppModule {}
