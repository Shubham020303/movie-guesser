// icons
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function VoteModal({ vote, currentPlayerId, players, onVote, onCancel, isProcessing }) {
	const isInitiator = vote.proposedBy === currentPlayerId;
	const hasVoted = vote.votes && vote.votes[currentPlayerId] !== undefined;
	const myVote = vote.votes?.[currentPlayerId];

	const totalPlayers = players.length;
	const votesCount = vote.votes ? Object.keys(vote.votes).length : 0;

	const isHint = vote.type === 'hint' || vote.question === '__HINT__' || vote.question === 'hint';
	const isGiveUp = vote.type === 'give_up' || vote.question === '__GIVEUP__' || vote.question === 'give_up';
	const isGuess = vote.type === 'guess';

	const getProposerName = () => {
		const proposer = players.find(p => p.id === vote.proposedBy);
		return proposer?.name || 'Someone';
	};

	const handleVote = (voteValue) => {
		if (!hasVoted) {
			onVote(voteValue);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
			<div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border-4 border-movie-primary">

				{isProcessing ? (
					<div className="text-center py-8">
						<div className="animate-spin w-12 h-12 border-4 border-movie-primary border-t-transparent rounded-full mx-auto mb-4"></div>
						<p className="text-movie-text font-medium mb-2">
							{vote.type === 'hint' ? 'Generating hint...' : vote.type === 'give_up' ? 'Ending game...' : 'Getting answer...'}
						</p>
						<p className="text-sm text-movie-muted">Please wait</p>
					</div>
				) : (
					<>
						{/* Header */}
						<div className="flex items-start justify-between mb-4">
							<h3 className="font-heading text-xl text-movie-text">
								{isHint ? '💡 Hint Vote' : isGiveUp ? '🏳️ Give Up Vote' : isGuess ? '🎬 Guess Vote' : '🗳️ Question Vote'}
							</h3>
							{isInitiator && (
								<button
									onClick={onCancel}
									className="text-movie-muted hover:text-movie-text transition-colors"
								>
									<XMarkIcon className="w-6 h-6" />
								</button>
							)}
						</div>

						{/* Question/Prompt */}
						<div className="mb-6">
							{!hasVoted ? (
								// Before voting
								<>
									{isInitiator ? (
										<p className="text-movie-text">
											{isHint && 'Are you sure you want a hint?'}
											{isGiveUp && 'Are you sure you want to give up?'}
											{isGuess && `Do you want to guess: "${vote.guess}"?`}
											{!isHint && !isGiveUp && !isGuess && `Do you want to ask: "${vote.question}"?`}
										</p>
									) : (
										<p className="text-movie-text">
											<span className="font-medium text-movie-primary">{getProposerName()}</span>
											{isHint && ' wants a hint'}
											{isGiveUp && ' wants to give up'}
											{isGuess && ` wants to guess: "${vote.guess}"`}
											{!isHint && !isGiveUp && !isGuess && ` wants to ask: "${vote.question}"`}
										</p>
									)}
									{isHint && (
										<p className="text-sm text-movie-warning mt-2">
											⚠️ This will cost 2 questions
										</p>
									)}
									{isGuess && (
										<p className="text-sm text-movie-success mt-2">
											⚠️ This will cost 1 question
										</p>
									)}
									{isGiveUp && (
										<p className="text-sm text-movie-danger mt-2">
											⚠️ This will end the game
										</p>
									)}
								</>
							) : (
								hasVoted && (
									<>
										<p className="text-movie-text font-medium mb-2">
											{isHint ? 'Hint Vote:' : isGiveUp ? 'Give Up Vote:' : isGuess ? 'Guess Vote:' : 'Question:'}
										</p>
										{isGuess && (
											<p className="text-movie-muted mb-3">"{vote.guess}"</p>
										)}
										{!isHint && !isGiveUp && !isGuess && (
											<p className="text-movie-muted mb-3">"{vote.question}"</p>
										)}

										{/* YOUR VOTE - Prominent display */}
										<div className="bg-movie-success/10 border-2 border-movie-success/30 rounded-xl p-4 mb-3">
											<p className="text-sm font-medium text-movie-success mb-1">✅ Your vote recorded</p>
											<p className="text-movie-text">
												You voted: <span className="font-bold">{myVote === 'yes' ? 'Yes' : 'No'}</span>
											</p>
										</div>

										{/* VOTE PROGRESS */}
										<div className="bg-movie-info/10 border-2 border-movie-info/20 rounded-xl p-4">
											<div className="flex items-center justify-between mb-2">
												<p className="text-sm font-medium text-movie-info">
													Votes: {votesCount}/{totalPlayers}
												</p>
												<div className="flex gap-1">
													{[...Array(totalPlayers)].map((_, i) => (
														<div
															key={i}
															className={`w-3 h-3 rounded-full ${i < votesCount ? 'bg-movie-success' : 'bg-movie-border'
																}`}
														/>
													))}
												</div>
											</div>
											<p className="text-xs text-movie-muted">
												{votesCount === totalPlayers
													? 'Processing vote...'
													: `Waiting for ${totalPlayers - votesCount} more ${totalPlayers - votesCount === 1 ? 'player' : 'players'}...`
												}
											</p>
										</div>
									</>
								)
							)}
						</div>

						{/* Vote Buttons */}
						{!hasVoted && (
							<div className="flex gap-3">
								<button
									onClick={() => handleVote('no')}
									className="flex-1 py-3 bg-movie-danger/10 text-movie-danger border-2 border-movie-danger/20 rounded-xl hover:bg-movie-danger/20 transition-colors font-medium"
								>
									No
								</button>
								<button
									onClick={() => handleVote('yes')}
									className="flex-1 py-3 bg-movie-success text-white rounded-xl hover:bg-movie-success/90 transition-colors font-medium"
								>
									Yes
								</button>
							</div>
						)}

						{/* Cancel button for initiator after voting */}
						{hasVoted && isInitiator && (
							<button
								onClick={onCancel}
								className="w-full py-3 bg-movie-hover text-movie-text rounded-xl hover:bg-movie-border transition-colors font-medium"
							>
								Cancel Vote
							</button>
						)}
					</>
				)}

			</div>
		</div>
	);
}