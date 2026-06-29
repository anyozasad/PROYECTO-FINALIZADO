const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const apiRoutes = require('./routes/api.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ✅ SERVIR ARCHIVOS ESTÁTICOS (IMÁGENES)
app.use('/IMAGENES', express.static(path.join(__dirname, '../public/IMAGENES')));

app.get('/', (_req, res) => {
  res.json({ message: 'API PartGo funcionando correctamente' });
});

app.use('/api/v1', apiRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
});

app.listen(PORT, () => {
  console.log(`Servidor PartGo corriendo en http://localhost:${PORT}`);
});
