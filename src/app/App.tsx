import { useState, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LocationPermission } from "./components/LocationPermission";
import { SwipeCard, Restaurant } from "./components/SwipeCard";
import { mockRestaurants as fallbackRestaurants } from "./data/mockRestaurants";
import { fetchNearbyRestaurants, type UserLocation } from "./data/places";
import {
  DEFAULT_USERS,
  recordLocalSwipe,
  undoLocalSwipe,
  getMatchesForUser,
} from "./data/localMatches";
import { onAuth } from "./data/auth";
import { createInvite, joinInvite, recordSessionSwipe } from "./data/friendSession";
import { AccountBar } from "./components/AccountBar";
import { ShortList } from "./components/ShortList";
import { EndScreen } from "./components/EndScreen";
import { FilterPanel } from "./components/FilterPanel";
import { Survey, SurveyPreferences } from "./components/Survey";
import { MatchModal } from "./components/MatchModal";
import { MatchesScreen } from "./components/MatchesScreen";
import { Search } from "./components/Search";
import { Heart, X, List, SlidersHorizontal, Users, Undo, Search as SearchIcon } from "lucide-react";
import { PreferenceLearning } from "./utils/preferenceLearning";
import { projectId, publicAnonKey } from "../../utils/supabase/info";

// Helper function to assign filter category based on cuisine
function getFilterCategory(cuisine: string): string {
  const cuisineLower = cuisine.toLowerCase();
  
  // BBQ
  if (cuisineLower.includes('bbq')) {
    return 'BBQ';
  }
  
  // Italian / Pizza
  if (cuisineLower.includes('italian') || 
      cuisineLower.includes('pizza') || 
      cuisineLower.includes('pasta')) {
    return 'Italian / Pizza';
  }
  
  // Asian & Sushi
  if (cuisineLower.includes('sushi') || 
      cuisineLower.includes('japanese') || 
      cuisineLower.includes('poke') || 
      cuisineLower.includes('asian') ||
      cuisineLower.includes('noodle') || 
      cuisineLower.includes('chinese') ||
      cuisineLower.includes('hawaiian')) {
    return 'Asian & Sushi';
  }
  
  // Mexican
  if (cuisineLower.includes('mexican') || 
      cuisineLower.includes('torta') || 
      cuisineLower.includes('taco')) {
    return 'Mexican';
  }
  
  // Brunch / Breakfast & Cafe
  if (cuisineLower.includes('brunch') || 
      cuisineLower.includes('breakfast') || 
      cuisineLower.includes('bagel') || 
      cuisineLower.includes('cafe') || 
      cuisineLower.includes('bakery') || 
      cuisineLower.includes('diner')) {
    return 'Brunch / Breakfast & Cafe';
  }
  
  // Vegan / Healthy
  if (cuisineLower.includes('vegan') || 
      cuisineLower.includes('health')) {
    return 'Vegan / Healthy';
  }
  
  // Seafood
  if (cuisineLower.includes('seafood') || 
      cuisineLower.includes('oyster')) {
    return 'Seafood';
  }
  
  // Fine Dining / Contemporary
  if (cuisineLower.includes('wine bar') || 
      cuisineLower.includes('small plates') || 
      cuisineLower.includes('contemporary') || 
      cuisineLower.includes('fine dining') || 
      cuisineLower.includes('modern')) {
    return 'Fine Dining / Contemporary';
  }
  
  // Mediterranean & Spanish
  if (cuisineLower.includes('mediterranean') || 
      cuisineLower.includes('moroccan') || 
      cuisineLower.includes('spanish') || 
      cuisineLower.includes('tapas')) {
    return 'Mediterranean & Spanish';
  }
  
  // Indian
  if (cuisineLower.includes('indian') || 
      cuisineLower.includes('curry')) {
    return 'Indian';
  }
  
  // Ethiopian / African
  if (cuisineLower.includes('ethiopian') || 
      cuisineLower.includes('african')) {
    return 'Ethiopian / African';
  }
  
  // French
  if (cuisineLower.includes('french')) {
    return 'French';
  }
  
  // Dessert
  if (cuisineLower.includes('dessert') || 
      cuisineLower.includes('cheesecake')) {
    return 'Dessert';
  }
  
  // American / Southern (catch-all for American, Southern, Soul Food, Burgers, etc.)
  if (cuisineLower.includes('american') || 
      cuisineLower.includes('southern') || 
      cuisineLower.includes('soul food') || 
      cuisineLower.includes('burger') || 
      cuisineLower.includes('gastropub') || 
      cuisineLower.includes('sandwich') || 
      cuisineLower.includes('steakhouse') || 
      cuisineLower.includes('farm-to-table') || 
      cuisineLower.includes('fried chicken') ||
      cuisineLower.includes('deli')) {
    return 'American / Southern';
  }
  
  // Default fallback - return empty string to exclude from filters
  return '';
}

type Screen = "permission" | "survey" | "swipe" | "shortlist" | "end" | "matches";

interface User {
  id: string;
  name: string;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("permission");
  const [surveyPreferences, setSurveyPreferences] = useState<SurveyPreferences | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(fallbackRestaurants);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [deckSource, setDeckSource] = useState<"places" | "mock">("mock");
  const [isLoadingDeck, setIsLoadingDeck] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedRestaurants, setLikedRestaurants] = useState<Restaurant[]>(() => {
    try {
      const raw = localStorage.getItem("grubbr.likes");
      return raw ? (JSON.parse(raw) as Restaurant[]) : [];
    } catch {
      return [];
    }
  });
  const [direction, setDirection] = useState<"left" | "right" | null>(null);
  const [swipeHistory, setSwipeHistory] = useState<Array<{
    restaurant: Restaurant;
    direction: "left" | "right";
    index: number;
  }>>([]);
  
  // Multi-user state
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [currentUserId, setCurrentUserId] = useState<string>("user:1");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [currentMatch, setCurrentMatch] = useState<{
    restaurant: Restaurant;
    otherUserName: string;
  } | null>(null);
  
  // Filter state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedFoodTypes, setSelectedFoodTypes] = useState<string[]>([]);
  const [selectedPrices, setSelectedPrices] = useState<number[]>([]);
  const [selectedDietary, setSelectedDietary] = useState<string[]>([]);
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  
  // Preference learning (runs silently in background)
  const learningRef = useRef<PreferenceLearning>(new PreferenceLearning());
  const [isLearningEnabled, setIsLearningEnabled] = useState(true);
  
  // Initialize users on mount
  useEffect(() => {
    const initUsers = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b503081b/init`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const remote = (data.users || []) as User[];
          if (remote.length > 0) {
            const byId = new Map(DEFAULT_USERS.map((u) => [u.id, u]));
            remote.forEach((u) => byId.set(u.id, u));
            setUsers(Array.from(byId.values()));
          }
        }
      } catch (error) {
        console.error("Error initializing users:", error);
      }
    };
    
    initUsers();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("grubbr.likes", JSON.stringify(likedRestaurants));
    } catch {
      // ignore private mode
    }
  }, [likedRestaurants]);

  useEffect(() => {
    return onAuth((session) => {
      const user = session?.user;
      if (!user) {
        setAccountName(null);
        setAccountId(null);
        return;
      }
      const name = user.user_metadata?.full_name || user.email || "You";
      setAccountName(name);
      setAccountId(user.id);
      const join = new URLSearchParams(window.location.search).get("join");
      if (join) joinInvite(join, user.id, name).then(() => setSessionCode(join)).catch(console.error);
    });
  }, []);

  const handleInvite = async () => {
    if (!accountId || !accountName) return;
    if (sessionCode) {
      await navigator.clipboard.writeText(`${window.location.origin}/?join=${sessionCode}`);
      alert("Invite link copied");
      return;
    }
    const id = await createInvite(accountId, accountName);
    setSessionCode(id);
    await navigator.clipboard.writeText(`${window.location.origin}/?join=${id}`);
    alert("Invite link copied");
  };
  
  // Extract unique food type categories from all restaurants (data-driven)
  const availableFoodTypes = useMemo(() => {
    const categorySet = new Set<string>();
    restaurants.forEach((restaurant) => {
      const category = getFilterCategory(restaurant.cuisine);
      if (category) { // Only add non-empty categories
        categorySet.add(category);
      }
    });
    return Array.from(categorySet).sort();
  }, [restaurants]);

  // Filter restaurants based on survey preferences and selected filters
  const filteredRestaurants = useMemo(() => {
    let filtered = restaurants;

    // Filter by survey preferences
    if (surveyPreferences) {
      // Filter by meal time
      if (surveyPreferences.mealTime !== "any") {
        filtered = filtered.filter((restaurant) => {
          // Default: breakfast places are bagels/bakery, lunch/dinner is everyone else
          if (!restaurant.mealTimes) {
            const isBreakfastPlace = restaurant.cuisine.toLowerCase().includes("breakfast") ||
                                     restaurant.cuisine.toLowerCase().includes("bagel") ||
                                     restaurant.cuisine.toLowerCase().includes("bakery");
            if (surveyPreferences.mealTime === "breakfast") {
              return isBreakfastPlace;
            }
            return !isBreakfastPlace; // Lunch/dinner includes all non-breakfast places
          }
          return restaurant.mealTimes.includes(surveyPreferences.mealTime as any);
        });
      }

      // Filter by dining style - if not specified, assume most places offer both
      if (surveyPreferences.diningStyle !== "any") {
        filtered = filtered.filter((restaurant) => {
          if (!restaurant.diningOptions) return true; // Default: both options available
          return restaurant.diningOptions.includes(surveyPreferences.diningStyle as any);
        });
      }

      // Filter by meal pace - default based on price level
      if (surveyPreferences.mealPace === "quick") {
        filtered = filtered.filter((restaurant) => {
          if (restaurant.quickService !== undefined) {
            return restaurant.quickService === true;
          }
          // Default: price level 1-2 are typically quick service
          return restaurant.priceLevel <= 2;
        });
      } else if (surveyPreferences.mealPace === "sit-down") {
        filtered = filtered.filter((restaurant) => {
          if (restaurant.quickService !== undefined) {
            return restaurant.quickService !== true;
          }
          // Default: price level 3-4 are typically sit-down
          return restaurant.priceLevel >= 2;
        });
      }

      // Filter by budget
      if (surveyPreferences.budget) {
        filtered = filtered.filter(
          (restaurant) => restaurant.priceLevel === surveyPreferences.budget
        );
      }
    }

    // Filter by dietary preferences - Show only restaurants with ALL selected dietary options
    if (selectedDietary.length > 0) {
      filtered = filtered.filter((restaurant) => {
        if (!restaurant.dietaryOptions) return false;
        // Restaurant must have ALL selected dietary options
        return selectedDietary.every((dietary) =>
          restaurant.dietaryOptions!.includes(dietary)
        );
      });
    }

    // Filter by food type category
    if (selectedFoodTypes.length > 0) {
      filtered = filtered.filter((restaurant) => {
        const category = getFilterCategory(restaurant.cuisine);
        return selectedFoodTypes.includes(category);
      });
    }

    // Filter by price
    if (selectedPrices.length > 0) {
      filtered = filtered.filter((restaurant) =>
        selectedPrices.includes(restaurant.priceLevel)
      );
    }

    // Apply preference learning sorting if enabled and enough data
    if (isLearningEnabled && learningRef.current.hasEnoughData()) {
      filtered = learningRef.current.sortRestaurants(filtered);
    }

    return filtered;
  }, [restaurants, surveyPreferences, selectedFoodTypes, selectedPrices, selectedDietary, isLearningEnabled]);

  const currentRestaurant = filteredRestaurants[currentIndex];
  const hasMoreCards = currentIndex < filteredRestaurants.length;
  const activeFilterCount = 
    selectedFoodTypes.length + 
    selectedPrices.length + 
    selectedDietary.length;

  const loadDeck = async (useDeviceLocation: boolean) => {
    setIsLoadingDeck(true);
    try {
      const result = await fetchNearbyRestaurants({ useDeviceLocation });
      setRestaurants(result.restaurants);
      setUserLocation(result.location);
      setDeckSource(result.source);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Error loading nearby restaurants:", error);
      setRestaurants(fallbackRestaurants);
      setDeckSource("mock");
    } finally {
      setIsLoadingDeck(false);
    }
  };

  const handleLocationAllow = () => {
    void loadDeck(true);
    setCurrentScreen("survey");
  };

  const handleLocationSkip = () => {
    void loadDeck(false);
    setCurrentScreen("survey");
  };

  const handleSurveyComplete = (preferences: SurveyPreferences) => {
    setSurveyPreferences(preferences);
    setCurrentScreen("swipe");
  };

  const handleSwipe = async (swipeDirection: "left" | "right") => {
    setDirection(swipeDirection);
    
    // Record swipe in history
    if (currentRestaurant) {
      setSwipeHistory(prev => [...prev, {
        restaurant: currentRestaurant,
        direction: swipeDirection,
        index: currentIndex,
      }]);
    }
    
    // Record swipe in learning system
    if (currentRestaurant && isLearningEnabled) {
      learningRef.current.recordSwipe(currentRestaurant, swipeDirection);
    }
    
    if (swipeDirection === "right" && currentRestaurant) {
      setLikedRestaurants((prev) => [...prev, currentRestaurant]);

      const localMatch = recordLocalSwipe(currentUserId, currentRestaurant.id, "like");
      if (sessionCode && accountId) {
        recordSessionSwipe(sessionCode, accountId, currentRestaurant.id, "like").then((remote) => {
          if (remote) {
            setCurrentMatch({ restaurant: currentRestaurant, otherUserName: remote.otherName });
            setMatchModalOpen(true);
          }
        }).catch(console.error);
      }
      if (localMatch) {
        const otherUserId =
          localMatch.user1Id === currentUserId ? localMatch.user2Id : localMatch.user1Id;
        const otherUser = users.find((u) => u.id === otherUserId);
        setCurrentMatch({
          restaurant: currentRestaurant,
          otherUserName: otherUser?.name || "a friend",
        });
        setMatchModalOpen(true);
      }
      
      // Best-effort remote sync; local match already happened
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b503081b/swipe`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              userId: currentUserId,
              restaurantId: currentRestaurant.id,
              direction: "like",
            }),
          }
        );
      } catch (error) {
        console.error("Error recording swipe:", error);
      }
    } else if (swipeDirection === "left" && currentRestaurant) {
      recordLocalSwipe(currentUserId, currentRestaurant.id, "dislike");
      // Record dislike
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b503081b/swipe`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              userId: currentUserId,
              restaurantId: currentRestaurant.id,
              direction: "dislike",
            }),
          }
        );
      } catch (error) {
        console.error("Error recording dislike:", error);
      }
    }

    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setDirection(null);
      
      // If we've gone through all cards, show end screen
      if (nextIndex >= filteredRestaurants.length) {
        setTimeout(() => {
          setCurrentScreen("end");
        }, 400);
      }
    }, 300);
  };

  const handleButtonSwipe = (swipeDirection: "left" | "right") => {
    if (hasMoreCards) {
      handleSwipe(swipeDirection);
    }
  };

  const handleUndo = async () => {
    if (swipeHistory.length === 0) return;
    
    // Get the last swipe from history
    const lastSwipe = swipeHistory[swipeHistory.length - 1];
    
    // Remove the last swipe from history
    setSwipeHistory(prev => prev.slice(0, -1));
    
    // If it was a right swipe, remove from liked restaurants
    if (lastSwipe.direction === "right") {
      setLikedRestaurants(prev => 
        prev.filter(r => r.id !== lastSwipe.restaurant.id)
      );
    }
    undoLocalSwipe(currentUserId, lastSwipe.restaurant.id);
    
    // Delete the swipe from the database
    try {
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b503081b/swipe`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            userId: currentUserId,
            restaurantId: lastSwipe.restaurant.id,
          }),
        }
      );
    } catch (error) {
      console.error("Error undoing swipe:", error);
    }
    
    // Go back to the previous card
    setCurrentIndex(lastSwipe.index);
    setDirection(null);
  };

  const handleShowShortList = () => {
    setCurrentScreen("shortlist");
  };

  const handleShortListDone = () => {
    setCurrentScreen("end");
  };

  const handleStartNew = () => {
    setCurrentIndex(0);
    setLikedRestaurants([]);
    setCurrentScreen("swipe");
    setDirection(null);
  };

  const handleFoodTypeToggle = (foodType: string) => {
    setSelectedFoodTypes((prev) =>
      prev.includes(foodType)
        ? prev.filter((c) => c !== foodType)
        : [...prev, foodType]
    );
  };

  const handlePriceToggle = (price: number) => {
    setSelectedPrices((prev) =>
      prev.includes(price) ? prev.filter((p) => p !== price) : [...prev, price]
    );
  };

  const handleDietaryToggle = (dietary: string) => {
    setSelectedDietary((prev) =>
      prev.includes(dietary)
        ? prev.filter((d) => d !== dietary)
        : [...prev, dietary]
    );
  };

  const handleClearFilters = () => {
    setSelectedFoodTypes([]);
    setSelectedPrices([]);
    setSelectedDietary([]);
  };

  const handleApplyFilters = () => {
    setShowFilterPanel(false);
    setCurrentIndex(0); // Reset to first card of filtered results
  };
  
  const handleCloseMatchModal = () => {
    setMatchModalOpen(false);
    setCurrentMatch(null);
  };
  
  const handleViewMatches = () => {
    setMatchModalOpen(false);
    setCurrentMatch(null);
    setCurrentScreen("matches");
  };
  
  const handleShowMatches = () => {
    setCurrentScreen("matches");
  };
  
  const handleBackToSwipe = () => {
    setCurrentScreen("swipe");
  };
  
  // Search handlers
  const handleShowSearch = () => {
    setShowSearch(true);
  };
  
  const handleCloseSearch = () => {
    setShowSearch(false);
  };
  
  const handleAddToSavedFromSearch = async (restaurant: Restaurant) => {
    // Check if already saved
    if (!likedRestaurants.some(r => r.id === restaurant.id)) {
      setLikedRestaurants(prev => [...prev, restaurant]);
      
      // Record in database as a like (without showing match modal from search)
      try {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-b503081b/swipe`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({
              userId: currentUserId,
              restaurantId: restaurant.id,
              direction: "like",
            }),
          }
        );
      } catch (error) {
        console.error("Error saving restaurant from search:", error);
      }
    }
  };
  
  const handleSwipeOnThisFromSearch = (restaurant: Restaurant) => {
    // Find the restaurant in the filtered deck
    const restaurantIndex = filteredRestaurants.findIndex(r => r.id === restaurant.id);
    
    if (restaurantIndex !== -1) {
      // Jump to this restaurant in the deck (even if already swiped, go back to it)
      setCurrentIndex(restaurantIndex);
      // Clear any direction state
      setDirection(null);
    } else {
      // Restaurant not in filtered deck - might be filtered out
      // Still jump to it by finding it in the full list
      const fullIndex = restaurants.findIndex(r => r.id === restaurant.id);
      if (fullIndex !== -1) {
        handleClearFilters();
        setTimeout(() => {
          const newIndex = restaurants.findIndex(r => r.id === restaurant.id);
          setCurrentIndex(newIndex);
        }, 100);
      }
    }
  };

  // Location Permission Screen
  if (currentScreen === "permission") {
    return (
      <LocationPermission onAllow={handleLocationAllow} onSkip={handleLocationSkip} />
    );
  }

  // Survey Screen
  if (currentScreen === "survey") {
    return <Survey onComplete={handleSurveyComplete} />;
  }

  // Saved List Screen
  if (currentScreen === "shortlist") {
    return (
      <ShortList 
        restaurants={likedRestaurants} 
        onDone={handleShortListDone}
        onBack={handleBackToSwipe}
      />
    );
  }

  // End Screen
  if (currentScreen === "end") {
    return (
      <EndScreen restaurants={likedRestaurants} onStartNew={handleStartNew} />
    );
  }
  
  // Matches Screen
  if (currentScreen === "matches") {
    return (
      <div className="w-full h-screen bg-white flex items-center justify-center">
        <div className="w-full max-w-[430px] h-screen bg-white flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-6 border-b border-gray-200">
            <button
              onClick={handleBackToSwipe}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Swipe
            </button>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <select
                value={currentUserId}
                onChange={(e) => setCurrentUserId(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <MatchesScreen
              currentUserId={currentUserId}
              restaurants={restaurants}
              users={users}
            />
          </div>
        </div>
      </div>
    );
  }

  // Swipe Card Screen (Main)
  return (
    <div className="w-full h-screen bg-white flex items-center justify-center">
      {/* iPhone 14 Frame - 390px × 844px */}
      <div className="w-full max-w-[430px] h-screen bg-white flex flex-col relative">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200">
          {/* User Selector */}
          <div className="flex items-center justify-between mb-3">
            <AccountBar name={accountName} sessionCode={sessionCode} onInvite={handleInvite} />
            
            <div className="flex items-center gap-2">
              {/* Search Button */}
              <button
                onClick={handleShowSearch}
                className="relative p-2 bg-white border border-gray-300 rounded-full"
              >
                <SearchIcon className="w-5 h-5" />
              </button>
              {/* Matches Button */}
              <button
                onClick={handleShowMatches}
                className="relative p-2 bg-white border border-gray-300 rounded-full"
              >
                <Heart className="w-5 h-5 text-pink-500" />
              </button>
              {/* Filter Button */}
              <button
                onClick={() => setShowFilterPanel(true)}
                className="relative p-2 bg-white border border-gray-300 rounded-full"
              >
                <SlidersHorizontal className="w-5 h-5" />
                {activeFilterCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </div>
                )}
              </button>
              {/* Saved List Button */}
              <button
                onClick={handleShowShortList}
                className="relative p-2 bg-white border border-gray-300 rounded-full"
              >
                <List className="w-5 h-5" />
                {likedRestaurants.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                    {likedRestaurants.length}
                  </div>
                )}
              </button>
            </div>
          </div>
          
          <div>
            <h1 className="text-xl">Find a Place <span className="text-xs text-gray-400 font-normal">v0.2</span></h1>
            <p className="text-sm text-gray-600">
              {isLoadingDeck
                ? "Finding places nearby…"
                : `${filteredRestaurants.length - currentIndex} nearby${userLocation?.source === "fallback" ? " · Memphis" : ""}${deckSource === "mock" ? "" : ""}`}
              {activeFilterCount > 0 && (
                <span className="text-blue-500"> • {activeFilterCount} filter{activeFilterCount !== 1 ? "s" : ""}</span>
              )}
            </p>
          </div>
        </div>

        {/* Card Stack Area - with 20px margin */}
        <div className="flex-1 min-h-0 px-5 pb-3">
          {filteredRestaurants.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center bg-white rounded-xl border border-gray-200">
              <div className="text-center px-8">
                <h2 className="text-xl mb-2">No restaurants found</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Try adjusting your filters
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 bg-black text-white rounded-lg text-sm"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {/* Background Cards for depth */}
              {currentIndex + 1 < filteredRestaurants.length && (
                <div
                  className="absolute w-full h-full bg-white rounded-xl shadow-sm border border-gray-200"
                  style={{ transform: "scale(0.96) translateY(8px)", zIndex: 1 }}
                />
              )}
              {currentIndex + 2 < filteredRestaurants.length && (
                <div
                  className="absolute w-full h-full bg-white rounded-xl shadow-sm border border-gray-200"
                  style={{ transform: "scale(0.92) translateY(16px)", zIndex: 0 }}
                />
              )}

              {/* Current Card */}
              <AnimatePresence mode="wait">
                {currentRestaurant && (
                  <motion.div
                    key={currentRestaurant.id}
                    initial={{ scale: 1, opacity: 1 }}
                    exit={{
                      x: direction === "left" ? -400 : direction === "right" ? 400 : 0,
                      opacity: 0,
                      transition: { duration: 0.3 },
                    }}
                    className="relative w-full h-full"
                    style={{ zIndex: 2 }}
                  >
                    <SwipeCard restaurant={currentRestaurant} onSwipe={handleSwipe} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {hasMoreCards && (
          <div className="flex items-center justify-center gap-8 py-4 flex-shrink-0">
            <button
              onClick={() => handleButtonSwipe("left")}
              className="w-14 h-14 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-red-400 transition-colors"
            >
              <X className="w-7 h-7 text-red-500" />
            </button>
            <button
              onClick={() => handleButtonSwipe("right")}
              className="w-16 h-16 bg-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors"
            >
              <Heart className="w-8 h-8 text-white" />
            </button>
          </div>
        )}
        
        {/* Undo Button - Bottom Left */}
        {hasMoreCards && (
          <button
            onClick={handleUndo}
            disabled={swipeHistory.length === 0}
            className={`fixed bottom-8 left-6 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
              swipeHistory.length > 0
                ? "bg-white border-2 border-gray-300 hover:border-gray-400 hover:scale-105"
                : "bg-gray-100 border-2 border-gray-200 opacity-40 cursor-not-allowed"
            }`}
          >
            <Undo className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Filter Panel */}
        <FilterPanel
          isOpen={showFilterPanel}
          onClose={() => setShowFilterPanel(false)}
          selectedFoodTypes={selectedFoodTypes}
          selectedPrices={selectedPrices}
          onFoodTypeToggle={handleFoodTypeToggle}
          onPriceToggle={handlePriceToggle}
          onClearAll={handleClearFilters}
          onApply={handleApplyFilters}
          availableFoodTypes={availableFoodTypes}
          selectedDietary={selectedDietary}
          onDietaryToggle={handleDietaryToggle}
        />
        
        {/* Match Modal */}
        <MatchModal
          isOpen={matchModalOpen}
          restaurant={currentMatch?.restaurant || null}
          currentUserName={users.find(u => u.id === currentUserId)?.name || "You"}
          matchedUserName={currentMatch?.otherUserName || ""}
          onClose={handleCloseMatchModal}
          onViewMatches={handleViewMatches}
        />
      </div>
      
      {/* Search Modal */}
      {showSearch && (
        <Search
          restaurants={restaurants}
          onClose={handleCloseSearch}
          onAddToSaved={handleAddToSavedFromSearch}
          onSwipeOnThis={handleSwipeOnThisFromSearch}
          savedRestaurants={likedRestaurants}
        />
      )}
    </div>
  );
}