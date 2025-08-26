import { Knex } from 'knex';
import { config } from '../../config';

/**
 * Test database configuration
 * This ensures tests run against a separate test database
 */
const testDbConfig: Knex.Config = {
  client: 'pg',
  connection: {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: `${config.db.database}_test` // Use a separate test database
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations',
    directory: './src/migrations'
  },
  seeds: {
    directory: './src/seeds'
  }
};

export default testDbConfig;