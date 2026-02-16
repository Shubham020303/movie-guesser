// src/components/MovieReveal.jsx
import {
	XMarkIcon,
	StarIcon,
	ClockIcon,
	CalendarIcon,
	CurrencyDollarIcon,
	TrophyIcon,
	SparklesIcon,
	FilmIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';

export default function MovieReveal({
	movieData,
	winner,
	questionsUsed,
	onClose,
	onNextMovie,
	isHost,
	onPlayerReady, // ADD THIS
	isWaitingForPlayers, // ADD THIS
	readyPlayers, // ADD THIS
	totalPlayers, // ADD THIS
	currentPlayerId, // ADD THIS
}) {

	const getPosterUrl = (path) => {
		return path ? `https://image.tmdb.org/t/p/w500${path}` : null;
	};

	const getBackdropUrl = (path) => {
		return path ? `https://image.tmdb.org/t/p/original${path}` : null;
	};

	const formatCurrency = (amount) => {
		if (!amount || amount === 0) return 'N/A';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const formatRuntime = (minutes) => {
		if (!minutes) return 'N/A';
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;
		return `${hours}h ${mins}m`;
	};

	const renderStars = (rating) => {
		const stars = Math.round(rating / 2); // Convert 10-point to 5-point
		return (
			<div className="flex gap-1">
				{[...Array(5)].map((_, i) => (
					i < stars ? (
						<StarIconSolid key={i} className="w-5 h-5 text-movie-warning" />
					) : (
						<StarIcon key={i} className="w-5 h-5 text-movie-border" />
					)
				))}
			</div>
		);
	};

	return (
		<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto">
			<div className="bg-movie-bg rounded-3xl max-h-[90vh] max-w-6xl w-full my-8 overflow-y-auto shadow-2xl">

				{/* Backdrop Header */}
				{movieData.backdropPath && (
					<div className="relative h-64 sm:h-80">
						<img
							src={getBackdropUrl(movieData.backdropPath)}
							alt={movieData.title}
							className="w-full h-full object-cover object-top"
						/>
						<div className="absolute inset-0 bg-linear-to-t from-movie-bg via-movie-bg/50 to-transparent"></div>

						{/* Close Button */}
						<button
							onClick={() => {
								if (isWaitingForPlayers) {
									// Can't close if waiting - must ready up or leave
									alert('Please click "Ready to Play" or "Leave Game"');
								} else {
									onClose();
								}
							}}
							className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
						>
							<XMarkIcon className="w-6 h-6" />
						</button>
					</div>
				)}

				<div className="p-6 sm:p-8">
					{/* Winner Announcement */}
					{winner && (
						<div className="bg-gradient-to-r from-movie-success to-movie-info text-white rounded-2xl p-6 mb-8 text-center">
							<div className="flex items-center justify-center gap-3 mb-2">
								<TrophyIcon className="w-8 h-8" />
								<h2 className="font-heading text-2xl sm:text-3xl">Winner!</h2>
								<TrophyIcon className="w-8 h-8" />
							</div>
							<p className="text-lg sm:text-xl font-medium">
								🎉 {winner.name} guessed it correctly! 🎉
							</p>
							<p className="text-sm opacity-90 mt-2">
								Questions used: {questionsUsed}/15
							</p>
						</div>
					)}

					{/* Main Content Grid */}
					<div className="grid md:grid-cols-3 gap-8">
						{/* Poster */}
						<div className="md:col-span-1">
							{movieData.posterPath ? (
								<img
									src={getPosterUrl(movieData.posterPath)}
									alt={movieData.title}
									className="w-full rounded-2xl shadow-lg"
								/>
							) : (
								<div className="w-full aspect-[2/3] bg-movie-hover rounded-2xl flex items-center justify-center">
									<FilmIcon className="w-24 h-24 text-movie-border" />
								</div>
							)}

							{/* Links */}
							<div className="mt-4 space-y-2">
								{movieData.imdbId && (
									<a
										href={`https://www.imdb.com/title/${movieData.imdbId}`}
										target="_blank"
										rel="noopener noreferrer"
										className="block w-full py-3 px-4 bg-movie-warning text-white rounded-xl hover:bg-movie-warning/90 transition-colors text-center font-medium"
									>
										View on IMDb
									</a>
								)}
								<a
									href={`https://www.themoviedb.org/movie/${movieData.id}`}
									target="_blank"
									rel="noopener noreferrer"
									className="block w-full py-3 px-4 bg-movie-info text-white rounded-xl hover:bg-movie-info/90 transition-colors text-center font-medium"
								>
									View on TMDB
								</a>
							</div>
						</div>

						{/* Details */}
						<div className="md:col-span-2 space-y-6">
							{/* Title */}
							<div>
								<h1 className="font-heading text-3xl sm:text-4xl text-movie-text mb-2">
									{movieData.title}
								</h1>
								{movieData.tagline && (
									<p className="text-movie-muted italic">"{movieData.tagline}"</p>
								)}
							</div>

							{/* Quick Stats */}
							<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
								<div className="bg-white border-2 border-movie-border rounded-xl p-4">
									<div className="flex items-center gap-2 mb-1">
										<StarIcon className="w-5 h-5 text-movie-warning" />
										<p className="text-xs text-movie-muted">Rating</p>
									</div>
									<p className="text-2xl font-heading text-movie-text">
										{movieData.rating?.toFixed(1)}/10
									</p>
									{renderStars(movieData.rating)}
								</div>

								<div className="bg-white border-2 border-movie-border rounded-xl p-4">
									<div className="flex items-center gap-2 mb-1">
										<CalendarIcon className="w-5 h-5 text-movie-info" />
										<p className="text-xs text-movie-muted">Year</p>
									</div>
									<p className="text-2xl font-heading text-movie-text">
										{movieData.releaseYear}
									</p>
								</div>

								<div className="bg-white border-2 border-movie-border rounded-xl p-4">
									<div className="flex items-center gap-2 mb-1">
										<ClockIcon className="w-5 h-5 text-movie-success" />
										<p className="text-xs text-movie-muted">Runtime</p>
									</div>
									<p className="text-xl font-heading text-movie-text">
										{formatRuntime(movieData.runtime)}
									</p>
								</div>

								<div className="bg-white border-2 border-movie-border rounded-xl p-4">
									<div className="flex items-center gap-2 mb-1">
										<SparklesIcon className="w-5 h-5 text-movie-primary" />
										<p className="text-xs text-movie-muted">Votes</p>
									</div>
									<p className="text-xl font-heading text-movie-text">
										{movieData.voteCount?.toLocaleString()}
									</p>
								</div>
							</div>

							{/* Genres */}
							<div>
								<h3 className="text-sm font-medium text-movie-muted mb-2">Genres</h3>
								<div className="flex flex-wrap gap-2">
									{movieData.genres?.map((genre, index) => (
										<span
											key={index}
											className="px-3 py-1 bg-movie-primary/10 text-movie-primary rounded-full text-sm"
										>
											{genre}
										</span>
									))}
								</div>
							</div>

							{/* Overview */}
							<div>
								<h3 className="text-sm font-medium text-movie-muted mb-2">Plot</h3>
								<p className="text-movie-text leading-relaxed">
									{movieData.overview}
								</p>
							</div>

							{/* Director & Cast */}
							<div className="grid sm:grid-cols-2 gap-4">
								<div>
									<h3 className="text-sm font-medium text-movie-muted mb-2">Director</h3>
									<p className="text-movie-text font-medium">
										{movieData.crew?.find(c => c.job === 'Director')?.name || 'N/A'}
									</p>
								</div>
								<div>
									<h3 className="text-sm font-medium text-movie-muted mb-2">Top Cast</h3>
									<p className="text-movie-text">
										{movieData.cast?.slice(0, 3).map(c => c.name).join(', ')}
									</p>
								</div>
							</div>

							{/* Box Office */}
							<div className="grid sm:grid-cols-2 gap-4">
								<div className="bg-white border-2 border-movie-border rounded-xl p-4">
									<div className="flex items-center gap-2 mb-2">
										<CurrencyDollarIcon className="w-5 h-5 text-movie-success" />
										<h3 className="text-sm font-medium text-movie-muted">Budget</h3>
									</div>
									<p className="text-xl font-heading text-movie-text">
										{formatCurrency(movieData.budget)}
									</p>
								</div>
								<div className="bg-white border-2 border-movie-border rounded-xl p-4">
									<div className="flex items-center gap-2 mb-2">
										<CurrencyDollarIcon className="w-5 h-5 text-movie-warning" />
										<h3 className="text-sm font-medium text-movie-muted">Revenue</h3>
									</div>
									<p className="text-xl font-heading text-movie-text">
										{formatCurrency(movieData.revenue)}
									</p>
								</div>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="mt-8 space-y-4">

						{/* STATE 1: Game Over, Not Waiting - Show Play Next Movie for Host */}
						{!isWaitingForPlayers && isHost && (
							<button
								onClick={onNextMovie}
								className="w-full py-4 bg-movie-success text-white rounded-2xl hover:bg-movie-success/90 transition-all font-heading text-lg flex items-center justify-center gap-2 hover:scale-105"
							>
								<SparklesIcon className="w-6 h-6" />
								Play Next Movie
							</button>
						)}

						{/* STATE 2: Waiting for Players - Show Ready System */}
						{isWaitingForPlayers && (
							<div className="bg-movie-info/10 border-2 border-movie-info/20 rounded-2xl p-6">
								<div className="text-center mb-4">
									<p className="text-movie-info font-heading text-lg mb-2">
										🎬 New movie is ready!
									</p>
									<p className="text-movie-muted text-sm">
										Waiting for players: {readyPlayers?.length || 0}/{totalPlayers}
									</p>
								</div>

								{/* Ready Button for Non-Ready Players */}
								{!readyPlayers?.includes(currentPlayerId) && (
									<button
										onClick={onPlayerReady}
										className="w-full py-3 bg-movie-success text-white rounded-xl hover:bg-movie-success/90 transition-all font-medium"
									>
										✅ I'm Ready to Play
									</button>
								)}

								{/* Already Ready Message */}
								{readyPlayers?.includes(currentPlayerId) && (
									<div className="text-center py-3 bg-movie-success/10 rounded-xl">
										<p className="text-movie-success font-medium">
											✅ You're ready! Waiting for others...
										</p>
									</div>
								)}
							</div>
						)}

						{/* Back to Home / Leave Game */}
						<button
							onClick={() => {
								if (isWaitingForPlayers) {
									// If waiting for players, confirm before leaving
									if (window.confirm('A new game is ready. Are you sure you want to leave?')) {
										onClose();
									}
								} else {
									onClose();
								}
							}}
							className="w-full py-4 bg-movie-primary text-white rounded-2xl hover:bg-movie-primary/90 transition-all font-heading text-lg hover:scale-105"
						>
							{isWaitingForPlayers ? 'Leave Game' : 'Back to Home'}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}