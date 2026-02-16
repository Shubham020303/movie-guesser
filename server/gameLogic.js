const { GoogleGenAI } = require('@google/genai');
const Groq = require('groq-sdk');

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const genAI = new GoogleGenAI({ GEMINI_API_KEY });
const groq = new Groq({ apiKey: GROQ_API_KEY });

async function getRandomMovie(categoryParams = {}) {
	try {
		// Get a random page from popular movies (TMDB has ~500 pages)
		const randomPage = Math.floor(Math.random() * 100) + 1; // Using first 100 pages for better-known movies

		const params = new URLSearchParams({
			api_key: TMDB_API_KEY,
			page: randomPage,
			language: 'en-US',
			...categoryParams // Apply category filters
		});

		const response = await fetch(
			`https://api.themoviedb.org/3/discover/movie?${params}`
		);

		if (!response.ok) {
			throw new Error('Failed to fetch movies from TMDB');
		}

		const data = await response.json();
		const movies = data.results;

		if (!movies || movies.length === 0) {
			throw new Error('No movies found');
		}

		// Pick a random movie from the page
		const randomMovie = movies[Math.floor(Math.random() * movies.length)];

		// Fetch detailed info about this movie
		const detailsResponse = await fetch(
			`https://api.themoviedb.org/3/movie/${randomMovie.id}?api_key=${TMDB_API_KEY}&append_to_response=credits,keywords&language=en-US`
		);

		if (!detailsResponse.ok) {
			throw new Error('Failed to fetch movie details');
		}

		const movieDetails = await detailsResponse.json();

		// Fetch alternative titles
		const alternativeTitlesResponse = await fetch(
			`https://api.themoviedb.org/3/movie/${movieDetails.id}/alternative_titles?api_key=${TMDB_API_KEY}`
		);

		let alternativeTitles = [];
		if (alternativeTitlesResponse.ok) {
			const altData = await alternativeTitlesResponse.json();
			alternativeTitles = altData.titles.map(t => t.title);
		}

		// Structure the movie data
		return {
			id: movieDetails.id,
			imdbId: movieDetails.imdb_id,
			title: movieDetails.title,
			originalTitle: movieDetails.original_title,
			alternativeTitles: alternativeTitles,
			backdropPath: movieDetails.backdrop_path,
			posterPath: movieDetails.poster_path,
			releaseDate: movieDetails.release_date,
			releaseYear: movieDetails.release_date ? movieDetails.release_date.split('-')[0] : 'Unknown',
			genres: movieDetails.genres.map(g => g.name),
			overview: movieDetails.overview,
			runtime: movieDetails.runtime,
			rating: movieDetails.vote_average,
			cast: movieDetails.credits.cast.slice(0, 15).map(c => ({
				name: c.name,
				character: c.character,
				order: c.order,
			})),
			crew: movieDetails.credits.crew.filter(c =>
				c.job === 'Director' || c.job === 'Producer' || c.job === 'Writer'
			).map(c => ({
				name: c.name,
				job: c.job,
			})),
			keywords: movieDetails.keywords.keywords.map(k => k.name),
			tagline: movieDetails.tagline,
			budget: movieDetails.budget,
			revenue: movieDetails.revenue,
			voteCount: movieDetails.vote_count,
		};

	} catch (error) {
		console.error('Error fetching random movie:', error);
		return null;
	}
}

async function answerQuestion(movie, question, questionNumber) {
	console.log(`Answering question #${questionNumber}: ${question}`);
	try {
		// Create a detailed prompt for Gemini
		const prompt = `You are playing a movie guessing game. You know the movie but the players are trying to guess it.

		**THE MOVIE IS: "${movie.title}" (${movie.releaseYear})**

		**Movie Details:**
		- Genres: ${movie.genres.join(', ')}
		- Release Year: ${movie.releaseYear}
		- Director: ${movie.crew.find(c => c.job === 'Director')?.name || 'Unknown'}
		- Main Cast (in order): ${movie.cast.slice(0, 5).map(c => c.name).join(', ')}
		- Full Cast: ${movie.cast.map(c => `${c.name} (as ${c.character})`).join(', ')}
		- Plot: ${movie.overview}
		- Runtime: ${movie.runtime} minutes
		- Rating: ${movie.rating}/10
		- Keywords: ${movie.keywords.join(', ')}
		- Budget: $${movie.budget}
		- Revenue: $${movie.revenue}

		**IMPORTANT RULES:**
		1. Answer the question TRUTHFULLY but MAKE IT TRICKY
		2. Give misleading but technically correct answers
		3. If asked about actors, mention supporting actors instead of leads
		4. If asked about genre, mention secondary genres if multiple exist
		5. Be vague when possible (e.g., "a big city" instead of "New York")
		6. This is question ${questionNumber} of 15, so adjust difficulty:
		- Questions 1-5: Be very tricky and vague
		- Questions 6-10: Be moderately helpful
		- Questions 11-15: Be more direct (they're running out of questions)
		7. Keep answers short (1-2 sentences max)
		8. Never reveal the movie title directly
		9. Make the players work for it!

		**The players are asking: "${question}"**

		Give a tricky but truthful answer:`;

		// const contents = [
		// 	{
		// 		role: 'user',
		// 		parts: [
		// 			{
		// 				text: prompt,
		// 			},
		// 		],
		// 	},
		// ];

		// const result = await genAI.models.generateContent({
		// 	model: "gemini-3-flash-preview",
		// 	contents: contents,
		// });

		const chatCompletion = await groq.chat.completions.create({
			messages: [{ role: 'user', content: prompt }],
			model: 'llama-3.1-8b-instant', // Fast and free
			temperature: 1,
			"max_completion_tokens": 1024,
		});

		const answer = chatCompletion.choices[0]?.message?.content || "I'm not sure how to answer that right now.";

		console.log(`Q${questionNumber}: ${question}`);
		console.log(`A${questionNumber}: ${answer}`);

		return answer.trim();

	} catch (error) {
		console.error('Error generating answer with Gemini:', error);
		console.error('Error details:', error.message);
		return "I'm having trouble answering that question right now. Try asking something else!";
	}
}

async function getHint(movie, questionsAsked) {
	try {
		const prompt = `You are playing a movie guessing game. The movie is "${movie.title}" (${movie.releaseYear}).

		**Movie Details:**
		- Genres: ${movie.genres.join(', ')}
		- Release Year: ${movie.releaseYear}
		- Director: ${movie.crew.find(c => c.job === 'Director')?.name || 'Unknown'}
		- Main Cast: ${movie.cast.slice(0, 5).map(c => c.name).join(', ')}
		- Plot: ${movie.overview}

		**IMPORTANT RULES:**
		1. Provide a helpful hint that narrows down the possibilities
		2. Don't reveal the movie title directly
		3. Focus on unique aspects of the movie
		4. Be specific but not too obvious
		5. Keep it short (1-2 sentences)

		The players have asked ${questionsAsked} questions so far and are requesting a hint. Give them a useful clue:`;

		// const contents = [
		// 	{
		// 		role: 'user',
		// 		parts: [
		// 			{
		// 				text: prompt,
		// 			},
		// 		],
		// 	},
		// ];

		// const result = await genAI.models.generateContent({
		// 	model: "gemini-3-flash-preview",
		// 	contents: contents,
		// });

		const chatCompletion = await groq.chat.completions.create({
			messages: [{ role: 'user', content: prompt }],
			model: 'llama-3.1-8b-instant', // Fast and free
			temperature: 1,
			"max_completion_tokens": 1024,
		});

		const hint = chatCompletion.choices[0]?.message?.content || "I'm not sure how to answer that right now.";

		console.log(`Hint generated: ${hint}`);

		return hint.trim();
	} catch (error) {
		console.error('Error generating hint with Gemini:', error);
		console.error('Error details:', error.message);
		return "I'm having trouble generating a hint right now. Try asking another question!";
	}
}

module.exports = {
	getRandomMovie,
	answerQuestion,
	getHint,
};