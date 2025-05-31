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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped, creating blob...');
        
        if (audioChunksRef.current.length === 0) {
          alert('لم يتم تسجيل أي صوت');
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Created blob:', audioBlob.size, 'bytes');
        
        setRecordedBlob(audioBlob);
        
        const newAudioUrl = URL.createObjectURL(audioBlob);
        setAudioUrl(newAudioUrl);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setDuration(0);
        intervalRef.current = window.setInterval(() => {
          setDuration(prev => prev + 1);
        }, 1000);
      };

      mediaRecorder.start();

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('لا يمكن الوصول إلى الميكروفون');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  };

  const playRecording = async () => {
    if (!audioUrl || isPlaying) return;

    try {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
      
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.ontimeupdate = () => setCurrentTime(audio.currentTime);
      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        alert('خطأ في تشغيل الصوت');
      };

      await audio.play();
      setIsPlaying(true);
      
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
    }
  };

  const handleSend = () => {
    console.log('Send clicked, blob:', recordedBlob, 'duration:', duration);
    
    if (!recordedBlob || recordedBlob.size === 0) {
      alert('لا يوجد تسجيل صوتي');
      return;
    }
    
    if (duration === 0) {
      alert('مدة التسجيل قصيرة جداً');
      return;
    }

    try {
      console.log('Calling onVoiceRecorded...');
      onVoiceRecorded(recordedBlob, duration);
    } catch (error) {
      console.error('Error calling onVoiceRecorded:', error);
      alert('خطأ في إرسال الرسالة: ' + error.message);
    }
  };

  const handleDelete = () => {
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
            <div className="text-2xl text-white mb-2">{Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}</div>
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
            <div className="text-white text-sm">
              مدة التسجيل: {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
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
              disabled={!recordedBlob || duration === 0}
            >
              إرسال ({recordedBlob ? (recordedBlob.size / 1024).toFixed(1) + 'KB' : '0KB'})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
