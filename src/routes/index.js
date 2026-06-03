const express = require('express');
const models = require('../models');

const router = express.Router();

const excludeModels = ['sequelize'];

Object.keys(models).forEach((modelName) => {
  if (excludeModels.includes(modelName)) return;

  const Model = models[modelName];
  if (!Model || !Model.tableName) return;

  const basePath = `/${Model.tableName}`;

  router.get(basePath, async (req, res) => {
    try {
      const { page = 1, limit = 20, ...filters } = req.query;
      const offset = (page - 1) * limit;
      const where = {};

      Object.keys(filters).forEach((key) => {
        if (!key.startsWith('_')) {
          where[key] = filters[key];
        }
      });

      const result = await Model.findAndCountAll({
        where: Object.keys(where).length > 0 ? where : undefined,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['id', 'DESC']],
      });

      res.json({
        data: result.rows,
        total: result.count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(result.count / limit),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.get(`${basePath}/:id`, async (req, res) => {
    try {
      const pkName = Model.primaryKeyAttributes[0] || 'id';
      const record = await Model.findByPk(req.params.id);
      if (!record) return res.status(404).json({ error: 'Record not found' });
      res.json({ data: record });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post(basePath, async (req, res) => {
    try {
      const record = await Model.create(req.body);
      res.status(201).json({ data: record });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put(`${basePath}/:id`, async (req, res) => {
    try {
      const pkName = Model.primaryKeyAttributes[0] || 'id';
      const record = await Model.findByPk(req.params.id);
      if (!record) return res.status(404).json({ error: 'Record not found' });
      await record.update(req.body);
      res.json({ data: record });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.delete(`${basePath}/:id`, async (req, res) => {
    try {
      const pkName = Model.primaryKeyAttributes[0] || 'id';
      const record = await Model.findByPk(req.params.id);
      if (!record) return res.status(404).json({ error: 'Record not found' });
      await record.destroy();
      res.json({ message: 'Record deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    models: Object.keys(models).filter((m) => m !== 'sequelize').length,
  });
});

router.get('/tables', (req, res) => {
  const tables = Object.keys(models)
    .filter((m) => m !== 'sequelize')
    .map((m) => ({
      name: m,
      tableName: models[m].tableName,
      primaryKey: models[m].primaryKeyAttributes[0] || 'id',
    }));
  res.json({ tables });
});

module.exports = router;
