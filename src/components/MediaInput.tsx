import React, { useState, useRef } from 'react';
import { Camera, Send, X, Mic, MicOff, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
interface Message {
  id: string;
  content: string;
  profiles: {
    username: string;
  };
}
interface MediaInputProps {
  onSendMessage: (content: string, mediaFile?: File, mediaType?: string) => void;
  isSending: boolean;
  quotedMessage?: Message | null;
  onClearQuote?: () => void;
}
const MediaInput = ({
  onSendMessage,
  isSending,
  quotedMessage,
  onClearQuote
}: MediaInputProps) => {
  const [message, setMessage] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.log('=== MEDIA SELECTION ===');
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
      if (file.size > 10 * 1024 * 1024) {
        alert('حجم الملف كبير جداً. الحد الأقصى 10 ميجابايت');
        return;
      }
      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
      if (!type) {
        alert('نوع الملف غير مدعوم. يرجى اختيار صورة أو فيديو');
        return;
      }
      console.log('Media type determined:', type);
      setSelectedMedia(file);
      setMediaType(type);
      const reader = new FileReader();
      reader.onload = e => {
        const result = e.target?.result as string;
        console.log('Preview created:', result.substring(0, 50) + '...');
        setMediaPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };
  const startRecording = async () => {
    try {
      console.log('=== STARTING VOICE RECORDING ===');
      console.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }
      });
      console.log('Microphone access granted');
      streamRef.current = stream;

      // تحديد نوع الملف المدعوم
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/wav';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4';
          }
        }
      }
      console.log('Using MIME type:', mimeType);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: mimeType
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = event => {
        console.log('Audio data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      mediaRecorder.onstop = () => {
        console.log('=== RECORDING STOPPED ===');
        console.log('Total chunks:', audioChunksRef.current.length);
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mimeType
        });
        console.log('Created audio blob:', audioBlob.size, 'bytes, type:', audioBlob.type);

        // إنشاء ملف صوتي مع الاسم والنوع الصحيح
        const extension = mimeType.includes('webm') ? 'webm' : mimeType.includes('wav') ? 'wav' : 'mp4';
        const audioFile = new File([audioBlob], `voice_${Date.now()}.${extension}`, {
          type: mimeType
        });
        console.log('Created audio file:', audioFile.name, audioFile.size, 'bytes, type:', audioFile.type);
        setSelectedMedia(audioFile);
        setMediaType('voice');
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioPreview(audioUrl);

        // تنظيف المتدفق
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };
      mediaRecorder.onerror = event => {
        console.error('MediaRecorder error:', event);
        alert('حدث خطأ أثناء التسجيل');
      };
      mediaRecorder.start(1000); // جمع البيانات كل ثانية
      console.log('Recording started');
      setIsRecording(true);
      setRecordingDuration(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      let errorMessage = 'فشل في الوصول للميكروفون';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'يرجى السماح بالوصول للميكروفون من إعدادات المتصفح';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'لم يتم العثور على ميكروفون متاح';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'التسجيل الصوتي غير مدعوم في هذا المتصفح';
      }
      alert(errorMessage);
    }
  };
  const stopRecording = () => {
    console.log('=== STOPPING RECORDING ===');
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };
  const toggleAudioPreview = () => {
    if (!audioPreview) return;
    if (!audioPreviewRef.current) {
      audioPreviewRef.current = new Audio(audioPreview);
      audioPreviewRef.current.onended = () => setIsPlayingPreview(false);
    }
    if (isPlayingPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      audioPreviewRef.current.play();
      setIsPlayingPreview(true);
    }
  };
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(message, selectedMedia || undefined, mediaType || undefined);
  };
  const sendMessage = async (content: string, mediaFile?: File, mediaType?: string) => {
    console.log('=== SEND MESSAGE CALLED ===');
    console.log('Content:', content);
    console.log('Media file:', mediaFile ? `${mediaFile.name} (${mediaFile.size} bytes, type: ${mediaFile.type})` : 'none');
    console.log('Media type:', mediaType);
    if (!content.trim() && !mediaFile) {
      console.log('No content or media to send');
      return;
    }

    // تحديد نوع الوسائط بشكل صحيح
    let finalMediaType = mediaType;
    if (mediaFile) {
      if (mediaType === 'voice') {
        finalMediaType = 'voice';
      } else if (mediaFile.type.startsWith('image/')) {
        finalMediaType = 'image';
      } else if (mediaFile.type.startsWith('video/')) {
        finalMediaType = 'video';
      }
    }
    console.log('Final media type determined:', finalMediaType);
    console.log('Calling onSendMessage...');
    onSendMessage(content.trim(), mediaFile || undefined, finalMediaType || undefined);

    // تنظيف النموذج
    setMessage('');
    clearMedia();
    console.log('Form cleared after send');
  };
  const clearMedia = () => {
    console.log('Clearing selected media');
    setSelectedMedia(null);
    setMediaPreview(null);
    setMediaType(null);
    setAudioPreview(null);
    setRecordingDuration(0);
    setIsPlayingPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (audioPreviewRef.current) {
      audioPreviewRef.current = null;
    }
  };
  return <div className="sticky bottom-0 left-0 right-0 z-50 bg-zinc-800 border-t border-zinc-700 px-4 py-3 pb-safe-bottom">
      {/* Quoted Message Preview */}
      {quotedMessage && <div className="mb-3 bg-zinc-700 rounded-lg p-3 border-l-4 border-blue-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-blue-400">الرد على {quotedMessage.profiles?.username}</span>
            <button onClick={onClearQuote} className="text-zinc-400 hover:text-white transition-colors p-1">
              <X size={16} />
            </button>
          </div>
          <p className="text-sm text-zinc-300 truncate">{quotedMessage.content}</p>
        </div>}

      {/* Media Preview */}
      {(mediaPreview || audioPreview) && <div className="mb-3 relative">
          <div className="bg-zinc-700 rounded-lg p-2 relative">
            {mediaType === 'image' && mediaPreview && <img src={mediaPreview} alt="معاينة الصورة" className="max-h-32 rounded object-cover" />}
            {mediaType === 'video' && mediaPreview && <video src={mediaPreview} className="max-h-32 rounded" controls />}
            {mediaType === 'voice' && audioPreview && <div className="flex items-center gap-3 p-2">
                <button onClick={toggleAudioPreview} className="p-2 bg-blue-500 rounded-full hover:bg-blue-600 transition-colors">
                  {isPlayingPreview ? <Pause size={16} className="text-white" /> : <Play size={16} className="text-white" />}
                </button>
                <div className="flex-1">
                  <p className="text-sm text-zinc-300">رسالة صوتية</p>
                  <p className="text-xs text-zinc-400">{formatDuration(recordingDuration)}</p>
                </div>
              </div>}
            <button onClick={clearMedia} className="absolute top-1 right-1 bg-red-500 rounded-full p-1 hover:bg-red-600 transition-colors">
              <X size={14} className="text-white" />
            </button>
          </div>
        </div>}

      {/* Recording Indicator */}
      {isRecording && <div className="mb-3 bg-red-600 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="text-white text-sm">جاري التسجيل... {formatDuration(recordingDuration)}</span>
          </div>
        </div>}

      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* Media Button */}
        <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSending || isRecording} className="flex-shrink-0 h-12 w-12 p-0 bg-zinc-700 hover:bg-zinc-600 transition-colors rounded-xl border border-zinc-600" variant="secondary">
          <Camera size={20} className="text-zinc-300" />
        </Button>

        {/* Voice Button */}
        
        
        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleMediaSelect} className="hidden" />

        {/* Message Input Container */}
        <div className="flex-1 flex items-end gap-3">
          <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="اكتب رسالة..." className="flex-1 min-h-[48px] bg-zinc-700 border-zinc-600 text-white placeholder-zinc-400 rounded-xl px-4 py-3 text-base resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" disabled={isSending || isRecording} style={{
          fontSize: '16px'
        }} />

          {/* Send Button */}
          <Button type="submit" disabled={!message.trim() && !selectedMedia || isSending || isRecording} className="flex-shrink-0 h-12 w-12 p-0 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl">
            <Send size={20} className="text-white" />
          </Button>
        </div>
      </form>
    </div>;
};
export default MediaInput;