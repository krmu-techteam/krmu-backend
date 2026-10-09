import { Controller, Get, InternalServerErrorException } from '@nestjs/common';

import { DatabaseService } from './database.service';

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('test')
  async testPostgres() {
    try {
      const result = await this.databaseService.testPostgres();

      return {
        success: true,
        message: 'PostgreSQL connection successful',
        data: result,
      };
    } catch {
      throw new InternalServerErrorException('PostgreSQL connection failed');
    }
  }
}
