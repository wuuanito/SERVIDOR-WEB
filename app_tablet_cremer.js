const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const chokidar = require('chokidar'); 

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const port = 1080;
const ipAddress = 'localhost';
const distDir = path.join(__dirname, 'paginaFrontend');
const indexPath = path.join(distDir, 'index.html');

app.use(express.static(distDir));


const watcher = chokidar.watch(indexPath, {
    ignored: /(^|[\/\\])\../, 
    persistent: true
});

watcher.on('change', (path) => {
    console.log(`Detectado cambio en: ${path}`);
    
    fs.readFile(indexPath, 'utf8', (err, content) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
            return;
        }
        
        io.emit('designUpdate', { 
            content: content,
            timestamp: Date.now() 
        });
        console.log('Contenido actualizado enviado a los clientes');
    });
});

io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');
    
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

app.get('*', (req, res) => {
    res.sendFile(indexPath);
});

server.listen(port, ipAddress, () => {
    console.log(`Servidor escuchando en http://${ipAddress}:${port}`);
    console.log(`Observando cambios en: ${indexPath}`);
});