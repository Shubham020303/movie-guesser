import { useState, useEffect } from 'react';

// icons
import {
	ArrowLeftIcon,
	ChatBubbleLeftRightIcon,
	QuestionMarkCircleIcon,
	Bars3Icon,
	XMarkIcon,
	InformationCircleIcon,
} from '@heroicons/react/24/outline';

// components
import PlayersSidebar from './game/PlayersSidebar';
import ChatTab from './game/ChatTab';
import QuestionsTab from './game/QuestionsTab';
import VoteModal from './game/VoteModal';
import VoteDetailsModal from './game/VoteDetailsModal';
import HowToPlay from './game/HowToPlay';
import MovieReveal from './MovieReveal';

export default function GameRoom({ profile, ws, onBack }) {
	const [activeTab, setActiveTab] = useState('questions'); // 'chat' or 'questions'
	const [sidebarOpen, setSidebarOpen] = useState(true); // For mobile toggle
	const [voteDetailsOpen, setVoteDetailsOpen] = useState(false);
	const [selectedVoteDetails, setSelectedVoteDetails] = useState(null);
	const [showMovieReveal, setShowMovieReveal] = useState(false);
	const [gameOverData, setGameOverData] = useState(null);
	const [showHowToPlay, setShowHowToPlay] = useState(false);

	const questionsUsed = (ws.roomData?.questionsAsked || []).reduce((total, item) => {
		if (item.result === 'approved') {
			if (item.type === 'question') return total + 1;
			if (item.type === 'hint') return total + 2;
			if (item.type === 'guess') return total + 1;
		}
		return total;
	}, 0);

	const questionsRemaining = 15 - questionsUsed;
	const isVoting = ws.roomData?.activeVote !== null;
	const isProcessing = ws.roomData?.isProcessing || false;

	const handleShowVoteDetails = (voteData) => {
		setSelectedVoteDetails(voteData);
		setVoteDetailsOpen(true);
	};

	const getCategoryName = (categoryId) => {
		const categories = {
			'general': 'General',
			'hollywood': 'Hollywood',
			'bollywood': 'Bollywood',
			'tollywood': 'Tollywood',
			'korean': 'Korean',
			'anime': 'Anime',
			'action': 'Action',
			'animated': 'Animated',
		};
		return categories[categoryId] || 'General';
	};

	useEffect(() => {
		if (ws.roomData?.gameOver && ws.roomData?.movie) {
			const movieData = ws.roomData.movie;
			const winner = ws.roomData.winner || null;
			const questionsUsed = calculateQuestionsUsed(ws.roomData.questionsAsked || []);

			setGameOverData({ movieData, winner, questionsUsed });
			setShowMovieReveal(true);
		}
	}, [ws.roomData?.gameOver, ws.roomData?.movie]);

	// useEffect(() => {
	// 	// Close movie reveal when new game starts (all players ready)
	// 	if (ws.roomData?.waitingForPlayers === false && showMovieReveal) {
	// 		setShowMovieReveal(false);
	// 		setGameOverData(null); // Clear game over data
	// 	}
	// }, [ws.roomData?.waitingForPlayers, showMovieReveal]);

	useEffect(() => {
		// Game started = gameOver is false AND not waiting for players
		const gameStarted = !ws.roomData?.gameOver && !ws.roomData?.waitingForPlayers;

		if (gameStarted && showMovieReveal) {
			console.log('Closing movie reveal - new game started');
			setShowMovieReveal(false);
			setGameOverData(null);
		}
	}, [ws.roomData?.gameOver, ws.roomData?.waitingForPlayers, showMovieReveal]);

	function calculateQuestionsUsed(questionsAsked) {
		return questionsAsked.reduce((total, item) => {
			if (item.result === 'approved') {
				if (item.type === 'question') return total + 1;
				if (item.type === 'hint') return total + 2;
				if (item.type === 'guess') return total + 1;
			}
			return total;
		}, 0);
	}

	return (
		<div className="h-screen bg-movie-bg flex flex-col overflow-hidden">

			{/* Header */}
			<div className="shrink-0 bg-movie-panel border-b-2 border-movie-border p-4 shadow-sm">
				<div className="max-w-7xl mx-auto flex items-center justify-between">

					{/* Left: Back + Mobile Menu */}
					<div className="flex items-center gap-1 md:gap-3">
						<button
							onClick={onBack}
							className="flex items-center gap-2 text-movie-muted hover:text-movie-text transition-colors"
						>
							<ArrowLeftIcon className="md:w-5 w-4 md:h-5 h-4" />
							<span className="hidden sm:inline font-medium">Back</span>
						</button>

						{/* How to Play Button */}
						<button
							onClick={() => setShowHowToPlay(true)}
							className="p-2 hover:bg-movie-hover rounded-lg transition-colors group"
							title="How to Play"
						>
							<InformationCircleIcon className="w-6 h-6 text-movie-muted group-hover:text-movie-info transition-colors" />
						</button>

						{/* Mobile Sidebar Toggle */}
						<button
							onClick={() => setSidebarOpen(!sidebarOpen)}
							className="lg:hidden p-2 hover:bg-movie-hover rounded-lg transition-colors"
						>
							{sidebarOpen ? (
								<XMarkIcon className="md:w-6 w-4 md:h-6 h-4 text-movie-text" />
							) : (
								<Bars3Icon className="md:w-6 w-4 md:h-6 h-4 text-movie-text" />
							)}
						</button>
					</div>

					{/* Center: Game Info */}
					<div className="flex items-center gap-3 sm:gap-6">
						<div className="text-center">
							<p className="text-xs text-movie-muted">Questions Left</p>
							<p className="text-sm sm:text-xl font-heading text-movie-primary">
								{questionsRemaining}/15
							</p>
						</div>
						<div className="hidden sm:block w-px h-8 bg-movie-border"></div>
						<div className="hidden sm:block text-center">
							<p className="text-xs text-movie-muted">Category</p>
							<p className="text-lg font-heading text-movie-text">
								{getCategoryName(ws.roomData?.category)}
							</p>
						</div>
						<div className="hidden md:block w-px h-8 bg-movie-border"></div>
						<div className="hidden md:block text-center">
							<p className="text-xs text-movie-muted">Room Code</p>
							<p className="text-lg font-heading text-movie-text">
								{ws.roomData?.code}
							</p>
						</div>
					</div>

					{/* Right: Players Count */}
					<div className="text-right">
						<p className="text-xs text-movie-muted">Players</p>
						<p className="text-sm sm:text-xl font-heading text-movie-text">
							{ws.roomData?.players?.length || 0}
						</p>
					</div>

				</div>
			</div>

			{/* Main Content */}
			<div className="flex-1 flex overflow-hidden">

				{/* Sidebar */}
				<PlayersSidebar
					players={ws.roomData?.players || []}
					currentPlayerId={ws.playerId}
					isOpen={sidebarOpen}
					onClose={() => setSidebarOpen(false)}
				/>

				{/* Main Panel */}
				<div className="flex-1 flex flex-col overflow-hidden">

					{/* Tabs - FIXED */}
					<div className="shrink-0 bg-movie-panel border-b-2 border-movie-border">
						<div className="flex">
							<button
								onClick={() => !isVoting && setActiveTab('chat')}
								disabled={isVoting}
								className={`flex-1 text-sm md:text-base py-3 md:py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'chat'
									? 'bg-movie-bg text-movie-primary border-b-4 border-movie-primary'
									: 'text-movie-muted hover:text-movie-text hover:bg-movie-hover disabled:opacity-50 disabled:cursor-not-allowed'
									}`}
							>
								<ChatBubbleLeftRightIcon className="md:w-5 w-4 md:h-5 h-4" />
								Chat
							</button>
							<button
								onClick={() => !isVoting && setActiveTab('questions')}
								disabled={isVoting}
								className={`flex-1 text-sm md:text-base py-3 md:py-4 px-6 font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'questions'
									? 'bg-movie-bg text-movie-primary border-b-4 border-movie-primary'
									: 'text-movie-muted hover:text-movie-text hover:bg-movie-hover disabled:opacity-50 disabled:cursor-not-allowed'
									}`}
							>
								<QuestionMarkCircleIcon className="md:w-5 w-4 md:h-5 h-4" />
								Questions
							</button>
						</div>
					</div>

					{/* Tab Content - SCROLLABLE */}
					<div className="flex-1 overflow-hidden">
						{activeTab === 'chat' && (
							<ChatTab
								messages={ws.messages}
								currentPlayerId={ws.playerId}
								players={ws.roomData?.players || []}
								onSendMessage={ws.sendChatMessage}
								isVoting={isVoting}
							/>
						)}
						{activeTab === 'questions' && (
							<QuestionsTab
								questionsAsked={ws.roomData?.questionsAsked || []}
								questionsRemaining={questionsRemaining}
								onStartVote={ws.startVote}
								isVoting={isVoting}
								onShowVoteDetails={handleShowVoteDetails}
								onGuessMovie={ws.guessMovie}
							/>
						)}
					</div>
				</div>
			</div>

			{/* Vote Modal (shown when voting is active) */}
			{isVoting && (
				<VoteModal
					vote={ws.roomData.activeVote}
					currentPlayerId={ws.playerId}
					players={ws.roomData?.players || []}
					onVote={ws.castVote}
					onCancel={ws.cancelVote}
					isProcessing={isProcessing}
				/>
			)}

			{/* Vote Details Modal */}
			{voteDetailsOpen && selectedVoteDetails && (
				<VoteDetailsModal
					voteData={selectedVoteDetails}
					onClose={() => setVoteDetailsOpen(false)}
				/>
			)}

			{/* Movie Reveal Modal */}
			{showMovieReveal && gameOverData && (
				<MovieReveal
					movieData={gameOverData.movieData}
					winner={gameOverData.winner}
					questionsUsed={gameOverData.questionsUsed}
					isHost={ws.roomData?.players?.find(p => p.id === ws.playerId)?.isHost}
					isWaitingForPlayers={ws.roomData?.waitingForPlayers}
					readyPlayers={ws.roomData?.readyPlayers}
					totalPlayers={ws.roomData?.players?.filter(p => !p.disconnected).length}
					currentPlayerId={ws.playerId}
					onNextMovie={() => {
						ws.nextMovie();
						// setShowMovieReveal(false);
					}}
					onPlayerReady={() => {
						ws.playerReady();
					}}
					onClose={() => {
						ws.leaveRoom();
						setShowMovieReveal(false);
						onBack();
					}}
				/>
			)}

			{/* How to Play Modal */}
			{showHowToPlay && (
				<HowToPlay onClose={() => setShowHowToPlay(false)} />
			)}
		</div>
	);
}