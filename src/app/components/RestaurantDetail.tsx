import { X, Heart, ArrowRight } from "lucide-react";
import { Restaurant } from "./SwipeCard";

interface RestaurantDetailProps {
  restaurant: Restaurant;
  onClose: () => void;
  onAddToSaved: (restaurant: Restaurant) => void;
  onSwipeOnThis: (restaurant: Restaurant) => void;
  isAlreadySaved: boolean;
}

export function RestaurantDetail({
  restaurant,
  onClose,
  onAddToSaved,
  onSwipeOnThis,
  isAlreadySaved,
}: RestaurantDetailProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-[390px] bg-white rounded-2xl overflow-hidden shadow-xl">
        {/* Header with Close Button */}
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md z-10"
          >
            <X className="w-5 h-5 text-gray-700" />
          </button>
          
          {/* Restaurant Image */}
          <div className="w-full h-64 bg-gray-200">
            <img
              src={restaurant.imageUrl}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-2xl mb-2">{restaurant.name}</h2>
            
            {/* Google Rating */}
            <div className="flex items-center gap-1 mb-3">
              <span className="text-yellow-500">★</span>
              <span className="text-sm font-medium text-gray-900">{restaurant.rating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">Google rating</span>
            </div>

            {/* Description */}
            {restaurant.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-3">
                {restaurant.description}
              </p>
            )}
            
            {/* Info Row */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>{restaurant.cuisine.split(",")[0]}</span>
              <span>•</span>
              <span>{"$".repeat(restaurant.priceLevel)}</span>
              <span>•</span>
              <span>{restaurant.distance}</span>
              {restaurant.healthyOptions && (
                <>
                  <span>•</span>
                  <span className="text-green-600">Health</span>
                </>
              )}
              {restaurant.servesAlcohol && (
                <>
                  <span>•</span>
                  <span className="text-purple-600">Bar</span>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            {/* Add to Saved Button */}
            <button
              onClick={() => onAddToSaved(restaurant)}
              disabled={isAlreadySaved}
              className={`w-full h-12 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                isAlreadySaved
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-black text-white hover:bg-gray-800"
              }`}
            >
              <Heart className={`w-5 h-5 ${isAlreadySaved ? "" : "fill-white"}`} />
              {isAlreadySaved ? "Already Saved" : "Add to Saved"}
            </button>

            {/* Swipe on This Restaurant Button */}
            <button
              onClick={() => onSwipeOnThis(restaurant)}
              className="w-full h-12 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:border-gray-400 transition-colors"
            >
              <span className="text-gray-700">Swipe on This Restaurant</span>
              <ArrowRight className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}