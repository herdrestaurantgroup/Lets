import { supabase } from "./auth";

export interface FriendMatch {
  restaurantId: number;
  otherUserId: string;
  otherName: string;
}

function code() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export async function createInvite(userId: string, name: string) {
  if (!supabase) throw new Error("Sign in is not configured");
  const id = code();
  const { error } = await supabase.from("sessions").insert({ id, host_id: userId });
  if (error) throw error;
  await supabase.from("session_members").insert({ session_id: id, user_id: userId, name });
  return id;
}

export async function joinInvite(sessionId: string, userId: string, name: string) {
  if (!supabase) throw new Error("Sign in is not configured");
  const { error } = await supabase.from("session_members").upsert({
    session_id: sessionId,
    user_id: userId,
    name,
  });
  if (error) throw error;
}

export async function recordSessionSwipe(
  sessionId: string,
  userId: string,
  restaurantId: number,
  direction: "like" | "dislike"
): Promise<FriendMatch | null> {
  if (!supabase) return null;
  await supabase.from("swipes").upsert({
    session_id: sessionId,
    user_id: userId,
    restaurant_id: restaurantId,
    direction,
  });
  if (direction !== "like") return null;
  const { data } = await supabase
    .from("swipes")
    .select("user_id")
    .eq("session_id", sessionId)
    .eq("restaurant_id", restaurantId)
    .eq("direction", "like")
    .neq("user_id", userId);
  const other = data?.[0];
  if (!other) return null;
  const { data: member } = await supabase
    .from("session_members")
    .select("name")
    .eq("session_id", sessionId)
    .eq("user_id", other.user_id)
    .maybeSingle();
  return {
    restaurantId,
    otherUserId: other.user_id,
    otherName: member?.name || "a friend",
  };
}
