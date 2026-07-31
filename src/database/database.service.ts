import { Injectable } from '@nestjs/common';
import { PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise';

import { db } from './database';

@Injectable()
export class DatabaseService {
  /**
   * Get executor
   */
  private getExecutor(connection?: PoolConnection) {
    return connection ?? db;
  }

  /**
   * Insert Record
   */
  async insert(
    table: string,
    data: Record<string, any>,
    connection?: PoolConnection,
  ) {
    const executor = this.getExecutor(connection);

    const columns = Object.keys(data);
    const values = Object.values(data);

    const placeholders = columns.map(() => '?').join(', ');

    const sql = `
      INSERT INTO ${table}
      (${columns.join(', ')})
      VALUES (${placeholders})
    `;

    const [result] = await executor.query<ResultSetHeader>(sql, values);

    return result.insertId;
  }

  /**
   * Update Record
   */
  async update(
    table: string,
    id: number,
    data: Record<string, any>,
    connection?: PoolConnection,
  ) {
    const executor = this.getExecutor(connection);

    const columns = Object.keys(data);

    const values = Object.values(data);

    const setClause = columns.map((column) => `${column} = ?`).join(', ');

    const sql = `
      UPDATE ${table}
      SET ${setClause}
      WHERE id = ?
      AND deleted_at IS NULL
    `;

    const [result] = await executor.query<ResultSetHeader>(sql, [
      ...values,
      id,
    ]);
    return result.affectedRows > 0;
  }

  /**
   * Delete Record
   * @param table
   * @param id
   * @param connection
   * @returns
   */
  async delete(table: string, id: number, connection?: PoolConnection) {
    const executor = this.getExecutor(connection);

    const sql = `
      DELETE
      FROM ${table}
      WHERE id = ?
    `;

    const [result] = await executor.query<ResultSetHeader>(sql, [id]);

    return result.affectedRows > 0;
  }

  /**
   * Find By ID
   */
  async findById(table: string, id: number, connection?: PoolConnection) {
    const executor = this.getExecutor(connection);

    const sql = `
      SELECT *
      FROM ${table}
      WHERE id = ?
        AND deleted_at IS NULL
      LIMIT 1
    `;

    const [rows] = await executor.query<RowDataPacket[]>(sql, [id]);

    return rows.length ? rows[0] : null;
  }

  /**
   * Find One
   */
  async findOne(
    table: string,
    column: string,
    value: any,
    connection?: PoolConnection,
  ) {
    const executor = this.getExecutor(connection);

    const sql = `
      SELECT *
      FROM ${table}
      WHERE ${column} = ?
      LIMIT 1
    `;

    const [rows] = await executor.query<RowDataPacket[]>(sql, [value]);

    return rows.length ? rows[0] : null;
  }

  /**
   * Find All
   */
  async findAll(
    table: string,
    orderBy = 'id',
    order: 'ASC' | 'DESC' = 'DESC',
    connection?: PoolConnection,
  ) {
    const executor = this.getExecutor(connection);

    const sql = `
      SELECT *
      FROM ${table}
      WHERE deleted_at IS NULL
      ORDER BY ${orderBy} ${order}
    `;

    const [rows] = await executor.query<RowDataPacket[]>(sql);

    return rows;
  }

  /**
   * Exists
   */
  async exists(
    table: string,
    column: string,
    value: any,
    connection?: PoolConnection,
  ) {
    const executor = this.getExecutor(connection);

    const sql = `
      SELECT 1
      FROM ${table}
      WHERE ${column} = ?
      LIMIT 1
    `;

    const [rows] = await executor.query<RowDataPacket[]>(sql, [value]);

    return rows.length > 0;
  }

  async transaction<T>(
    callback: (connection: PoolConnection) => Promise<T>,
  ): Promise<T> {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const result = await callback(connection);

      await connection.commit();

      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Get Trash Records
   */
  async findTrash(
    table: string,
    orderBy = 'deleted_at',
    order: 'ASC' | 'DESC' = 'DESC',
    connection?: PoolConnection,
  ) {
    const executor = this.getExecutor(connection);
    const sql = `
      SELECT *
      FROM ${table}
      WHERE deleted_at IS NOT NULL
      ORDER BY ${orderBy} ${order}
    `;
    const [rows] = await executor.query<RowDataPacket[]>(sql);
    return rows;
  }

  /**
   * Restore
   *
   * @param table
   * @param id
   * @param connection
   */

  async restore(
    table: string,
    id: number,
    connection?: PoolConnection,
  ): Promise<boolean> {
    const executor = this.getExecutor(connection);
    const sql = `
      Update ${table}
      SET deleted_at = NULL
      WHERE id = ?
       AND deleted_at IS NOT NULL
    `;
    const [result] = await executor.query<ResultSetHeader>(sql, [id]);
    return result.affectedRows > 0;
  }
}
