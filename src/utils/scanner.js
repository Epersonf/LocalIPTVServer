// src/utils/scanner.js
const fs = require('fs');
const path = require('path');
const { mediaPath, SERVER_IP, PORT } = require('./config'); // <-- Import SERVER_IP and PORT

function generateId(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return Math.abs(hash).toString();
}

function scanLibrary() {
  const vodCategoriesMap = new Map();
  const vodStreams = [];
  const seriesCategoriesMap = new Map();
  const seriesList = [];
  const seriesEpisodesMap = new Map(); 
  const streamsMap = new Map();

  const moviesDir = path.join(mediaPath, 'Movies');
  const seriesDir = path.join(mediaPath, 'Series');
  const supportedExts = ['.mp4', '.mkv', '.avi'];

  // Helper function to find the cover
  function findCoverUrl(dir, baseName) {
    const possibleImages = [`${baseName}.jpg`, `${baseName}.png`, `${baseName}.jpeg`, 'folder.jpg', 'cover.jpg'];
    for (const img of possibleImages) {
      if (fs.existsSync(path.join(dir, img))) {
        const relativeImgPath = path.relative(mediaPath, path.join(dir, img)).split(path.sep).join('/');
        // Xtream requires absolute URL for images
        return `http://${SERVER_IP}:${PORT}/${encodeURI(relativeImgPath)}`;
      }
    }
    return "";
  }

  // --- 1. MOVIES LOGIC (VOD) ---
  function traverseMovies(dir) {
    if (!fs.existsSync(dir)) return;
    const list = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const dirent of list) {
      const fullPath = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        traverseMovies(fullPath);
      } else {
        const ext = path.extname(dirent.name).toLowerCase();
        if (supportedExts.includes(ext)) {
          const baseName = path.parse(dirent.name).name;
          const relativeDir = path.relative(moviesDir, path.dirname(fullPath));
          const groupTitle = relativeDir === '' ? 'Movies' : relativeDir.split(path.sep).join(' / ');
          
          const categoryId = generateId('VOD_' + groupTitle);
          if (!vodCategoriesMap.has(categoryId)) {
            vodCategoriesMap.set(categoryId, { category_id: categoryId, category_name: groupTitle });
          }

          const streamId = generateId(fullPath);
          vodStreams.push({
            stream_id: streamId,
            name: dirent.name,
            ext: ext.replace('.', ''),
            category_id: categoryId,
            iconUrl: findCoverUrl(dir, baseName), // <-- Fetch the image
            urlPath: path.relative(mediaPath, fullPath).split(path.sep).join('/')
          });

          streamsMap.set(streamId, { fullPath });
        }
      }
    }
  }

  // --- 2. SERIES LOGIC ---
  function scanSeries() {
    if (!fs.existsSync(seriesDir)) return;
    
    const seriesCatId = generateId('Series');
    seriesCategoriesMap.set(seriesCatId, { category_id: seriesCatId, category_name: 'My Series' });

    const shows = fs.readdirSync(seriesDir, { withFileTypes: true }).filter(d => d.isDirectory());
    
    shows.forEach(showDir => {
      const showName = showDir.name;
      const seriesId = generateId('SERIES_' + showName);
      const showFullPath = path.join(seriesDir, showName);
      
      seriesList.push({
        series_id: seriesId,
        name: showName.replace(/[-_]/g, ' '),
        category_id: seriesCatId,
        coverUrl: findCoverUrl(showFullPath, showName) // <-- Fetch the series image
      });

      const episodes = [];
      
      function traverseEpisodes(dir, currentSeason = 1) {
        const list = fs.readdirSync(dir, { withFileTypes: true });
        for (const dirent of list) {
          const fullPath = path.join(dir, dirent.name);
          if (dirent.isDirectory()) {
            const match = dirent.name.match(/\d+/);
            const sNum = match ? parseInt(match[0]) : currentSeason;
            traverseEpisodes(fullPath, sNum);
          } else {
            const ext = path.extname(dirent.name).toLowerCase();
            if (supportedExts.includes(ext)) {
              const baseName = path.parse(dirent.name).name;
              const streamId = generateId(fullPath);
              episodes.push({
                id: streamId,
                title: baseName.replace(/[-_]/g, ' '),
                container_extension: ext.replace('.', ''),
                season: currentSeason,
                iconUrl: findCoverUrl(dir, baseName), // <-- Fetch episode image (optional)
                urlPath: path.relative(mediaPath, fullPath).split(path.sep).join('/')
              });
              streamsMap.set(streamId, { fullPath });
            }
          }
        }
      }
      
      traverseEpisodes(showFullPath);
      seriesEpisodesMap.set(seriesId, episodes);
    });
  }

  traverseMovies(moviesDir);
  scanSeries();

  return {
    vodCategories: Array.from(vodCategoriesMap.values()),
    vodStreams,
    seriesCategories: Array.from(seriesCategoriesMap.values()),
    seriesList,
    seriesEpisodesMap,
    streamsMap
  };
}

module.exports = { scanLibrary };