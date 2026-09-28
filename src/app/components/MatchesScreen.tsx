import { useEffect, useState } from "react";
import { Heart, MapPin, Clock } from "lucide-react";
import { Restaurant } from "./SwipeCard";
import { projectId, publicAnonKey } from "../../../utils/supabase/info";
import { getMatchesForUser } from "../data/localMatches";

interface Match {
  id: string;
  user1Id: string;
  user2Id: string;
  restaurantId: number;
  createdAt: string;
}

interface User {
  id: string;
  name: string;
}

interface MatchesScreenProps {
  currentUserId: string;
  restaurants: Restaurant[];
  users: User[];
}

export function MatchesScreen({ currentUserId, restaurants, users }: MatchesScreenProps) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, [currentUserId]);

  const fetchMatches = async () => {
    const local = getMatchesForUser(currentUserId);
    setMatches(local);
    setLoading(false);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-b503081b/matches/${currentUserId}`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      const remote = (data.matches || []) as Match[];
      const byId = new Map<string, Match>();
      [...local, ...remote].forEach((m) => byId.set(m.id, m));
      setMatches(Array.from(byId.values()));
    } catch (error) {
      console.error("Error fetching matches:", error);
    }
  };

  const getOtherUserId = (match: Match) => {
    return match.user1Id === currentUserId ? match.user2Id : match.user1Id;
  };

  const getOtherUserName = (match: Match) => {
    const otherUserId = getOtherUserId(match);
    const user = users.find(u => u.id === otherUserId);
    return user?.name || "Unknown User";
  };

  const getRestaurant = (restaurantId: number) => {
    return restaurants.find(r => r.id === restaurantId);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-5">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-2xl mb-2 text-gray-900">No matches yet</h2>
          <p className="text-gray-600">
            Start swiping to find restaurants you and your friends both want to try!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-5">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl mb-2">Matches</h1>
          <p className="text-gray-600">{matches.length} restaurant{matches.length !== 1 ? 's' : ''} you both want to try</p>
        </div>

        {/* Matches List */}
        <div className="space-y-4">
          {matches.map((match) => {
            const restaurant = getRestaurant(match.restaurantId);
            const otherUserName = getOtherUserName(match);

            if (!restaurant) return null;

            return (
              <div
                key={match.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="flex gap-4 p-4">
                  {/* Restaurant Image */}
                  <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Restaurant Name */}
                    <h3 className="font-medium text-gray-900 mb-1 truncate">
                      {restaurant.name}
                    </h3>

                    {/* Cuisine */}
                    <p className="text-sm text-gray-600 mb-2 truncate">
                      {restaurant.cuisine}
                    </p>

                    {/* Matched with */}
                    <div className="flex items-center gap-1 mb-2">
                      <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                      <span className="text-sm text-gray-700">
                        Matched with <span className="font-medium">{otherUserName}</span>
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{restaurant.distance}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>{"$".repeat(restaurant.priceLevel)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(match.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}