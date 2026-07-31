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

export class CreateFacultyDto {
  @IsInt()
  @IsOptional()
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

  @IsString()
  @IsOptional()
  image_url?: string;

  // Multiple emails
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  emails?: string[];

  // Multiple LinkedIn profiles
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  linkedin_profiles?: string[];

  // Multiple interest areas
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  interest_areas?: string[];

  // Accordion content
  @IsString()
  @IsOptional()
  profile?: string;

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
