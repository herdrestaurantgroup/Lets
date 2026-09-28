export const DEFAULT_USERS = [
  { id: "user:1", name: "You" },
  { id: "user:2", name: "Jonathan" },
  { id: "user:3", name: "Liam" },
];

export interface LocalSwipe {
  userId: string;
  restaurantId: number;
  direction: "like" | "dislike";
  createdAt: string;
}

export interface LocalMatch {
  id: string;
  user1Id: string;
  user2Id: string;
  restaurantId: number;
  createdAt: string;
}

const SWIPES_KEY = "grubbr.swipes";
const MATCHES_KEY = "grubbr.matches";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota / private mode
  }
}

export function getSwipes(): LocalSwipe[] {
  return readJson<LocalSwipe[]>(SWIPES_KEY, []);
}

export function getMatches(): LocalMatch[] {
  return readJson<LocalMatch[]>(MATCHES_KEY, []);
}

export function getMatchesForUser(userId: string): LocalMatch[] {
  return getMatches().filter((m) => m.user1Id === userId || m.user2Id === userId);
}

export function recordLocalSwipe(
  userId: string,
  restaurantId: number,
  direction: "like" | "dislike"
): LocalMatch | null {
  const swipes = getSwipes().filter(
    (s) => !(s.userId === userId && s.restaurantId === restaurantId)
  );
  swipes.push({
    userId,
    restaurantId,
    direction,
    createdAt: new Date().toISOString(),
  });
  writeJson(SWIPES_KEY, swipes);

  if (direction !== "like") return null;

  const otherLikes = swipes.filter(
    (s) =>
      s.restaurantId === restaurantId &&
      s.direction === "like" &&
      s.userId !== userId
  );
  if (otherLikes.length === 0) return null;

  const otherUserId = otherLikes[0].userId;
  const [a, b] = [userId, otherUserId].sort();
  const matchId = `match:${a}:${b}:${restaurantId}`;
  const matches = getMatches();
  const existing = matches.find((m) => m.id === matchId);
  if (existing) return existing;

  const match: LocalMatch = {
    id: matchId,
    user1Id: a,
    user2Id: b,
    restaurantId,
    createdAt: new Date().toISOString(),
  };
  writeJson(MATCHES_KEY, [...matches, match]);
  return match;
}

export function undoLocalSwipe(userId: string, restaurantId: number) {
  writeJson(
    SWIPES_KEY,
    getSwipes().filter((s) => !(s.userId === userId && s.restaurantId === restaurantId))
  );
}
