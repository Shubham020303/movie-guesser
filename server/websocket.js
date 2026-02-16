const WebSocket = require('ws');
const { getRandomMovie, answerQuestion, getHint } = require('./gameLogic');

// Store active rooms in memory
const rooms = new Map();

// Store WebSocket connections with metadata
const clients = new Map();
let globalCategoryParams = null

function generateRoomCode() {
	return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function initWebSocket(server) {
	const wss = new WebSocket.Server({ server });

	wss.on('connection', (ws) => {
		console.log('New client connected');

		ws.on('message', async (message) => {
			try {
				const data = JSON.parse(message);
				await handleMessage(ws, data, wss);
			} catch (error) {
				console.error('Error handling message:', error);
				ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
			}
		});

		ws.on('close', () => {
			handleDisconnect(ws, wss);
		});
	});

	console.log('WebSocket server initialized');
}

async function handleMessage(ws, data, wss) {
	const { type } = data;

	switch (type) {
		case 'create_room':
			await handleCreateRoom(ws, data);
			break;

		case 'join_room':
			handleJoinRoom(ws, data, wss);
			break;

		case 'chat_message':
			handleChatMessage(ws, data, wss);
			break;

		case 'start_vote':
			handleStartVote(ws, data, wss);
			break;

		case 'cast_vote':
			await handleCastVote(ws, data, wss);
			break;

		case 'cancel_vote':
			handleCancelVote(ws, data, wss);
			break;

		case 'guess_movie':
			handleGuessMovie(ws, data, wss);
			break;

		case 'start_game':
			handleStartGame(ws, data, wss);
			break;

		case 'next_movie':
			await handleNextMovie(ws, data, wss);
			break;

		case 'player_ready':
			handlePlayerReady(ws, data, wss);
			break;

		case 'leave_room':
			handleLeaveRoom(ws, data, wss);
			break;

		default:
			ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
	}
}

async function handleCreateRoom(ws, data) {
	const { playerName, playerAvatar, category, playerId, categoryParams } = data;
	const roomCode = generateRoomCode();

	// Fetch a random movie for this room
	globalCategoryParams = categoryParams;
	const movie = await getRandomMovie(categoryParams);

	if (!movie) {
		ws.send(JSON.stringify({ type: 'error', message: 'Failed to fetch movie' }));
		return;
	}

	// Use existing playerId if provided, otherwise generate new one
	const finalPlayerId = playerId || generatePlayerId();

	const room = {
		code: roomCode,
		movie: movie,
		category: category || 'general',
		players: [
			{
				id: finalPlayerId,
				name: playerName,
				avatar: playerAvatar,
				isHost: true,
				disconnected: false,
				wins: 0,
			}
		],
		questionsAsked: [],
		activeVote: null,
		gameStarted: false,
		gameOver: false,
	};

	rooms.set(roomCode, room);

	// Store client info
	clients.set(ws, {
		playerId: finalPlayerId,
		roomCode: roomCode,
	});

	ws.send(JSON.stringify({
		type: 'room_created',
		roomCode: roomCode,
		playerId: finalPlayerId,
		room: getSafeRoomData(room),
	}));

	console.log(`Room created: ${roomCode}`);
}

function handleJoinRoom(ws, data, wss) {
	const { roomCode, playerName, playerAvatar, playerId } = data;
	const room = rooms.get(roomCode);

	if (!room) {
		ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
		return;
	}

	// Check if player already exists in room (rejoining)
	const existingPlayer = room.players.find(p => p.id === playerId);

	// Only block new players if game started, allow existing players to rejoin
	if (room.gameStarted && !existingPlayer) {
		ws.send(JSON.stringify({ type: 'error', message: 'Game already started' }));
		return;
	}

	let finalPlayerId;

	if (existingPlayer) {
		// Player is rejoining - reconnect them
		finalPlayerId = existingPlayer.id;

		// Mark as reconnected
		existingPlayer.disconnected = false;
		delete existingPlayer.disconnectedAt;

		// Update client mapping
		clients.set(ws, {
			playerId: finalPlayerId,
			roomCode: roomCode,
		});

		// Notify player they've rejoined
		ws.send(JSON.stringify({
			type: 'room_joined',
			roomCode: roomCode,
			playerId: finalPlayerId,
			room: getSafeRoomData(room),
		}));

		// Broadcast to others that player reconnected
		broadcastToRoom(roomCode, wss, {
			type: 'player_reconnected',
			playerId: finalPlayerId,
			room: getSafeRoomData(room),
		}, ws);

		console.log(`Player ${playerName} reconnected to room ${roomCode}`);
	} else {
		// New player joining
		finalPlayerId = playerId || generatePlayerId();

		const player = {
			id: finalPlayerId,
			name: playerName,
			avatar: playerAvatar,
			isHost: false,
			disconnected: false,
			wins: 0,
		};

		room.players.push(player);

		// Store client info
		clients.set(ws, {
			playerId: finalPlayerId,
			roomCode: roomCode,
		});

		// Send to the joining player
		ws.send(JSON.stringify({
			type: 'room_joined',
			roomCode: roomCode,
			playerId: finalPlayerId,
			room: getSafeRoomData(room),
		}));

		// Broadcast to all players in room
		broadcastToRoom(roomCode, wss, {
			type: 'player_joined',
			player: player,
			room: getSafeRoomData(room),
		});

		console.log(`Player ${playerName} joined room ${roomCode}`);
	}
}

function handleChatMessage(ws, data, wss) {
	const clientInfo = clients.get(ws);
	if (!clientInfo) return;

	const { roomCode } = clientInfo;
	const { message } = data;

	broadcastToRoom(roomCode, wss, {
		type: 'chat_message',
		playerId: clientInfo.playerId,
		message: message,
		timestamp: Date.now(),
	});
}

function handleStartVote(ws, data, wss) {
	const clientInfo = clients.get(ws);
	if (!clientInfo) return;

	const { roomCode, playerId } = clientInfo;
	const { question } = data;
	const room = rooms.get(roomCode);

	if (!room) return;

	if (room.activeVote) {
		ws.send(JSON.stringify({ type: 'error', message: 'A vote is already in progress' }));
		return;
	}

	// Get player info
	const player = room.players.find(p => p.id === playerId);
	if (!player) return;

	// Determine vote type
	let voteType = 'question';
	let guessValue = null;

	if (question === '__HINT__') {
		voteType = 'hint';
	} else if (question === '__GIVEUP__') {
		voteType = 'give_up';
	} else if (question.startsWith('__GUESS__:')) {
		voteType = 'guess';
		guessValue = question.replace('__GUESS__:', '');
	}

	// Create a new vote
	room.activeVote = {
		type: voteType,
		question: voteType === 'question' ? question : voteType,
		guess: guessValue,
		proposedBy: playerId,
		proposedByName: player.name,
		votes: {
			[playerId]: 'yes' // Initiator automatically votes yes
		},
		startTime: Date.now(),
	};

	// Broadcast vote started to all players
	broadcastToRoom(roomCode, wss, {
		type: 'vote_started',
		vote: room.activeVote,
	});

	console.log(`Vote started in room ${roomCode}: ${voteType}`);
}

async function handleCastVote(ws, data, wss) {
	const clientInfo = clients.get(ws);
	if (!clientInfo) return;

	const { roomCode, playerId } = clientInfo;
	const { vote } = data;
	const room = rooms.get(roomCode);

	if (!room || !room.activeVote) return;

	// Record the vote
	room.activeVote.votes[playerId] = vote;

	// Broadcast the UPDATED vote object to all players
	const totalPlayers = room.players.filter(p => !p.disconnected).length;
	const totalVotes = Object.keys(room.activeVote.votes).length;

	broadcastToRoom(roomCode, wss, {
		type: 'vote_updated', // NEW MESSAGE TYPE
		vote: room.activeVote, // Send the full updated vote
		votesCount: totalVotes,
		totalPlayers: totalPlayers,
	});

	console.log(`Vote cast in room ${roomCode}: ${playerId} voted ${vote} (${totalVotes}/${totalPlayers})`);

	// Check if all players have voted
	if (totalVotes === totalPlayers) {
		await processVoteResult(room, wss, roomCode);
	}
}

async function processVoteResult(room, wss, roomCode) {
	const vote = room.activeVote;
	if (!vote) return;

	// Count votes
	const votes = Object.values(vote.votes);
	const yesCount = votes.filter(v => v === 'yes').length;
	const noCount = votes.filter(v => v === 'no').length;

	const approved = yesCount > noCount;

	// Get player names for vote breakdown
	const yesVotes = [];
	const noVotes = [];

	for (const [playerId, voteValue] of Object.entries(vote.votes)) {
		const player = room.players.find(p => p.id === playerId);
		if (player) {
			if (voteValue === 'yes') {
				yesVotes.push(player.name);
			} else {
				noVotes.push(player.name);
			}
		}
	}

	let answer = null;
	let isCorrectGuess = false;
	let winner = null;

	if (approved) {
		// Notify players that we're processing
		broadcastToRoom(roomCode, wss, {
			type: 'vote_processing',
			voteType: vote.type,
		});

		// Process based on vote type
		if (vote.type === 'question') {
			answer = await answerQuestion(room.movie, vote.question, room.questionsAsked.length + 1);
		} else if (vote.type === 'hint') {
			answer = await getHint(room.movie, room.questionsAsked.length);
		} else if (vote.type === 'guess') {
			const normalizeTitle = (title) => {
				if (!title) return '';
				return title
					.toLowerCase()
					.trim()
					.replace(/^(the|a|an)\s+/i, '')
					.replace(/-/g, ' ')
					.replace(/[^\w\s]/g, '')
					.replace(/\s+/g, ' ')
					.trim();
			};

			const checkSequelPattern = (guess, title) => {
				const guessMatch = guess.match(/^(.+?)\s*(\d+)$/);
				if (guessMatch) {
					const [, baseName, number] = guessMatch;
					const baseNorm = normalizeTitle(baseName);
					const titleNorm = normalizeTitle(title);

					return titleNorm.startsWith(baseNorm) && titleNorm.includes(number);
				}
				return false;
			};

			const guessNormalized = normalizeTitle(vote.guess);
			const titleNormalized = normalizeTitle(room.movie.title);
			const originalTitleNormalized = normalizeTitle(room.movie.originalTitle);

			// option 1: Exact match
			isCorrectGuess =
				guessNormalized === titleNormalized ||
				guessNormalized === originalTitleNormalized;

			// option 2: Check alternative titles (if available)
			if (!isCorrectGuess && room.movie.alternativeTitles) {
				const altTitlesNormalized = room.movie.alternativeTitles.map(t => normalizeTitle(t));
				isCorrectGuess = altTitlesNormalized.includes(guessNormalized);
			}

			// option 3: Check sequel pattern
			if (!isCorrectGuess) {
				isCorrectGuess =
					checkSequelPattern(vote.guess, room.movie.title) ||
					checkSequelPattern(vote.guess, room.movie.originalTitle);
			}

			// option 4: Fuzzy match (very lenient, only for very close)
			if (!isCorrectGuess) {
				const similarity = (str1, str2) => {
					const longer = str1.length > str2.length ? str1 : str2;
					const shorter = str1.length > str2.length ? str2 : str1;

					if (shorter.length < longer.length * 0.85) return false;

					let matches = 0;
					for (let i = 0; i < shorter.length; i++) {
						if (longer.includes(shorter[i])) matches++;
					}

					return matches / shorter.length >= 0.95;
				};

				isCorrectGuess =
					similarity(guessNormalized, titleNormalized) ||
					(originalTitleNormalized && similarity(guessNormalized, originalTitleNormalized));
			}

			if (isCorrectGuess) {
				room.gameOver = true;
				winner = room.players.find(p => p.id === vote.proposedBy);

				// Increment wins counter
				if (winner) {
					winner.wins = (winner.wins || 0) + 1;
				}

				answer = `🎉 Correct! The movie is "${room.movie.title}"!`;
			} else {
				answer = `❌ Wrong! "${vote.guess}" is not the movie.`;
			}
		} else if (vote.type === 'give_up') {
			room.gameOver = true;
			answer = `Game Over! The movie was "${room.movie.title}"`;
		}
	}

	// Create history entry
	const historyEntry = {
		type: vote.type,
		question: vote.question,
		guess: vote.guess, // Include guess
		proposedBy: vote.proposedByName,
		votes: vote.votes,
		yesVotes: yesVotes,
		noVotes: noVotes,
		result: approved ? 'approved' : 'rejected',
		answer: answer,
		isCorrect: isCorrectGuess, // Track if guess was correct
		timestamp: Date.now(),
	};

	// Add to history
	room.questionsAsked.push(historyEntry);

	// Clear active vote
	room.activeVote = null;

	// Broadcast result
	if (approved) {
		if (vote.type === 'give_up') {
			broadcastToRoom(roomCode, wss, {
				type: 'game_over',
				reason: 'give_up',
				movie: room.movie, // MAKE SURE THIS IS HERE
				voteDetails: historyEntry,
			});
		} else if (vote.type === 'guess' && isCorrectGuess) {
			broadcastToRoom(roomCode, wss, {
				type: 'game_won',
				winner: winner,
				movie: room.movie,
				questionsUsed: calculateQuestionsUsed(room),
				voteDetails: historyEntry,
			});
		} else {
			broadcastToRoom(roomCode, wss, {
				type: 'question_answered',
				question: vote.question || vote.guess,
				answer: answer,
				questionsCount: room.questionsAsked.length,
				voteDetails: historyEntry,
			});
		}
	} else {
		broadcastToRoom(roomCode, wss, {
			type: 'vote_rejected',
			question: vote.question || vote.guess,
			voteDetails: historyEntry,
		});
	}

	// Check if max questions reached
	const questionsUsed = calculateQuestionsUsed(room);

	if (questionsUsed >= 15 && !room.gameOver) {
		room.gameOver = true;
		broadcastToRoom(roomCode, wss, {
			type: 'game_over',
			reason: 'max_questions',
			movie: room.movie,
		});
	}

	console.log(`Vote result in room ${roomCode}: ${approved ? 'approved' : 'rejected'}`);
}

// Helper function to calculate questions used
function calculateQuestionsUsed(room) {
	return room.questionsAsked.reduce((total, item) => {
		if (item.result === 'approved') {
			if (item.type === 'question') return total + 1;
			if (item.type === 'hint') return total + 2;
			if (item.type === 'guess') return total + 1;
		}
		return total;
	}, 0);
}

function handleCancelVote(ws, data, wss) {
	const clientInfo = clients.get(ws);
	if (!clientInfo) return;

	const { roomCode, playerId } = clientInfo;
	const room = rooms.get(roomCode);

	if (!room || !room.activeVote) return;

	// Only the proposer can cancel
	if (room.activeVote.proposedBy !== playerId) {
		ws.send(JSON.stringify({ type: 'error', message: 'Only the proposer can cancel the vote' }));
		return;
	}

	// Clear the vote
	room.activeVote = null;

	// Broadcast cancellation
	broadcastToRoom(roomCode, wss, {
		type: 'vote_cancelled',
	});

	console.log(`Vote cancelled in room ${roomCode} by ${playerId}`);
}

function handleGuessMovie(ws, data, wss) {
	const clientInfo = clients.get(ws);
	if (!clientInfo) return;

	const { roomCode, playerId } = clientInfo;
	const { guess } = data;
	const room = rooms.get(roomCode);

	if (!room) return;

	const correct = guess.toLowerCase().trim() === room.movie.title.toLowerCase().trim();

	if (correct) {
		room.gameOver = true;
		const player = room.players.find(p => p.id === playerId);

		broadcastToRoom(roomCode, wss, {
			type: 'game_won',
			winner: player,
			movie: room.movie,
			questionsUsed: room.questionsAsked.length,
		});
	} else {
		broadcastToRoom(roomCode, wss, {
			type: 'wrong_guess',
			playerId: playerId,
			guess: guess,
		});
	}
}

function handleDisconnect(ws, wss) {
	const clientInfo = clients.get(ws);
	if (!clientInfo) return;

	const { roomCode, playerId } = clientInfo;
	const room = rooms.get(roomCode);

	if (room) {
		console.log(`Player ${playerId} disconnected from room ${roomCode}`);

		// DON'T remove the player immediately - mark them as disconnected
		const player = room.players.find(p => p.id === playerId);
		if (player) {
			player.disconnected = true;
			player.disconnectedAt = Date.now();
		}

		// Broadcast player disconnected (but still in room)
		broadcastToRoom(roomCode, wss, {
			type: 'player_disconnected',
			playerId: playerId,
			room: getSafeRoomData(room),
		});

		// Set a grace period (e.g., 30 seconds) before actually removing the player
		setTimeout(() => {
			const currentRoom = rooms.get(roomCode);
			if (!currentRoom) return;

			const currentPlayer = currentRoom.players.find(p => p.id === playerId);

			// If player is still disconnected after grace period, remove them
			if (currentPlayer && currentPlayer.disconnected) {
				currentRoom.players = currentRoom.players.filter(p => p.id !== playerId);

				// If room is now empty, delete it
				if (currentRoom.players.length === 0) {
					rooms.delete(roomCode);
					console.log(`Room ${roomCode} deleted (empty after grace period)`);
				} else {
					// If the disconnected player was the host, assign new host
					if (currentPlayer.isHost && currentRoom.players.length > 0) {
						currentRoom.players[0].isHost = true;
						console.log(`New host assigned in room ${roomCode}: ${currentRoom.players[0].name}`);
					}

					broadcastToRoom(roomCode, wss, {
						type: 'player_left',
						playerId: playerId,
						room: getSafeRoomData(currentRoom),
					});
				}
			}
		}, 30000); // 30 second grace period
	}

	clients.delete(ws);
	console.log('Client disconnected');
}

function handleStartGame(ws, data, wss) {
	const clientInfo = clients.get(ws);
	if (!clientInfo) return;

	const { roomCode, playerId } = clientInfo;
	const room = rooms.get(roomCode);

	if (!room) {
		ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
		return;
	}

	// Check if player is host
	const player = room.players.find(p => p.id === playerId);
	if (!player || !player.isHost) {
		ws.send(JSON.stringify({ type: 'error', message: 'Only the host can start the game' }));
		return;
	}

	// Check minimum players
	if (room.players.length < 2) {
		ws.send(JSON.stringify({ type: 'error', message: 'Need at least 2 players to start' }));
		return;
	}

	// Start the game
	room.gameStarted = true;

	// Broadcast to all players
	broadcastToRoom(roomCode, wss, {
		type: 'game_started',
		room: getSafeRoomData(room),
	});

	console.log(`Game started in room ${roomCode} by ${player.name}`);
}

async function handleNextMovie(ws, data, wss) {
	const clientInfo = clients.get(ws);
	if (!clientInfo) return;

	const { roomCode, playerId } = clientInfo;
	const room = rooms.get(roomCode);

	if (!room) {
		ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
		return;
	}

	// Only host can start next movie
	const player = room.players.find(p => p.id === playerId);
	if (!player || !player.isHost) {
		ws.send(JSON.stringify({ type: 'error', message: 'Only the host can start the next movie' }));
		return;
	}

	// Get a new movie with the same category
	const newMovie = await getRandomMovie(globalCategoryParams || room.category);

	if (!newMovie) {
		ws.send(JSON.stringify({ type: 'error', message: 'Failed to fetch new movie' }));
		return;
	}

	// Reset game state but keep players and their wins
	room.movie = newMovie;
	room.questionsAsked = [];
	room.activeVote = null;
	room.gameOver = true;
	room.gameStarted = true;
	room.waitingForPlayers = true;
	room.readyPlayers = []; // CHANGED: Don't auto-ready the host

	// Broadcast new movie waiting
	broadcastToRoom(roomCode, wss, {
		type: 'new_movie_waiting',
		room: getSafeRoomData(room),
	});

	console.log(`New movie waiting in room ${roomCode}: ${newMovie.title}`);
}

function handlePlayerReady(ws, data, wss) {
	const clientInfo = clients.get(ws);
	if (!clientInfo) return;

	const { roomCode, playerId } = clientInfo;
	const room = rooms.get(roomCode);

	if (!room) return;

	// Add player to ready list
	if (!room.readyPlayers) {
		room.readyPlayers = [];
	}

	if (!room.readyPlayers.includes(playerId)) {
		room.readyPlayers.push(playerId);
	}

	// FIXED: Only count ACTIVE (non-disconnected) players
	const activePlayers = room.players.filter(p => !p.disconnected);
	const allReady = activePlayers.every(p => room.readyPlayers.includes(p.id));

	if (allReady) {
		// All players ready - start the game
		room.waitingForPlayers = false;
		room.readyPlayers = [];
		room.gameOver = false;

		broadcastToRoom(roomCode, wss, {
			type: 'new_movie_started',
			room: getSafeRoomData(room),
		});

		console.log(`All players ready - new movie started in room ${roomCode}`);
	} else {
		// Broadcast ready status
		broadcastToRoom(roomCode, wss, {
			type: 'player_ready_update',
			readyCount: room.readyPlayers.length,
			totalCount: activePlayers.length, // FIXED: Use active players count
			room: getSafeRoomData(room),
		});
	}
}

function handleLeaveRoom(ws, data, wss) {
	const clientInfo = clients.get(ws);
	if (!clientInfo) return;

	const { roomCode, playerId } = clientInfo;
	const room = rooms.get(roomCode);

	if (!room) return;

	// Remove player from room
	room.players = room.players.filter(p => p.id !== playerId);

	// Remove from ready list if present
	if (room.readyPlayers) {
		room.readyPlayers = room.readyPlayers.filter(id => id !== playerId);
	}

	// Clear localStorage for this player
	clients.delete(ws);

	console.log(`Player ${playerId} left room ${roomCode}`);

	// If room is empty, delete it
	if (room.players.length === 0) {
		rooms.delete(roomCode);
		console.log(`Room ${roomCode} deleted (empty)`);
	} else {
		// Reassign host if the leaving player was host
		const leavingPlayer = room.players.find(p => p.id === playerId);
		if (leavingPlayer && leavingPlayer.isHost && room.players.length > 0) {
			room.players[0].isHost = true;
		}

		// Broadcast player left
		broadcastToRoom(roomCode, wss, {
			type: 'player_left',
			playerId: playerId,
			room: getSafeRoomData(room),
		});

		// Check if all remaining players are ready
		if (room.waitingForPlayers) {
			const activePlayers = room.players.filter(p => !p.disconnected);
			const allReady = activePlayers.every(p => room.readyPlayers.includes(p.id));

			if (allReady) {
				room.waitingForPlayers = false;
				room.readyPlayers = [];

				broadcastToRoom(roomCode, wss, {
					type: 'new_movie_started',
					room: getSafeRoomData(room),
				});
			}
		}
	}
}

function broadcastToRoom(roomCode, wss, message, excludeWs = null) {
	const room = rooms.get(roomCode);
	if (!room) return;

	wss.clients.forEach((client) => {
		if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
			const clientInfo = clients.get(client);
			if (clientInfo && clientInfo.roomCode === roomCode) {
				client.send(JSON.stringify(message));
			}
		}
	});
}

function getSafeRoomData(room) {
	// Don't send movie title or details to clients
	return {
		code: room.code,
		category: room.category,
		players: room.players,
		questionsAsked: room.questionsAsked,
		activeVote: room.activeVote,
		gameStarted: room.gameStarted,
		gameOver: room.gameOver,
		waitingForPlayers: room.waitingForPlayers, // ADD THIS
		readyPlayers: room.readyPlayers,
	};
}

function generatePlayerId() {
	return 'player_' + Math.random().toString(36).substring(2, 11);
}

module.exports = { initWebSocket };