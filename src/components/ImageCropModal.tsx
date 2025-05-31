
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ImageCropModalProps {
  imageUrl: string;
  onSave: (croppedImage: File) => void;
  onClose: () => void;
}

const ImageCropModal = ({ imageUrl, onSave, onClose }: ImageCropModalProps) => {
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const newX = Math.max(0, Math.min(300 - cropArea.width, e.clientX - dragStart.x));
    const newY = Math.max(0, Math.min(300 - cropArea.height, e.clientY - dragStart.y));
    
    setCropArea(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const cropImage = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    ctx.drawImage(
      image,
      cropArea.x, cropArea.y, cropArea.width, cropArea.height,
      0, 0, cropArea.width, cropArea.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
        onSave(file);
      }
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">اقتصاص الصورة</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="relative mb-4">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="للاقتصاص"
            className="w-full h-80 object-cover rounded-lg"
            style={{ maxWidth: '300px', maxHeight: '300px' }}
          />
          <div
            className="absolute border-2 border-blue-500 cursor-move"
            style={{
              left: cropArea.x,
              top: cropArea.y,
              width: cropArea.width,
              height: cropArea.height,
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          />
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
        
        <div className="flex space-x-3">
          <Button onClick={cropImage} className="flex-1 bg-blue-500 hover:bg-blue-600">
            حفظ
          </Button>
          <Button onClick={onClose} variant="outline" className="flex-1">
            إلغاء
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImageCropModal;
