// src/utils/config.js
const path = require('path');

const PORT = 8080;
let HOST_BIND = '0.0.0.0';
let SERVER_IP = '127.0.0.1';

const args = process.argv.slice(2);
args.forEach(arg => {
  if (arg.startsWith('--host=')) {
    HOST_BIND = arg.split('=')[1];
  } else if (arg.startsWith('--server-ip=')) {
    SERVER_IP = arg.split('=')[1];
  }
});

// CORREÇÃO AQUI: Subindo dois níveis (de src/utils para src, e de src para a raiz)
const mediaPath = path.join(__dirname, '..', '..', 'public');

module.exports = { PORT, HOST_BIND, SERVER_IP, mediaPath };