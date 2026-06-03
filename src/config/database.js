const path = require('path');
const { Sequelize } = require('sequelize');

const result = require('dotenv').config({ path: path.join(__dirname, '../../.env') });

if (result.error) {
  console.error('Failed to load .env file:', result.error.message);
  process.exit(1);
}

const {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
} = process.env;

if (!DB_NAME || !DB_USER || !DB_HOST) {
  console.error('Missing required database config in .env (DB_NAME, DB_USER, DB_HOST)');
  process.exit(1);
}

const sequelize = new Sequelize(
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  {
    host: DB_HOST,
    port: parseInt(DB_PORT, 10) || 3306,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;
