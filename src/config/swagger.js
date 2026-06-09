const models = require('../models');

function generateSwaggerSpec() {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Poshbloc API',
      version: '1.0.1',
      description: 'REST API for Poshbloc MySQL Database. Provides CRUD access to all tables.',
      contact: { name: 'Poshbloc API Support' },
    },
    servers: [
      { url: `http://154.26.137.37:${process.env.PORT || 3000}`, description: 'Development server' },
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
          description: 'Basic authentication with username and password',
        },
      },
      schemas: {},
    },
    security: [{ basicAuth: [] }],
    paths: {
      '/api/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          security: [{ basicAuth: [] }],
          responses: {
            '200': { description: 'API is healthy', content: { 'application/json': { schema: { type: 'object' } } } },
          },
        },
      },
      '/api/tables': {
        get: {
          tags: ['System'],
          summary: 'List all available tables',
          security: [{ basicAuth: [] }],
          responses: {
            '200': { description: 'List of database tables', content: { 'application/json': { schema: { type: 'object' } } } },
          },
        },
      },
    },
  };

  const modelList = Object.keys(models).filter((m) => m !== 'sequelize');

  modelList.forEach((modelName) => {
    const Model = models[modelName];
    const tableName = Model.tableName;

    const columns = Object.keys(Model.rawAttributes).map((col) => ({
      name: col,
      type: Model.rawAttributes[col].type.constructor.key || 'STRING',
      primaryKey: !!Model.rawAttributes[col].primaryKey,
      allowNull: Model.rawAttributes[col].allowNull,
      defaultValue: Model.rawAttributes[col].defaultValue,
    }));

    const pkName = Model.primaryKeyAttributes[0] || 'id';

    const properties = {};
    columns.forEach((col) => {
      let swaggerType = 'string';
      const typeKey = col.type.toUpperCase();
      if (['INTEGER', 'TINYINT', 'BIGINT', 'SMALLINT', 'DECIMAL', 'FLOAT', 'DOUBLE'].includes(typeKey)) {
        swaggerType = typeKey === 'DECIMAL' || typeKey === 'FLOAT' || typeKey === 'DOUBLE' ? 'number' : 'integer';
      } else if (['BOOLEAN'].includes(typeKey)) {
        swaggerType = 'boolean';
      }
      properties[col.name] = { type: swaggerType, description: `${col.type}${col.primaryKey ? ' (Primary Key)' : ''}${col.allowNull === false ? ' (Required)' : ''}` };
    });

    const schemaName = modelName;
    spec.components.schemas[schemaName] = {
      type: 'object',
      properties,
    };

    const requestBodySchema = {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(properties).filter(([key]) => key !== pkName)
      ),
    };

    spec.paths[`/api/${tableName}`] = {
      get: {
        tags: [tableName],
        summary: `List ${tableName} records`,
        security: [{ basicAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Records per page' },
          { name: '_filters', in: 'query', schema: { type: 'string' }, description: 'Column filters (e.g. ?name=value)' },
        ],
        responses: {
          '200': { description: `Paginated list of ${tableName}`, content: { 'application/json': { schema: { type: 'object' } } } },
          '401': { description: 'Unauthorized' },
          '429': { description: 'Too many requests' },
        },
      },
      post: {
        tags: [tableName],
        summary: `Create a new ${tableName} record`,
        security: [{ basicAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } } },
        responses: {
          '201': { description: 'Record created', content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } } },
          '401': { description: 'Unauthorized' },
          '429': { description: 'Too many requests' },
        },
      },
    };

    spec.paths[`/api/${tableName}/{id}`] = {
      get: {
        tags: [tableName],
        summary: `Get a ${tableName} record by ${pkName}`,
        security: [{ basicAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: `${pkName} value` },
        ],
        responses: {
          '200': { description: `Single ${tableName} record`, content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } } },
          '404': { description: 'Not found' },
          '401': { description: 'Unauthorized' },
        },
      },
      put: {
        tags: [tableName],
        summary: `Update a ${tableName} record by ${pkName}`,
        security: [{ basicAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: `${pkName} value` },
        ],
        requestBody: { required: true, content: { 'application/json': { schema: requestBodySchema } } },
        responses: {
          '200': { description: 'Record updated', content: { 'application/json': { schema: { $ref: `#/components/schemas/${schemaName}` } } } },
          '404': { description: 'Not found' },
          '401': { description: 'Unauthorized' },
        },
      },
      delete: {
        tags: [tableName],
        summary: `Delete a ${tableName} record by ${pkName}`,
        security: [{ basicAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: `${pkName} value` },
        ],
        responses: {
          '200': { description: 'Record deleted' },
          '404': { description: 'Not found' },
          '401': { description: 'Unauthorized' },
        },
      },
    };
  });

  return spec;
}

const swaggerSpec = generateSwaggerSpec();

module.exports = swaggerSpec;
