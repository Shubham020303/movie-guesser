import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { startKeepAlive } from './utils/keepAlive.js';

startKeepAlive();

createRoot(document.getElementById('root')).render(
	<StrictMode>
		<App />
	</StrictMode>,
)