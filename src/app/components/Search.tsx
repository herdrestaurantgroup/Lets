import { useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { Restaurant } from "./SwipeCard";
import { RestaurantDetail } from "./RestaurantDetail";

interface SearchProps {
  restaurants: Restaurant[];
  onClose: () => void;
  onAddToSaved: (restaurant: Restaurant) => void;
  onSwipeOnThis: (restaurant: Restaurant) => void;
  savedRestaurants: Restaurant[];
}

export function Search({
  restaurants,
  onClose,
  onAddToSaved,
  onSwipeOnThis,
  savedRestaurants,
}: SearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);

  // Filter restaurants based on search query
  const searchResults = searchQuery.trim()
    ? restaurants.filter((restaurant) =>
        restaurant.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleRestaurantClick = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
  };

  const handleCloseDetail = () => {
    setSelectedRestaurant(null);
  };

  const handleAddToSaved = (restaurant: Restaurant) => {
    onAddToSaved(restaurant);
    setSelectedRestaurant(null);
  };

  const handleSwipeOnThis = (restaurant: Restaurant) => {
    onSwipeOnThis(restaurant);
    setSelectedRestaurant(null);
    onClose();
  };

  const isRestaurantSaved = (restaurant: Restaurant) => {
    return savedRestaurants.some((r) => r.id === restaurant.id);
  };

  return (
    <>
      <div className="fixed inset-0 bg-white z-40 flex flex-col">
        <div className="w-full max-w-[390px] mx-auto h-screen flex flex-col">
          {/* Header */}
          <div className="px-5 py-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="text-xl">Search Restaurants</h1>
            </div>

            {/* Search Input */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-11 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                autoFocus
              />
            </div>
          </div>

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {searchQuery.trim() === "" ? (
              <div className="text-center py-12 text-gray-500">
                <SearchIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Start typing to search restaurants</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No restaurants found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    onClick={() => handleRestaurantClick(restaurant)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-400 transition-colors text-left"
                  >
                    <div className="flex gap-3">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        <img
                          src={restaurant.imageUrl}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base mb-1 truncate">{restaurant.name}</h3>
                        
                        {/* Google Rating */}
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-yellow-500 text-xs">★</span>
                          <span className="text-xs font-medium text-gray-900">{restaurant.rating.toFixed(1)}</span>
                        </div>
                        
                        {/* Info Row - Same as SwipeCard */}
                        <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
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
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Restaurant Detail Modal */}
      {selectedRestaurant && (
        <RestaurantDetail
          restaurant={selectedRestaurant}
          onClose={handleCloseDetail}
          onAddToSaved={handleAddToSaved}
          onSwipeOnThis={handleSwipeOnThis}
          isAlreadySaved={isRestaurantSaved(selectedRestaurant)}
        />
      )}
    </>
  );
}