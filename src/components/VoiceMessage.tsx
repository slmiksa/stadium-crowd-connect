
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

    // Reset error state when user tries again
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
          // Fall through to create new audio instance
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

      // Set up event listeners before loading
      audio.addEventListener('loadstart', () => {
        console.log('VoiceMessage: Load started');
      });

      audio.addEventListener('canplay', () => {
        console.log('VoiceMessage: Audio can play');
        setIsLoading(false);
      });

      audio.addEventListener('loadeddata', () => {
        console.log('VoiceMessage: Audio data loaded, duration:', audio.duration);
        setIsLoading(false);
      });

      audio.addEventListener('timeupdate', () => {
        setCurrentTime(audio.currentTime);
      });

      audio.addEventListener('ended', () => {
        console.log('VoiceMessage: Audio ended');
        setIsPlaying(false);
        setCurrentTime(0);
      });

      audio.addEventListener('error', (e) => {
        console.error('VoiceMessage: Audio error:', e);
        console.error('VoiceMessage: Audio error details:', audio.error);
        setIsLoading(false);
        setHasError(true);
        setIsPlaying(false);
      });

      audio.addEventListener('abort', () => {
        console.log('VoiceMessage: Audio loading aborted');
        setIsLoading(false);
      });

      // Try different URL variations
      let finalUrl = voiceUrl;
      
      // If URL doesn't have proper protocol, try adding it
      if (!voiceUrl.startsWith('http://') && !voiceUrl.startsWith('https://')) {
        console.log('VoiceMessage: URL missing protocol, attempting to fix...');
        if (voiceUrl.includes('supabase')) {
          finalUrl = `https://${voiceUrl}`;
        }
      }

      // Add timestamp to bypass cache if needed
      if (finalUrl.indexOf('?') === -1) {
        finalUrl += `?t=${Date.now()}`;
      } else {
        finalUrl += `&t=${Date.now()}`;
      }

      console.log('VoiceMessage: Final URL:', finalUrl);

      // Set crossOrigin to handle CORS issues
      audio.crossOrigin = 'anonymous';
      
      // Load the audio with error handling
      audio.src = finalUrl;
      
      // Try to load and play
      try {
        audio.load();
        
        // Wait for the audio to be ready with shorter timeout
        await new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Audio loading timeout'));
          }, 5000); // 5 second timeout

          const onCanPlay = () => {
            clearTimeout(timeoutId);
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
            resolve(true);
          };

          const onError = () => {
            clearTimeout(timeoutId);
            audio.removeEventListener('canplay', onCanPlay);
            audio.removeEventListener('error', onError);
            reject(audio.error || new Error('Audio loading failed'));
          };

          audio.addEventListener('canplay', onCanPlay);
          audio.addEventListener('error', onError);
        });

        // Now try to play
        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);
        console.log('VoiceMessage: Audio started playing successfully');
        
      } catch (playError) {
        console.error('VoiceMessage: Failed to play audio:', playError);
        setIsLoading(false);
        setHasError(true);
        setIsPlaying(false);
        
        // Additional debug info
        console.log('VoiceMessage: Audio readyState:', audio.readyState);
        console.log('VoiceMessage: Audio networkState:', audio.networkState);
        console.log('VoiceMessage: Audio src:', audio.src);
      }

    } catch (error) {
      console.error('VoiceMessage: Error during playback setup:', error);
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
