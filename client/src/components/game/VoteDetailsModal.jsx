// icons
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function VoteDetailsModal({ voteData, onClose }) {
	const isHint = voteData.type === 'hint';
	const isGiveUp = voteData.type === 'give_up';
	const isGuess = voteData.type === 'guess';
	const isRejected = voteData.result === 'rejected';

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">

				{/* Header */}
				<div className="flex items-start justify-between mb-4">
					<h3 className="font-heading text-xl text-movie-text">
						Vote Details
					</h3>
					<button
						onClick={onClose}
						className="text-movie-muted hover:text-movie-text transition-colors"
					>
						<XMarkIcon className="w-6 h-6" />
					</button>
				</div>

				{/* Question/Type */}
				<div className="mb-6">
					{isHint && (
						<p className="text-movie-warning font-medium mb-2">💡 Hint Request</p>
					)}
					{isGiveUp && (
						<p className="text-movie-danger font-medium mb-2">🏳️ Give Up Vote</p>
					)}
					{isGuess && (
						<p className="text-movie-success font-medium mb-2">🎬 Guess Attempt</p>
					)}
					{isGuess && (
						<>
							<p className="text-sm text-movie-muted mb-1">Guess:</p>
							<p className="text-movie-text font-medium mb-3">"{voteData.guess}"</p>
						</>
					)}
					{!isHint && !isGiveUp && !isGuess && (
						<>
							<p className="text-sm text-movie-muted mb-1">Question:</p>
							<p className="text-movie-text font-medium mb-3">"{voteData.question}"</p>
						</>
					)}
					<p className="text-sm text-movie-muted">
						Proposed by: <span className="text-movie-text font-medium">{voteData.proposedBy}</span>
					</p>
				</div>

				{/* Vote Breakdown */}
				<div className="space-y-4 mb-6">

					{/* Yes Votes */}
					<div>
						<p className="text-sm font-medium text-movie-success mb-2">
							✅ Voted Yes ({voteData.yesVotes?.length || 0}):
						</p>
						{voteData.yesVotes && voteData.yesVotes.length > 0 ? (
							<ul className="space-y-1 pl-4">
								{voteData.yesVotes.map((name, index) => (
									<li key={index} className="text-sm text-movie-text">• {name}</li>
								))}
							</ul>
						) : (
							<p className="text-sm text-movie-muted pl-4">• None</p>
						)}
					</div>

					{/* No Votes */}
					<div>
						<p className="text-sm font-medium text-movie-danger mb-2">
							❌ Voted No ({voteData.noVotes?.length || 0}):
						</p>
						{voteData.noVotes && voteData.noVotes.length > 0 ? (
							<ul className="space-y-1 pl-4">
								{voteData.noVotes.map((name, index) => (
									<li key={index} className="text-sm text-movie-text">• {name}</li>
								))}
							</ul>
						) : (
							<p className="text-sm text-movie-muted pl-4">• None</p>
						)}
					</div>

				</div>

				{/* Final Result */}
				<div className={`p-4 rounded-xl border-2 ${isRejected
					? 'bg-movie-danger/10 border-movie-danger/20'
					: 'bg-movie-success/10 border-movie-success/20'
					}`}>
					<p className="text-sm font-medium text-center">
						Final Result: {isRejected ? '❌ Rejected' : '✅ Approved'}
					</p>
				</div>

			</div>
		</div>
	);
}