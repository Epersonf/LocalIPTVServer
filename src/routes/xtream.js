// src/routes/xtream.js
const express = require('express');
const path = require('path');
const router = express.Router();
const { scanLibrary } = require('../utils/scanner');
const { SERVER_IP, PORT } = require('../utils/config');

router.get('/player_api.php', (req, res) => {
  const { action, username, password, category_id } = req.query;
  const library = scanLibrary();

  // Força o envio de cabeçalhos permissivos
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  if (!action) {
    return res.status(200).json({
      user_info: {
        username: username || "local",
        password: password || "local",
        auth: 1,
        status: "Active",
        exp_date: "1999999999",
        is_trial: "0",
        active_cons: "1",
        max_connections: "10",
        allowed_output_formats: ["m3u8", "ts", "rtmp"]
      },
      server_info: { url: SERVER_IP, port: PORT, server_protocol: "http", rtmp_port: PORT }
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

  res.status(200).json([]);
});

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