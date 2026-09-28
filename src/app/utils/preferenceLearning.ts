import { Restaurant } from "../components/SwipeCard";

/**
 * PreferenceLearning - Algorithm-based learning system for restaurant preferences
 * 
 * HOW IT WORKS:
 * 1. Records every swipe (left/right) with restaurant attributes
 * 2. Calculates preference scores for cuisines, price levels, and features
 * 3. Scores range from -1 (strongly dislike) to +1 (strongly like)
 * 4. Sorts upcoming restaurants by predicted preference
 * 5. Stores all data in browser localStorage
 * 
 * SCORING ALGORITHM:
 * - Each restaurant gets a weighted score based on learned preferences
 * - Cuisine matches: 2.0x weight
 * - Price level matches: 1.5x weight  
 * - Healthy/alcohol features: 1.0x weight each
 * - Final score is normalized average of all applicable factors
 * 
 * PRIVACY:
 * - All data stored locally in browser
 * - No server communication
 * - User can clear history anytime
 */

export interface SwipeHistory {
  restaurantId: number;
  direction: "left" | "right";
  restaurant: {
    cuisine: string;
    priceLevel: number;
    healthyOptions?: boolean;
    servesAlcohol?: boolean;
    allergens?: string[];
    dietaryOptions?: string[];
  };
  timestamp: number;
}

export interface LearnedPreferences {
  cuisineScores: Record<string, { likes: number; dislikes: number; score: number }>;
  priceScores: Record<number, { likes: number; dislikes: number; score: number }>;
  healthyScore: { likes: number; dislikes: number; score: number };
  alcoholScore: { likes: number; dislikes: number; score: number };
  totalSwipes: number;
  rightSwipes: number;
  leftSwipes: number;
}

const STORAGE_KEY = "restaurant_swipe_history";
const PREFERENCES_KEY = "learned_preferences";

export class PreferenceLearning {
  private history: SwipeHistory[] = [];
  private preferences: LearnedPreferences;

  constructor() {
    this.loadHistory();
    this.preferences = this.calculatePreferences();
  }

  private loadHistory(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.history = JSON.parse(stored);
      } catch (e) {
        this.history = [];
      }
    }
  }

  private saveHistory(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
  }

  recordSwipe(restaurant: Restaurant, direction: "left" | "right"): void {
    const swipe: SwipeHistory = {
      restaurantId: restaurant.id,
      direction,
      restaurant: {
        cuisine: restaurant.cuisine,
        priceLevel: restaurant.priceLevel,
        healthyOptions: restaurant.healthyOptions,
        servesAlcohol: restaurant.servesAlcohol,
        allergens: restaurant.allergens,
        dietaryOptions: restaurant.dietaryOptions,
      },
      timestamp: Date.now(),
    };

    this.history.push(swipe);
    this.saveHistory();
    this.preferences = this.calculatePreferences();
    this.savePreferences();
  }

  private calculatePreferences(): LearnedPreferences {
    const preferences: LearnedPreferences = {
      cuisineScores: {},
      priceScores: {},
      healthyScore: { likes: 0, dislikes: 0, score: 0 },
      alcoholScore: { likes: 0, dislikes: 0, score: 0 },
      totalSwipes: this.history.length,
      rightSwipes: 0,
      leftSwipes: 0,
    };

    this.history.forEach((swipe) => {
      const isLike = swipe.direction === "right";

      // Count total swipes
      if (isLike) {
        preferences.rightSwipes++;
      } else {
        preferences.leftSwipes++;
      }

      // Track cuisine preferences
      // Split multi-cuisine strings (e.g., "Japanese, Sushi" -> ["Japanese", "Sushi"])
      const cuisines = swipe.restaurant.cuisine
        .split(",")
        .map((c) => c.trim());

      cuisines.forEach((cuisine) => {
        if (!preferences.cuisineScores[cuisine]) {
          preferences.cuisineScores[cuisine] = { likes: 0, dislikes: 0, score: 0 };
        }
        if (isLike) {
          preferences.cuisineScores[cuisine].likes++;
        } else {
          preferences.cuisineScores[cuisine].dislikes++;
        }
      });

      // Track price level preferences
      const price = swipe.restaurant.priceLevel;
      if (!preferences.priceScores[price]) {
        preferences.priceScores[price] = { likes: 0, dislikes: 0, score: 0 };
      }
      if (isLike) {
        preferences.priceScores[price].likes++;
      } else {
        preferences.priceScores[price].dislikes++;
      }

      // Track healthy options preference
      if (swipe.restaurant.healthyOptions) {
        if (isLike) {
          preferences.healthyScore.likes++;
        } else {
          preferences.healthyScore.dislikes++;
        }
      }

      // Track alcohol preference
      if (swipe.restaurant.servesAlcohol) {
        if (isLike) {
          preferences.alcoholScore.likes++;
        } else {
          preferences.alcoholScore.dislikes++;
        }
      }
    });

    // Calculate normalized scores (-1 to 1)
    // Score calculation: (likes - dislikes) / (likes + dislikes)
    // If no data, score is 0 (neutral)

    Object.keys(preferences.cuisineScores).forEach((cuisine) => {
      const { likes, dislikes } = preferences.cuisineScores[cuisine];
      const total = likes + dislikes;
      preferences.cuisineScores[cuisine].score =
        total > 0 ? (likes - dislikes) / total : 0;
    });

    Object.keys(preferences.priceScores).forEach((price) => {
      const { likes, dislikes } = preferences.priceScores[price as any];
      const total = likes + dislikes;
      preferences.priceScores[price as any].score =
        total > 0 ? (likes - dislikes) / total : 0;
    });

    const healthyTotal =
      preferences.healthyScore.likes + preferences.healthyScore.dislikes;
    preferences.healthyScore.score =
      healthyTotal > 0
        ? (preferences.healthyScore.likes - preferences.healthyScore.dislikes) /
          healthyTotal
        : 0;

    const alcoholTotal =
      preferences.alcoholScore.likes + preferences.alcoholScore.dislikes;
    preferences.alcoholScore.score =
      alcoholTotal > 0
        ? (preferences.alcoholScore.likes - preferences.alcoholScore.dislikes) /
          alcoholTotal
        : 0;

    return preferences;
  }

  private savePreferences(): void {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(this.preferences));
  }

  getPreferences(): LearnedPreferences {
    return this.preferences;
  }

  // Score a restaurant based on learned preferences
  scoreRestaurant(restaurant: Restaurant): number {
    // If no history yet, return neutral score
    if (this.history.length === 0) {
      return 0;
    }

    let score = 0;
    let weights = 0;

    // Cuisine scoring (weight: 2.0)
    const cuisines = restaurant.cuisine.split(",").map((c) => c.trim());
    let cuisineScore = 0;
    let cuisineCount = 0;

    cuisines.forEach((cuisine) => {
      if (this.preferences.cuisineScores[cuisine]) {
        cuisineScore += this.preferences.cuisineScores[cuisine].score;
        cuisineCount++;
      }
    });

    if (cuisineCount > 0) {
      score += (cuisineScore / cuisineCount) * 2.0;
      weights += 2.0;
    }

    // Price level scoring (weight: 1.5)
    if (this.preferences.priceScores[restaurant.priceLevel]) {
      const priceScore = this.preferences.priceScores[restaurant.priceLevel].score;
      score += priceScore * 1.5;
      weights += 1.5;
    }

    // Healthy options scoring (weight: 1.0)
    if (restaurant.healthyOptions && this.preferences.healthyScore.score !== 0) {
      score += this.preferences.healthyScore.score * 1.0;
      weights += 1.0;
    }

    // Alcohol scoring (weight: 1.0)
    if (restaurant.servesAlcohol && this.preferences.alcoholScore.score !== 0) {
      score += this.preferences.alcoholScore.score * 1.0;
      weights += 1.0;
    }

    // Normalize to -1 to 1 range
    return weights > 0 ? score / weights : 0;
  }

  // Sort restaurants by preference score (highest first)
  sortRestaurants(restaurants: Restaurant[]): Restaurant[] {
    return [...restaurants].sort((a, b) => {
      const scoreA = this.scoreRestaurant(a);
      const scoreB = this.scoreRestaurant(b);
      return scoreB - scoreA; // Higher scores first
    });
  }

  // Check if we have enough data to make predictions
  hasEnoughData(): boolean {
    return this.history.length >= 3;
  }

  // Get top preferred cuisines
  getTopCuisines(limit: number = 3): string[] {
    return Object.entries(this.preferences.cuisineScores)
      .sort(([, a], [, b]) => b.score - a.score)
      .slice(0, limit)
      .filter(([, data]) => data.score > 0)
      .map(([cuisine]) => cuisine);
  }

  // Clear all learning data
  clearHistory(): void {
    this.history = [];
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PREFERENCES_KEY);
    this.preferences = this.calculatePreferences();
  }
}
