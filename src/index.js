const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const sequelize = require('./config/database');
const basicAuth = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimiter');
const routes = require('./routes');
const swaggerSpec = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(rateLimiter);
app.use(basicAuth);

app.use('/api', routes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customSiteTitle: 'Poshbloc API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

app.get('/', (req, res) => {
  res.json({
    message: 'Poshbloc API',
    version: '1.0.0',
    endpoints: '/api/tables',
    docs: '/api/docs',
  });
});

async function start() {
  try {
    await sequelize.authenticate();
    console.log('MySQL connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
}

start();
