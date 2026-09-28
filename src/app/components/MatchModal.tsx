import { motion, AnimatePresence } from "motion/react";
import { Heart, Sparkles } from "lucide-react";
import { Restaurant } from "./SwipeCard";

interface MatchModalProps {
  isOpen: boolean;
  restaurant: Restaurant | null;
  currentUserName: string;
  matchedUserName: string;
  onClose: () => void;
  onViewMatches: () => void;
}

// Generate random confetti particles
const generateConfetti = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -20,
    rotation: Math.random() * 360,
    scale: 0.5 + Math.random() * 0.5,
    color: ["#ec4899", "#ef4444", "#f97316", "#facc15"][Math.floor(Math.random() * 4)],
    delay: Math.random() * 0.3,
  }));
};

export function MatchModal({
  isOpen,
  restaurant,
  currentUserName,
  matchedUserName,
  onClose,
  onViewMatches,
}: MatchModalProps) {
  if (!restaurant) return null;

  const confettiParticles = generateConfetti(50);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          {/* Confetti Effect */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {confettiParticles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{
                  x: `${particle.x}vw`,
                  y: `${particle.y}vh`,
                  rotate: 0,
                  opacity: 0,
                  scale: 0,
                }}
                animate={{
                  y: "120vh",
                  rotate: particle.rotation + 720,
                  opacity: [0, 1, 1, 0],
                  scale: particle.scale,
                }}
                transition={{
                  duration: 2.5 + Math.random() * 1.5,
                  delay: particle.delay,
                  ease: "easeOut",
                }}
                className="absolute"
                style={{
                  left: 0,
                  top: 0,
                }}
              >
                <Heart
                  className="w-4 h-4 fill-current"
                  style={{ color: particle.color }}
                />
              </motion.div>
            ))}
          </div>

          {/* Match Card */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{
              type: "spring",
              damping: 25,
              stiffness: 300,
              duration: 0.3,
            }}
            className="relative w-full max-w-md mx-5 bg-white rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Animated gradient background */}
            <motion.div
              className="absolute inset-0 opacity-10"
              animate={{
                background: [
                  "linear-gradient(45deg, #ec4899, #ef4444)",
                  "linear-gradient(135deg, #ef4444, #ec4899)",
                  "linear-gradient(225deg, #ec4899, #ef4444)",
                  "linear-gradient(315deg, #ef4444, #ec4899)",
                  "linear-gradient(45deg, #ec4899, #ef4444)",
                ],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
            />

            {/* Restaurant Image */}
            <div className="relative h-72 bg-gradient-to-br from-pink-100 to-red-100">
              <motion.img
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />
              
              {/* Floating sparkles */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
                className="absolute top-4 right-4"
              >
                <Sparkles className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              </motion.div>
            </div>

            {/* Content */}
            <div className="relative p-8 text-center bg-white">
              {/* Match Icon with pulse animation */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.2,
                  type: "spring",
                  damping: 15,
                  stiffness: 200,
                }}
                className="mx-auto w-20 h-20 -mt-16 mb-6 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Heart className="w-10 h-10 text-white fill-white" />
                </motion.div>
              </motion.div>

              {/* Title with stagger animation */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <h2 className="text-4xl mb-3 text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-red-600">
                  It's a Match!
                </h2>
              </motion.div>

              {/* Users */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.3 }}
                className="text-gray-600 mb-6 text-lg"
              >
                <span className="font-semibold text-gray-900">{currentUserName}</span> and{" "}
                <span className="font-semibold text-gray-900">{matchedUserName}</span> both want to try
              </motion.p>

              {/* Restaurant name */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                className="mb-8"
              >
                <h3 className="text-3xl mb-2 text-gray-900">{restaurant.name}</h3>
                <p className="text-gray-600">{restaurant.cuisine}</p>
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.3 }}
                className="space-y-3"
              >
                <motion.button
                  onClick={onViewMatches}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-red-500 text-white rounded-xl hover:from-pink-600 hover:to-red-600 transition-all shadow-lg hover:shadow-xl font-medium text-lg"
                >
                  View All Matches
                </motion.button>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Keep Swiping
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
