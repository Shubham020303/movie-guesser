import { useState } from 'react';

// icons
import {
	QuestionMarkCircleIcon,
	LightBulbIcon,
	FlagIcon,
	ChevronRightIcon,
	FilmIcon,
	ChartBarIcon 
} from '@heroicons/react/24/outline';

export default function QuestionsTab({
	questionsAsked,
	questionsRemaining,
	onStartVote,
	isVoting,
	onShowVoteDetails,
	onGuessMovie
}) {
	const [showQuestionModal, setShowQuestionModal] = useState(false);
	const [showHintConfirm, setShowHintConfirm] = useState(false);
	const [showGiveUpConfirm, setShowGiveUpConfirm] = useState(false);
	const [questionText, setQuestionText] = useState('');
	const [showGuessModal, setShowGuessModal] = useState(false);
	const [guessText, setGuessText] = useState('');

	const handleAskQuestion = () => {
		if (questionText.trim()) {
			onStartVote(questionText.trim());
			setQuestionText('');
			setShowQuestionModal(false);
		}
	};

	const handleHint = () => {
		// Start hint vote
		onStartVote('__HINT__'); // Special marker for hint
		setShowHintConfirm(false);
	};

	const handleGiveUp = () => {
		// Start give up vote
		onStartVote('__GIVEUP__'); // Special marker for give up
		setShowGiveUpConfirm(false);
	};

	const handleGuessMovie = () => {
		if (guessText.trim()) {
			onStartVote(`__GUESS__:${guessText.trim()}`); // Special format for guess
			setGuessText('');
			setShowGuessModal(false);
		}
	};

	return (
		<div className="h-full flex flex-col bg-movie-bg">

			{/* Question History */}
			<div className="flex-1 overflow-y-auto p-4 space-y-4">
				{questionsAsked.length === 0 && (
					<div className="text-center py-12">
						<QuestionMarkCircleIcon className="w-16 h-16 text-movie-muted mx-auto mb-4" />
						<p className="text-movie-muted">No questions asked yet.</p>
						<p className="text-sm text-movie-light mt-2">Start by asking a question below!</p>
					</div>
				)}

				{questionsAsked.map((item, index) => {
					const isHint = item.type === 'hint';
					const isGiveUp = item.type === 'give_up';
					const isGuess = item.type === 'guess';
					const isRejected = item.result === 'rejected';

					return (
						<div
							key={index}
							className={"bg-white border-2 rounded-2xl p-4 shadow-sm " + (isRejected ? 'border-movie-danger' : 'border-movie-border')}
						>
							{/* Header */}
							<div className="flex items-start justify-between mb-3">
								<div className="flex items-center gap-2">
									{isHint && <LightBulbIcon className="w-5 h-5 text-movie-warning" />}
									{isGiveUp && <FlagIcon className="w-5 h-5 text-movie-danger" />}
									{isGuess && <FilmIcon className="w-5 h-5 text-movie-success" />}
									{!isHint && !isGiveUp && !isGuess && <QuestionMarkCircleIcon className="w-5 h-5 text-movie-info" />}
									<span className="text-sm font-medium text-movie-muted">
										{isHint ? 'Hint Request' : isGiveUp ? 'Give Up Vote' : isGuess ? 'Guess Attempt' : `Question #${index + 1}`}
									</span>
								</div>

								<div className="flex items-center gap-2">
									<span className="text-xs text-movie-muted">
										{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</span>

									{/* Vote Stats Icon - Clickable */}
									<button
										onClick={() => onShowVoteDetails(item)}
										className={`p-1.5 rounded-lg transition-all hover:scale-110 ${isRejected
												? 'bg-movie-danger/10 hover:bg-movie-danger/20'
												: 'bg-movie-success/10 hover:bg-movie-success/20'
											}`}
										title={`${isRejected ? 'Rejected' : 'Approved'} - Click for details`}
									>
										<ChartBarIcon className={`w-5 h-5 ${isRejected ? 'text-movie-danger' : 'text-movie-success'
											}`} />
									</button>
								</div>
							</div>

							{/* Question/Guess/Request */}
							{!isHint && !isGiveUp && !isGuess && (
								<p className="text-movie-text text-sm md:text-base font-medium mb-2">{item.question}</p>
							)}
							{isGuess && (
								<p className="text-movie-text text-sm md:text-base font-medium mb-2">Guess: "{item.guess}"</p>
							)}
							<p className="text-xs text-movie-muted mb-3">Proposed by: {item.proposedBy}</p>

							{/* Vote Result - Clickable */}
							{/* <button
								onClick={() => onShowVoteDetails(item)}
								className="w-full text-left p-3 bg-movie-hover hover:bg-movie-border rounded-xl transition-colors mb-3 flex items-center justify-between group"
							>
								<div className="flex items-center gap-2">
									<span className="text-xs md:text-sm font-medium">
										{isRejected ? '❌ Rejected' : '✅ Approved'}
									</span>
									<span className="text-xs md:text-sm text-movie-muted">
										({item.yesVotes?.length || 0} Yes, {item.noVotes?.length || 0} No)
									</span>
								</div>
								<ChevronRightIcon className="md:w-5 w-4 md:h-5 h-4 text-movie-muted group-hover:text-movie-text transition-colors" />
							</button> */}

							{/* Answer (if approved) */}
							{!isRejected && item.answer && (
								<div className={`border-2 rounded-xl p-3 ${isGuess && item.isCorrect
									? 'bg-movie-success/10 border-movie-success/20'
									: 'bg-movie-primary/10 border-movie-primary/20'
									}`}>
									<p className={`text-xs font-medium mb-1 ${isGuess && item.isCorrect ? 'text-movie-success' : 'text-movie-primary'}`}>
										{isGuess ? (item.isCorrect ? '✅ Result:' : '❌ Result:') : isHint ? '💡 Hint:' : '🤖 Answer:'}
									</p>
									<p className="text-xs md:text-sm text-movie-text">{item.answer}</p>
								</div>
							)}

							{/* Cost indicators */}
							{isHint && !isRejected && (
								<p className="text-xs text-movie-warning mt-2">⚠️ Cost: 2 questions</p>
							)}
							{isGuess && !isRejected && (
								<p className="text-xs text-movie-success mt-2">⚠️ Cost: 1 question</p>
							)}
						</div>
					);
				})}
			</div>

			{/* Action Buttons */}
			<div className="shrink-0 p-4 bg-movie-panel border-t-2 border-movie-border space-y-3">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
					{/* Guess Movie - PRIMARY ACTION */}
					<button
						onClick={() => setShowGuessModal(true)}
						disabled={isVoting || questionsRemaining <= 0}
						className="w-full py-3 bg-movie-success text-sm md:text-base text-white rounded-xl hover:bg-movie-success/90 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<FilmIcon className="md:w-5 w-4 md:h-5 h-4" />
						Guess Movie
					</button>

					{/* Ask Question */}
					<button
						onClick={() => setShowQuestionModal(true)}
						disabled={isVoting || questionsRemaining <= 0}
						className="w-full py-3 bg-movie-primary text-sm md:text-base text-white rounded-xl hover:bg-movie-primary/90 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<QuestionMarkCircleIcon className="md:w-5 w-4 md:h-5 h-4" />
						Ask Question
					</button>

					{/* Hint & Give Up */}
					<button
						onClick={() => setShowHintConfirm(true)}
						disabled={isVoting || questionsRemaining < 2}
						className="py-3 bg-movie-warning text-sm md:text-base text-white rounded-xl hover:bg-movie-warning/90 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<LightBulbIcon className="md:w-5 w-4 md:h-5 h-4" />
						Hint
					</button>
					<button
						onClick={() => setShowGiveUpConfirm(true)}
						disabled={isVoting}
						className="py-3 bg-movie-danger text-sm md:text-base text-white rounded-xl hover:bg-movie-danger/90 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<FlagIcon className="md:w-5 w-4 md:h-5 h-4" />
						Give Up
					</button>
				</div>

			</div>

			{/* Ask Question Modal */}
			{showQuestionModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
						<h3 className="font-heading text-xl text-movie-text mb-4">
							What question do you want to ask?
						</h3>
						<textarea
							value={questionText}
							onChange={(e) => setQuestionText(e.target.value)}
							placeholder="e.g., Is it animated?"
							className="w-full px-4 py-3 bg-movie-bg rounded-xl border-2 border-movie-border focus:outline-none focus:border-movie-primary text-movie-text placeholder-movie-muted resize-none"
							rows={3}
							autoFocus
						/>
						<div className="flex gap-3 mt-6">
							<button
								onClick={() => {
									setShowQuestionModal(false);
									setQuestionText('');
								}}
								className="flex-1 py-3 bg-movie-hover text-movie-text rounded-xl hover:bg-movie-border transition-colors font-medium"
							>
								Cancel
							</button>
							<button
								onClick={handleAskQuestion}
								disabled={!questionText.trim()}
								className="flex-1 py-3 bg-movie-primary text-white rounded-xl hover:bg-movie-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Ask
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Hint Confirmation Modal */}
			{showHintConfirm && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
						<h3 className="font-heading text-xl text-movie-text mb-2">
							Are you sure you want a hint?
						</h3>
						<p className="text-movie-muted mb-6">
							⚠️ This will cost <span className="font-bold text-movie-warning">2 questions</span>
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => setShowHintConfirm(false)}
								className="flex-1 py-3 bg-movie-hover text-movie-text rounded-xl hover:bg-movie-border transition-colors font-medium"
							>
								Cancel
							</button>
							<button
								onClick={handleHint}
								className="flex-1 py-3 bg-movie-warning text-white rounded-xl hover:bg-movie-warning/90 transition-colors font-medium"
							>
								Yes, Get Hint
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Give Up Confirmation Modal */}
			{showGiveUpConfirm && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
						<h3 className="font-heading text-xl text-movie-text mb-2">
							Are you sure you want to give up?
						</h3>
						<p className="text-movie-muted mb-6">
							⚠️ This will <span className="font-bold text-movie-danger">end the game</span>
						</p>
						<div className="flex gap-3">
							<button
								onClick={() => setShowGiveUpConfirm(false)}
								className="flex-1 py-3 bg-movie-hover text-movie-text rounded-xl hover:bg-movie-border transition-colors font-medium"
							>
								Cancel
							</button>
							<button
								onClick={handleGiveUp}
								className="flex-1 py-3 bg-movie-danger text-white rounded-xl hover:bg-movie-danger/90 transition-colors font-medium"
							>
								Yes, Give Up
							</button>
						</div>
					</div>
				</div>
			)}

			{/* Guess Movie Modal */}
			{showGuessModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
						<div className="bg-movie-info/10 border-2 border-movie-info/20 rounded-xl p-3 mb-4">
							<p className="text-xs text-movie-info font-medium mb-1">💡 Tip:</p>
							<p className="text-xs text-movie-text">
								Enter the FULL movie title as it appears (e.g., "Avatar: The Way of Water" not "Avatar 2")
							</p>
						</div>
						<h3 className="font-heading text-xl text-movie-text mb-4">
							What's your guess?
						</h3>
						<input
							type="text"
							value={guessText}
							onChange={(e) => setGuessText(e.target.value)}
							placeholder="Enter movie name..."
							className="w-full px-4 py-3 bg-movie-bg rounded-xl border-2 border-movie-border focus:outline-none focus:border-movie-success text-movie-text placeholder-movie-muted"
							autoFocus
						/>
						<div className="flex gap-3 mt-6">
							<button
								onClick={() => {
									setShowGuessModal(false);
									setGuessText('');
								}}
								className="flex-1 py-3 bg-movie-hover text-movie-text rounded-xl hover:bg-movie-border transition-colors font-medium"
							>
								Cancel
							</button>
							<button
								onClick={handleGuessMovie}
								disabled={!guessText.trim()}
								className="flex-1 py-3 bg-movie-success text-white rounded-xl hover:bg-movie-success/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Submit Guess
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}