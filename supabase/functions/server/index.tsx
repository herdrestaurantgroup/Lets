import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-b503081b/health", (c) => {
  return c.json({ status: "ok" });
});

// Initialize users on first load
app.post("/make-server-b503081b/init", async (c) => {
  try {
    // Check if users already exist
    const existingUsers = await kv.getByPrefix("user:");
    
    if (existingUsers.length === 0) {
      // Seed initial users
      const users = [
        { id: "user:1", name: "Liam" },
        { id: "user:2", name: "Jonathan" },
        { id: "user:3", name: "Demo Partner" },
      ];
      
      const keys = users.map(u => u.id);
      const values = users.map(u => u);
      await kv.mset(keys, values);
      console.log("Initialized users:", users);
    }
    
    const allUsers = await kv.getByPrefix("user:");
    return c.json({ users: allUsers });
  } catch (error) {
    console.error("Error initializing users:", error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get all users
app.get("/make-server-b503081b/users", async (c) => {
  try {
    const users = await kv.getByPrefix("user:");
    return c.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: String(error) }, 500);
  }
});

// Record a swipe
app.post("/make-server-b503081b/swipe", async (c) => {
  try {
    const { userId, restaurantId, direction } = await c.req.json();
    
    if (!userId || !restaurantId || !direction) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const swipeId = `swipe:${userId}:${restaurantId}`;
    const swipe = {
      id: swipeId,
      userId,
      restaurantId,
      direction,
      createdAt: new Date().toISOString(),
    };
    
    await kv.set(swipeId, swipe);
    console.log("Recorded swipe:", swipe);
    
    // If it's a like, check for matches
    let match = null;
    if (direction === "like") {
      // Get all swipes for this restaurant
      const allSwipes = await kv.getByPrefix("swipe:");
      const restaurantLikes = allSwipes.filter(
        s => s.restaurantId === restaurantId && 
        s.direction === "like" && 
        s.userId !== userId
      );
      
      console.log(`Found ${restaurantLikes.length} other likes for restaurant ${restaurantId}`);
      
      // Check if there's already a match with any of these users
      if (restaurantLikes.length > 0) {
        const otherUser = restaurantLikes[0]; // Match with the first user who liked it
        const otherUserId = otherUser.userId;
        
        // Create a consistent match ID regardless of user order
        const userIds = [userId, otherUserId].sort();
        const matchId = `match:${userIds[0]}:${userIds[1]}:${restaurantId}`;
        
        // Check if match already exists
        const existingMatch = await kv.get(matchId);
        
        if (!existingMatch) {
          match = {
            id: matchId,
            user1Id: userIds[0],
            user2Id: userIds[1],
            restaurantId,
            createdAt: new Date().toISOString(),
          };
          
          await kv.set(matchId, match);
          console.log("Created match:", match);
        } else {
          console.log("Match already exists:", existingMatch);
        }
      }
    }
    
    return c.json({ swipe, match });
  } catch (error) {
    console.error("Error recording swipe:", error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get matches for a user
app.get("/make-server-b503081b/matches/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const allMatches = await kv.getByPrefix("match:");
    
    // Filter matches that include this user
    const userMatches = allMatches.filter(
      m => m.user1Id === userId || m.user2Id === userId
    );
    
    console.log(`Found ${userMatches.length} matches for user ${userId}`);
    return c.json({ matches: userMatches });
  } catch (error) {
    console.error("Error fetching matches:", error);
    return c.json({ error: String(error) }, 500);
  }
});

// Get user's swipe for a specific restaurant
app.get("/make-server-b503081b/swipe/:userId/:restaurantId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const restaurantId = c.req.param("restaurantId");
    const swipeId = `swipe:${userId}:${restaurantId}`;
    
    const swipe = await kv.get(swipeId);
    return c.json({ swipe });
  } catch (error) {
    console.error("Error fetching swipe:", error);
    return c.json({ error: String(error) }, 500);
  }
});

// Delete a swipe (for undo)
app.delete("/make-server-b503081b/swipe", async (c) => {
  try {
    const { userId, restaurantId } = await c.req.json();
    
    if (!userId || !restaurantId) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const swipeId = `swipe:${userId}:${restaurantId}`;
    
    // Get the swipe to check if it was a like
    const swipe = await kv.get(swipeId);
    
    // Delete the swipe
    await kv.del(swipeId);
    console.log("Deleted swipe:", swipeId);
    
    // If it was a like, check if we need to delete any matches
    if (swipe && swipe.direction === "like") {
      const allMatches = await kv.getByPrefix("match:");
      
      // Find matches that involve this user and restaurant
      const matchesToDelete = allMatches.filter(
        m => m.restaurantId === restaurantId && 
        (m.user1Id === userId || m.user2Id === userId)
      );
      
      // Delete the matches
      for (const match of matchesToDelete) {
        await kv.del(match.id);
        console.log("Deleted match:", match.id);
      }
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting swipe:", error);
    return c.json({ error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
