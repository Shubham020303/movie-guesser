import { useState } from 'react';
import {
	ClipboardDocumentCheckIcon,
	ShareIcon,
	PlayIcon,
	ArrowLeftIcon,
	UserGroupIcon
} from '@heroicons/react/24/outline';

export default function WaitingLobby({ profile, ws, onBack }) {
	const [copied, setCopied] = useState(false);

	const getAvatarUrl = (avatar) => {
		return `https://api.dicebear.com/7.x/${avatar.style}/svg?seed=${avatar.seed}`;
	};

	const isHost = ws.roomData?.players?.find(p => p.id === ws.playerId)?.isHost;

	const handleCopyCode = () => {
		navigator.clipboard.writeText(ws.roomData.code);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const handleShare = async () => {
		const shareUrl = `${window.location.origin}/room/${ws.roomData.code}`; // Add /room/ prefix

		const shareData = {
			title: 'Join my Movie Guesser game!',
			text: `Join my game with code: ${ws.roomData.code}`,
			url: shareUrl,
		};

		if (navigator.share) {
			try {
				await navigator.share(shareData);
			} catch (err) {
				console.log('Share cancelled');
			}
		} else {
			// Fallback: copy the full URL
			navigator.clipboard.writeText(shareUrl);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	const handleStartGame = () => {
		if (!ws.isConnected) {
			alert('Not connected to server. Please wait...');
			return;
		}

		if (ws.roomData?.players?.length < 2) {
			alert('Need at least 2 players to start the game');
			return;
		}

		// Send start game message
		ws.startGame();
	};

	const getCategoryName = (code) => {
		const categories = {
			'general': 'General',
			'hollywood': 'Hollywood',
			'bollywood': 'Bollywood',
			'tollywood': 'Tollywood',
			'korean': 'Korean Cinema',
			'anime': 'Anime Movies',
			'action': 'Action & Thriller',
			'animated': 'Animated',
		};
		return categories[code] || 'General';
	};

	return (
		<div className="min-h-screen bg-movie-bg p-6">
			<div className="max-w-4xl mx-auto">

				{/* Back Button */}
				<button
					onClick={onBack}
					className="mb-6 flex items-center gap-2 text-movie-muted hover:text-movie-text transition-colors"
				>
					<ArrowLeftIcon className="w-5 h-5" />
					<span className="font-medium">Back to Home</span>
				</button>

				{/* Ticket Display */}
				<div className="bg-movie-panel border-2 border-movie-border rounded-3xl overflow-hidden shadow-card mb-8">

					{/* Ticket Header */}
					<div className="bg-linear-to-r from-movie-primary to-movie-info p-6 text-white relative">
						<div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
						<div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

						<div className="relative z-10">
							<h1 className="font-heading text-xl md:text-3xl mb-2">🎬 Movie Guesser</h1>
							<p className="text-sm md:text-base text-white/80">Game Ticket</p>
						</div>
					</div>

					{/* Ticket Body */}
					<div className="p-6 md:p-8">
						<div className="grid md:grid-cols-2 gap-6 mb-6">
							{/* Room Code */}
							<div>
								<p className="text-xs md:text-sm text-movie-muted mb-2 font-medium">Room Code</p>
								<div className="flex items-center gap-1 md:gap-3">
									<p className="font-heading text-xl md:text-4xl text-movie-primary tracking-wider">
										{ws.roomData?.code}
									</p>
									<button
										onClick={handleCopyCode}
										className="md:p-2 hover:bg-movie-hover rounded-lg transition-colors"
										title="Copy code"
									>
										<ClipboardDocumentCheckIcon className={`w-5 md:w-6 h-5 md:h-6 ${copied ? 'text-movie-success' : 'text-movie-muted'}`} />
									</button>
								</div>
								{copied && (
									<p className="text-xs text-movie-success mt-1">Copied!</p>
								)}
							</div>

							{/* Category */}
							<div>
								<p className="text-xs md:text-sm text-movie-muted mb-2 font-medium">Category</p>
								<p className="text-xl md:text-2xl font-heading text-movie-text">
									{getCategoryName(ws.roomData?.category)}
								</p>
							</div>

							{/* Your Seat */}
							<div>
								<p className="text-xs md:text-sm text-movie-muted mb-2 font-medium">Your Seat</p>
								<div className="flex items-center gap-2 md:gap-3">
									<img
										src={getAvatarUrl(profile.avatar)}
										alt={profile.name}
										className="w-10 md:w-12 h-10 md:h-12 rounded-xl border-2 border-movie-primary"
									/>
									<div>
										<p className="text-xs md:text-base font-medium text-movie-text">{profile.name}</p>
										<p className="text-xs text-movie-muted">
											{isHost ? '👑 Host' : 'Player'}
										</p>
									</div>
								</div>
							</div>

							{/* Players Count */}
							<div>
								<p className="text-xs md:text-sm text-movie-muted mb-2 font-medium">Players</p>
								<div className="flex items-center gap-2">
									<UserGroupIcon className="w-5 md:w-6 h-5 md:h-6 text-movie-info" />
									<p className="text-xl md:text-2xl font-heading text-movie-text">
										{ws.roomData?.players?.length || 0}
									</p>
								</div>
							</div>
						</div>

						{/* Dashed Line Separator */}
						<div className="border-t-2 border-dashed border-movie-border mb-6"></div>

						{/* Share Buttons */}
						<div className="flex flex-col md:flex-row gap-3">
							<button
								onClick={handleCopyCode}
								className="flex-1 text-sm md:text-base py-2 md:py-3 md:px-4 bg-movie-hover hover:bg-movie-border rounded-xl transition-colors flex items-center justify-center gap-2 font-medium text-movie-text"
							>
								<ClipboardDocumentCheckIcon className="w-4 md:w-5 h-4 md:h-5" />
								Copy Code
							</button>
							<button
								onClick={handleShare}
								className="flex-1 text-sm md:text-base py-2 md:py-3 md:px-4 bg-movie-info text-white rounded-xl hover:bg-movie-info/90 transition-colors flex items-center justify-center gap-2 font-medium"
							>
								<ShareIcon className="w-4 md:w-5 h-4 md:h-5" />
								Share Invite
							</button>
						</div>
					</div>
				</div>

				{/* Players List */}
				<div className="bg-movie-panel border-2 border-movie-border rounded-3xl p-6 shadow-card mb-6">
					<div className="flex items-center gap-1 md:gap-3 mb-6">
						<UserGroupIcon className="w-5 md:w-6 h-5 md:h-6 text-movie-primary" />
						<h2 className="font-heading text-sm md:text-2xl text-movie-text">
							Players in Lobby ({ws.roomData?.players?.length || 0})
						</h2>
					</div>

					<div className="grid sm:grid-cols-2 gap-4">
						{ws.roomData?.players?.map((player) => (
							<div
								key={player.id}
								className="flex items-center gap-2 md:gap-4 p-2 md:p-4 bg-movie-hover rounded-2xl border-2 border-transparent hover:border-movie-primary transition-all"
							>
								<img
									src={getAvatarUrl(player.avatar)}
									alt={player.name}
									className="w-8 md:w-14 h-8 md:h-14 rounded-xl border-2 border-movie-primary"
								/>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<p className="text-xs md:text-base font-medium text-movie-text">{player.name}</p>
										{player.isHost && (
											<span className="hidden md:block text-xs bg-movie-warning text-white px-2 py-1 rounded-full">
												👑 Host
											</span>
										)}
									</div>
									<p className="text-xs text-movie-muted">
										{player.id === ws.playerId ? `You${player.isHost && window.innerWidth < 500 ? ' (👑)' : ''}` : 'Player'}
									</p>
								</div>
							</div>
						))}
					</div>

					{/* Waiting Message */}
					{ws.roomData?.players?.length === 1 && (
						<div className="mt-6 text-center p-3 md:p-6 bg-movie-info/10 rounded-2xl border-2 border-movie-info/20">
							<p className="text-sm md:text-base text-movie-muted">
								Waiting for other players to join...
							</p>
							<p className="text-xs md:text-sm text-movie-light mt-1">
								Share the room code with your friends!
							</p>
						</div>
					)}
				</div>

				{/* Start Game Button (Host Only) */}
				{isHost && (
					<button
						onClick={handleStartGame}
						disabled={ws.roomData?.players?.length < 2}
						className="w-full py-2 md:py-4 bg-movie-success text-white font-heading md:text-lg rounded-2xl hover:bg-movie-success/90 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-1 md:gap-3"
					>
						<PlayIcon className="w-5 md:w-6 h-5 md:h-6" />
						Start Game
					</button>
				)}

				{/* Non-host waiting message */}
				{!isHost && (
					<div className="text-center p-2 md:p-4 bg-movie-hover rounded-2xl border-2 border-movie-border">
						<p className="text-sm md:text-base text-movie-muted">
							Waiting for host to start the game...
						</p>
					</div>
				)}
			</div>
		</div>
	);
}