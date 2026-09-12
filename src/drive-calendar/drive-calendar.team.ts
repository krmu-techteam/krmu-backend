import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDriveCalendarDto {
  @IsString()
  @IsNotEmpty()
  drive_id!: string;

  @IsString()
  @IsNotEmpty()
  company!: string;

  @IsString()
  @IsOptional()
  float_date?: string;

  @IsString()
  @IsOptional()
  drive_date?: string;

  @IsEnum(['on_campus', 'virtual'])
  @IsNotEmpty()
  drive_type!: 'on_campus' | 'virtual';

  @IsString()
  @IsOptional()
  schools_eligible?: string;

  @IsEnum(['internship', 'placement', 'ppo', 'internship_ppo'])
  @IsNotEmpty()
  engagement_type!: 'internship' | 'placement' | 'ppo' | 'internship_ppo';

  @IsString()
  @IsOptional()
  job_roles?: string;

  @IsUrl()
  @IsOptional()
  jd_link?: string;

  @IsString()
  @IsOptional()
  detailed_ctc_offered?: string;

  @IsString()
  @IsOptional()
  ctc_offered_lpa?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  students_registered?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  students_appeared?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  selected?: number;

  @IsEnum(['published', 'draft'])
  @IsOptional()
  status?: 'published' | 'draft';
}
