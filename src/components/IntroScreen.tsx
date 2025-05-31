
import React, { useEffect, useState } from 'react';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onComplete();
      }, 500); // Extra time for fade out animation
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) {
    return null; // Return nothing during fade out
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 flex items-center justify-center z-50 animate-fade-in">
      <div className="text-center animate-scale-in">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto bg-zinc-800 rounded-full flex items-center justify-center shadow-2xl mb-6 animate-pulse border-2 border-blue-500/30">
            <div className="relative">
              {/* Soccer ball design */}
              <div className="w-24 h-24 bg-zinc-800 rounded-full border-4 border-blue-500 flex items-center justify-center relative overflow-hidden">
                {/* Hexagon pattern */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-blue-500 transform rotate-45 animate-spin"></div>
                </div>
                {/* Curved lines to simulate soccer ball */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-blue-500 rounded-full transform rotate-12"></div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-blue-500 rounded-full transform -rotate-12"></div>
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-0.5 h-12 bg-blue-500 rounded-full transform rotate-45"></div>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-0.5 h-12 bg-blue-500 rounded-full transform -rotate-45"></div>
              </div>
            </div>
          </div>
          
          {/* Glowing effect */}
          <div className="absolute inset-0 w-32 h-32 mx-auto bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
        </div>

        {/* App Name */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-white tracking-wider drop-shadow-2xl animate-bounce">
            KOORA
          </h1>
          <h2 className="text-4xl font-bold text-blue-400 tracking-widest drop-shadow-lg">
            LIVE
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-400 mx-auto rounded-full mt-4 animate-pulse"></div>
        </div>

        {/* Subtitle */}
        <p className="text-zinc-300 text-lg mt-6 font-medium tracking-wide animate-fade-in">
          Your Football Companion
        </p>

        {/* Loading dots */}
        <div className="flex justify-center mt-8 space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-3 h-3 bg-blue-300 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;
