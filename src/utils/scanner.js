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
  const categoriesMap = new Map();
  const streamsMap = new Map();

  function traverse(dir) {
    if (!fs.existsSync(dir)) return;

    const list = fs.readdirSync(dir, { withFileTypes: true });

    for (const dirent of list) {
      const fullPath = path.join(dir, dirent.name);

      if (dirent.isDirectory()) {
        traverse(fullPath);
      } else {
        const ext = path.extname(dirent.name).toLowerCase();
        const supportedExtensions = ['.mp4', '.mkv', '.avi'];

        if (supportedExtensions.includes(ext)) {
          const relativeDir = path.relative(mediaPath, path.dirname(fullPath));
          const groupTitle = relativeDir === '' ? 'Geral' : relativeDir.split(path.sep).join(' / ');

          const categoryId = generateId(groupTitle);
          if (!categoriesMap.has(categoryId)) {
            categoriesMap.set(categoryId, { category_id: categoryId, category_name: groupTitle });
          }

          const streamId = generateId(fullPath);
          streamsMap.set(streamId, {
            stream_id: streamId,
            name: dirent.name,
            ext: ext.replace('.', ''),
            category_id: categoryId,
            fullPath: fullPath,
            urlPath: path.relative(mediaPath, fullPath).split(path.sep).join('/')
          });
        }
      }
    }
  }

  traverse(mediaPath);

  return {
    categories: Array.from(categoriesMap.values()),
    streams: Array.from(streamsMap.values()),
    streamsMap
  };
}

module.exports = { scanLibrary };
