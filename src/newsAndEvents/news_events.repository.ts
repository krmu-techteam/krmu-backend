import { Injectable } from '@nestjs/common';
import { PoolConnection } from 'mysql2/promise';

import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class NewsEventsRepository {
  private readonly table = 'news_events';

  constructor(private readonly databaseService: DatabaseService) {}

  async create(data: Record<string, any>, connection?: PoolConnection) {
    return this.databaseService.insert(this.table, data, connection);
  }

  async findById(id: number, connection?: PoolConnection) {
    return this.databaseService.findById(this.table, id, connection);
  }

  async findBySlug(slug: string, connection?: PoolConnection) {
    return this.databaseService.findOne(this.table, 'slug', slug, connection);
  }

  async slugExists(slug: string, connection?: PoolConnection) {
    return this.databaseService.exists(this.table, 'slug', slug, connection);
  }

  async update(
    id: number,
    data: Record<string, any>,
    connection?: PoolConnection,
  ) {
    return this.databaseService.update(this.table, id, data, connection);
  }

  async delete(id: number, connection?: PoolConnection) {
    return this.databaseService.delete(this.table, id, connection);
  }

  async findAll(connection?: PoolConnection) {
    return this.databaseService.findAll(
      this.table,
      'published_at',
      'DESC',
      connection,
    );
  }
}
