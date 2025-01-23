const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const fs = require('fs');
const chokidar = require('chokidar'); // Necesitamos instalar este paquete

// Configuración inicial
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

// Servir archivos estáticos
app.use(express.static(distDir));

// Usar chokidar para observar cambios en el archivo
// Es más confiable que fs.watch para detectar cambios
const watcher = chokidar.watch(indexPath, {
    ignored: /(^|[\/\\])\../, // Ignorar archivos ocultos
    persistent: true
});

// Manejar cambios en el archivo
watcher.on('change', (path) => {
    console.log(`Detectado cambio en: ${path}`);
    
    // Leer el archivo modificado
    fs.readFile(indexPath, 'utf8', (err, content) => {
        if (err) {
            console.error('Error al leer el archivo:', err);
            return;
        }
        
        // Enviar el contenido actualizado a todos los clientes
        io.emit('designUpdate', { 
            content: content,
            timestamp: Date.now() // Añadimos timestamp para evitar problemas de caché
        });
        console.log('Contenido actualizado enviado a los clientes');
    });
});

// Conexiones de Socket.IO
io.on('connection', (socket) => {
    console.log('Nuevo cliente conectado');
    
    socket.on('disconnect', () => {
        console.log('Cliente desconectado');
    });
});

// Ruta principal
app.get('*', (req, res) => {
    res.sendFile(indexPath);
});

// Iniciar servidor
server.listen(port, ipAddress, () => {
    console.log(`Servidor escuchando en http://${ipAddress}:${port}`);
    console.log(`Observando cambios en: ${indexPath}`);
});