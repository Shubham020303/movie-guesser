import { useState, useEffect, useRef, useCallback } from 'react';

const getWebSocketUrl = () => {
	// Production - use Render backend
	if (import.meta.env.PROD) {
	return 'wss://movie-guesser-oz1u.onrender.com';
	}
	
	// Development - use localhost
	return 'ws://localhost:8080';
};

const WS_URL = getWebSocketUrl()

export function useWebSocket() {
	const [isConnected, setIsConnected] = useState(false);
	const [roomData, setRoomData] = useState(null);
	const [messages, setMessages] = useState([]);
	const [playerId, setPlayerId] = useState(null);
	const [error, setError] = useState(null);

	const wsRef = useRef(null);
	const reconnectTimeoutRef = useRef(null);
	const shouldReconnectRef = useRef(true);

	// Connect to WebSocket
	useEffect(() => {
		connect();

		// Prevent reconnect on page unload
		const handleBeforeUnload = () => {
			shouldReconnectRef.current = false;
		};

		window.addEventListener('beforeunload', handleBeforeUnload);

		return () => {
			shouldReconnectRef.current = false;
			window.removeEventListener('beforeunload', handleBeforeUnload);
			if (wsRef.current) {
				wsRef.current.close();
			}
			if (reconnectTimeoutRef.current) {
				clearTimeout(reconnectTimeoutRef.current);
			}
		};
	}, []);

	const connect = () => {
		try {
			const ws = new WebSocket(WS_URL);

			ws.onopen = () => {
				console.log('WebSocket connected');
				setIsConnected(true);
				setError(null);
			};

			ws.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					handleMessage(data);
				} catch (err) {
					console.error('Error parsing message:', err);
				}
			};

			ws.onerror = (error) => {
				console.error('WebSocket error:', error);
				setError('Connection error');
			};

			ws.onclose = () => {
				console.log('WebSocket disconnected');
				setIsConnected(false);

				// Only attempt to reconnect if we should
				if (shouldReconnectRef.current) {
					reconnectTimeoutRef.current = setTimeout(() => {
						console.log('Attempting to reconnect...');
						connect();
					}, 3000);
				}
			};

			wsRef.current = ws;
		} catch (err) {
			console.error('Failed to connect:', err);
			setError('Failed to connect to server');
		}
	};

	const handleMessage = (data) => {
		console.log('Received:', data);

		switch (data.type) {
			case 'game_started':
				setRoomData(prev => ({
					...prev,
					gameStarted: true,
				}));
				addSystemMessage('Game started! Good luck!');
				break;

			case 'room_created':
				setPlayerId(data.playerId);
				setRoomData(data.room);
				// Save to localStorage
				localStorage.setItem('currentPlayerId', data.playerId);
				localStorage.setItem('currentRoomCode', data.room.code);
				break;

			case 'room_joined':
				setPlayerId(data.playerId);
				setRoomData(data.room);
				// Save to localStorage
				localStorage.setItem('currentPlayerId', data.playerId);
				localStorage.setItem('currentRoomCode', data.room.code);
				break;

			case 'player_joined':
				setRoomData(data.room);
				addSystemMessage(`${data.player.name} joined the room`);
				break;

			case 'player_left':
				setRoomData(data.room);
				addSystemMessage(`A player left the room`);
				break;

			case 'chat_message':
				setMessages(prev => [...prev, {
					type: 'chat',
					playerId: data.playerId,
					message: data.message,
					timestamp: data.timestamp,
				}]);
				break;

			case 'vote_started':
				setRoomData(prev => ({
					...prev,
					activeVote: data.vote,
				}));
				addSystemMessage(`Vote started`);
				break;

			case 'vote_progress':
				addSystemMessage(`Votes: ${data.votesCount}/${data.totalPlayers}`);
				break;

			case 'vote_processing':
				setRoomData(prev => ({
					...prev,
					isProcessing: true, // Add processing flag
				}));
				addSystemMessage('Processing answer...');
				break;

			case 'vote_updated':
				setRoomData(prev => ({
					...prev,
					activeVote: data.vote, // Update the vote with new votes
				}));
				// Optionally add a system message
				// addSystemMessage(`Votes: ${data.votesCount}/${data.totalPlayers}`);
				break;

			case 'question_answered':
				setRoomData(prev => ({
					...prev,
					questionsAsked: [...(prev.questionsAsked || []), data.voteDetails],
					activeVote: null,
					isProcessing: false, // Clear processing flag
				}));
				addSystemMessage(`Question answered! (${data.questionsCount} questions used)`);
				break;

			case 'vote_rejected':
				setRoomData(prev => ({
					...prev,
					questionsAsked: [...(prev.questionsAsked || []), data.voteDetails],
					activeVote: null,
					isProcessing: false, // Clear processing flag
				}));
				addSystemMessage(`Vote rejected`);
				break;

			case 'vote_cancelled':
				setRoomData(prev => ({
					...prev,
					activeVote: null,
				}));
				addSystemMessage(`Vote cancelled by proposer`);
				break;

			case 'game_won':
				setRoomData(prev => ({
					...prev,
					gameOver: true,
					activeVote: null,
					movie: data.movie, // Make sure this is set
					winner: data.winner,
				}));
				if (data.voteDetails) {
					setRoomData(prev => ({
						...prev,
						questionsAsked: [...(prev.questionsAsked || []), data.voteDetails],
					}));
				}
				addSystemMessage(`🎉 ${data.winner.name} won! The movie was "${data.movie.title}"!`);
				break;

			case 'game_over':
				setRoomData(prev => ({
					...prev,
					gameOver: true,
					activeVote: null,
					isProcessing: false,
					movie: data.movie, // Make sure this is set
				}));
				if (data.voteDetails) {
					setRoomData(prev => ({
						...prev,
						questionsAsked: [...(prev.questionsAsked || []), data.voteDetails],
					}));
				}
				addSystemMessage(`Game Over! The movie was "${data.movie.title}"`);
				break;

			case 'wrong_guess':
				addSystemMessage(`Wrong guess!`);
				break;

			case 'error':
				setError(data.message);
				addSystemMessage(`Error: ${data.message}`);
				break;

			case 'player_disconnected':
				setRoomData(data.room);
				addSystemMessage(`A player temporarily disconnected`);
				break;

			case 'player_reconnected':
				setRoomData(data.room);
				addSystemMessage(`A player reconnected`);
				break;

			case 'new_movie_started':
				setRoomData(data.room);
				setMessages([]); // Clear chat
				addSystemMessage('🎬 New movie! Good luck!');
				break;

			case 'new_movie_waiting':
				setRoomData(data.room);
				addSystemMessage('🎬 New movie selected! Waiting for players to ready up...');
				break;

			case 'player_ready_update':
				setRoomData(data.room);
				addSystemMessage(`Ready: ${data.readyCount}/${data.totalCount}`);
				break;

			case 'new_movie_started':
				setRoomData(data.room);
				setMessages([]); // Clear chat
				addSystemMessage('🎬 New movie! Good luck!');
				break;

			default:
				console.log('Unknown message type:', data.type);
		}
	};

	const addSystemMessage = (text) => {
		setMessages(prev => [...prev, {
			type: 'system',
			message: text,
			timestamp: Date.now(),
		}]);
	};

	// Send functions
	const createRoom = useCallback((playerName, playerAvatar, category, categoryParams) => {
		if (wsRef.current && isConnected) {
			const existingPlayerId = localStorage.getItem('currentPlayerId');

			wsRef.current.send(JSON.stringify({
				type: 'create_room',
				playerName,
				playerAvatar,
				category, // Add this
				categoryParams, // Add this
				playerId: existingPlayerId,
			}));
		}
	}, [isConnected]);

	const joinRoom = useCallback((roomCode, playerName, playerAvatar) => {
		if (wsRef.current && isConnected) {
			const existingPlayerId = localStorage.getItem('currentPlayerId');

			wsRef.current.send(JSON.stringify({
				type: 'join_room',
				roomCode,
				playerName,
				playerAvatar,
				playerId: existingPlayerId, // Send if rejoining
			}));
		}
	}, [isConnected]);

	const sendChatMessage = useCallback((message) => {
		if (wsRef.current && isConnected) {
			wsRef.current.send(JSON.stringify({
				type: 'chat_message',
				message,
			}));
		}
	}, [isConnected]);

	const startVote = useCallback((question) => {
		if (wsRef.current && isConnected) {
			wsRef.current.send(JSON.stringify({
				type: 'start_vote',
				question,
			}));
		}
	}, [isConnected]);

	const castVote = useCallback((vote) => {
		if (wsRef.current && isConnected) {
			wsRef.current.send(JSON.stringify({
				type: 'cast_vote',
				vote, // 'yes' or 'no'
			}));
		}
	}, [isConnected]);

	const cancelVote = useCallback(() => {
		if (wsRef.current && isConnected) {
			wsRef.current.send(JSON.stringify({
				type: 'cancel_vote',
			}));
		}
	}, [isConnected]);

	const guessMovie = useCallback((guess) => {
		if (wsRef.current && isConnected) {
			wsRef.current.send(JSON.stringify({
				type: 'guess_movie',
				guess,
			}));
		}
	}, [isConnected]);

	const leaveRoom = useCallback(() => {
		// Send leave message to server
		if (wsRef.current && isConnected) {
			wsRef.current.send(JSON.stringify({
				type: 'leave_room',
			}));
		}

		// Clear room-related data
		localStorage.removeItem('currentPlayerId');
		localStorage.removeItem('currentRoomCode');
		setRoomData(null);
		setPlayerId(null);
	}, [isConnected]);

	const startGame = useCallback(() => {
		if (wsRef.current && isConnected) {
			wsRef.current.send(JSON.stringify({
				type: 'start_game',
			}));
		}
	}, [isConnected]);

	const nextMovie = useCallback(() => {
		if (wsRef.current && isConnected) {
			wsRef.current.send(JSON.stringify({
				type: 'next_movie',
			}));
		}
	}, [isConnected]);

	const playerReady = useCallback(() => {
		if (wsRef.current && isConnected) {
			wsRef.current.send(JSON.stringify({
				type: 'player_ready',
			}));
		}
	}, [isConnected]);

	return {
		isConnected,
		roomData,
		messages,
		playerId,
		error,
		createRoom,
		joinRoom,
		sendChatMessage,
		startVote,
		castVote,
		guessMovie,
		leaveRoom,
		cancelVote,
		startGame,
		nextMovie,
		playerReady,
	};
}
