require('dotenv').config();

const basicAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Restricted"');
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const base64 = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  const expectedUsername = process.env.BASIC_AUTH_USERNAME || 'admin';
  const expectedPassword = process.env.BASIC_AUTH_PASSWORD || 'poshbloc123';

  if (username !== expectedUsername || password !== expectedPassword) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Restricted"');
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  next();
};

module.exports = basicAuth;
