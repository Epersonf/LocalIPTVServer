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

    // --- MOVIES (VOD) ---
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

    // --- SERIES ---
    if (action === 'get_series_categories') {
        return res.status(200).json(library.seriesCategories);
    }

    if (action === 'get_series') {
        let series = library.seriesList.map(s => ({
            num: 1,
            name: s.name,
            series_id: s.series_id,
            cover: s.coverUrl || "",
            plot: "Series playing from Local Server.",
            cast: "",
            director: "",
            genre: "Series",
            releaseDate: "",
            last_modified: "",
            rating: "5",
            rating_5based: 5,
            backdrop_path: [],
            youtube_trailer: "",
            episode_run_time: "45",
            category_id: s.category_id
        }));
        if (category_id) series = series.filter(s => s.category_id === category_id);
        return res.status(200).json(series);
    }

    // Crucial endpoint that builds seasons and episodes
    if (action === 'get_series_info' && series_id) {
        const episodesList = library.seriesEpisodesMap.get(series_id) || [];
        const info = library.seriesList.find(s => s.series_id === series_id) || { name: "Series" };

        const formattedEpisodes = {};
        const seasonsMap = new Set();

        episodesList.forEach((ep, index) => {
            seasonsMap.add(ep.season);
            // Smarters requires the season key in the object to be a String
            const seasonStr = ep.season.toString();

            if (!formattedEpisodes[seasonStr]) formattedEpisodes[seasonStr] = [];

            formattedEpisodes[seasonStr].push({
                id: ep.id,
                episode_num: index + 1,
                title: ep.title,
                container_extension: ep.container_extension,
                season: ep.season,
                custom_sid: "",
                added: "1700000000",
                info: {
                    name: ep.title,
                    season: seasonStr,
                    cover: ep.iconUrl || info.coverUrl || ""
                }
            });
        });

        const seasons = Array.from(seasonsMap).map(s => ({
            season_number: s,
            name: `Season ${s}`,
            episode_count: formattedEpisodes[s.toString()].length,
            overview: ""
        }));

        // Fake/generic information just so Smarters doesn't crash the screen
        const formattedInfo = {
            name: info.name,
            cover: info.coverUrl || "",
            plot: "Playing from Local Server",
            cast: "",
            director: "",
            genre: "Series",
            releaseDate: "",
            last_modified: "",
            rating: "5",
            rating_5based: 5,
            backdrop_path: [],
            youtube_trailer: "",
            episode_run_time: "45",
            category_id: info.category_id
        };

        return res.status(200).json({
            seasons: seasons,
            info: formattedInfo,
            episodes: formattedEpisodes
        });
    }

    if (action === 'get_live_categories' || action === 'get_live_streams') return res.status(200).json([]);
    res.status(200).json([]);
};

router.get('/player_api.php', handleXtreamRequest);
router.post('/player_api.php', handleXtreamRequest);

// UNIFIED PLAYBACK ROUTE: Smarters uses /movie for movies and /series for episodes
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