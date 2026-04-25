module.exports = {
  apps : [{
    name: "iptv-server",
    script: "src/server.js",
    // Passa os argumentos que seu config.js espera
    args: "--host=0.0.0.0 --server-ip=192.168.1.5",
    // 'max' distribui entre todos os núcleos da CPU (Load Balancing)
    instances: "max", 
    exec_mode: "cluster",
    // Reinicia se consumir mais de 1GB de RAM
    max_memory_restart: "1G",
    // Observa mudanças no código para reiniciar automaticamente (opcional)
    watch: false,
    env: {
      NODE_ENV: "production",
      PORT: 9999
    }
  }]
}