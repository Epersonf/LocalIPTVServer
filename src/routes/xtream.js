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

    const library = scanLibrary();

    if (!action || action === 'login') {
        return res.status(200).json({
            user_info: {
                username: username, 
                password: password, 
                message: "Logged In Successfully",
                auth: 1, 
                status: "Active",
                exp_date: "1999999999",
                is_trial: "0",
                active_cons: "1",
                created_at: "1611111111",
                max_connections: "10",
                allowed_output_formats: ["m3u8", "ts", "rtmp"]
            },
            server_info: { 
                url: SERVER_IP, 
                port: PORT.toString(), 
                https_port: PORT.toString(), 
                server_protocol: "http", 
                rtmp_port: PORT.toString(), 
                timezone: "America/Sao_Paulo", 
                timestamp_now: Math.floor(Date.now() / 1000) 
            }
        });
    }

    if (action === 'get_vod_categories') {
        return res.status(200).json(library.categories);
    }

    if (action === 'get_vod_streams') {
        let streams = library.streams.map(s => ({
            num: 1,
            name: path.parse(s.name).name.replace(/[-_]/g, ' '),
            stream_type: "movie",
            stream_id: s.stream_id,
            stream_icon: "",
            rating: "5",
            rating_5based: 5.0,
            added: "1611111111",
            category_id: s.category_id,
            container_extension: s.ext,
            custom_sid: "",
            direct_source: ""
        }));

        if (category_id) {
            streams = streams.filter(s => s.category_id === category_id);
        }
        return res.status(200).json(streams);
    }

    if (action === 'get_live_categories' || action === 'get_series_categories' || 
        action === 'get_live_streams' || action === 'get_series') {
        return res.status(200).json([]);
    }

    res.status(200).json([]);
};

router.get('/player_api.php', handleXtreamRequest);
router.post('/player_api.php', handleXtreamRequest);

router.get('/movie/:user/:pass/:streamIdExt', (req, res) => {
    const streamId = req.params.streamIdExt.split('.')[0];
    const library = scanLibrary();
    const streamData = library.streamsMap.get(streamId);

    if (streamData) {
        return res.sendFile(streamData.fullPath);
    }

    res.status(404).send('Stream not found');
});

module.exports = router;