import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

// components
import Dropdown from './Dropdown';

const DICEBEAR_STYLES = [
	{ value: 'adventurer', label: 'Adventurer' },
	{ value: 'avataaars', label: 'Avataaars' },
	{ value: 'big-smile', label: 'Big Smile' },
	{ value: 'bottts', label: 'Robots' },
	{ value: 'croodles', label: 'Croodles' },
	{ value: 'fun-emoji', label: 'Emoji' },
	{ value: 'lorelei', label: 'Lorelei' },
	{ value: 'micah', label: 'Micah' },
	{ value: 'miniavs', label: 'Miniavs' },
	{ value: 'notionists', label: 'Notionists' },
	{ value: 'open-peeps', label: 'Peeps' },
	{ value: 'personas', label: 'Personas' },
	{ value: 'pixel-art', label: 'Pixel Art' },
];

export default function ProfileSetup({ onComplete }) {
	const [name, setName] = useState('');
	const [selectedStyle, setSelectedStyle] = useState('avataaars');
	const [avatars, setAvatars] = useState([]);
	const [selectedAvatar, setSelectedAvatar] = useState(null);
	const [showAvatarPicker, setShowAvatarPicker] = useState(false);

	// Generate initial avatars
	useEffect(() => {
		generateAvatars();
	}, [selectedStyle]);

	const generateAvatars = () => {
		const newAvatars = Array.from({ length: 12 }, (_, i) => ({
			style: selectedStyle,
			seed: `${selectedStyle}-${Math.random().toString(36).substring(7)}`,
		}));
		setAvatars(newAvatars);
		if (!selectedAvatar) {
			setSelectedAvatar(newAvatars[0]);
		}
	};

	const getAvatarUrl = (avatar) => {
		return `https://api.dicebear.com/7.x/${avatar.style}/svg?seed=${avatar.seed}`;
	};

	const handleStyleChange = (styleId) => {
		setSelectedStyle(styleId);
		const newAvatars = Array.from({ length: 12 }, (_, i) => ({
			style: styleId,
			seed: `${styleId}-${Math.random().toString(36).substring(7)}`,
		}));
		setAvatars(newAvatars);
		setSelectedAvatar(newAvatars[0]);
	};

	const handleContinue = () => {
		if (name.trim() && selectedAvatar) {
			const profile = {
				name: name.trim(),
				avatar: selectedAvatar,
			};
			localStorage.setItem('movieGuesserProfile', JSON.stringify(profile));
			onComplete(profile);
		}
	};

	return (
		<div className="min-h-screen bg-movie-bg flex items-center justify-center p-4 md:p-6">
			<div className="w-full max-w-md">

				<div className="bg-movie-panel rounded-3xl p-5 md:p-8 shadow-card border border-movie-border">
					<div className="text-center mb-8">
						<h1 className="font-heading text-3xl md:text-4xl text-movie-primary mb-2">
							🎬 Welcome!
						</h1>
						<p className="text-movie-muted text-sm md:text-lg">
							Let's set up your profile
						</p>
					</div>

					<div className="space-y-3 md:space-y-6">

						{/* Avatar Picker */}
						<div className="flex flex-col items-center">
							{/* <label className="block text-sm font-medium text-movie-text mb-3 self-start">
								Your Avatar
							</label> */}
							<button
								onClick={() => setShowAvatarPicker(true)}
								className="relative group"
							>
								<div className="w-18 md:w-24 h-18 md:h-24 rounded-2xl bg-movie-hover flex items-center justify-center overflow-hidden border-4 border-movie-primary group-hover:scale-105 group-hover:border-movie-info transition-transform">
									{selectedAvatar ? (
										<img
											src={getAvatarUrl(selectedAvatar)}
											alt="Your avatar"
											className="w-full h-full"
										/>
									) : (
										<span className="text-4xl">👤</span>
									)}
								</div>
								<div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm font-medium transition-opacity">
									Click to change
								</div>
							</button>
						</div>

						{/* Name Input */}
						<div>
							<label className="block text-xs md:text-sm font-medium text-movie-text mb-2">
								Your Name
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Enter your name"
								className="w-full text-sm md:text-base px-4 md:px-6 py-3 md:py-4 bg-white rounded-2xl text-movie-text placeholder-movie-muted focus:outline-none focus:ring-2 focus:ring-movie-primary border-2 border-movie-border"
								maxLength={20}
								autoFocus
							/>
						</div>

						{/* Continue Button */}
						<button
							onClick={handleContinue}
							disabled={!name.trim() || !selectedAvatar}
							className="w-full py-2 md:py-4 bg-movie-primary text-white font-heading md:text-lg rounded-2xl hover:bg-movie-primary/90 hover:shadow-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all"
						>
							Continue →
						</button>
					</div>
				</div>

			</div>

			{/* Avatar Picker Modal */}
			{showAvatarPicker && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
					<div className="bg-movie-panel rounded-3xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-movie-border">

						<div className="flex items-center justify-between mb-6">
							<h2 className="font-heading md:text-2xl text-movie-primary">
								Choose Your Avatar
							</h2>
							<button
								onClick={() => setShowAvatarPicker(false)}
								className="text-movie-muted hover:text-movie-text text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-movie-hover transition-colors"
							>
								<XMarkIcon className="w-6 h-6" />
							</button>
						</div>

						{/* Style Dropdown */}
						<Dropdown
							label="Avatar Style"
							options={DICEBEAR_STYLES}
							value={selectedStyle}
							onChange={handleStyleChange}
							placeholder="Select a style"
							className="mb-6"
						/>

						{/* Avatar Grid */}
						<div className="grid grid-cols-4 gap-3 mb-4">
							{avatars.map((avatar, index) => (
								<button
									key={index}
									onClick={() => {
										setSelectedAvatar(avatar);
										setShowAvatarPicker(false);
									}}
									className={`p-2 rounded-xl transition-all border-2 ${selectedAvatar?.seed === avatar.seed
											? 'border-movie-primary bg-movie-primary/10 scale-105 shadow-lg'
											: 'border-movie-border hover:border-movie-primary hover:scale-105'
										}`}
								>
									<img
										src={getAvatarUrl(avatar)}
										alt={`Avatar ${index + 1}`}
										className="w-full h-full rounded-lg"
									/>
								</button>
							))}
						</div>

						{/* Shuffle Button */}
						<button
							onClick={generateAvatars}
							className="w-full text-sm md:text-base py-2 md:py-3 bg-movie-info text-white rounded-xl hover:bg-movie-info/90 transition-colors font-medium"
						>
							🎲 Shuffle Avatars
						</button>

					</div>
				</div>
			)}
		</div>
	);
}