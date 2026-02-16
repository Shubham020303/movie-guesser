import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import ProfileSetup from './components/ProfileSetup';
import Home from './components/Home';
import WaitingLobby from './components/WaitingLobby';
import GameRoom from './components/GameRoom';
import { useWebSocket } from './hooks/useWebSocket';

function App() {
	return (
		<BrowserRouter>
			<AppContent />
		</BrowserRouter>
	);
}

function AppContent() {
	const ws = useWebSocket();
	const location = useLocation();

	console.log('Current route:', location.pathname); // Debug

	return (
		<>
			<Routes>
				<Route path="/" element={<ProfileRoute ws={ws} />} />
				<Route path="/home" element={<HomeRoute ws={ws} />} />
				<Route path="/room/:roomCode" element={<RoomRoute ws={ws} />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
			<ConnectionStatus ws={ws} />
		</>
	);
}

// Profile Route
function ProfileRoute({ ws }) {
	console.log('ProfileRoute mounted');
	const navigate = useNavigate();
	const location = useLocation();
	const [profile, setProfile] = useState(null);

	useEffect(() => {
		const savedProfile = localStorage.getItem('movieGuesserProfile');
		if (savedProfile) {
			try {
				const parsedProfile = JSON.parse(savedProfile);
				setProfile(parsedProfile);

				// Calculate returnTo inside useEffect
				const searchParams = new URLSearchParams(location.search);
				const returnTo = searchParams.get('returnTo') || location.state?.returnTo || '/home';

				console.log('Profile exists, redirecting to:', returnTo); // Debug
				navigate(returnTo, { replace: true });
			} catch (error) {
				console.error('Error loading profile:', error);
				localStorage.removeItem('movieGuesserProfile');
			}
		}
	}, [navigate, location]);

	const handleProfileComplete = (newProfile) => {
		setProfile(newProfile);

		// Calculate returnTo inside handler
		const searchParams = new URLSearchParams(location.search);
		const returnTo = searchParams.get('returnTo') || location.state?.returnTo || '/home';

		console.log('location.search:', location.search); // Debug
		console.log('searchParams:', searchParams.toString()); // Debug
		console.log('returnTo param:', searchParams.get('returnTo')); // Debug
		console.log('Profile completed, redirecting to:', returnTo); // Debug

		navigate(returnTo, { replace: true });
	};

	return <ProfileSetup onComplete={handleProfileComplete} />;
}

// Home Route
function HomeRoute({ ws }) {
	console.log('HomeRoute mounted');
	const navigate = useNavigate();
	const [profile, setProfile] = useState(null);

	useEffect(() => {
		const savedProfile = localStorage.getItem('movieGuesserProfile');
		if (!savedProfile) {
			navigate('/', { replace: true });
			return;
		}
		try {
			setProfile(JSON.parse(savedProfile));
		} catch (error) {
			navigate('/', { replace: true });
		}
	}, [navigate]);

	// Navigate to room when roomData is available
	useEffect(() => {
		if (ws.roomData?.code) {
			navigate(`/room/${ws.roomData.code}`, { replace: true });
		}
	}, [ws.roomData, navigate]);

	const handleResetProfile = () => {
		localStorage.removeItem('movieGuesserProfile');
		navigate('/', { replace: true });
	};

	if (!profile) return null;

	return (
		<Home
			profile={profile}
			ws={ws}
			onRoomCreated={() => { }}
			onRoomJoined={() => { }}
			onResetProfile={handleResetProfile}
		/>
	);
}

// Room Route (Waiting Lobby + Game Room)
function RoomRoute({ ws }) {
	const { roomCode } = useParams();
	const navigate = useNavigate();
	const [profile, setProfile] = useState(null);
	const [hasAttemptedJoin, setHasAttemptedJoin] = useState(false);

	// Check profile on mount
	useEffect(() => {
		const savedProfile = localStorage.getItem('movieGuesserProfile');
		if (!savedProfile) {
			// No profile - redirect to setup with returnTo
			navigate(`/?returnTo=${encodeURIComponent(`/room/${roomCode}`)}`, { replace: true });
			return;
		}
		try {
			setProfile(JSON.parse(savedProfile));
		} catch (error) {
			navigate('/', { replace: true });
		}
	}, [navigate, roomCode]);

	// Auto-join room when profile loads and WS connects
	useEffect(() => {
		if (profile && ws.isConnected && !hasAttemptedJoin) {
			const upperRoomCode = roomCode.toUpperCase();

			// Check if already in this room
			if (ws.roomData?.code === upperRoomCode) {
				setHasAttemptedJoin(true);
				return;
			}

			// Check if in a different room
			if (ws.roomData?.code && ws.roomData.code !== upperRoomCode) {
				// In different room - ask to leave
				if (window.confirm(`You're in room ${ws.roomData.code}. Leave and join ${upperRoomCode}?`)) {
					ws.leaveRoom();
					// Wait a bit for leave to process, then join
					setTimeout(() => {
						ws.joinRoom(upperRoomCode, profile.name, profile.avatar);
						setHasAttemptedJoin(true);
					}, 500);
				} else {
					navigate('/home', { replace: true });
				}
				return;
			}

			// Not in any room - join this one
			ws.joinRoom(upperRoomCode, profile.name, profile.avatar);
			setHasAttemptedJoin(true);
		}
	}, [profile, ws.isConnected, hasAttemptedJoin, roomCode, ws.roomData, navigate]);

	const handleBack = () => {
		ws.leaveRoom();
		navigate('/home', { replace: true });
	};

	if (!profile) return null;

	// Show error if room data doesn't match
	if (ws.roomData && ws.roomData.code !== roomCode.toUpperCase()) {
		return (
			<div className="min-h-screen bg-movie-bg flex items-center justify-center p-6">
				<div className="bg-movie-panel border-2 border-movie-danger rounded-3xl p-8 max-w-md text-center">
					<p className="text-movie-danger font-heading text-2xl mb-4">Wrong Room</p>
					<p className="text-movie-muted mb-6">You're trying to access a different room.</p>
					<button
						onClick={handleBack}
						className="px-6 py-3 bg-movie-primary text-white rounded-xl font-medium"
					>
						Go Home
					</button>
				</div>
			</div>
		);
	}

	// Show loading if waiting for room data
	if (!ws.roomData) {
		return (
			<div className="min-h-screen bg-movie-bg flex items-center justify-center p-6">
				<div className="text-center">
					<div className="animate-spin w-12 h-12 border-4 border-movie-primary border-t-transparent rounded-full mx-auto mb-4"></div>
					<p className="text-movie-muted">Joining room...</p>
				</div>
			</div>
		);
	}

	// Show waiting lobby or game room based on game state
	const isGameStarted = ws.roomData?.gameStarted;

	return (
		<>
			{!isGameStarted && <WaitingLobby profile={profile} ws={ws} onBack={handleBack} />}
			{isGameStarted && <GameRoom profile={profile} ws={ws} onBack={handleBack} />}
		</>
	);
}

// Connection Status Component
function ConnectionStatus({ ws }) {
	return (
		<>
			<div className="fixed bottom-4 right-4 z-50">
				{!ws.isConnected && (
					<div className="bg-movie-danger text-white px-4 py-2 rounded-full text-sm shadow-lg flex items-center gap-2">
						<div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
						Reconnecting...
					</div>
				)}
			</div>

			{ws.error && (
				<div className="fixed top-4 right-4 z-50 bg-movie-danger text-white px-6 py-4 rounded-2xl shadow-lg max-w-md">
					<div className="flex items-start gap-3">
						<span className="text-xl">⚠️</span>
						<div>
							<p className="font-medium">Error</p>
							<p className="text-sm opacity-90">{ws.error}</p>
						</div>
					</div>
				</div>
			)}
		</>
	);
}

export default App;