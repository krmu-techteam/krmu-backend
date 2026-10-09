import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('database-controller')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}
}
