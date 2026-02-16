export default function PlayersSidebar({ players, currentPlayerId, isOpen, onClose }) {

	const getAvatarUrl = (avatar) => {
		return `https://api.dicebear.com/7.x/${avatar.style}/svg?seed=${avatar.seed}`;
	};

	return (
		<>
			{/* Mobile Overlay */}
			{isOpen && (
				<div
					className="lg:hidden fixed inset-0 bg-black/50 z-20"
					onClick={onClose}
				></div>
			)}

			{/* Sidebar */}
			<div className={`bg-movie-panel border-r-2 border-movie-border w-64 shrink-0 overflow-y-auto lg:relative fixed inset-y-0 left-0 z-30 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
				<div className="p-4">
					<h3 className="font-heading text-lg text-movie-text mb-4 flex items-center gap-2">
						👥 Players ({players.length})
					</h3>

					<div className="space-y-3">
						{players.map((player) => (
							<div
								key={player.id}
								className={`p-3 rounded-xl border-2 transition-all ${player.id === currentPlayerId
										? 'border-movie-primary bg-movie-primary/10'
										: player.disconnected
											? 'border-movie-border bg-movie-hover opacity-50'
											: 'border-movie-border bg-white'
									}`}
							>
								<div className="flex items-center gap-3">
									<div className="relative">
										<img
											src={getAvatarUrl(player.avatar)}
											alt={player.name}
											className="w-12 h-12 rounded-lg border-2 border-movie-primary"
										/>
										{/* Win Badge */}
										{player.wins > 0 && (
											<div className="absolute -top-1 -right-1 bg-movie-warning text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
												{player.wins}
											</div>
										)}
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-medium text-movie-text text-sm truncate">
											{player.name}
											{player.id === currentPlayerId && (
												<span className="text-movie-muted ml-1">(You)</span>
											)}
										</p>
										<div className="flex items-center gap-1 mt-1 flex-wrap">
											{player.isHost && (
												<span className="text-xs bg-movie-warning text-white px-2 py-0.5 rounded-full">
													👑 Host
												</span>
											)}
											{player.disconnected && (
												<span className="text-xs bg-movie-danger/20 text-movie-danger px-2 py-0.5 rounded-full">
													Offline
												</span>
											)}
											{player.wins > 0 && (
												<span className="text-xs bg-movie-success/20 text-movie-success px-2 py-0.5 rounded-full font-medium">
													🏆 {player.wins} {player.wins === 1 ? 'win' : 'wins'}
												</span>
											)}
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</>
	);
}