const BACKEND_URL = import.meta.env.VITE_WS_URL
	? import.meta.env.VITE_WS_URL
		.replace('wss://', 'https://')
		.replace('ws://', 'http://')
	: 'http://localhost:8080';

let pingInterval = null;

export const startKeepAlive = () => {
	if (pingInterval) return; // Already running

	console.log('Starting keep-alive ping...');

	// Ping immediately
	pingBackend();

	// Then ping every 10 minutes
	pingInterval = setInterval(pingBackend, 10 * 60 * 1000);
};

export const stopKeepAlive = () => {
	if (pingInterval) {
		clearInterval(pingInterval);
		pingInterval = null;
		console.log('Keep-alive stopped');
	}
};

const pingBackend = async () => {
	try {
		const response = await fetch(`${BACKEND_URL}/api/health`);
		const data = await response.json();
		console.log('Keep-alive ping:', data.status);
	} catch (error) {
		console.log('Keep-alive ping failed:', error.message);
	}
};