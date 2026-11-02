import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map(Number);
    }

    return [Number(value)];
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  category_ids!: number[];

  @IsString()
  @IsOptional()
  featured_image?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content!: string;

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

  @IsEnum(['published', 'draft'])
  status!: 'published' | 'draft';
}
