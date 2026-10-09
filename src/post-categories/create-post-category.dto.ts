import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreatePostCategoryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsString()
  @IsOptional()
  description?: string;

  //   @IsUrl({ require_tld: true })
  //   @IsOptional()
  //   category_url?: string;

  //   @IsString()
  //   @IsOptional()
  //   @IsNotEmpty()
  //   taxonomy?: string = 'category';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  parent_id?: number = 0;

  // SEO fields
  @IsString()
  @IsOptional()
  seo_title?: string;

  @IsString()
  @IsOptional()
  seo_description?: string;

  @IsEnum(['index', 'noindex'])
  @IsOptional()
  seo_robots_index?: 'index' | 'noindex';

  @IsEnum(['follow', 'nofollow'])
  @IsOptional()
  seo_robots_follow?: 'follow' | 'nofollow';

  @IsEnum(['published', 'draft'])
  @IsOptional()
  status?: 'published' | 'draft';
}
