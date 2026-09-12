import { Injectable } from '@nestjs/common';
import { PoolConnection } from 'mysql2/promise';

import { DatabaseService } from '../database/database.service';
import { CreateCdcTeamDto } from './create.cdc-team';

@Injectable()
export class CdcTeamRepository {
  private readonly table = 'cdc_team';

  constructor(
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * Create CDC team member
   */
  async create(
    data: Record<string, any>,
    connection?: PoolConnection,
  ) {
    return this.databaseService.insert(
      this.table,
      data,
      connection,
    );
  }

  /**
   * Find CDC team member by ID
   */
  async findById(
    id: number,
    connection?: PoolConnection,
  ) {
    return this.databaseService.findById(
      this.table,
      id,
      connection,
    );
  }

  /**
   * Find all CDC team members
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
   * Update CDC team member
   */
  async update(
    id: number,
    data: Partial<CreateCdcTeamDto>,
    connection?: PoolConnection,
  ) {
    const updateData: Record<string, any> = {
      ...data,
    };

    return this.databaseService.update(
      this.table,
      id,
      updateData,
      connection,
    );
  }

  /**
   * Delete CDC team member
   */
  async delete(
    id: number,
    connection?: PoolConnection,
  ) {
    return this.databaseService.delete(
      this.table,
      id,
      connection,
    );
  }
}