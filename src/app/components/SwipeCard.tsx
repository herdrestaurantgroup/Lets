import { motion, useMotionValue, useTransform, PanInfo } from "motion/react";
import { Heart, X, MapPin, ChevronLeft, ChevronRight, Leaf, Wine } from "lucide-react";
import { useState } from "react";

export interface Restaurant {
  id: number;
  name: string;
  cuisine: string;
  distance: string;
  rating: number;
  priceLevel: number;
  imageUrl: string;
  /** Google Places (or compatible) id when loaded from a live source */
  placeId?: string;
  lat?: number;
  lng?: number;
  mapsUrl?: string;
  isOpen?: boolean | null;
  source?: "places" | "mock";
  popularItems?: string[]; // 2-3 standout dishes
  description?: string; // Brief description of the restaurant (deprecated, use popularItems)
  allergens?: string[]; // e.g., ["Dairy", "Nuts", "Gluten"]
  dietaryOptions?: string[]; // e.g., ["Vegan", "Vegetarian", "Gluten-Free"]
  photos?: {
    food: string;
    menu: string;
    interior: string;
    exterior: string;
  };
  healthyOptions?: boolean; // Has healthy or high-protein options
  servesAlcohol?: boolean; // Serves alcohol or is bar/wine-focused
  mealTimes?: Array<"breakfast" | "lunch" | "dinner">; // What meals are served
  diningOptions?: Array<"dine-in" | "takeout">; // Dining options available
  quickService?: boolean; // Fast casual or quick service
}

interface SwipeCardProps {
  restaurant: Restaurant;
  onSwipe: (direction: "left" | "right") => void;
  style?: React.CSSProperties;
}

export function SwipeCard({ restaurant, onSwipe, style }: SwipeCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-20, 20]);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

  // Photo carousel state
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  
  // Build photos array - use imageUrl as default food photo if photos object exists
  const photos = restaurant.photos 
    ? [
        { url: restaurant.photos.food, label: "Food" },
        { url: restaurant.photos.menu, label: "Menu" },
        { url: restaurant.photos.interior, label: "Interior" },
        { url: restaurant.photos.exterior, label: "Exterior" },
      ]
    : [{ url: restaurant.imageUrl, label: "Photo" }];

  // Helper function to get contextual tag
  const getContextualTag = (): string | null => {
    if (restaurant.healthyOptions) return "Healthy";
    if (restaurant.servesAlcohol) return "Bar";
    if (restaurant.quickService) return "Casual";
    // Stub "Late Night" for demo purposes - could check hours in production
    if (restaurant.id % 5 === 0) return "Late Night";
    return null;
  };

  // Helper function to extract primary cuisine type
  const getPrimaryCuisine = (): string => {
    // Take first part before comma if cuisine has multiple types
    return restaurant.cuisine.split(',')[0].trim();
  };

  // Helper function to format price tier
  const getPriceTier = (): string => {
    return "$".repeat(restaurant.priceLevel);
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100;
    if (Math.abs(info.offset.x) > threshold) {
      onSwipe(info.offset.x > 0 ? "right" : "left");
    }
  };

  const handlePreviousPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentPhotoIndex((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handlePhotoAreaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Determine if click was on left or right side
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const halfWidth = rect.width / 2;
    
    if (clickX < halfWidth) {
      handlePreviousPhoto(e);
    } else {
      handleNextPhoto(e);
    }
  };

  return (
    <motion.div
      style={{
        x,
        rotate,
        opacity,
        ...style,
      }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      className="absolute w-full h-full cursor-grab active:cursor-grabbing"
    >
      <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-md">
        <div
          className="absolute inset-0 bg-gray-200 cursor-pointer"
          onClick={handlePhotoAreaClick}
        >
          <img
            src={photos[currentPhotoIndex].url}
            alt={`${restaurant.name} - ${photos[currentPhotoIndex].label}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

          <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 text-white text-xs rounded-full backdrop-blur-sm">
            {photos[currentPhotoIndex].label}
          </div>

          {photos.length > 1 && (
            <>
              <button
                onClick={handlePreviousPhoto}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg z-10"
              >
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
              <button
                onClick={handleNextPhoto}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg z-10"
              >
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {photos.map((_, index) => (
                  <span
                    key={index}
                    className={`h-1 rounded-full ${
                      index === currentPhotoIndex ? "w-5 bg-white" : "w-1.5 bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-10 text-white z-10 pointer-events-none">
          <h2 className="text-2xl font-semibold leading-tight drop-shadow-sm">{restaurant.name}</h2>
          <div className="mt-1 flex items-center gap-1 text-sm">
            <span className="text-yellow-400">★</span>
            <span className="font-medium">{restaurant.rating.toFixed(1)}</span>
            <span className="text-white/80">
              · {getPrimaryCuisine()} · {getPriceTier()} · {restaurant.distance}
            </span>
          </div>
          {restaurant.popularItems && restaurant.popularItems.length > 0 && (
            <p className="mt-1 text-sm text-white/85 truncate">
              {restaurant.popularItems.slice(0, 3).join(" · ")}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            {restaurant.healthyOptions && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                <Leaf className="w-3 h-3" /> Healthy
              </span>
            )}
            {restaurant.servesAlcohol && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                <Wine className="w-3 h-3" /> Bar
              </span>
            )}
            {getContextualTag() && (
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs">{getContextualTag()}</span>
            )}
          </div>
        </div>

        {/* Swipe Direction Indicators - Left Arrow */}
        <motion.div
          style={{
            opacity: useTransform(x, [-150, 0], [1, 0]),
          }}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-white/95 px-3 py-2 rounded-lg shadow-lg border-2 border-red-400"
        >
          <X className="w-6 h-6 text-red-500" />
          <span className="text-[10px] text-red-500 whitespace-nowrap">Not Interested</span>
        </motion.div>

        {/* Swipe Direction Indicators - Right Arrow */}
        <motion.div
          style={{
            opacity: useTransform(x, [0, 150], [0, 1]),
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-white/95 px-3 py-2 rounded-lg shadow-lg border-2 border-green-400"
        >
          <Heart className="w-6 h-6 text-green-500" />
          <span className="text-[10px] text-green-500 whitespace-nowrap">Would Eat</span>
        </motion.div>
      </div>
    </motion.div>
  );
}