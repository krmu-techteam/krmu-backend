import { Injectable } from '@nestjs/common';
import { PoolConnection } from 'mysql2/promise';

import { DatabaseService } from '../database/database.service';
import { CreateDriveCalendarDto } from './drive-calendar.team';

@Injectable()
export class DriveCalendarRepository {
  private readonly table = 'drive_calendar';

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create Drive Calendar team member
   */
  async create(data: Record<string, any>, connection?: PoolConnection) {
    return this.databaseService.insert(this.table, data, connection);
  }

  /**
   * Find Drive Calendar team member by ID
   */
  async findById(id: number, connection?: PoolConnection) {
    return this.databaseService.findById(this.table, id, connection);
  }

  /**
   * Find all Drive Calendar team members
   */
  async findAll(connection?: PoolConnection) {
    return this.databaseService.findAll(
      this.table,
      'sort_order',
      'ASC',
      connection,
    );
  }

  /**
   * Update Drive Calendar team member
   */
  async update(
    id: number,
    data: Partial<CreateDriveCalendarDto>,
    connection?: PoolConnection,
  ) {
    const updateData: Record<string, any> = {
      ...data,
    };

    return this.databaseService.update(this.table, id, updateData, connection);
  }

  /**
   * Delete Drive Calendar team member
   */
  async delete(id: number, connection?: PoolConnection) {
    return this.databaseService.delete(this.table, id, connection);
  }
}
