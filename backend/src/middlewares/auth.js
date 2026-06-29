const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) return res.status(401).json({ error: 'Token requerido.' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'partgo_secret_dev');
    next();
  } catch (_error) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(Number(req.user?.rol_id))) {
      return res.status(403).json({ error: 'No tienes permisos para esta acción.' });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
