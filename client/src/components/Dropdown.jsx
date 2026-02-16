import { useState, useRef, useEffect } from 'react';

export default function Dropdown({
	label,
	options = [],
	value,
	onChange,
	placeholder = 'Select an option',
	className = ''
}) {
	const [isOpen, setIsOpen] = useState(false);
	const dropdownRef = useRef(null);

	// Get selected option
	const selectedOption = options.find(opt => opt.value === value);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};

		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleSelect = (optionValue) => {
		onChange(optionValue);
		setIsOpen(false);
	};

	return (
		<div className={className}>
			{label && (
				<label className="block text-sm font-medium text-movie-text mb-2">
					{label}
				</label>
			)}

			<div className="relative" ref={dropdownRef}>
				{/* Dropdown Button */}
				<button
					type="button"
					onClick={() => setIsOpen(!isOpen)}
					className="w-full px-4 py-3 bg-white rounded-xl text-movie-text border-2 border-movie-border hover:border-movie-primary focus:outline-none focus:border-movie-primary transition-colors text-left flex items-center justify-between"
				>
					<span className={selectedOption ? 'text-movie-text' : 'text-movie-muted'}>
						{selectedOption ? selectedOption.label : placeholder}
					</span>
					<svg
						className={`w-5 h-5 text-movie-muted transition-transform ${isOpen ? 'rotate-180' : ''}`}
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{/* Dropdown Menu */}
				{isOpen && (
					<div className="absolute z-10 w-full mt-2 bg-white border-2 border-movie-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
						{options.map((option) => (
							<button
								key={option.value}
								type="button"
								onClick={() => handleSelect(option.value)}
								className={`w-full px-4 py-3 text-left hover:bg-movie-hover transition-colors ${value === option.value
										? 'bg-movie-primary/10 text-movie-primary font-medium'
										: 'text-movie-text'
									}`}
							>
								<div className="flex items-center justify-between">
									<span>{option.label}</span>
									{value === option.value && (
										<svg className="w-5 h-5 text-movie-primary" fill="currentColor" viewBox="0 0 20 20">
											<path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
										</svg>
									)}
								</div>
							</button>
						))}
					</div>
				)}
			</div>
		</div>
	);
}