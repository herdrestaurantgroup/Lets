import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, MapPin } from "lucide-react";

interface SurveyProps {
  onComplete: (preferences: SurveyPreferences) => void;
}

export interface SurveyPreferences {
  mealTime: "breakfast" | "lunch" | "dinner" | "any";
  diningStyle: "dine-in" | "takeout" | "any";
  mealPace: "quick" | "sit-down" | "any";
  budget: 1 | 2 | 3 | 4 | null;
}

export function Survey({ onComplete }: SurveyProps) {
  const [step, setStep] = useState(0);
  const [preferences, setPreferences] = useState<SurveyPreferences>({
    mealTime: "any",
    diningStyle: "any",
    mealPace: "any",
    budget: null,
  });

  const questions = [
    {
      id: "mealTime",
      question: "What meal are you looking for?",
      options: [
        { value: "breakfast", label: "Breakfast" },
        { value: "lunch", label: "Lunch" },
        { value: "dinner", label: "Dinner" },
        { value: "any", label: "Any time" },
      ],
    },
    {
      id: "diningStyle",
      question: "How do you want to eat?",
      options: [
        { value: "dine-in", label: "Dine-in" },
        { value: "takeout", label: "Takeout/Delivery" },
        { value: "any", label: "Either works" },
      ],
    },
    {
      id: "mealPace",
      question: "What's your pace?",
      options: [
        { value: "quick", label: "Quick bite" },
        { value: "sit-down", label: "Sit-down meal" },
        { value: "any", label: "No preference" },
      ],
    },
    {
      id: "budget",
      question: "What's your budget?",
      options: [
        { value: 1, label: "Budget-friendly", description: "Under $15" },
        { value: 2, label: "Moderate", description: "$15-$30" },
        { value: 3, label: "Upscale", description: "$30-$50" },
        { value: 4, label: "Fine dining", description: "$50+" },
      ],
    },
  ];

  const currentQuestion = questions[step];

  const handleSelect = (value: string | number) => {
    const newPreferences = {
      ...preferences,
      [currentQuestion.id]: value,
    };
    setPreferences(newPreferences);

    if (step < questions.length - 1) {
      setTimeout(() => setStep(step + 1), 300);
    } else {
      setTimeout(() => onComplete(newPreferences), 300);
    }
  };

  const handleSkip = () => {
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(preferences);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-gray-600" />
          <span className="text-sm text-gray-600">Memphis, TN</span>
        </div>
        <button
          onClick={handleSkip}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Skip
        </button>
      </div>

      {/* Progress */}
      <div className="px-5 pb-4">
        <div className="flex gap-2">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all ${
                index <= step ? "bg-black" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            <h2 className="text-2xl text-center mb-8 text-black">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-white border border-gray-300 rounded-lg p-5 hover:border-black transition-all flex items-center gap-4 group"
                >
                  <div className="flex-1 text-left">
                    <div className="font-medium text-black">
                      {option.label}
                    </div>
                    {option.description && (
                      <div className="text-sm text-gray-500">
                        {option.description}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-black transition-colors" />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Step indicator */}
      <div className="pb-8 text-center text-sm text-gray-500">
        Question {step + 1} of {questions.length}
      </div>
    </div>
  );
}