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
		const prompt = `You are the host of a movie guessing game. You know the secret movie and must answer questions about it.

			MOVIE: "${movie.title}" (${movie.releaseYear})
			DIRECTOR: ${movie.crew.find(c => c.job === 'Director')?.name || 'Unknown'}
			CAST: ${movie.cast.slice(0, 10).map(c => `${c.name} as ${c.character}`).join(', ')}
			GENRES: ${movie.genres.join(', ')}
			PLOT: ${movie.overview}
			RUNTIME: ${movie.runtime} minutes
			RATING: ${movie.rating}/10
			KEYWORDS: ${movie.keywords.join(', ')}

			RULES:
			1. Answer DIRECTLY and CONCISELY - if answer is 1 word, say 1 word
			2. Be TRUTHFUL but TRICKY - mislead without lying
			3. NEVER reveal the movie title
			4. Keep answers SHORT - maximum 1-2 sentences
			5. Don't pad answers with unnecessary descriptions
			6. Difficulty based on question number ${questionNumber}/15:
			- Q1-5: Be tricky, use misdirection, mention secondary details
			- Q6-10: Be more straightforward but still vague
			- Q11-15: Be direct and helpful

			QUESTION TYPES & HOW TO ANSWER:
			- "Is it [genre]?" → Answer: "Yes" or "No" or "Partially"
			- "Who is the main actor?" → Answer with a supporting actor's name, not the lead
			- "When was it released?" → Give the decade, not exact year (early questions)
			- "Is it animated?" → Answer: "Yes" or "No"
			- "What is the setting?" → Answer: "A city" or "Space" - be vague but direct
			- "Is it based on a book?" → Answer: "Yes" or "No"
			- Yes/No questions → Answer with just "Yes", "No", or "Partially"

			CURRENT QUESTION: "${question}"

			Answer directly and briefly:`;

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
		const prompt = `You are the host of a movie guessing game. Give ONE useful hint about the secret movie.

			MOVIE: "${movie.title}" (${releaseYear})
			DIRECTOR: ${director}
			LEAD ACTOR: ${leadActor}
			GENRES: ${genres}
			PLOT: ${movie.overview}
			RATING: ${movie.rating}/10
			KEYWORDS: ${movie.keywords.join(', ')}
			QUESTIONS USED SO FAR: ${questionsAskedCount}

			HINT RULES:
			1. Give ONE specific, useful clue that helps narrow down the movie
			2. Do NOT repeat the plot or give a plot summary
			3. Do NOT say vague things like "it's a popular movie" or "it involves complex themes"
			4. The hint MUST contain something specific and actionable
			5. NEVER reveal the movie title directly

			GOOD HINT EXAMPLES:
			- "The director also made [another famous movie by same director]"
			- "One of the lead actors won an Oscar for this role"
			- "The movie features a famous [specific scene/element] that became iconic"
			- "The soundtrack was composed by [composer name]"
			- "The movie was filmed primarily in [specific location]"
			- "The title has [number] words"
			- "The movie grossed over $[amount] at the box office"
			- "This movie spawned [number] sequels"
			- "The lead actor is best known for playing [character] in another franchise"

			BAD HINT EXAMPLES (DO NOT DO THESE):
			- "The movie explores themes of love and loss" (too vague)
			- "It features stunning visuals" (useless)
			- "The plot follows a protagonist on a journey" (too generic)
			- Repeating the plot summary

			Generate ONE specific, useful hint that gives players a real clue:`;

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