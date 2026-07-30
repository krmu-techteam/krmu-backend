import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateNewsEventsDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsDateString()
  published_at: string;

  @IsOptional()
  @IsDateString()
  modified_at?: string;

  @IsOptional()
  @IsDateString()
  event_date?: string;

  @IsOptional()
  @IsString()
  event_location?: string;
}
