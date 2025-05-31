
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface IntroScreenProps {
  onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

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
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-900 via-green-700 to-emerald-600 flex items-center justify-center z-50 animate-fade-out">
        <div className="text-center animate-scale-out">
          {/* Logo */}
          <div className="mb-8 relative">
            <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl mb-6">
              <div className="relative">
                {/* Soccer ball design */}
                <div className="w-24 h-24 bg-white rounded-full border-4 border-green-600 flex items-center justify-center relative overflow-hidden">
                  {/* Hexagon pattern */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-green-600 transform rotate-45"></div>
                  </div>
                  {/* Curved lines to simulate soccer ball */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-green-600 rounded-full transform rotate-12"></div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-green-600 rounded-full transform -rotate-12"></div>
                  <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-0.5 h-12 bg-green-600 rounded-full transform rotate-45"></div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-0.5 h-12 bg-green-600 rounded-full transform -rotate-45"></div>
                </div>
              </div>
            </div>
            
            {/* Glowing effect */}
            <div className="absolute inset-0 w-32 h-32 mx-auto bg-white/20 rounded-full blur-xl"></div>
          </div>

          {/* App Name */}
          <div className="space-y-2">
            <h1 className="text-6xl font-black text-white tracking-wider drop-shadow-2xl">
              KOORA
            </h1>
            <h2 className="text-4xl font-bold text-green-200 tracking-widest drop-shadow-lg">
              LIVE
            </h2>
            <div className="w-24 h-1 bg-white mx-auto rounded-full mt-4"></div>
          </div>

          {/* Subtitle */}
          <p className="text-white/80 text-lg mt-6 font-medium tracking-wide">
            Your Football Companion
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-green-900 via-green-700 to-emerald-600 flex items-center justify-center z-50 animate-fade-in">
      <div className="text-center animate-scale-in">
        {/* Logo */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl mb-6 animate-pulse">
            <div className="relative">
              {/* Soccer ball design */}
              <div className="w-24 h-24 bg-white rounded-full border-4 border-green-600 flex items-center justify-center relative overflow-hidden">
                {/* Hexagon pattern */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 bg-green-600 transform rotate-45 animate-spin"></div>
                </div>
                {/* Curved lines to simulate soccer ball */}
                <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-green-600 rounded-full transform rotate-12"></div>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-green-600 rounded-full transform -rotate-12"></div>
                <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-0.5 h-12 bg-green-600 rounded-full transform rotate-45"></div>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 w-0.5 h-12 bg-green-600 rounded-full transform -rotate-45"></div>
              </div>
            </div>
          </div>
          
          {/* Glowing effect */}
          <div className="absolute inset-0 w-32 h-32 mx-auto bg-white/20 rounded-full blur-xl animate-pulse"></div>
        </div>

        {/* App Name */}
        <div className="space-y-2">
          <h1 className="text-6xl font-black text-white tracking-wider drop-shadow-2xl animate-bounce">
            KOORA
          </h1>
          <h2 className="text-4xl font-bold text-green-200 tracking-widest drop-shadow-lg">
            LIVE
          </h2>
          <div className="w-24 h-1 bg-white mx-auto rounded-full mt-4 animate-pulse"></div>
        </div>

        {/* Subtitle */}
        <p className="text-white/80 text-lg mt-6 font-medium tracking-wide animate-fade-in">
          Your Football Companion
        </p>

        {/* Loading dots */}
        <div className="flex justify-center mt-8 space-x-2">
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
          <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
        </div>
      </div>
    </div>
  );
};

export default IntroScreen;
