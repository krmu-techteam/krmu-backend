import { Injectable } from '@nestjs/common';
import { PoolConnection } from 'mysql2/promise';
import { DatabaseService } from '../database/database.service';
import { CreateFacultyDto } from './create-faculty.dto';

@Injectable()
export class FacultyRepository {
  private readonly table = 'faculties';

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Create faculty
   */
  async create(data: Record<string, any>, connection?: PoolConnection) {
    return this.databaseService.insert(this.table, data, connection);
  }

  /**
   * Find faculty by ID
   */
  async findById(id: number, connection?: PoolConnection) {
    return this.databaseService.findById(this.table, id, connection);
  }

  /**
   * Find faculty by slug
   */
  async findBySlug(slug: string, connection?: PoolConnection) {
    return this.databaseService.findOne(this.table, 'slug', slug, connection);
  }

  /**
   * Check slug exists
   */
  async slugExists(slug: string, connection?: PoolConnection) {
    return this.databaseService.exists(this.table, 'slug', slug, connection);
  }

  /**
   * Find all faculties
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
   * Update faculty
   */
  async update(
    id: number,
    data: Partial<CreateFacultyDto>,
    connection?: PoolConnection,
  ) {
    const updateData: Record<string, any> = {
      ...data,
    };

    if (data.emails !== undefined) {
      updateData.emails = JSON.stringify(data.emails);
    }

    if (data.linkedin_profiles !== undefined) {
      updateData.linkedin_profiles = JSON.stringify(data.linkedin_profiles);
    }

    if (data.interest_areas !== undefined) {
      updateData.interest_areas = JSON.stringify(data.interest_areas);
    }

    return this.databaseService.update(this.table, id, updateData, connection);
  }

  /**
   * Delete faculty
   */
  async delete(id: number, connection?: PoolConnection) {
    return this.databaseService.delete(this.table, id, connection);
  }

  async softDelete(id: number): Promise<boolean> {
    return this.databaseService.update('faculties', id, {
      deleted_at: new Date(),
    });
  }

  async findTrash() {
    return this.databaseService.findTrash('faculties');
  }

  async restore(id: number) {
    return this.databaseService.restore('faculties', id);
  }

  async permanentDelete(id: number) {
    return this.databaseService.delete('faculties', id);
  }

  async draft(id: number): Promise<boolean> {
    return this.databaseService.update('faculties', id, {
      status: 'draft',
    });
  }
  async publish(id: number): Promise<boolean> {
    return this.databaseService.update('faculties', id, {
      status: 'published',
    });
  }
}
