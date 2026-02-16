import { useState } from 'react';
import { SparklesIcon, ArrowRightCircleIcon, FilmIcon, StarIcon } from '@heroicons/react/24/outline';

// swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/navigation';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const CATEGORIES = [
	{
		id: 'general',
		name: 'General',
		description: 'Movies from all around the world',
		posterUrl: 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
		// posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
		apiParams: {} // No filters
	},
	{
		id: 'hollywood',
		name: 'Hollywood',
		description: 'American cinema classics',
		posterUrl: 'https://image.tmdb.org/t/p/w500/9cqNxx0GxF0bflZmeSMuL5tnGzr.jpg',
		apiParams: { region: 'US', with_original_language: 'en' }
	},
	{
		id: 'bollywood',
		name: 'Bollywood',
		description: 'Indian Hindi films',
		posterUrl: 'https://image.tmdb.org/t/p/w500/2CAL2433ZeIihfX1Hb2139CX0pW.jpg',
		apiParams: { region: 'IN', with_original_language: 'hi' }
	},
	{
		id: 'tollywood',
		name: 'Tollywood',
		description: 'Telugu blockbusters',
		posterUrl: 'https://image.tmdb.org/t/p/w500/u0XUBNQWlOvrh0Gd97ARGpIkL0.jpg',
		apiParams: { region: 'IN', with_original_language: 'te' }
	},
	{
		id: 'korean',
		name: 'Korean Cinema',
		description: 'Korean films',
		posterUrl: 'https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg',
		apiParams: { region: 'KR', with_original_language: 'ko' }
	},
	{
		id: 'anime',
		name: 'Anime Movies',
		description: 'Japanese animated films',
		posterUrl: 'https://image.tmdb.org/t/p/w500/q719jXXEzOoYaps6babgKnONONX.jpg',
		// posterUrl: 'https://image.tmdb.org/t/p/w500/39wmItIWsg5sZMyRUHLkWBcuVCM.jpg',
		apiParams: { with_genres: '16', with_original_language: 'ja' }
	},
	{
		id: 'action',
		name: 'Action & Thriller',
		description: 'High-octane adventures',
		posterUrl: 'https://image.tmdb.org/t/p/w500/vZloFAK7NmvMGKE7VkF5UHaz0I.jpg',
		apiParams: { with_genres: '28,53' } // Action, Thriller
	},
	{
		id: 'animated',
		name: 'Animated',
		description: 'Pixar, Disney & more',
		posterUrl: 'https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg',
		apiParams: { with_genres: '16', with_original_language: 'en' }
	},
];

export default function Home({ profile, ws, onRoomCreated, onRoomJoined, onResetProfile }) {
	const [mode, setMode] = useState(null); // null, 'create', 'join'
	const [selectedCategory, setSelectedCategory] = useState('general');
	const [selectedCategoryParams, setSelectedCategoryParams] = useState({});
	const [roomCode, setRoomCode] = useState('');
	const [isCreating, setIsCreating] = useState(false);
	const [isJoining, setIsJoining] = useState(false);
	const [swiperInstance, setSwiperInstance] = useState(null);

	const getAvatarUrl = (avatar) => {
		return `https://api.dicebear.com/7.x/${avatar.style}/svg?seed=${avatar.seed}`;
	};

	const handleCreateRoom = () => {
		if (!ws.isConnected) {
			alert('Not connected to server. Please wait...');
			return;
		}

		setIsCreating(true);
		ws.createRoom(profile.name, profile.avatar, selectedCategory, selectedCategoryParams);

		setTimeout(() => setIsCreating(false), 1000);
	};

	const handleJoinRoom = () => {
		if (!ws.isConnected) {
			alert('Not connected to server. Please wait...');
			return;
		}

		if (!roomCode.trim()) {
			alert('Please enter a room code');
			return;
		}

		setIsJoining(true);
		ws.joinRoom(roomCode.toUpperCase().trim(), profile.name, profile.avatar);

		// Navigation will happen automatically via useEffect in HomeRoute
		setTimeout(() => setIsJoining(false), 1000);
	};

	return (
		<div className="min-h-screen bg-movie-bg flex items-center justify-center p-6">
			<div className="w-full max-w-4xl">

				{/* Header with Profile */}
				<div className="text-center mb-8">
					<h1 className="font-heading text-3xl md:text-5xl text-movie-primary mb-2">
						🎬 Movie Guesser
					</h1>
					<p className="text-movie-muted text-sm md:text-lg mb-6">
						Guess the movie with your friends!
					</p>

					{/* Profile Card */}
					<div className="w-full md:w-fit inline-flex items-center gap-4 bg-movie-panel px-5 md:px-6 py-3 md:py-4 rounded-2xl shadow-soft border-2 border-movie-border">
						<img
							src={getAvatarUrl(profile.avatar)}
							alt={profile.name}
							className="w-10 md:w-12 h-10 md:h-12 rounded-xl border-2 border-movie-primary"
						/>
						<div className="text-left">
							<p className="text-sm md:text-base text-movie-text font-medium">{profile.name}</p>
							<button
								onClick={onResetProfile}
								className="text-xs text-movie-muted hover:text-movie-primary transition-colors font-medium"
							>
								Edit Profile
							</button>
						</div>
					</div>
				</div>

				{/* Main Menu */}
				{mode === null && (
					<div className="grid md:grid-cols-2 gap-6">

						{/* Create Room Card */}
						<button
							onClick={() => setMode('create')}
							className="bg-movie-panel border-2 border-movie-border p-6 md:p-8 rounded-3xl hover:border-movie-success hover:shadow-lg hover:scale-105 transition-all text-left group"
						>
							<div className="text-5xl mb-3 md:mb-4 group-hover:scale-110 transition-transform">
								<SparklesIcon className="w-10 md:w-16 h-10 md:h-16" />
							</div>
							<h2 className="font-heading text-xl md:text-2xl text-movie-success mb-1 md:mb-2">
								Create Room
							</h2>
							<p className="text-movie-muted text-xs md:text-base">
								Start a new game and invite your friends
							</p>
						</button>

						{/* Join Room Card */}
						<button
							onClick={() => setMode('join')}
							className="bg-movie-panel border-2 border-movie-border p-6 md:p-8 rounded-3xl hover:border-movie-info hover:shadow-lg hover:scale-105 transition-all text-left group"
						>
							<div className="text-5xl mb-3 md:mb-4 group-hover:scale-110 transition-transform">
								<ArrowRightCircleIcon className="w-10 md:w-16 h-10 md:h-16" />
							</div>
							<h2 className="font-heading text-xl md:text-2xl text-movie-info mb-1 md:mb-2">
								Join Room
							</h2>
							<p className="text-movie-muted text-xs md:text-base">
								Enter a room code to join your friends
							</p>
						</button>

					</div>
				)}

				{/* Create Room Mode */}
				{mode === 'create' && (
					<div className="bg-movie-panel border-2 border-movie-border rounded-3xl p-6 md:p-8 shadow-card">
						<div className="flex items-center justify-between mb-6">
							<h2 className="font-heading text-sm md:text-2xl text-movie-primary">
								Choose Category
							</h2>
							<button
								onClick={() => setMode(null)}
								className="text-sm md:text-base text-movie-muted hover:text-movie-text transition-colors font-medium"
							>
								← Back
							</button>
						</div>

						{/* Category Selection Carousel */}
						<div className="mb-8 relative">
							<Swiper
								effect="coverflow"
								grabCursor={true}
								centeredSlides={true}
								slidesPerView="auto"
								initialSlide={CATEGORIES.findIndex(cat => cat.id === selectedCategory)}
								loop={true}
								coverflowEffect={{
									rotate: 0,
									stretch: 0,
									depth: 100,
									modifier: 2.5,
									slideShadows: false,
								}}
								navigation={{
									prevEl: '.swiper-button-prev-custom',
									nextEl: '.swiper-button-next-custom',
								}}
								modules={[EffectCoverflow, Navigation]}
								onSwiper={setSwiperInstance}
								onSlideChange={(swiper) => {
									const realIndex = swiper.realIndex;
									setSelectedCategory(CATEGORIES[realIndex].id);
									setSelectedCategoryParams(CATEGORIES[realIndex].apiParams);
								}}
								className="category-swiper"
							>
								{CATEGORIES.map((category) => (
									<SwiperSlide key={category.id} className="md:w-80!">
										<div className="p-2 md:p-4">
											<div className={`relative rounded-2xl overflow-hidden border-3 md:border-4 transition-all ${selectedCategory === category.id
												? `border-movie-primary shadow-xl`
												: 'border-movie-border'
												}`}>
												{/* Poster Image */}
												<div className="aspect-2/3 relative">
													<img
														src={category.posterUrl}
														alt={category.name}
														className="w-full h-full object-cover"
													/>
													{/* Gradient Overlay */}
													<div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-transparent"></div>

													{/* Category Info */}
													<div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 text-white">
														<h3 className="font-heading text-xl md:text-2xl md:mb-2">
															{category.name}
														</h3>
														<p className="text-xs md:text-sm text-white/80">
															{category.description}
														</p>
													</div>
												</div>
											</div>
										</div>
									</SwiperSlide>
								))}
							</Swiper>

							{/* Custom Navigation Buttons */}
							<button
								className="swiper-button-prev-custom absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all hover:scale-110"
							>
								<ChevronLeftIcon className="w-4 md:w-6 h-4 md:h-6 text-movie-text" />
							</button>
							<button
								className="swiper-button-next-custom absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all hover:scale-110"
							>
								<ChevronRightIcon className="w-4 md:w-6 h-4 md:h-6 text-movie-text" />
							</button>
						</div>

						{/* Create Button */}
						<button
							onClick={handleCreateRoom}
							disabled={isCreating || !ws.isConnected}
							className="w-full py-2 md:py-4 bg-movie-success text-white font-heading md:text-lg rounded-2xl hover:bg-movie-success/90 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
						>
							{isCreating ? 'Creating Room...' : 'Create Room 🎬'}
						</button>
					</div>
				)}

				{/* Join Room Mode */}
				{mode === 'join' && (
					<div className="bg-movie-panel border-2 border-movie-border rounded-3xl p-5 md:p-8 shadow-card">
						<div className="flex items-center justify-between mb-6">
							<h2 className="font-heading text-sm md:text-2xl text-movie-info">
								Enter Room Code
							</h2>
							<button
								onClick={() => setMode(null)}
								className="text-sm md:text-base text-movie-muted hover:text-movie-text transition-colors font-medium"
							>
								← Back
							</button>
						</div>

						<div className="space-y-3 md:space-y-6">
							{/* Room Code Input */}
							<div>
								<label className="block text-sm font-medium text-movie-text mb-2">
									Room Code
								</label>
								<input
									type="text"
									value={roomCode}
									onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
									placeholder="e.g., ABC123"
									className="w-full px-4 md:px-6 py-2 md:py-4 bg-white rounded-2xl text-movie-text text-center md:text-2xl font-heading placeholder-movie-muted focus:outline-none focus:ring-2 focus:ring-movie-info border-2 border-movie-border uppercase"
									maxLength={6}
									autoFocus
								/>
							</div>

							{/* Join Button */}
							<button
								onClick={handleJoinRoom}
								disabled={isJoining || !roomCode.trim() || !ws.isConnected}
								className="w-full py-2 md:py-4 bg-movie-info text-white font-heading md:text-lg rounded-2xl hover:bg-movie-info/90 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
							>
								{isJoining ? 'Joining...' : 'Join Room 🚪'}
							</button>
						</div>
					</div>
				)}

				{/* Connection Status */}
				{!ws.isConnected && (
					<div className="mt-6 text-center">
						<div className="inline-flex items-center gap-2 bg-movie-danger/10 text-movie-danger px-4 py-2 rounded-full border border-movie-danger/20">
							<div className="w-2 h-2 bg-movie-danger rounded-full animate-pulse"></div>
							<p className="text-sm font-medium">Connecting to server...</p>
						</div>
					</div>
				)}

			</div>
		</div>
	);
}