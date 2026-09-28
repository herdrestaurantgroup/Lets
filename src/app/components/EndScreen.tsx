import { useState } from "react";
import { MapPin } from "lucide-react";
import { Restaurant } from "./SwipeCard";

interface EndScreenProps {
  restaurants: Restaurant[];
  onStartNew: () => void;
}

export function EndScreen({ restaurants, onStartNew }: EndScreenProps) {
  const [pickedId, setPickedId] = useState<number | null>(
    restaurants.length === 1 ? restaurants[0].id : null
  );
  const picked = restaurants.find((r) => r.id === pickedId) ?? null;

  const openMaps = (restaurant: Restaurant) => {
    const url =
      restaurant.mapsUrl ||
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="w-full h-screen bg-white flex flex-col">
      <div className="px-5 py-6 border-b border-gray-200">
        <h1 className="text-2xl">Your Top Picks</h1>
        <p className="text-sm text-gray-600 mt-1">
          {restaurants.length > 0
            ? "Tap one place — that’s dinner."
            : "No restaurants selected"}
        </p>
      </div>

      <div className="flex-1 overflow-auto px-5 py-5">
        {restaurants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">You didn't save any restaurants.</p>
            <p className="text-gray-400 text-sm mt-2">Start a new session to find places to eat!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {restaurants.map((restaurant) => {
              const selected = pickedId === restaurant.id;
              return (
                <button
                  key={restaurant.id}
                  type="button"
                  onClick={() => setPickedId(restaurant.id)}
                  className={`w-full text-left bg-white border rounded-lg overflow-hidden ${
                    selected ? "border-black ring-2 ring-black" : "border-gray-200"
                  }`}
                >
                  <div className="w-full h-48 bg-gray-200">
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="text-lg">{restaurant.name}</h3>
                    <p className="text-sm text-gray-600">{restaurant.cuisine}</p>
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                      <span>{"$".repeat(restaurant.priceLevel)}</span>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{restaurant.distance}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-5 py-5 border-t border-gray-200 space-y-3">
        {picked && (
          <button
            className="w-full h-12 bg-black text-white rounded-lg"
            onClick={() => openMaps(picked)}
          >
            Go to {picked.name}
          </button>
        )}
        {restaurants.length > 0 && !picked && (
          <p className="text-center text-sm text-gray-500">Select a restaurant first</p>
        )}
        <button
          onClick={onStartNew}
          className="w-full h-12 bg-white text-black border-2 border-gray-300 rounded-lg"
        >
          Start New Session
        </button>
      </div>
    </div>
  );
}
