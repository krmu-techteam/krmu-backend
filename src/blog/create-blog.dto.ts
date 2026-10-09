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
  image?: string;

  @IsString()
  @IsNotEmpty()
  content!: string;

  @IsOptional()
  @IsString()
  seo_title?: string;

  @IsOptional()
  @IsString()
  seo_description?: string;

  @IsOptional()
  @IsEnum(['index', 'noindex'])
  robot_index?: 'index' | 'noindex';

  @IsOptional()
  @IsEnum(['follow', 'nofollow'])
  robot_follow?: 'follow' | 'nofollow';

  @IsEnum(['published', 'draft'])
  status!: 'published' | 'draft';
}
