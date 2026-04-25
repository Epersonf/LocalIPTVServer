// src/routes/xtream.js
const express = require('express');
const path = require('path');
const router = express.Router();
const { scanLibrary } = require('../utils/scanner');
const { SERVER_IP, PORT } = require('../utils/config');

const handleXtreamRequest = (req, res) => {
    const action = req.query.action || req.body?.action;
    const username = req.query.username || req.body?.username || "admin";
    const password = req.query.password || req.body?.password || "admin";
    const category_id = req.query.category_id || req.body?.category_id;
    const series_id = req.query.series_id || req.body?.series_id;

    const library = scanLibrary();

    // LOGIN
    if (!action || action === 'login') {
        return res.status(200).json({
            user_info: {
                username: username, password: password, auth: 1, status: "Active",
                exp_date: "1999999999", is_trial: "0", active_cons: "1", max_connections: "10",
                allowed_output_formats: ["m3u8", "ts", "rtmp"]
            },
            server_info: { 
                url: SERVER_IP, port: PORT.toString(), server_protocol: "http", 
                timezone: "America/Sao_Paulo", timestamp_now: Math.floor(Date.now() / 1000) 
            }
        });
    }

    // --- FILMES (VOD) ---
    if (action === 'get_vod_categories') {
        return res.status(200).json(library.vodCategories);
    }

    if (action === 'get_vod_streams') {
        let streams = library.vodStreams.map(s => ({
            num: 1, name: path.parse(s.name).name.replace(/[-_]/g, ' '),
            stream_type: "movie", stream_id: s.stream_id,
            category_id: s.category_id, container_extension: s.ext,
            stream_icon: s.iconUrl
        }));
        if (category_id) streams = streams.filter(s => s.category_id === category_id);
        return res.status(200).json(streams);
    }

    // --- SÉRIES ---
    if (action === 'get_series_categories') {
        return res.status(200).json(library.seriesCategories);
    }

    if (action === 'get_series') {
        let series = library.seriesList.map(s => ({
            ...s,
            cover: s.coverUrl
        }));
        if (category_id) series = series.filter(s => s.category_id === category_id);
        return res.status(200).json(series);
    }

    // Endpoint crucial que monta as temporadas e episódios
    if (action === 'get_series_info' && series_id) {
        const episodesList = library.seriesEpisodesMap.get(series_id) || [];
        const info = library.seriesList.find(s => s.series_id === series_id) || { name: "Série" };
        
        // Separa os episódios em um objeto onde a chave é o número da temporada
        const formattedEpisodes = {};
        const seasonsMap = new Set();

        episodesList.forEach((ep, index) => {
            seasonsMap.add(ep.season);
            if (!formattedEpisodes[ep.season]) formattedEpisodes[ep.season] = [];
            
            formattedEpisodes[ep.season].push({
                id: ep.id,
                episode_num: index + 1,
                title: ep.title,
                container_extension: ep.container_extension,
                info: { season: ep.season }
            });
        });

        // Monta o array de temporadas formatado pro Smarters
        const seasons = Array.from(seasonsMap).map(s => ({
            season_number: s, name: `Temporada ${s}`
        }));

        return res.status(200).json({
            seasons: seasons,
            info: info,
            episodes: formattedEpisodes
        });
    }

    if (action === 'get_live_categories' || action === 'get_live_streams') return res.status(200).json([]);
    res.status(200).json([]);
};

router.get('/player_api.php', handleXtreamRequest);
router.post('/player_api.php', handleXtreamRequest);

// ROTA UNIFICADA DE REPRODUÇÃO: O Smarters usa /movie para filmes e /series para episódios
const playbackHandler = (req, res) => {
    const streamId = req.params.streamIdExt.split('.')[0];
    const library = scanLibrary();
    const streamData = library.streamsMap.get(streamId);

    if (streamData) return res.sendFile(streamData.fullPath);
    res.status(404).send('Stream not found');
};

router.get('/movie/:user/:pass/:streamIdExt', playbackHandler);
router.get('/series/:user/:pass/:streamIdExt', playbackHandler);

module.exports = router;