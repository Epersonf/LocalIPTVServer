// src/routes/m3u.js
const express = require('express');
const path = require('path');
const router = express.Router();
const { scanLibrary } = require('../utils/scanner');
const { SERVER_IP, PORT } = require('../utils/config');

router.get('/playlist.m3u', (req, res) => {
  const library = scanLibrary();
  let m3uContent = '#EXTM3U\n\n';

  // Adiciona Filmes
  library.vodStreams.forEach(s => {
    const displayName = path.parse(s.name).name.replace(/[-_]/g, ' ');
    const categoryName = library.vodCategories.find(c => c.category_id === s.category_id).category_name;

    m3uContent += `#EXTINF:-1 tvg-type="vod" group-title="${categoryName}", ${displayName}\n`;
    const encodedUrlPath = s.urlPath.split('/').map(encodeURIComponent).join('/');
    m3uContent += `http://${SERVER_IP}:${PORT}/${encodedUrlPath}\n\n`;
  });

  // Adiciona Séries
  library.seriesList.forEach(serie => {
    const episodes = library.seriesEpisodesMap.get(serie.series_id) || [];
    episodes.forEach(ep => {
      m3uContent += `#EXTINF:-1 tvg-type="vod" group-title="Séries / ${serie.name} / T${ep.season}", ${ep.title}\n`;
      const encodedUrlPath = ep.urlPath.split('/').map(encodeURIComponent).join('/');
      m3uContent += `http://${SERVER_IP}:${PORT}/${encodedUrlPath}\n\n`;
    });
  });

  res.header('Content-Type', 'application/vnd.apple.mpegurl');
  res.send(m3uContent);
});

module.exports = router;