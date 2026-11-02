import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateBlogDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  slug?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(Number);
    }

    return [Number(value)];
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  category_ids?: number[];

  @IsString()
  @IsOptional()
  featured_image?: File;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  content?: string;

  @IsOptional()
  @IsString()
  seo_title?: string;

  @IsOptional()
  @IsString()
  seo_description?: string;

  @IsOptional()
  @IsString()
  seo_keywords?: string;

  @IsOptional()
  @IsEnum(['index', 'noindex'])
  seo_robots_index?: 'index' | 'noindex';

  @IsOptional()
  @IsEnum(['follow', 'nofollow'])
  seo_robots_follow?: 'follow' | 'nofollow';

  @IsOptional()
  @IsEnum(['published', 'draft'])
  status?: 'published' | 'draft';
}
