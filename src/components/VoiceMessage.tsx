
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
  const [hasError, setHasError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
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
    console.log('VoiceMessage: Play/Pause clicked, voiceUrl:', voiceUrl);
    
    if (!voiceUrl) {
      console.error('VoiceMessage: No voice URL provided');
      setHasError(true);
      return;
    }

    setHasError(false);

    try {
      // If audio is currently playing, pause it
      if (audioRef.current && isPlaying) {
        console.log('VoiceMessage: Pausing audio');
        audioRef.current.pause();
        setIsPlaying(false);
        return;
      }

      // If audio exists but is paused, resume it
      if (audioRef.current && !isPlaying && !audioRef.current.ended) {
        console.log('VoiceMessage: Resuming audio');
        try {
          await audioRef.current.play();
          setIsPlaying(true);
          return;
        } catch (error) {
          console.log('VoiceMessage: Resume failed, creating new audio instance');
        }
      }

      // Create new audio element
      setIsLoading(true);
      console.log('VoiceMessage: Creating new audio element with URL:', voiceUrl);
      
      // Clean up existing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }

      const audio = new Audio();
      audioRef.current = audio;

      // Set up event listeners before setting src
      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        console.log('VoiceMessage: Audio ended');
        setIsPlaying(false);
        setCurrentTime(0);
      };

      const handleError = (e: Event) => {
        console.error('VoiceMessage: Audio error:', e);
        setIsLoading(false);
        setHasError(true);
        setIsPlaying(false);
      };

      const handleCanPlay = () => {
        console.log('VoiceMessage: Audio can play');
        setIsLoading(false);
      };

      const handleLoadStart = () => {
        console.log('VoiceMessage: Audio load started');
        setIsLoading(true);
      };

      // Add event listeners
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('loadstart', handleLoadStart);

      // Set audio properties
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      
      // Set the source and load
      audio.src = voiceUrl;
      audio.load();
      
      // Try to play
      console.log('VoiceMessage: Attempting to play audio');
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        setIsLoading(false);
        console.log('VoiceMessage: Audio started playing successfully');
      }

    } catch (error) {
      console.error('VoiceMessage: Error during playback:', error);
      setIsLoading(false);
      setHasError(true);
      setIsPlaying(false);
    }
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center space-x-3 p-3 rounded-lg max-w-xs ${
      isOwn ? 'bg-blue-500' : 'bg-zinc-700'
    }`}>
      <Button
        onClick={handlePlayPause}
        disabled={isLoading || !voiceUrl}
        className={`rounded-full w-10 h-10 flex-shrink-0 ${
          isOwn ? 'bg-blue-600 hover:bg-blue-700' : 'bg-zinc-600 hover:bg-zinc-500'
        } ${hasError ? 'bg-red-500 hover:bg-red-600' : ''}`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : hasError ? (
          <Play size={16} />
        ) : isPlaying ? (
          <Pause size={16} />
        ) : (
          <Play size={16} />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-white text-sm">
            {hasError ? 'خطأ - اضغط للمحاولة مرة أخرى' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
          </span>
        </div>
        {!hasError && (
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
        )}
      </div>
    </div>
  );
};

export default VoiceMessage;
