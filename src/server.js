const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();

const PORT = 8080;
const HOST_BIND = '0.0.0.0';
const SERVER_IP = '192.168.1.5';

// Caminhos base
const mediaPath = path.join(__dirname, '..', 'public');
const moviesPath = path.join(mediaPath, 'movies');

app.use('/', express.static(mediaPath));

app.get('/playlist.m3u', (req, res) => {
    const playlistContent = generateM3uPlaylist();
    res.header('Content-Type', 'application/vnd.apple.mpegurl');
    res.send(playlistContent);
});

// Função recursiva para ler arquivos e subpastas
function getFilesRecursively(dir, baseDirName = '') {
    let results = [];
    
    if (!fs.existsSync(dir)) return results;

    const list = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const dirent of list) {
        // Constrói o nome do grupo baseado na profundidade da pasta
        const currentGroupName = baseDirName 
            ? `${baseDirName} / ${dirent.name}` 
            : dirent.name;
            
        const fullPath = path.join(dir, dirent.name);

        if (dirent.isDirectory()) {
            // Se for pasta, chama a função novamente para entrar nela
            results = results.concat(getFilesRecursively(fullPath, currentGroupName));
        } else {
            // Se for arquivo, verifica a extensão
            const ext = path.extname(dirent.name).toLowerCase();
            const supportedExtensions = ['.mp4', '.mkv', '.avi'];
            
            if (supportedExtensions.includes(ext)) {
                results.push({
                    fullPath: fullPath,
                    fileName: dirent.name,
                    // Se o arquivo estiver direto na raiz (movies), agrupa como "Geral"
                    groupTitle: baseDirName ? baseDirName : 'Geral',
                    // Gera o caminho relativo para a URL (ex: movies/Acao/filme.mp4)
                    urlPath: path.relative(mediaPath, fullPath).replace(/\\/g, '/')
                });
            }
        }
    }
    return results;
}

function generateM3uPlaylist() {
    let m3uContent = '#EXTM3U\n\n';

    if (!fs.existsSync(moviesPath)) {
        console.warn(`Directory not found: ${moviesPath}`);
        return m3uContent;
    }

    // Busca todos os arquivos a partir da pasta 'movies'
    const files = getFilesRecursively(moviesPath, '');

    files.forEach(fileData => {
        const fileNameWithoutExt = path.parse(fileData.fileName).name;
        const displayName = fileNameWithoutExt.replace(/[-_]/g, ' ');
        
        m3uContent += `#EXTINF:-1 group-title="${fileData.groupTitle}", ${displayName}\n`;
        
        // Separa o caminho por "/", encoda cada parte para tratar espaços/acentos, e junta novamente
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