import { useState, useRef, useEffect } from 'react';

// icons
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function ChatTab({ messages, currentPlayerId, players, onSendMessage, isVoting }) {
	const [messageText, setMessageText] = useState('');
	const messagesEndRef = useRef(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSend = (e) => {
		e.preventDefault();
		if (messageText.trim() && !isVoting) {
			onSendMessage(messageText.trim());
			setMessageText('');
		}
	};

	const getPlayerName = (playerId) => {
		const player = players.find(p => p.id === playerId);
		return player?.name || 'Unknown';
	};

	const getAvatarUrl = (playerId) => {
		const player = players.find(p => p.id === playerId);
		if (!player?.avatar) return '';
		return `https://api.dicebear.com/7.x/${player.avatar.style}/svg?seed=${player.avatar.seed}`;
	};

	return (
		<div className="h-full flex flex-col bg-movie-bg">

			{/* Messages - SCROLLABLE */}
			<div className="flex-1 overflow-y-auto p-4 space-y-3">
				{messages
					.filter(msg => msg.type === 'chat')
					.map((msg, index) => {
						const isCurrentUser = msg.playerId === currentPlayerId;

						return (
							<div
								key={index}
								className={`flex items-start gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
							>
								{/* Avatar */}
								<img
									src={getAvatarUrl(msg.playerId)}
									alt={getPlayerName(msg.playerId)}
									className="w-8 h-8 rounded-lg border-2 border-movie-primary shrink-0"
								/>

								{/* Message */}
								<div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
									<p className="text-xs text-movie-muted mb-1">
										{getPlayerName(msg.playerId)}
									</p>
									<div className={`px-3 md:px-4 py-1 md:py-2 rounded-2xl ${isCurrentUser
											? 'bg-movie-primary text-white'
											: 'bg-white border-2 border-movie-border text-movie-text'
										}`}>
										<p className="text-xs md:text-sm wrap-break-word">{msg.message}</p>
									</div>
								</div>
							</div>
						);
					})}

				{messages.filter(msg => msg.type === 'chat').length === 0 && (
					<div className="text-center py-12">
						<p className="text-movie-muted">No messages yet. Start chatting!</p>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{/* Input - FIXED AT BOTTOM */}
			<form onSubmit={handleSend} className="shrink-0 p-2 md:p-4 bg-movie-panel border-t-2 border-movie-border">
				<div className="flex gap-1 md:gap-2">
					<input
						type="text"
						value={messageText}
						onChange={(e) => setMessageText(e.target.value)}
						placeholder={isVoting ? "Voting in progress..." : "Type a message..."}
						disabled={isVoting}
						className="flex-1 text-sm md:text-base px-3 md:px-4 py-2 md:py-3 bg-white rounded-xl border-2 border-movie-border focus:outline-none focus:border-movie-primary text-movie-text placeholder-movie-muted disabled:opacity-50 disabled:cursor-not-allowed"
					/>
					<button
						type="submit"
						disabled={!messageText.trim() || isVoting}
						className="px-3 md:px-4 py-2 md:py-3 bg-movie-primary text-white rounded-xl hover:bg-movie-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
					>
						<PaperAirplaneIcon className="md:w-5 w-4 md:h-5 h-4" />
					</button>
				</div>
			</form>

		</div>
	);
}