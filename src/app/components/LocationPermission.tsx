interface LocationPermissionProps {
  onAllow: () => void;
  onSkip: () => void;
}

export function LocationPermission({ onAllow, onSkip }: LocationPermissionProps) {
  return (
    <div className="w-full h-screen bg-white flex items-center justify-center p-5">
      <div className="w-full max-w-[350px] text-center space-y-8">
        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-3xl">Where do you want to eat?</h1>
          <p className="text-base text-gray-600">
            Allow location access so we can show restaurants near you.
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <button
            onClick={onAllow}
            className="w-full h-12 bg-black text-white rounded-lg"
          >
            Allow Location
          </button>
          <button
            onClick={onSkip}
            className="w-full h-12 bg-white text-black border-2 border-gray-300 rounded-lg"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
