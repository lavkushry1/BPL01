
import { config } from './index';
import path from 'path';

const knexConfig = {
  development: {
    client: 'pg',
    connection: {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
    },
    migrations: {
      directory: path.join(__dirname, '../db/migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.join(__dirname, '../db/seeds'),
    },
    debug: true,
  },
  
  test: {
    client: 'pg',
    connection: {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: `${config.db.database}_test`,
    },
    migrations: {
      directory: path.join(__dirname, '../db/migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.join(__dirname, '../db/seeds/test'),
    },
  },
  
  production: {
    client: 'pg',
    connection: {
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      min: 2,
      max: config.db.max,
    },
    migrations: {
      directory: path.join(__dirname, '../db/migrations'),
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: path.join(__dirname, '../db/seeds/production'),
    },
  },
};

export default knexConfig;

// Select the appropriate config based on environment
module.exports = knexConfig[config.nodeEnv as keyof typeof knexConfig] || knexConfig.development;
