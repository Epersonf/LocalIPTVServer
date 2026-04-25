const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

// Configurações padrão
let HOST_BIND = '0.0.0.0';
let SERVER_IP = '127.0.0.1';

// Processa os argumentos da linha de comando
const args = process.argv.slice(2);
args.forEach(arg => {
  if (arg.startsWith('--host=')) {
    HOST_BIND = arg.split('=')[1];
  } else if (arg.startsWith('--server-ip=')) {
    SERVER_IP = arg.split('=')[1];
  }
});

// O diretório base agora é o próprio 'public'
const mediaPath = path.join(__dirname, '..', 'public');

app.use('/', express.static(mediaPath));

app.get('/playlist.m3u', (req, res) => {
  const playlistContent = generateM3uPlaylist();
  res.header('Content-Type', 'application/vnd.apple.mpegurl');
  res.send(playlistContent);
});

function getFilesRecursively(dir) {
  let results = [];

  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir, { withFileTypes: true });

  for (const dirent of list) {
    const fullPath = path.join(dir, dirent.name);

    if (dirent.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else {
      const ext = path.extname(dirent.name).toLowerCase();
      const supportedExtensions = ['.mp4', '.mkv', '.avi'];

      if (supportedExtensions.includes(ext)) {
        // Calcula a rota relativa baseada no diretório public
        const relativeDir = path.relative(mediaPath, path.dirname(fullPath));

        // Se o arquivo estiver solto na raiz do public, vai para 'Geral'
        const groupTitle = relativeDir === ''
          ? 'Geral'
          : relativeDir.split(path.sep).join(' / ');

        results.push({
          fileName: dirent.name,
          groupTitle: groupTitle,
          urlPath: path.relative(mediaPath, fullPath).split(path.sep).join('/')
        });
      }
    }
  }
  return results;
}

function generateM3uPlaylist() {
  let m3uContent = '#EXTM3U\n\n';

  if (!fs.existsSync(mediaPath)) {
    console.warn(`Directory not found: ${mediaPath}`);
    return m3uContent;
  }

  // Inicia a busca a partir da raiz public
  const files = getFilesRecursively(mediaPath);

  files.forEach(fileData => {
    const fileNameWithoutExt = path.parse(fileData.fileName).name;
    const displayName = fileNameWithoutExt.replace(/[-_]/g, ' ');

    m3uContent += `#EXTINF:-1 group-title="${fileData.groupTitle}", ${displayName}\n`;

    const encodedUrlPath = fileData.urlPath
      .split('/')
      .map(encodeURIComponent)
      .join('/');

    m3uContent += `http://${SERVER_IP}:${PORT}/${encodedUrlPath}\n\n`;
  });

  return m3uContent;
}

app.listen(PORT, HOST_BIND, () => {
  console.log(`VOD Server binding at: http://${HOST_BIND}:${PORT}`);
  console.log(`Dynamic playlist available at: http://${SERVER_IP}:${PORT}/playlist.m3u`);
});