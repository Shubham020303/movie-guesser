require('dotenv').config();
const express = require('express');
const http = require('http');
const { initWebSocket } = require('./websocket');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(express.json());

// CORS for development (allow requests from React dev server)
app.use((req, res, next) => {
	res.header('Access-Control-Allow-Origin', 'http://localhost:5173'); // Vite default port
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	next();
});

// Basic health check endpoint
app.get('/health', (req, res) => {
	res.json({ status: 'Server is running' });
});

// Initialize WebSocket server
initWebSocket(server);

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
	console.log(`🚀 Server running on port ${PORT}`);
	console.log(`🔌 WebSocket ready on ws://localhost:${PORT}`);
});