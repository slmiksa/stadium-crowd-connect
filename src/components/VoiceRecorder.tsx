
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
      console.log('VoiceRecorder: Starting recording process...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });

      console.log('VoiceRecorder: Microphone access granted');
      streamRef.current = stream;

      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = '';
          }
        }
      }

      console.log('VoiceRecorder: Using MIME type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('VoiceRecorder: Data available, size:', event.data.size);
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('VoiceRecorder: Recording stopped, creating blob...');
        console.log('VoiceRecorder: Number of chunks:', audioChunksRef.current.length);
        
        if (audioChunksRef.current.length === 0) {
          console.error('VoiceRecorder: No audio chunks recorded');
          alert('لم يتم تسجيل أي صوت. يرجى المحاولة مرة أخرى.');
          return;
        }

        const finalMimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
        console.log('VoiceRecorder: Blob created:', {
          size: audioBlob.size,
          type: finalMimeType,
          duration: duration
        });
        
        if (audioBlob.size === 0) {
          console.error('VoiceRecorder: Empty blob created');
          alert('فشل في إنشاء ملف صوتي صالح. يرجى المحاولة مرة أخرى.');
          return;
        }
        
        // Clean up old audio URL
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl);
        }
        
        const newAudioUrl = URL.createObjectURL(audioBlob);
        console.log('VoiceRecorder: Audio URL created:', newAudioUrl);
        
        setRecordedBlob(audioBlob);
        setAudioUrl(newAudioUrl);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            console.log('VoiceRecorder: Track stopped:', track.kind);
          });
        }
      };

      mediaRecorder.onstart = () => {
        console.log('VoiceRecorder: Recording started');
        setIsRecording(true);
        setDuration(0);

        intervalRef.current = window.setInterval(() => {
          setDuration(prev => {
            const newDuration = prev + 1;
            console.log('VoiceRecorder: Duration updated:', newDuration);
            return newDuration;
          });
        }, 1000);
      };

      mediaRecorder.onerror = (event) => {
        console.error('VoiceRecorder: MediaRecorder error:', event);
        alert('حدث خطأ أثناء التسجيل');
      };

      console.log('VoiceRecorder: Starting MediaRecorder...');
      mediaRecorder.start(100);

    } catch (error) {
      console.error('VoiceRecorder: Error accessing microphone:', error);
      alert('لا يمكن الوصول إلى الميكروفون. يرجى التأكد من الصلاحيات.');
    }
  };

  const stopRecording = () => {
    console.log('VoiceRecorder: Stop recording button clicked');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('VoiceRecorder: Stopping MediaRecorder...');
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('VoiceRecorder: Timer cleared');
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
        console.error('VoiceRecorder: Audio playback error:', e);
        setIsPlaying(false);
        alert('خطأ في تشغيل الصوت');
      };

      await audio.play();
      setIsPlaying(true);
      
    } catch (error) {
      console.error('VoiceRecorder: Error playing audio:', error);
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
    console.log('VoiceRecorder: Send button clicked');
    console.log('VoiceRecorder: Recorded blob:', recordedBlob);
    console.log('VoiceRecorder: Duration:', duration);
    
    if (!recordedBlob) {
      console.error('VoiceRecorder: No recorded blob available');
      alert('لا يوجد تسجيل صوتي لإرساله');
      return;
    }
    
    if (duration === 0) {
      console.error('VoiceRecorder: Duration is 0');
      alert('مدة التسجيل غير صحيحة');
      return;
    }

    if (recordedBlob.size === 0) {
      console.error('VoiceRecorder: Blob size is 0');
      alert('الملف الصوتي فارغ');
      return;
    }

    console.log('VoiceRecorder: Calling onVoiceRecorded with:', {
      blobSize: recordedBlob.size,
      blobType: recordedBlob.type,
      duration: duration
    });
    
    try {
      onVoiceRecorded(recordedBlob, duration);
      console.log('VoiceRecorder: onVoiceRecorded called successfully');
    } catch (error) {
      console.error('VoiceRecorder: Error calling onVoiceRecorded:', error);
      alert('فشل في إرسال الرسالة الصوتية: ' + error.message);
    }
  };

  const handleDelete = () => {
    console.log('VoiceRecorder: Deleting recording');
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
              disabled={!recordedBlob || duration === 0}
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
