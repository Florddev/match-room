"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
	ArrowRight,
	Briefcase,
	Building,
	Calendar,
	Car,
	Check,
	Coffee,
	DollarSign,
	Dumbbell,
	MapPin,
	Maximize2,
	MessageCircle,
	Minimize2,
	Mountain,
	Palmtree,
	RefreshCw,
	Send,
	Sparkles,
	Star,
	Sunset,
	Users,
	Utensils,
	Waves,
	Wifi,
	X,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

// Types
type ChatMessageType =
	| "text"
	| "options"
	| "date"
	| "profile"
	| "properties"
	| "budget"
	| "property";

type MessageSender = "system" | "user";

interface ChatOption {
	id: string;
	text: string;
	icon?: string;
}

interface DateRange {
	start: string;
	end: string;
}

interface HostInfo {
	name: string;
	image: string;
	responseRate: number;
	superHost: boolean;
}

interface Property {
	id: number;
	name: string;
	location: string;
	region: string;
	description: string;
	originalPrice: number;
	discountedPrice: number;
	rating: number;
	image: string;
	tags: string[];
	amenities: string[];
	style: string;
	compatibility: number;
	reviews: number;
	host: HostInfo;
}

interface UserProfile {
	destination: string;
	dates: DateRange;
	style: string;
	essentials: string[];
	budget: number[];
	extras: string[];
}

interface ChatMessage {
	id: number;
	type: ChatMessageType;
	sender: MessageSender;
	content: string;
	options?: ChatOption[];
	properties?: Property[];
	dateRange?: DateRange;
	budget?: number[];
	profile?: UserProfile;
	multiSelect?: boolean;
}

interface ChatStep {
	id: number;
	message: string;
	type: ChatMessageType;
	options?: ChatOption[];
	multiSelect?: boolean;
}

interface HotelChatbotProps {
	botName?: string;
	botAvatar?: string;
	userAvatar?: string;
	accentColor?: string;
	position?: "bottom-right" | "bottom-left" | "bottom-center";
	initialMessage?: string;
	properties?: Property[];
}

const HotelChatbot: React.FC<HotelChatbotProps> = ({
	botName = "Match Room Assistant",
	botAvatar = "/assistant-avatar.png",
	userAvatar = "/user-avatar.png",
	accentColor = "#13293d",
	position = "bottom-right",
	initialMessage = "Bonjour ! Comment puis-je vous aider à trouver votre hotel idéal ?",
	properties = [],
}) => {
	const [chatOpen, setChatOpen] = useState(false);
	const [chatMinimized, setChatMinimized] = useState(false);
	const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
	const [inputMessage, setInputMessage] = useState("");
	const [currentStep, setCurrentStep] = useState(0);
	const [isTyping, setIsTyping] = useState(false);
	const [userProfile, setUserProfile] = useState<UserProfile>({
		destination: "",
		dates: { start: "", end: "" },
		style: "",
		essentials: [],
		budget: [100, 300],
		extras: [],
	});
	const [selectedProperties, setSelectedProperties] = useState<number[]>([]);
	const chatEndRef = useRef<HTMLDivElement>(null);

	// Default properties if none provided
	const defaultProperties: Property[] = [
		{
			id: 1,
			name: "Appartement avec vue sur la mer",
			location: "Nice, France",
			region: "Côte d'Azur",
			description: "Magnifique appartement avec vue panoramique sur la mer Méditerranée",
			originalPrice: 120,
			discountedPrice: 108,
			rating: 4.8,
			image: "/apartment.jpg",
			tags: ["Vue mer", "Balcon", "Centre-ville"],
			amenities: ["wifi", "tv", "kitchen"],
			style: "moderne",
			compatibility: 95,
			reviews: 128,
			host: {
				name: "Marie L.",
				image: "/host.jpg",
				responseRate: 98,
				superHost: true,
			},
		},
		{
			id: 2,
			name: "Studio cosy en montagne",
			location: "Chamonix, France",
			region: "Alpes",
			description: "Studio confortable au pied des pistes avec vue sur le Mont Blanc",
			originalPrice: 95,
			discountedPrice: 85,
			rating: 4.6,
			image: "/studio.jpg",
			tags: ["Ski", "Montagne", "Cosy"],
			amenities: ["wifi", "tv", "parking"],
			style: "chalet",
			compatibility: 88,
			reviews: 75,
			host: {
				name: "Jean M.",
				image: "/host2.jpg",
				responseRate: 96,
				superHost: false,
			},
		},
	];

	const availableProperties = properties.length > 0 ? properties : defaultProperties;

	// Chat steps for guided conversation
	const chatSteps: ChatStep[] = [
		{
			id: 1,
			message: "Où souhaitez-vous séjourner ?",
			type: "options",
			options: [
				{ id: "mountain", text: "Montagne", icon: "Mountain" },
				{ id: "beach", text: "Plage", icon: "Palmtree" },
				{ id: "city", text: "Ville", icon: "Building" },
				{ id: "flexible", text: "Je suis flexible", icon: "Sparkles" },
			],
		},
		{
			id: 2,
			message: "Pour quelles dates ?",
			type: "date",
		},
		{
			id: 3,
			message: "Quel style de logement recherchez-vous ?",
			type: "options",
			options: [
				{ id: "modern", text: "Moderne", icon: "Sparkles" },
				{ id: "cozy", text: "Cosy", icon: "Coffee" },
				{ id: "luxury", text: "Luxe", icon: "Star" },
				{ id: "unique", text: "Insolite", icon: "Sparkles" },
			],
		},
		{
			id: 4,
			message: "Quels équipements sont importants pour vous ?",
			type: "options",
			options: [
				{ id: "wifi", text: "Wi-Fi", icon: "Wifi" },
				{ id: "pool", text: "Piscine", icon: "Waves" },
				{ id: "kitchen", text: "Cuisine équipée", icon: "Utensils" },
				{ id: "parking", text: "Parking", icon: "Car" },
				{ id: "view", text: "Belle vue", icon: "Sunset" },
			],
			multiSelect: true,
		},
		{
			id: 5,
			message: "Quel est votre budget par nuit ?",
			type: "options",
			options: [
				{ id: "budget1", text: "Économique (< 75€)" },
				{ id: "budget2", text: "Modéré (75€-150€)" },
				{ id: "budget3", text: "Confort (150€-300€)" },
				{ id: "budget4", text: "Premium (300€+)" },
			],
		},
	];

	// Initialize chat with welcome message
	useEffect(() => {
		if (chatMessages.length === 0) {
			setChatMessages([
				{
					id: 1,
					type: "text",
					sender: "system",
					content: initialMessage,
				},
				{
					id: 2,
					type: "options",
					sender: "system",
					content: "",
					options: chatSteps[0].options,
				},
			]);
		}
	}, [chatMessages.length, initialMessage]);

	// Scroll to bottom of chat when new messages added
	useEffect(() => {
		if (chatEndRef.current) {
			chatEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [chatMessages]);

	// Simulate AI typing
	const simulateTyping = (callback: () => void) => {
		setIsTyping(true);
		const typingTime = Math.random() * 1000 + 500; // Between 500ms and 1500ms
		setTimeout(() => {
			setIsTyping(false);
			callback();
		}, typingTime);
	};

	// Handle option selection
	const handleOptionSelect = (optionId: string, optionText: string, multiSelect = false) => {
		// Add user response
		setChatMessages((prev) => [
			...prev,
			{
				id: Date.now(),
				type: "text",
				sender: "user",
				content: optionText,
			},
		]);

		// Update user profile based on current step
		if (currentStep === 0) {
			setUserProfile((prev) => ({ ...prev, destination: optionId }));
		} else if (currentStep === 2) {
			setUserProfile((prev) => ({ ...prev, style: optionId }));
		} else if (currentStep === 3) {
			if (multiSelect) {
				setUserProfile((prev) => {
					const newEssentials = prev.essentials.includes(optionId)
						? prev.essentials.filter((item) => item !== optionId)
						: [...prev.essentials, optionId];
					return { ...prev, essentials: newEssentials };
				});
				return;
			} else {
				setUserProfile((prev) => ({ ...prev, essentials: [optionId] }));
			}
		} else if (currentStep === 4) {
			// Set budget range based on selected option
			let budgetRange: number[] = [0, 0];
			switch (optionId) {
				case "budget1":
					budgetRange = [0, 75];
					break;
				case "budget2":
					budgetRange = [75, 150];
					break;
				case "budget3":
					budgetRange = [150, 300];
					break;
				case "budget4":
					budgetRange = [300, 1000];
					break;
			}
			setUserProfile((prev) => ({ ...prev, budget: budgetRange }));
		}

		// If not multi-select, advance to next step
		if (!multiSelect) {
			goToNextStep();
		}
	};

	// Handle date selection
	const handleDateSelect = (start: string, end: string) => {
		// Add user response
		setChatMessages((prev) => [
			...prev,
			{
				id: Date.now(),
				type: "text",
				sender: "user",
				content: `Du ${new Date(start).toLocaleDateString()} au ${new Date(end).toLocaleDateString()}`,
			},
		]);

		// Update user profile
		setUserProfile((prev) => ({ ...prev, dates: { start, end } }));

		// Advance to next step
		goToNextStep();
	};

	// Go to next step in conversation
	const goToNextStep = () => {
		const nextStep = currentStep + 1;

		// If we've completed all steps, show recommendations
		if (nextStep >= chatSteps.length) {
			simulateTyping(() => {
				// Add summary and recommendations
				setChatMessages((prev) => [
					...prev,
					{
						id: Date.now(),
						type: "text",
						sender: "system",
						content: "Voici votre profil de recherche :",
					},
					{
						id: Date.now() + 1,
						type: "profile",
						sender: "system",
						content: "",
						profile: userProfile,
					},
					{
						id: Date.now() + 2,
						type: "text",
						sender: "system",
						content: "Voici quelques logements qui pourraient vous plaire :",
					},
					{
						id: Date.now() + 3,
						type: "properties",
						sender: "system",
						content: "",
						properties: getRecommendedProperties(),
					},
					{
						id: Date.now() + 4,
						type: "text",
						sender: "system",
						content: "Souhaitez-vous affiner votre recherche ?",
					},
					{
						id: Date.now() + 5,
						type: "options",
						sender: "system",
						content: "",
						options: [
							{ id: "more-options", text: "Plus d'options", icon: "Sparkles" },
							{ id: "adjust-dates", text: "Modifier les dates", icon: "Calendar" },
							{ id: "adjust-budget", text: "Ajuster le budget", icon: "DollarSign" },
							{ id: "new-search", text: "Nouvelle recherche", icon: "RefreshCw" },
						],
					},
				]);
			});
		} else {
			// Advance to next step
			setCurrentStep(nextStep);

			// Add next step message
			simulateTyping(() => {
				setChatMessages((prev) => {
					const newMessages = [...prev];

					// Add text message for the step
					newMessages.push({
						id: Date.now(),
						type: "text",
						sender: "system",
						content: chatSteps[nextStep].message,
					});

					// Add appropriate component based on step type
					if (chatSteps[nextStep].type === "options") {
						newMessages.push({
							id: Date.now() + 1,
							type: "options",
							sender: "system",
							content: "",
							options: chatSteps[nextStep].options,
							multiSelect: chatSteps[nextStep].multiSelect,
						});
					} else if (chatSteps[nextStep].type === "date") {
						newMessages.push({
							id: Date.now() + 1,
							type: "date",
							sender: "system",
							content: "",
						});
					}

					// If we're halfway through, show some preliminary recommendations
					if (nextStep === 3) {
						newMessages.push({
							id: Date.now() + 2,
							type: "text",
							sender: "system",
							content: "Voici déjà quelques suggestions basées sur vos préférences :",
						});
						newMessages.push({
							id: Date.now() + 3,
							type: "properties",
							sender: "system",
							content: "",
							properties: getRecommendedProperties().slice(0, 2),
						});
					}

					return newMessages;
				});
			});
		}
	};

	// Get recommended properties based on user profile
	const getRecommendedProperties = (): Property[] => {
		let filteredProperties = [...availableProperties];

		// Filter by destination if specified
		if (userProfile.destination) {
			if (userProfile.destination === "mountain") {
				filteredProperties = filteredProperties.filter((p) => p.region.toLowerCase().includes("alpe"));
			} else if (userProfile.destination === "beach") {
				filteredProperties = filteredProperties.filter((p) =>
					p.region.toLowerCase().includes("azur") ||
					p.tags.some(tag => tag.toLowerCase().includes("mer") || tag.toLowerCase().includes("plage"))
				);
			} else if (userProfile.destination === "city") {
				filteredProperties = filteredProperties.filter((p) =>
					p.location.toLowerCase().includes("paris") ||
					p.region.toLowerCase().includes("france")
				);
			}
		}

		// Filter by budget
		if (userProfile.budget[0] > 0 || userProfile.budget[1] < 1000) {
			filteredProperties = filteredProperties.filter(
				(p) => p.discountedPrice >= userProfile.budget[0] && p.discountedPrice <= userProfile.budget[1]
			);
		}

		// Filter by essentials if any are specified
		if (userProfile.essentials.length > 0) {
			filteredProperties = filteredProperties.filter((p) =>
				userProfile.essentials.some((essential) => p.amenities.includes(essential))
			);
		}

		// If no properties match filters, return all properties
		if (filteredProperties.length === 0) {
			return availableProperties;
		}

		return filteredProperties;
	};

	// Add property to favorites
	const addToFavorites = (propertyId: number) => {
		if (!selectedProperties.includes(propertyId)) {
			setSelectedProperties([...selectedProperties, propertyId]);

			// Add confirmation message
			setChatMessages((prev) => [
				...prev,
				{
					id: Date.now(),
					type: "text",
					sender: "system",
					content: "Logement ajouté à vos favoris !",
				},
			]);
		}
	};

	// Show more property suggestions
	const showMoreSuggestions = () => {
		// Add user message
		setChatMessages((prev) => [
			...prev,
			{
				id: Date.now(),
				type: "text",
				sender: "user",
				content: "Je voudrais voir d'autres suggestions",
			},
		]);

		// Simulate AI response
		simulateTyping(() => {
			setChatMessages((prev) => [
				...prev,
				{
					id: Date.now(),
					type: "text",
					sender: "system",
					content: "Voici d'autres logements qui pourraient vous intéresser :",
				},
				{
					id: Date.now() + 1,
					type: "properties",
					sender: "system",
					content: "",
					properties: getRecommendedProperties().sort(() => Math.random() - 0.5),
				},
			]);
		});
	};

	// Refine search based on selected option
	const refineSearch = (optionId: string, optionText: string) => {
		// Add user message
		setChatMessages((prev) => [
			...prev,
			{
				id: Date.now(),
				type: "text",
				sender: "user",
				content: optionText,
			},
		]);

		// Update user profile based on selection
		if (optionId === "adjust-budget") {
			simulateTyping(() => {
				setChatMessages((prev) => [
					...prev,
					{
						id: Date.now(),
						type: "text",
						sender: "system",
						content: "Quel est votre nouveau budget par nuit ?",
					},
					{
						id: Date.now() + 1,
						type: "options",
						sender: "system",
						content: "",
						options: [
							{ id: "budget1", text: "Économique (< 75€)" },
							{ id: "budget2", text: "Modéré (75€-150€)" },
							{ id: "budget3", text: "Confort (150€-300€)" },
							{ id: "budget4", text: "Premium (300€+)" },
						],
					},
				]);
			});
			return;
		} else if (optionId === "adjust-dates") {
			simulateTyping(() => {
				setChatMessages((prev) => [
					...prev,
					{
						id: Date.now(),
						type: "text",
						sender: "system",
						content: "Quelles sont vos nouvelles dates ?",
					},
					{
						id: Date.now() + 1,
						type: "date",
						sender: "system",
						content: "",
					},
				]);
			});
			return;
		} else if (optionId === "new-search") {
			// Reset chat
			setChatMessages([
				{
					id: 1,
					type: "text",
					sender: "system",
					content: initialMessage,
				},
				{
					id: 2,
					type: "options",
					sender: "system",
					content: "",
					options: chatSteps[0].options,
				},
			]);
			setCurrentStep(0);
			setUserProfile({
				destination: "",
				dates: { start: "", end: "" },
				style: "",
				essentials: [],
				budget: [100, 300],
				extras: [],
			});
			return;
		}

		// For other options, show more suggestions
		simulateTyping(() => {
			setChatMessages((prev) => [
				...prev,
				{
					id: Date.now(),
					type: "text",
					sender: "system",
					content: "Voici des logements qui pourraient mieux vous convenir :",
				},
				{
					id: Date.now() + 1,
					type: "properties",
					sender: "system",
					content: "",
					properties: getRecommendedProperties(),
				},
			]);
		});
	};

	// Send text message
	const sendMessage = () => {
		if (inputMessage.trim()) {
			// Add user message
			setChatMessages((prev) => [
				...prev,
				{
					id: Date.now(),
					type: "text",
					sender: "user",
					content: inputMessage,
				},
			]);

			// Clear input
			setInputMessage("");

			// Simulate AI response
			simulateTyping(() => {
				setChatMessages((prev) => [
					...prev,
					{
						id: Date.now(),
						type: "text",
						sender: "system",
						content: "Merci pour votre message ! Je suis là pour vous aider à trouver le logement parfait. Que puis-je faire pour vous ?",
					},
					{
						id: Date.now() + 1,
						type: "options",
						sender: "system",
						content: "",
						options: [
							{ id: "more-suggestions", text: "Plus de suggestions", icon: "RefreshCw" },
							{ id: "adjust-budget", text: "Ajuster mon budget", icon: "DollarSign" },
							{ id: "adjust-dates", text: "Modifier mes dates", icon: "Calendar" },
							{ id: "new-search", text: "Nouvelle recherche", icon: "RefreshCw" },
						],
					},
				]);
			});
		}
	};

	// Render icons
	const renderIcon = (iconName: string) => {
		switch (iconName) {
			case "Mountain":
				return <Mountain className="h-4 w-4" />;
			case "Palmtree":
				return <Palmtree className="h-4 w-4" />;
			case "Building":
				return <Building className="h-4 w-4" />;
			case "Sparkles":
				return <Sparkles className="h-4 w-4" />;
			case "Users":
				return <Users className="h-4 w-4" />;
			case "Dumbbell":
				return <Dumbbell className="h-4 w-4" />;
			case "Briefcase":
				return <Briefcase className="h-4 w-4" />;
			case "Wifi":
				return <Wifi className="h-4 w-4" />;
			case "Waves":
				return <Waves className="h-4 w-4" />;
			case "Utensils":
				return <Utensils className="h-4 w-4" />;
			case "Car":
				return <Car className="h-4 w-4" />;
			case "Sunset":
				return <Sunset className="h-4 w-4" />;
			case "Coffee":
				return <Coffee className="h-4 w-4" />;
			case "RefreshCw":
				return <RefreshCw className="h-4 w-4" />;
			case "DollarSign":
				return <DollarSign className="h-4 w-4" />;
			case "Calendar":
				return <Calendar className="h-4 w-4" />;
			case "Star":
				return <Star className="h-4 w-4" />;
			default:
				return <Sparkles className="h-4 w-4" />;
		}
	};

	// Render chat messages
	const renderChatMessage = (message: ChatMessage) => {
		switch (message.type) {
			case "text":
				return (
					<div
						className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} mb-4`}
						key={message.id}
					>
						{message.sender === "system" && (
							<Avatar className="h-8 w-8 mr-2">
								<AvatarImage src={botAvatar} />
								<AvatarFallback style={{ backgroundColor: accentColor, color: "white" }}>
									{botName.substring(0, 2).toUpperCase()}
								</AvatarFallback>
							</Avatar>
						)}
						<div
							className={`max-w-[80%] rounded-2xl p-3 ${message.sender === "user"
								? "bg-gray-100 text-gray-800"
								: `text-black`
								}`}
							style={{ backgroundColor: message.sender === "user" ? "" : "#dfe9f1" }}
						>
							<p>{message.content}</p>
						</div>
						{message.sender === "user" && (
							<Avatar className="h-8 w-8 ml-2">
								<AvatarImage src={userAvatar} />
								<AvatarFallback className="bg-gray-300">U</AvatarFallback>
							</Avatar>
						)}
					</div>
				);
			case "options":
				return (
					<div className="mb-4" key={message.id}>
						<div className="flex flex-wrap gap-2">
							{message.options?.map((option) => (
								<Button
									key={option.id}
									variant="outline"
									className={`rounded-full flex items-center ${message.multiSelect && userProfile.essentials.includes(option.id)
										? "bg-gray-100 border-gray-300"
										: message.multiSelect && userProfile.extras.includes(option.id)
											? "bg-gray-100 border-gray-300"
											: ""
										}`}
									onClick={() => {
										if (currentStep <= chatSteps.length - 1) {
											handleOptionSelect(option.id, option.text, message.multiSelect);
										} else {
											refineSearch(option.id, option.text);
										}
									}}
								>
									{option.icon && <span className="mr-2">{renderIcon(option.icon)}</span>}
									{option.text}
									{(message.multiSelect && userProfile.essentials.includes(option.id)) ||
										(message.multiSelect && userProfile.extras.includes(option.id)) ? (
										<Check className="ml-2 h-4 w-4" />
									) : null}
								</Button>
							))}
							{message.multiSelect && (
								<Button
									variant="default"
									className="rounded-full text-white"
									style={{ backgroundColor: accentColor }}
									onClick={goToNextStep}
								>
									Continuer <ArrowRight className="ml-2 h-4 w-4" />
								</Button>
							)}
						</div>
					</div>
				);
			case "date":
				return (
					<div className="mb-4" key={message.id}>
						<div className="bg-gray-50 rounded-xl p-4">
							<div className="grid grid-cols-2 gap-4 mb-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Date d'arrivée
									</label>
									<Input
										type="date"
										className="rounded-xl"
										value={userProfile.dates.start}
										onChange={(e) =>
											setUserProfile({
												...userProfile,
												dates: { ...userProfile.dates, start: e.target.value },
											})
										}
									/>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-1">
										Date de départ
									</label>
									<Input
										type="date"
										className="rounded-xl"
										value={userProfile.dates.end}
										onChange={(e) =>
											setUserProfile({
												...userProfile,
												dates: { ...userProfile.dates, end: e.target.value },
											})
										}
									/>
								</div>
							</div>
							<div className="flex justify-between items-center">
								<Button
									variant="outline"
									className="rounded-full"
									onClick={() => {
										handleOptionSelect("flexible", "Je suis flexible sur les dates");
									}}
								>
									Je suis flexible
								</Button>
								<Button
									variant="default"
									className="rounded-full text-white"
									style={{ backgroundColor: accentColor }}
									onClick={() => {
										if (userProfile.dates.start && userProfile.dates.end) {
											handleDateSelect(userProfile.dates.start, userProfile.dates.end);
										}
									}}
									disabled={!userProfile.dates.start || !userProfile.dates.end}
								>
									Confirmer
								</Button>
							</div>
						</div>
					</div>
				);
			case "profile":
				return (
					<div className="mb-4" key={message.id}>
						<div className="bg-gray-50 rounded-xl p-4">
							<h3 className="font-medium mb-2">Votre profil de recherche</h3>
							<div className="space-y-2">
								<div className="flex justify-between">
									<span className="text-gray-600">Destination:</span>
									<span className="font-medium">
										{userProfile.destination === "mountain"
											? "Montagne"
											: userProfile.destination === "beach"
												? "Plage"
												: userProfile.destination === "city"
													? "Ville"
													: "Flexible"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Dates:</span>
									<span className="font-medium">
										{userProfile.dates.start && userProfile.dates.end
											? `${new Date(userProfile.dates.start).toLocaleDateString()} - ${new Date(
												userProfile.dates.end
											).toLocaleDateString()}`
											: "Flexible"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Style:</span>
									<span className="font-medium">
										{userProfile.style === "modern"
											? "Moderne"
											: userProfile.style === "cozy"
												? "Cosy"
												: userProfile.style === "luxury"
													? "Luxe"
													: userProfile.style === "unique"
														? "Insolite"
														: "Non spécifié"}
									</span>
								</div>
								<div className="flex justify-between">
									<span className="text-gray-600">Budget:</span>
									<span className="font-medium">
										{userProfile.budget[0]}€ - {userProfile.budget[1]}€
									</span>
								</div>
								{userProfile.essentials.length > 0 && (
									<div className="flex justify-between">
										<span className="text-gray-600">Équipements:</span>
										<div className="flex flex-wrap justify-end gap-1">
											{userProfile.essentials.map((essential) => (
												<Badge key={essential} className="bg-gray-200 text-gray-700">
													{essential === "wifi"
														? "Wi-Fi"
														: essential === "pool"
															? "Piscine"
															: essential === "kitchen"
																? "Cuisine équipée"
																: essential === "parking"
																	? "Parking"
																	: essential === "view"
																		? "Belle vue"
																		: essential}
												</Badge>
											))}
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				);
			case "properties":
				return (
					<div className="mb-4" key={message.id}>
						<div className="space-y-3">
							{message.properties?.map((property) => (
								<div
									key={property.id}
									className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
								>
									<div className="flex">
										<div className="relative w-24 h-24 sm:w-32 sm:h-32">
											<Image
												src={property.image || "/placeholder.svg"}
												alt={property.name}
												fill
												className="object-cover"
											/>
										</div>
										<div className="p-3 flex-grow">
											<div className="flex justify-between items-start">
												<h3 className="font-medium text-sm sm:text-base">{property.name}</h3>
												<div className="flex items-center bg-gray-100 px-2 py-1 rounded-full">
													<Star className="h-3 w-3 text-yellow-400 fill-yellow-400 mr-1" />
													<span className="text-xs">{property.rating}</span>
												</div>
											</div>
											<p className="text-gray-500 text-xs sm:text-sm flex items-center mb-1">
												<MapPin className="h-3 w-3 mr-1" /> {property.location}
											</p>
											<p className="text-xs text-gray-600 mb-2 line-clamp-2">{property.description}</p>
											<div className="flex justify-between items-center">
												<div>
													<span className="text-gray-400 line-through text-xs mr-1">€{property.originalPrice}</span>
													<span className="font-bold text-sm">€{property.discountedPrice}</span>
													<span className="text-gray-500 text-xs"> / nuit</span>
												</div>
												<Button
													size="sm"
													className="rounded-full text-white"
													style={{ backgroundColor: accentColor }}
													onClick={() => addToFavorites(property.id)}
												>
													<span className="text-xs">J'aime</span>
												</Button>
											</div>
										</div>
									</div>
								</div>
							))}
							{message.properties?.length === 0 && (
								<Button
									variant="outline"
									className="w-full rounded-xl flex items-center justify-center"
									onClick={showMoreSuggestions}
								>
									<RefreshCw className="h-4 w-4 mr-2" />
									Voir d'autres logements
								</Button>
							)}
							{message.properties?.length === 0 && (
								<div className="text-center py-4">
									<p className="text-gray-500">Aucun logement ne correspond à vos critères.</p>
									<Button
										variant="outline"
										className="mt-2 rounded-full"
										onClick={() => refineSearch("new-search", "Nouvelle recherche")}
									>
										<RefreshCw className="h-4 w-4 mr-2" />
										Nouvelle recherche
									</Button>
								</div>
							)}
						</div>
					</div>
				);
			default:
				return null;
		}
	};

	// Position style based on prop
	const getPositionStyle = () => {
		switch (position) {
			case "bottom-left":
				return "left-6";
			case "bottom-center":
				return "left-1/2 transform -translate-x-1/2";
			case "bottom-right":
			default:
				return "right-6";
		}
	};

	return (
		<>
			{/* Chat button */}
			{!chatOpen ? (
				<Button
					className={`fixed bottom-6 ${getPositionStyle()} rounded-full w-14 h-14 shadow-lg flex items-center justify-center text-white`}
					style={{ backgroundColor: accentColor }}
					onClick={() => setChatOpen(true)}
				>
					<MessageCircle className="h-6 w-6" />
				</Button>
			) : (
				<div
					className={cn(
						`fixed bottom-6 ${getPositionStyle()} bg-white rounded-2xl shadow-xl w-full max-w-sm transition-all duration-300 flex flex-col`,
						chatMinimized ? "h-14" : "h-[600px]"
					)}
				>
					{/* Chat header */}
					<div
						className="flex items-center justify-between p-4 border-b"
						style={{ borderColor: `${accentColor}20` }}
					>
						<div className="flex items-center">
							<Avatar className="h-8 w-8 mr-2">
								<AvatarImage src={botAvatar} />
								<AvatarFallback style={{ backgroundColor: accentColor, color: "white" }}>
									{botName.substring(0, 2).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<div>
								<h3 className="font-medium text-sm">{botName}</h3>
								<p className="text-xs text-gray-500">En ligne</p>
							</div>
						</div>
						<div className="flex items-center">
							{chatMinimized ? (
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0 rounded-full"
									onClick={() => setChatMinimized(false)}
								>
									<Maximize2 className="h-4 w-4" />
								</Button>
							) : (
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0 rounded-full"
									onClick={() => setChatMinimized(true)}
								>
									<Minimize2 className="h-4 w-4" />
								</Button>
							)}
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0 rounded-full ml-1"
								onClick={() => setChatOpen(false)}
							>
								<X className="h-4 w-4" />
							</Button>
						</div>
					</div>

					{/* Chat content */}
					{!chatMinimized && (
						<>
							<div className="flex-grow overflow-y-auto p-4">
								{chatMessages.map((message) => renderChatMessage(message))}
								{isTyping && (
									<div className="flex mb-4">
										<Avatar className="h-8 w-8 mr-2">
											<AvatarImage src={botAvatar} />
											<AvatarFallback style={{ backgroundColor: accentColor, color: "white" }}>
												{botName.substring(0, 2).toUpperCase()}
											</AvatarFallback>
										</Avatar>
										<div
											className="rounded-2xl p-3 flex items-center text-white"
											style={{ backgroundColor: accentColor }}
										>
											<div className="flex space-x-1">
												<div
													className="w-2 h-2 bg-white/70 rounded-full animate-bounce"
													style={{ animationDelay: "0s" }}
												></div>
												<div
													className="w-2 h-2 bg-white/70 rounded-full animate-bounce"
													style={{ animationDelay: "0.2s" }}
												></div>
												<div
													className="w-2 h-2 bg-white/70 rounded-full animate-bounce"
													style={{ animationDelay: "0.4s" }}
												></div>
											</div>
										</div>
									</div>
								)}
								<div ref={chatEndRef} />
							</div>

							{/* Chat input */}
							<div className="p-4 border-t">
								<div className="flex items-center">
									<Input
										placeholder="Écrivez votre message..."
										className="rounded-full"
										value={inputMessage}
										onChange={(e) => setInputMessage(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter" && !e.shiftKey) {
												e.preventDefault();
												sendMessage();
											}
										}}
									/>
									<Button
										className="ml-2 h-10 w-10 rounded-full p-0 text-white"
										style={{ backgroundColor: accentColor }}
										onClick={sendMessage}
									>
										<Send className="h-5 w-5" />
									</Button>
								</div>
							</div>
						</>
					)}
				</div>
			)}
		</>
	);
};

export default HotelChatbot;