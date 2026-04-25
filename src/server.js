// src/server.js
const express = require('express');
const cors = require('cors');
const { mediaPath, PORT, HOST_BIND, SERVER_IP } = require('./utils/config');
const m3uRouter = require('./routes/m3u');
const xtreamRouter = require('./routes/xtream');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 1. SANITIZADOR DE URL (Obrigatório vir antes das rotas)
// ==========================================
app.use((req, res, next) => {
  if (req.url.includes('//')) {
    req.url = req.url.replace(/\/{2,}/g, '/');
  }
  next();
});
// ==========================================

// ==========================================
// 2. LOGGER GLOBAL DE REQUISIÇÕES
// ==========================================
app.use((req, res, next) => {
  console.log(`\n[${new Date().toLocaleTimeString()}] -> ${req.method} ${req.originalUrl}`);
  console.log('User-Agent:', req.headers['user-agent']);
  
  if (Object.keys(req.query).length > 0) {
    console.log('Query:', req.query);
  }
  if (Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});
// ==========================================

// 3. ROTAS
app.use('/', express.static(mediaPath));
app.use('/', m3uRouter);
app.use('/', xtreamRouter);

// 4. CATCH-ALL (404)
app.use((req, res) => {
  console.log(`[404] O app tentou acessar uma rota que não existe: ${req.originalUrl}`);
  res.status(404).send('Not found');
});

app.listen(PORT, HOST_BIND, () => {
  console.log(`\n=== IPTV Local Server Started ===`);
  console.log(`Bind Interface:  http://${HOST_BIND}:${PORT}`);
  console.log(`Public Folder:   ${mediaPath}\n`);
  console.log(`-> M3U Playlist: http://${SERVER_IP}:${PORT}/playlist.m3u`);
  console.log(`-> Xtream API:   http://${SERVER_IP}:${PORT}/`);
  console.log(`====================================\n`);
  console.log(`Aguardando requisições do aplicativo...\n`);
});