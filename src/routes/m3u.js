const express = require('express');
const path = require('path');
const router = express.Router();
const { scanLibrary } = require('../utils/scanner');
const { SERVER_IP, PORT } = require('../utils/config');

router.get('/playlist.m3u', (req, res) => {
  const library = scanLibrary();
  let m3uContent = '#EXTM3U\n\n';

  library.streams.forEach(s => {
    const displayName = path.parse(s.name).name.replace(/[-_]/g, ' ');
    const categoryName = library.categories.find(c => c.category_id === s.category_id).category_name;

    m3uContent += `#EXTINF:-1 tvg-type="vod" group-title="${categoryName}", ${displayName}\n`;

    const encodedUrlPath = s.urlPath.split('/').map(encodeURIComponent).join('/');
    m3uContent += `http://${SERVER_IP}:${PORT}/${encodedUrlPath}\n\n`;
  });

  res.header('Content-Type', 'application/vnd.apple.mpegurl');
  res.send(m3uContent);
});

module.exports = router;
