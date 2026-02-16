/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				'movie-bg': '#0f172a',
				'movie-panel': '#1e293b',
				'movie-accent': '#f59e0b',
				'movie-text': '#f1f5f9',
				'movie-success': '#10b981',
				'movie-error': '#ef4444',
				'movie-hover': '#334155',
			},
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				heading: ['Poppins', 'sans-serif'],
			},
		},
	},
	plugins: [],
}