
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
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      console.log('Got media stream:', stream);

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);

      // Start timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          console.log('Duration updated:', newDuration);
          return newDuration;
        });
      }, 1000);

      console.log('Recording started successfully');

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('لا يمكن الوصول إلى الميكروفون. يرجى التأكد من الصلاحيات.');
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (recordedBlob && !isPlaying) {
      const audio = new Audio(URL.createObjectURL(recordedBlob));
      audioRef.current = audio;
      
      audio.ontimeupdate = () => {
        setCurrentTime(audio.currentTime);
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.play();
      setIsPlaying(true);
    }
  };

  const pausePlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSend = () => {
    if (recordedBlob) {
      onVoiceRecorded(recordedBlob, duration);
    }
  };

  const handleDelete = () => {
    setRecordedBlob(null);
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
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
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </Button>
              <div>
                <div className="text-white text-sm">{formatTime(currentTime)} / {formatTime(duration)}</div>
                <div className="w-32 bg-zinc-600 rounded-full h-1 mt-1">
                  <div 
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${(currentTime / duration) * 100}%` }}
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
