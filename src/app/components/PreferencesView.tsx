import { X, TrendingUp, TrendingDown } from "lucide-react";
import { LearnedPreferences } from "../utils/preferenceLearning";

interface PreferencesViewProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: LearnedPreferences;
  onClearLearning: () => void;
}

export function PreferencesView({
  isOpen,
  onClose,
  preferences,
  onClearLearning,
}: PreferencesViewProps) {
  if (!isOpen) return null;

  const topCuisines = Object.entries(preferences.cuisineScores)
    .filter(([, data]) => data.score > 0)
    .sort(([, a], [, b]) => b.score - a.score)
    .slice(0, 5);

  const dislikedCuisines = Object.entries(preferences.cuisineScores)
    .filter(([, data]) => data.score < 0)
    .sort(([, a], [, b]) => a.score - b.score)
    .slice(0, 3);

  const topPrices = Object.entries(preferences.priceScores)
    .filter(([, data]) => data.score > 0)
    .sort(([, a], [, b]) => b.score - a.score);

  const formatScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  const getPriceLabel = (price: string) => {
    const priceNum = parseInt(price);
    return "$".repeat(priceNum);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div
        className="w-full bg-white rounded-t-3xl max-h-[85vh] overflow-y-auto"
        style={{
          animation: "slideUp 0.3s ease-out",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg">Your Preferences</h2>
          <button onClick={onClose} className="p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-6 space-y-6">
          {/* Stats Summary */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Swipe Summary</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-2xl font-semibold">{preferences.totalSwipes}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-green-600">{preferences.rightSwipes}</div>
                <div className="text-xs text-gray-600">Liked</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-red-600">{preferences.leftSwipes}</div>
                <div className="text-xs text-gray-600">Passed</div>
              </div>
            </div>
          </div>

          {/* Top Cuisines */}
          {topCuisines.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <h3 className="text-sm font-medium">You Love</h3>
              </div>
              <div className="space-y-2">
                {topCuisines.map(([cuisine, data]) => (
                  <div key={cuisine} className="flex items-center justify-between bg-green-50 rounded-lg px-3 py-2">
                    <span className="text-sm">{cuisine}</span>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-600">
                        {data.likes} / {data.likes + data.dislikes}
                      </div>
                      <span className="text-xs font-medium text-green-700">
                        {formatScore(data.score)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disliked Cuisines */}
          {dislikedCuisines.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <h3 className="text-sm font-medium">You Avoid</h3>
              </div>
              <div className="space-y-2">
                {dislikedCuisines.map(([cuisine, data]) => (
                  <div key={cuisine} className="flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                    <span className="text-sm">{cuisine}</span>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-600">
                        {data.dislikes} / {data.likes + data.dislikes}
                      </div>
                      <span className="text-xs font-medium text-red-700">
                        {formatScore(Math.abs(data.score))}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Price Preferences */}
          {topPrices.length > 0 && (
            <div>
              <h3 className="text-sm font-medium mb-3">Price Preference</h3>
              <div className="space-y-2">
                {topPrices.map(([price, data]) => (
                  <div key={price} className="flex items-center justify-between bg-purple-50 rounded-lg px-3 py-2">
                    <span className="text-sm">{getPriceLabel(price)}</span>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-600">
                        {data.likes} / {data.likes + data.dislikes}
                      </div>
                      <span className="text-xs font-medium text-purple-700">
                        {formatScore(data.score)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Healthy & Alcohol Preferences */}
          <div className="grid grid-cols-2 gap-3">
            {preferences.healthyScore.likes + preferences.healthyScore.dislikes > 0 && (
              <div className={`rounded-lg p-3 ${
                preferences.healthyScore.score > 0 ? "bg-green-50" : "bg-gray-50"
              }`}>
                <div className="text-xs text-gray-600 mb-1">Healthy Options</div>
                <div className={`text-lg font-semibold ${
                  preferences.healthyScore.score > 0 ? "text-green-700" : "text-gray-700"
                }`}>
                  {formatScore(Math.abs(preferences.healthyScore.score))}
                </div>
                <div className="text-xs text-gray-500">
                  {preferences.healthyScore.likes} liked
                </div>
              </div>
            )}

            {preferences.alcoholScore.likes + preferences.alcoholScore.dislikes > 0 && (
              <div className={`rounded-lg p-3 ${
                preferences.alcoholScore.score > 0 ? "bg-purple-50" : "bg-gray-50"
              }`}>
                <div className="text-xs text-gray-600 mb-1">Bars/Alcohol</div>
                <div className={`text-lg font-semibold ${
                  preferences.alcoholScore.score > 0 ? "text-purple-700" : "text-gray-700"
                }`}>
                  {formatScore(Math.abs(preferences.alcoholScore.score))}
                </div>
                <div className="text-xs text-gray-500">
                  {preferences.alcoholScore.likes} liked
                </div>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-sm text-blue-900">
              <strong>How it works:</strong> The algorithm learns from your swipes and reorders
              upcoming restaurants to show you the most relevant options first.
            </div>
          </div>

          {/* Clear Learning Button */}
          <button
            onClick={() => {
              if (confirm("Reset all learning data? This cannot be undone.")) {
                onClearLearning();
                onClose();
              }
            }}
            className="w-full py-3 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Reset Learning Data
          </button>
        </div>
      </div>
    </div>
  );
}
