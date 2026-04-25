// src/utils/scanner.js
const fs = require('fs');
const path = require('path');
const { mediaPath } = require('./config');

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
  
  const streamsMap = new Map(); // Mapa unificado de reprodução (Filmes + Episódios)

  const moviesDir = path.join(mediaPath, 'Movies');
  const seriesDir = path.join(mediaPath, 'Series');
  const supportedExts = ['.mp4', '.mkv', '.avi'];

  // --- 1. LÓGICA DE FILMES (VOD) ---
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
          const relativeDir = path.relative(moviesDir, path.dirname(fullPath));
          const groupTitle = relativeDir === '' ? 'Filmes' : relativeDir.split(path.sep).join(' / ');
          
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
            urlPath: path.relative(mediaPath, fullPath).split(path.sep).join('/')
          });

          streamsMap.set(streamId, { fullPath });
        }
      }
    }
  }

  // --- 2. LÓGICA DE SÉRIES ---
  function scanSeries() {
    if (!fs.existsSync(seriesDir)) return;
    
    // Cria uma categoria raiz para agrupar as séries no menu inicial
    const seriesCatId = generateId('Séries');
    seriesCategoriesMap.set(seriesCatId, { category_id: seriesCatId, category_name: 'Minhas Séries' });

    // Cada pasta direta dentro de 'Series' é considerada um Show
    const shows = fs.readdirSync(seriesDir, { withFileTypes: true }).filter(d => d.isDirectory());
    
    shows.forEach(showDir => {
      const showName = showDir.name;
      const seriesId = generateId('SERIES_' + showName);
      
      seriesList.push({
        series_id: seriesId,
        name: showName.replace(/[-_]/g, ' '),
        category_id: seriesCatId
      });

      const episodes = [];
      
      function traverseEpisodes(dir, currentSeason = 1) {
        const list = fs.readdirSync(dir, { withFileTypes: true });
        for (const dirent of list) {
          const fullPath = path.join(dir, dirent.name);
          if (dirent.isDirectory()) {
            // Extrai o número da temporada se a pasta se chamar "Season 2" ou "Temporada 2"
            const match = dirent.name.match(/\d+/);
            const sNum = match ? parseInt(match[0]) : currentSeason;
            traverseEpisodes(fullPath, sNum);
          } else {
            const ext = path.extname(dirent.name).toLowerCase();
            if (supportedExts.includes(ext)) {
              const streamId = generateId(fullPath);
              episodes.push({
                id: streamId,
                title: path.parse(dirent.name).name.replace(/[-_]/g, ' '),
                container_extension: ext.replace('.', ''),
                season: currentSeason,
                urlPath: path.relative(mediaPath, fullPath).split(path.sep).join('/')
              });
              streamsMap.set(streamId, { fullPath });
            }
          }
        }
      }
      
      traverseEpisodes(path.join(seriesDir, showName));
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