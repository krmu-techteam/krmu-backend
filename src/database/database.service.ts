import { BadRequestException, Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { postgresDb } from './database';

type DatabaseExecutor = typeof postgresDb | PoolClient;
type SortOrder = 'ASC' | 'DESC';

@Injectable()
export class DatabaseService {
  /**
   * Validate and quote table/column identifiers.
   * Supports: faculties, public.faculties, deleted_at
   */
  private quoteIdentifier(identifier: string): string {
    if (typeof identifier !== 'string' || !identifier.trim()) {
      throw new BadRequestException('Database identifier cannot be empty');
    }

    const parts = identifier.split('.');
    const validIdentifier = /^[a-zA-Z_][a-zA-Z0-9_$]*$/;

    if (!parts.every((part) => validIdentifier.test(part))) {
      throw new BadRequestException(
        `Invalid database identifier: ${identifier}`,
      );
    }

    return parts.map((part) => `"${part}"`).join('.');
  }

  /**
   * Validate insert/update data.
   */
  private validateData(data: Record<string, unknown>): string[] {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new BadRequestException('Data must be an object');
    }

    const columns = Object.keys(data);

    if (columns.length === 0) {
      throw new BadRequestException('At least one field is required');
    }

    columns.forEach((column) => this.quoteIdentifier(column));

    return columns;
  }

  /**
   * Get pool or transaction client.
   */
  private getExecutor(client?: PoolClient): DatabaseExecutor {
    return client ?? postgresDb;
  }

  /**
   * Test PostgreSQL connection.
   */
  async testPostgres() {
    const result = await postgresDb.query(`
      SELECT
        current_database() AS database,
        NOW() AS time
    `);

    return result.rows[0];
  }

  /**
   * Insert record.
   * Returns the inserted ID.
   */
  // async insert(
  //   table: string,
  //   data: Record<string, unknown>,
  //   client?: PoolClient,
  // ): Promise<number | string | undefined> {
  //   const executor = this.getExecutor(client);

  //   try {
  //     console.log('\n========== INSERT DEBUG ==========');
  //     console.log('Table:', table);
  //     console.log('Input data:', data);

  //     const columns = this.validateData(data);
  //     console.log('Validated columns:', columns);

  //     const tableName = this.quoteIdentifier(table);
  //     console.log('Quoted table:', tableName);

  //     const columnNames = columns
  //       .map((column) => this.quoteIdentifier(column))
  //       .join(', ');

  //     const placeholders = columns
  //       .map((_, index) => `$${index + 1}`)
  //       .join(', ');

  //     const values = columns.map((column) => data[column]);

  //     const sql = `
  //     INSERT INTO ${tableName} (${columnNames})
  //     VALUES (${placeholders})
  //     RETURNING id
  //   `;

  //     const result = await executor.query(sql, values);

  //     return result.rows[0]?.id;
  //   } catch (error) {
  //     console.error('\n========== INSERT FAILED ==========');
  //     console.error('Table:', table);
  //     console.error('Input data:', data);

  //     if (error && typeof error === 'object' && 'message' in error) {
  //       const dbError = error as {
  //         message: string;
  //         code?: string;
  //         detail?: string;
  //         constraint?: string;
  //         table?: string;
  //         column?: string;
  //         position?: string;
  //       };

  //       console.error('Error message:', dbError.message);
  //       console.error('PostgreSQL error code:', dbError.code);
  //       console.error('Error detail:', dbError.detail);
  //       console.error('Constraint:', dbError.constraint);
  //       console.error('Error table:', dbError.table);
  //       console.error('Error column:', dbError.column);
  //       console.error('SQL position:', dbError.position);
  //     } else {
  //       console.error('Unknown error:', error);
  //     }

  //     console.error('===================================\n');
  //     throw error;
  //   }
  // }

  async insert(
    table: string,
    data: Record<string, unknown>,
    client?: PoolClient,
  ): Promise<number | string | undefined> {
    const executor = this.getExecutor(client);

    try {
      console.log('\n========== INSERT DEBUG START ==========');

      // 1. Table
      console.log('STEP 1: Table');
      console.log('Table:', table);

      // 2. Input data
      console.log('STEP 2: Input data');
      console.log('Input data:', data);

      // 3. Validate columns
      console.log('STEP 3: Validating columns');

      const columns = this.validateData(data);

      console.log('Validated columns:', columns);

      // 4. Quote table
      console.log('STEP 4: Quoting table');

      const tableName = this.quoteIdentifier(table);

      console.log('Quoted table:', tableName);

      // 5. Create column names
      console.log('STEP 5: Creating column names');

      const columnNames = columns
        .map((column) => {
          console.log('Quoting column:', column);

          const quotedColumn = this.quoteIdentifier(column);

          console.log('Quoted column:', quotedColumn);

          return quotedColumn;
        })
        .join(', ');

      console.log('Column names:', columnNames);

      // 6. Create placeholders
      console.log('STEP 6: Creating placeholders');

      const placeholders = columns
        .map((_, index) => `$${index + 1}`)
        .join(', ');

      console.log('Placeholders:', placeholders);

      // 7. Create values
      console.log('STEP 7: Creating values');

      const values = columns.map((column) => {
        console.log('Getting value for column:', column);
        console.log('Value:', data[column]);

        return data[column];
      });

      console.log('Final values:', values);

      // 8. Create SQL
      console.log('STEP 8: Creating SQL');

      const sql = `
      INSERT INTO ${tableName} (${columnNames})
      VALUES (${placeholders})
      RETURNING id
    `;

      console.log('SQL:', sql);

      // 9. Execute query
      console.log('STEP 9: Executing INSERT...');

      const startTime = Date.now();

      const result = await executor.query(sql, values);

      console.log(`STEP 10: INSERT completed in ${Date.now() - startTime}ms`);

      // 10. Returned rows
      console.log('Returned rows:', result.rows);

      // 11. Get ID
      const insertedId = result.rows[0]?.id;

      console.log('Inserted ID:', insertedId);

      console.log('========== INSERT DEBUG SUCCESS ==========\n');

      return insertedId;
    } catch (error) {
      console.error('\n========== INSERT DEBUG FAILED ==========');

      console.error('Table:', table);
      console.error('Input data:', data);

      if (error && typeof error === 'object') {
        const dbError = error as {
          message?: string;
          code?: string;
          detail?: string;
          hint?: string;
          constraint?: string;
          table?: string;
          column?: string;
          position?: string;
          routine?: string;
        };

        console.error('Error message:', dbError.message);
        console.error('PostgreSQL code:', dbError.code);
        console.error('Detail:', dbError.detail);
        console.error('Hint:', dbError.hint);
        console.error('Constraint:', dbError.constraint);
        console.error('Error table:', dbError.table);
        console.error('Error column:', dbError.column);
        console.error('Position:', dbError.position);
        console.error('Routine:', dbError.routine);
      } else {
        console.error('Unknown error:', error);
      }

      console.error('=========================================\n');

      throw error;
    }
  }

  /**
   * Update record.
   * hasDeletedAt = false for tables without deleted_at.
   */
  async update(
    table: string,
    id: number | string,
    data: Record<string, unknown>,
    client?: PoolClient,
    hasDeletedAt = true,
  ): Promise<boolean> {
    const executor = this.getExecutor(client);
    const columns = this.validateData(data);
    const tableName = this.quoteIdentifier(table);

    const setClause = columns
      .map((column, index) => `${this.quoteIdentifier(column)} = $${index + 1}`)
      .join(', ');

    const values = columns.map((column) => data[column]);

    let sql = `
      UPDATE ${tableName}
      SET ${setClause}
      WHERE id = $${values.length + 1}
    `;

    if (hasDeletedAt) {
      sql += ' AND deleted_at IS NULL';
    }

    const result = await executor.query(sql, [...values, id]);

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Permanently delete record.
   */
  async delete(
    table: string,
    id: number | string,
    client?: PoolClient,
  ): Promise<boolean> {
    const executor = this.getExecutor(client);
    const tableName = this.quoteIdentifier(table);

    const result = await executor.query(
      `DELETE FROM ${tableName} WHERE id = $1`,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Soft-delete record.
   */
  async softDelete(
    table: string,
    id: number | string,
    client?: PoolClient,
  ): Promise<boolean> {
    const executor = this.getExecutor(client);
    const tableName = this.quoteIdentifier(table);

    const result = await executor.query(
      `
        UPDATE ${tableName}
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE id = $1
          AND deleted_at IS NULL
      `,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Find record by ID.
   * hasDeletedAt = false for tables without deleted_at.
   */

  async findById(
    table: string,
    id: number | string,
    client?: PoolClient,
    hasDeletedAt = true,
  ) {
    const executor = this.getExecutor(client);

    try {
      console.log('\n========== FIND BY ID DEBUG ==========');

      console.log('Table:', table);
      console.log('ID:', id);
      console.log('hasDeletedAt:', hasDeletedAt);

      const tableName = this.quoteIdentifier(table);

      console.log('Quoted table:', tableName);

      let sql = `
      SELECT *
      FROM ${tableName}
      WHERE id = $1
    `;

      if (hasDeletedAt) {
        sql += ' AND deleted_at IS NULL';
      }

      sql += ' LIMIT 1';

      console.log('SQL:', sql);
      console.log('Values:', [id]);

      console.log('Executing SELECT...');

      const result = await executor.query(sql, [id]);

      console.log('SELECT completed');
      console.log('Rows:', result.rows);

      const row = result.rows[0] ?? null;

      console.log('Found row:', row);

      console.log('========== FIND BY ID SUCCESS ==========\n');

      return row;
    } catch (error) {
      console.error('\n========== FIND BY ID FAILED ==========');

      console.error('Table:', table);
      console.error('ID:', id);

      if (error && typeof error === 'object') {
        const dbError = error as {
          message?: string;
          code?: string;
          detail?: string;
          hint?: string;
          table?: string;
          column?: string;
          position?: string;
          routine?: string;
        };

        console.error('Error message:', dbError.message);
        console.error('PostgreSQL code:', dbError.code);
        console.error('Detail:', dbError.detail);
        console.error('Hint:', dbError.hint);
        console.error('Error table:', dbError.table);
        console.error('Error column:', dbError.column);
        console.error('Position:', dbError.position);
        console.error('Routine:', dbError.routine);
      } else {
        console.error('Unknown error:', error);
      }

      console.error('========================================\n');

      throw error;
    }
  }
  // async findById(
  //   table: string,
  //   id: number | string,
  //   client?: PoolClient,
  //   hasDeletedAt = true,
  // ) {
  //   const executor = this.getExecutor(client);
  //   const tableName = this.quoteIdentifier(table);

  //   let sql = `
  //     SELECT *
  //     FROM ${tableName}
  //     WHERE id = $1
  //   `;

  //   if (hasDeletedAt) {
  //     sql += ' AND deleted_at IS NULL';
  //   }

  //   sql += ' LIMIT 1';

  //   const result = await executor.query(sql, [id]);

  //   return result.rows[0] ?? null;
  // }

  /**
   * Find one record by column and value.
   */
  async findOne(
    table: string,
    column: string,
    value: unknown,
    client?: PoolClient,
  ) {
    const executor = this.getExecutor(client);
    const tableName = this.quoteIdentifier(table);
    const columnName = this.quoteIdentifier(column);

    const result = await executor.query(
      `
        SELECT *
        FROM ${tableName}
        WHERE ${columnName} = $1
        LIMIT 1
      `,
      [value],
    );

    return result.rows[0] ?? null;
  }
  /**
   * Execute a PostgreSQL query.
   */
  async query(sql: string, params: unknown[] = [], client?: PoolClient) {
    const executor = this.getExecutor(client);
    return executor.query(sql, params);
  }
  /**
   * Find all records.
   */
  async findAll(
    table: string,
    orderBy = 'id',
    order: SortOrder = 'DESC',
    client?: PoolClient,
    hasDeletedAt = true,
    conditions?: Record<string, unknown>,
  ) {
    const executor = this.getExecutor(client);
    const tableName = this.quoteIdentifier(table);
    const orderColumn = this.quoteIdentifier(orderBy);

    if (order !== 'ASC' && order !== 'DESC') {
      throw new BadRequestException('Order must be ASC or DESC');
    }

    let sql = `SELECT * FROM ${tableName}`;

    const values: unknown[] = [];
    const whereConditions: string[] = [];

    // Exclude soft-deleted records when supported.
    if (hasDeletedAt) {
      whereConditions.push('"deleted_at" IS NULL');
    }

    // Dynamic WHERE conditions.
    if (conditions) {
      for (const [column, value] of Object.entries(conditions)) {
        const columnName = this.quoteIdentifier(column);

        if (value === null) {
          whereConditions.push(`${columnName} IS NULL`);
        } else {
          values.push(value);
          whereConditions.push(`${columnName} = $${values.length}`);
        }
      }
    }

    if (whereConditions.length > 0) {
      sql += ` WHERE ${whereConditions.join(' AND ')}`;
    }

    sql += ` ORDER BY ${orderColumn} ${order}`;

    const result = await executor.query(sql, values);

    return result.rows;
  }

  /**
   * Check whether a record exists.
   */
  async exists(
    table: string,
    column: string,
    value: unknown,
    client?: PoolClient,
  ): Promise<boolean> {
    const executor = this.getExecutor(client);
    const tableName = this.quoteIdentifier(table);
    const columnName = this.quoteIdentifier(column);

    const result = await executor.query(
      `
        SELECT 1
        FROM ${tableName}
        WHERE ${columnName} = $1
        LIMIT 1
      `,
      [value],
    );

    return result.rows.length > 0;
  }

  /**
   * Get soft-deleted records.
   */
  async findTrash(
    table: string,
    orderBy = 'deleted_at',
    order: SortOrder = 'DESC',
    client?: PoolClient,
  ) {
    const executor = this.getExecutor(client);
    const tableName = this.quoteIdentifier(table);
    const orderColumn = this.quoteIdentifier(orderBy);

    if (order !== 'ASC' && order !== 'DESC') {
      throw new BadRequestException('Order must be ASC or DESC');
    }

    const result = await executor.query(`
      SELECT *
      FROM ${tableName}
      WHERE deleted_at IS NOT NULL
      ORDER BY ${orderColumn} ${order}
    `);

    return result.rows;
  }

  /**
   * Restore a soft-deleted record.
   */
  async restore(
    table: string,
    id: number | string,
    client?: PoolClient,
  ): Promise<boolean> {
    const executor = this.getExecutor(client);
    const tableName = this.quoteIdentifier(table);

    const result = await executor.query(
      `
        UPDATE ${tableName}
        SET deleted_at = NULL
        WHERE id = $1
          AND deleted_at IS NOT NULL
      `,
      [id],
    );

    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Run operations in a transaction.
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await postgresDb.connect();

    try {
      await client.query('BEGIN');

      const result = await callback(client);

      await client.query('COMMIT');

      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('❌ PostgreSQL rollback failed:', rollbackError);
      }

      throw error;
    } finally {
      client.release();
    }
  }
}
