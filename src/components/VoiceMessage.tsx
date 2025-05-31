
import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceMessageProps {
  voiceUrl: string;
  duration: number;
  isOwn?: boolean;
}

const VoiceMessage: React.FC<VoiceMessageProps> = ({ voiceUrl, duration, isOwn = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = async () => {
    if (!audioRef.current) {
      setIsLoading(true);
      const audio = new Audio(voiceUrl);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.onloadeddata = () => {
        setIsLoading(false);
      };

      audio.onerror = () => {
        setIsLoading(false);
        console.error('Error loading audio');
      };
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Error playing audio:', error);
        setIsLoading(false);
      }
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg max-w-xs ${
      isOwn ? 'bg-blue-500' : 'bg-zinc-700'
    }`}>
      <Button
        onClick={handlePlayPause}
        disabled={isLoading}
        className={`rounded-full w-10 h-10 flex-shrink-0 ${
          isOwn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-600 hover:bg-zinc-500'
        }`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause size={16} />
        ) : (
          <Play size={16} />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <div className={`w-full h-1 rounded-full ${
          isOwn ? 'bg-blue-600' : 'bg-zinc-600'
        }`}>
          <div 
            className={`h-1 rounded-full transition-all duration-300 ${
              isOwn ? 'bg-white' : 'bg-blue-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default VoiceMessage;
