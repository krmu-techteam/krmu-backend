import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateFacultyDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  school_category_id?: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  // @IsString()
  // @IsNotEmpty()
  // slug!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  designation!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  qualifications!: string;

  // @IsString()
  // @IsOptional()
  // image_url?: string;

  // Multiple emails
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];

    if (Array.isArray(value)) return value;

    return value
      .split(',')
      .map((email: string) => email.trim())
      .filter(Boolean);
  })
  @IsArray()
  @IsEmail({}, { each: true })
  emails?: string[];

  // Multiple LinkedIn profiles
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];

    if (Array.isArray(value)) return value;

    return value
      .split(',')
      .map((url: string) => url.trim())
      .filter(Boolean);
  })
  @IsArray()
  @IsUrl({}, { each: true })
  linkedin_profiles?: string[];

  // Multiple interest areas
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];

    if (Array.isArray(value)) return value;

    return value
      .split(',')
      .map((item: string) => item.trim())
      .filter(Boolean);
  })
  @IsArray()
  @IsString({ each: true })
  interest_areas?: string[];

  // Accordion content
  @IsString()
  @IsOptional()
  profile?: string;

  @IsString()
  @IsOptional()
  project_achievements?: string;


  @IsString()
  @IsOptional()
  education?: string;

  @IsString()
  @IsOptional()
  experience?: string;

  @IsString()
  @IsOptional()
  research?: string;

  @IsString()
  @IsOptional()
  projects_achievements?: string;

  @IsString()
  @IsOptional()
  conferences?: string;

  @IsString()
  @IsOptional()
  publications?: string;

  @IsEnum(['published', 'draft'])
  @IsOptional()
  status?: 'published' | 'draft';

  @IsInt()
  @Min(0)
  @IsOptional()
  sort_order?: number;
}
