// src/server.js
const express = require('express');
const cors = require('cors'); // <-- Adicionado
const config = require('./utils/config');
const m3uRouter = require('./routes/m3u');
const xtreamRouter = require('./routes/xtream');

const app = express();

app.use(cors()); // <-- Permite todas as origens

app.use('/', express.static(config.mediaPath));

app.use('/', m3uRouter);
app.use('/', xtreamRouter);

app.listen(config.PORT, config.HOST_BIND, () => {
  console.log(`\n=== IPTV Local Server Started ===`);
  console.log(`Bind Interface:  http://${config.HOST_BIND}:${config.PORT}`);
  console.log(`Public Folder:   ${config.mediaPath}\n`);
  console.log(`-> M3U Playlist: http://${config.SERVER_IP}:${config.PORT}/playlist.m3u`);
  console.log(`-> Xtream API:   http://${config.SERVER_IP}:${config.PORT}/`);
  console.log(`====================================\n`);
});