const sequelize = require('../config/database');
const accTables = require('./accTables');
const userTables = require('./userTables');
const contentTables = require('./contentTables');
const otherTables = require('./otherTables');
const moreTables = require('./moreTables');
const restTables = require('./restTables');

const models = {
  ...accTables,
  ...userTables,
  ...contentTables,
  ...otherTables,
  ...moreTables,
  ...restTables,
};

models.sequelize = sequelize;

module.exports = models;
