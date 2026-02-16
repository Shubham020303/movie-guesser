// src/components/game/HowToPlay.jsx
import {
	XMarkIcon,
	QuestionMarkCircleIcon,
	LightBulbIcon,
	FilmIcon,
	FlagIcon,
	ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

export default function HowToPlay({ onClose }) {
	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">

				{/* Header */}
				<div className="sticky top-0 bg-linear-to-r from-movie-primary to-movie-info p-6 text-white">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="font-heading text-3xl mb-1">🎬 How to Play</h2>
							<p className="text-white/80">Movie Guesser Rules</p>
						</div>
						<button
							onClick={onClose}
							className="p-2 hover:bg-white/20 rounded-full transition-colors"
						>
							<XMarkIcon className="w-6 h-6" />
						</button>
					</div>
				</div>

				{/* Content */}
				<div className="p-6 space-y-6">

					{/* Objective */}
					<div className="bg-movie-primary/10 border-2 border-movie-primary/20 rounded-2xl p-6">
						<h3 className="font-heading text-xl text-movie-primary mb-3 flex items-center gap-2">
							🎯 Objective
						</h3>
						<p className="text-movie-text">
							Work together with other players to guess the secret movie! Discuss in the chat,
							vote on questions, and use your 15 questions wisely to figure out what movie it is.
						</p>
					</div>

					{/* How It Works */}
					<div>
						<h3 className="font-heading text-xl text-movie-text mb-4">📝 How It Works</h3>
						<div className="space-y-4">

							<div className="flex gap-4">
								<div className="shrink-0 w-12 h-12 bg-movie-info/10 rounded-xl flex items-center justify-center">
									<ChatBubbleLeftRightIcon className="w-6 h-6 text-movie-info" />
								</div>
								<div>
									<p className="font-medium text-movie-text mb-1">1. Discuss</p>
									<p className="text-sm text-movie-muted">
										Use the chat tab to discuss theories and ideas with other players about what the movie might be.
									</p>
								</div>
							</div>

							<div className="flex gap-4">
								<div className="shrink-0 w-12 h-12 bg-movie-success/10 rounded-xl flex items-center justify-center">
									<QuestionMarkCircleIcon className="w-6 h-6 text-movie-success" />
								</div>
								<div>
									<p className="font-medium text-movie-text mb-1">2. Propose Questions</p>
									<p className="text-sm text-movie-muted">
										Any player can propose a question. All players must vote on whether to ask it.
									</p>
								</div>
							</div>

							<div className="flex gap-4">
								<div className="shrink-0 w-12 h-12 bg-movie-warning/10 rounded-xl flex items-center justify-center">
									<span className="text-2xl">🗳️</span>
								</div>
								<div>
									<p className="font-medium text-movie-text mb-1">3. Vote Together</p>
									<p className="text-sm text-movie-muted">
										Questions are only asked if the majority votes "Yes". Work as a team!
									</p>
								</div>
							</div>

							<div className="flex gap-4">
								<div className="shrink-0 w-12 h-12 bg-movie-primary/10 rounded-xl flex items-center justify-center">
									<FilmIcon className="w-6 h-6 text-movie-primary" />
								</div>
								<div>
									<p className="font-medium text-movie-text mb-1">4. Guess the Movie</p>
									<p className="text-sm text-movie-muted">
										When you think you know it, propose a guess. If correct, you win! If wrong, you lose 1 question.
									</p>
								</div>
							</div>

						</div>
					</div>

					{/* Actions & Costs */}
					<div>
						<h3 className="font-heading text-xl text-movie-text mb-4">⚡ Actions & Costs</h3>
						<div className="space-y-3">

							<div className="bg-white border-2 border-movie-border rounded-xl p-4 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<QuestionMarkCircleIcon className="w-6 h-6 text-movie-info" />
									<div>
										<p className="font-medium text-movie-text">Ask a Question</p>
										<p className="text-sm text-movie-muted">Get a tricky but truthful answer</p>
									</div>
								</div>
								<span className="font-heading text-2xl text-movie-info">-1</span>
							</div>

							<div className="bg-white border-2 border-movie-border rounded-xl p-4 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<LightBulbIcon className="w-6 h-6 text-movie-warning" />
									<div>
										<p className="font-medium text-movie-text">Request a Hint</p>
										<p className="text-sm text-movie-muted">Get a helpful clue about the movie</p>
									</div>
								</div>
								<span className="font-heading text-2xl text-movie-warning">-2</span>
							</div>

							<div className="bg-white border-2 border-movie-border rounded-xl p-4 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<FilmIcon className="w-6 h-6 text-movie-success" />
									<div>
										<p className="font-medium text-movie-text">Guess the Movie</p>
										<p className="text-sm text-movie-muted">Win if correct, lose 1 question if wrong</p>
									</div>
								</div>
								<span className="font-heading text-2xl text-movie-success">-1</span>
							</div>

							<div className="bg-white border-2 border-movie-border rounded-xl p-4 flex items-center justify-between">
								<div className="flex items-center gap-3">
									<FlagIcon className="w-6 h-6 text-movie-danger" />
									<div>
										<p className="font-medium text-movie-text">Give Up</p>
										<p className="text-sm text-movie-muted">End the game and reveal the movie</p>
									</div>
								</div>
								<span className="font-heading text-2xl text-movie-danger">Game Over</span>
							</div>

						</div>
					</div>

					{/* Question Limit */}
					<div className="bg-movie-danger/10 border-2 border-movie-danger/20 rounded-2xl p-6">
						<h3 className="font-heading text-xl text-movie-danger mb-3 flex items-center gap-2">
							⏱️ Question Limit
						</h3>
						<p className="text-movie-text mb-2">
							You have a total of <span className="font-bold">15 questions</span> to guess the movie.
						</p>
						<p className="text-sm text-movie-muted">
							Remember: Questions cost 1, Hints cost 2, and Guesses cost 1. Use them wisely!
						</p>
					</div>

					{/* Tips */}
					<div>
						<h3 className="font-heading text-xl text-movie-text mb-4">💡 Pro Tips</h3>
						<ul className="space-y-2 text-sm text-movie-muted">
							<li className="flex gap-2">
								<span className="text-movie-primary">•</span>
								<span>Start with broad questions (genre, era, main actors)</span>
							</li>
							<li className="flex gap-2">
								<span className="text-movie-primary">•</span>
								<span>The AI gives tricky answers - read between the lines!</span>
							</li>
							<li className="flex gap-2">
								<span className="text-movie-primary">•</span>
								<span>Use hints strategically when you're stuck</span>
							</li>
							<li className="flex gap-2">
								<span className="text-movie-primary">•</span>
								<span>Don't guess too early - make sure you're confident!</span>
							</li>
							<li className="flex gap-2">
								<span className="text-movie-primary">•</span>
								<span>Work together and discuss in the chat</span>
							</li>
						</ul>
					</div>

				</div>

			</div>
		</div>
	);
}