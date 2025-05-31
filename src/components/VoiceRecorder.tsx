
import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VoiceRecorderProps {
  onVoiceRecorded: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onVoiceRecorded, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      console.log('Requesting microphone access...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Microphone access granted, stream:', stream);
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available, size:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('Recording stopped, creating blob...');
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        console.log('Blob created, size:', audioBlob.size, 'type:', mimeType);
        
        // Clean up old audio URL
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        
        // Create new audio URL and test it
        const newAudioUrl = URL.createObjectURL(audioBlob);
        console.log('Audio URL created:', newAudioUrl);
        
        // Test the audio immediately
        const testAudio = new Audio(newAudioUrl);
        testAudio.oncanplay = () => {
          console.log('Audio can be played, duration:', testAudio.duration);
        };
        testAudio.onerror = (e) => {
          console.error('Audio test failed:', e);
        };
        
        setRecordedBlob(audioBlob);
        setAudioUrl(newAudioUrl);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            console.log('Track stopped:', track.kind);
          });
        }
      };

      mediaRecorder.onstart = () => {
        console.log('Recording started');
        setIsRecording(true);
        setDuration(0);

        // Start timer
        intervalRef.current = window.setInterval(() => {
          setDuration(prev => {
            const newDuration = prev + 1;
            console.log('Timer tick:', newDuration);
            return newDuration;
          });
        }, 1000);
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        alert('حدث خطأ أثناء التسجيل');
      };

      console.log('Starting MediaRecorder...');
      mediaRecorder.start(1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('لا يمكن الوصول إلى الميكروفون. يرجى التأكد من الصلاحيات.');
    }
  };

  const stopRecording = () => {
    console.log('Stop recording button clicked');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('Stopping MediaRecorder...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('Timer cleared');
      }
    }
  };

  const playRecording = async () => {
    console.log('Play button clicked');
    console.log('Current state - audioUrl:', audioUrl, 'isPlaying:', isPlaying);
    console.log('RecordedBlob exists:', !!recordedBlob);
    
    if (!audioUrl) {
      console.error('No audio URL available');
      alert('لا يوجد ملف صوتي للتشغيل');
      return;
    }

    if (isPlaying) {
      console.log('Already playing, ignoring click');
      return;
    }

    try {
      console.log('Starting playback with URL:', audioUrl);
      
      // Clean up previous audio instance
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      
      const audio = new Audio();
      audioRef.current = audio;
      
      // Set up event listeners first
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        console.log('Playback ended');
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        alert('خطأ في تشغيل الصوت');
      };

      audio.onloadedmetadata = () => {
        console.log('Audio metadata loaded, duration:', audio.duration);
      };

      audio.oncanplay = () => {
        console.log('Audio can play');
      };

      // Set the source and load
      audio.src = audioUrl;
      audio.load();

      // Wait a bit then try to play
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await audio.play();
      setIsPlaying(true);
      console.log('Playback started successfully');
      
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      alert('لا يمكن تشغيل الصوت: ' + error.message);
    }
  };

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      console.log('Playback paused');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (recordedBlob) {
      console.log('Sending recorded audio, size:', recordedBlob.size);
      onVoiceRecorded(recordedBlob, duration);
    }
  };

  const handleDelete = () => {
    console.log('Deleting recording');
    setRecordedBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  return (
    <div className="bg-zinc-700 rounded-lg p-4 m-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium">تسجيل رسالة صوتية</h3>
        <button 
          onClick={onCancel}
          className="text-zinc-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {!recordedBlob ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <div className="text-2xl text-white mb-2">{formatTime(duration)}</div>
            <div className="text-zinc-400 text-sm">
              {isRecording ? 'جاري التسجيل...' : 'اضغط للبدء في التسجيل'}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="bg-red-500 hover:bg-red-600 rounded-full w-16 h-16"
              >
                <Mic size={24} />
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                className="bg-red-500 hover:bg-red-600 rounded-full w-16 h-16"
              >
                <Square size={24} />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                onClick={isPlaying ? pausePlayback : playRecording}
                className="bg-blue-500 hover:bg-blue-600 rounded-full w-10 h-10"
                disabled={!audioUrl}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>
              <div>
                <div className="text-white text-sm">{formatTime(currentTime)} / {formatTime(duration)}</div>
                <div className="w-32 bg-zinc-600 rounded-full h-1 mt-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 rounded-full w-8 h-8"
            >
              <Trash2 size={16} />
            </Button>
          </div>
          
          <div className="flex justify-between space-x-2">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSend}
              className="bg-blue-500 hover:bg-blue-600 flex-1"
            >
              إرسال
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
