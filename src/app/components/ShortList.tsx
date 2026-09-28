import { MapPin, ArrowLeft } from "lucide-react";
import { Restaurant } from "./SwipeCard";

interface ShortListProps {
  restaurants: Restaurant[];
  onDone: () => void;
  onBack?: () => void;
}

export function ShortList({ restaurants, onDone, onBack }: ShortListProps) {
  return (
    <div className="w-full h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="px-5 py-6 border-b border-gray-200">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        <h1 className="text-2xl">Saved Restaurants</h1>
        <p className="text-sm text-gray-600 mt-1">
          {restaurants.length} {restaurants.length === 1 ? "place" : "places"} saved
        </p>
      </div>

      {/* Restaurant List */}
      <div className="flex-1 overflow-auto px-5 py-5">
        {restaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No restaurants saved yet.</p>
            <p className="text-gray-400 text-sm mt-2">Swipe right on restaurants you like!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <div
                key={restaurant.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="flex gap-4">
                  {/* Thumbnail Photo */}
                  <div className="w-24 h-24 bg-gray-200 flex-shrink-0">
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 py-3 pr-4 space-y-2">
                    {/* Name */}
                    <h3 className="text-base">{restaurant.name}</h3>
                    
                    {/* Cuisine */}
                    <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
                    
                    {/* Price & Distance */}
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <span>{"$".repeat(restaurant.priceLevel)}</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{restaurant.distance}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Button */}
      {restaurants.length > 0 && (
        <div className="px-5 py-5 border-t border-gray-200">
          <button
            onClick={onDone}
            className="w-full h-12 bg-black text-white rounded-lg"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}