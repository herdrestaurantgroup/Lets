import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFoodTypes: string[];
  selectedPrices: number[];
  selectedDietary: string[];
  onFoodTypeToggle: (foodType: string) => void;
  onPriceToggle: (price: number) => void;
  onDietaryToggle: (dietary: string) => void;
  onClearAll: () => void;
  onApply: () => void;
  availableFoodTypes: string[];
}

const priceOptions = [
  { level: 1, label: "$", description: "Under $10" },
  { level: 2, label: "$$", description: "$10-$25" },
  { level: 3, label: "$$$", description: "$25+" },
];

const dietaryOptions = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Halal",
  "Kosher",
  "Keto",
];

export function FilterPanel({
  isOpen,
  onClose,
  selectedFoodTypes,
  selectedPrices,
  selectedDietary,
  onFoodTypeToggle,
  onPriceToggle,
  onDietaryToggle,
  onClearAll,
  onApply,
  availableFoodTypes,
}: FilterPanelProps) {
  if (!isOpen) return null;

  const hasActiveFilters =
    selectedFoodTypes.length > 0 ||
    selectedPrices.length > 0 ||
    selectedDietary.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Filter Panel */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <button onClick={onClose} className="p-2 -ml-2">
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-lg">Filters</h2>
              {hasActiveFilters ? (
                <button
                  onClick={onClearAll}
                  className="text-sm text-blue-500"
                >
                  Clear All
                </button>
              ) : (
                <div className="w-16" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-5 py-5 space-y-8">
              {/* Food Type Section */}
              {availableFoodTypes.length > 0 && (
                <div>
                  <h3 className="text-base mb-4">Food Type</h3>
                  <div className="flex flex-wrap gap-2">
                    {availableFoodTypes.map((foodType) => {
                      const isSelected = selectedFoodTypes.includes(foodType);
                      return (
                        <button
                          key={foodType}
                          onClick={() => onFoodTypeToggle(foodType)}
                          className={`px-4 py-2 rounded-full border-2 transition-all text-sm ${
                            isSelected
                              ? "bg-black text-white border-black"
                              : "bg-white text-gray-700 border-gray-300"
                          }`}
                        >
                          {foodType}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Price Range Section */}
              <div>
                <h3 className="text-base mb-4">Price Range</h3>
                <div className="space-y-3">
                  {priceOptions.map((option) => {
                    const isSelected = selectedPrices.includes(option.level);
                    return (
                      <button
                        key={option.level}
                        onClick={() => onPriceToggle(option.level)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? "bg-black text-white border-black"
                            : "bg-white text-gray-700 border-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{option.label}</span>
                          <span className="text-sm">{option.description}</span>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-black" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dietary Preferences Section */}
              <div>
                <h3 className="text-base mb-2">Dietary Preferences</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Show only restaurants with these options
                </p>
                <div className="flex flex-wrap gap-2">
                  {dietaryOptions.map((dietary) => {
                    const isSelected = selectedDietary.includes(dietary);
                    return (
                      <button
                        key={dietary}
                        onClick={() => onDietaryToggle(dietary)}
                        className={`px-3 py-2 rounded-full border-2 transition-all text-sm ${
                          isSelected
                            ? "bg-green-500 text-white border-green-500"
                            : "bg-white text-gray-700 border-gray-300"
                        }`}
                      >
                        {dietary}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer - Apply Button */}
            <div className="px-5 py-5 border-t border-gray-200">
              <button
                onClick={onApply}
                className="w-full h-12 bg-black text-white rounded-lg"
              >
                Apply Filters
                {hasActiveFilters && (
                  <span className="ml-2">
                    (
                      {selectedFoodTypes.length +
                        selectedPrices.length +
                        selectedDietary.length}
                    )
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
