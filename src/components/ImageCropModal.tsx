
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ImageCropModalProps {
  imageUrl: string;
  onSave: (croppedImage: File) => void;
  onClose: () => void;
}

const ImageCropModal = ({ imageUrl, onSave, onClose }: ImageCropModalProps) => {
  const [cropArea, setCropArea] = useState({ x: 50, y: 50, size: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({ 
      x: e.clientX - rect.left - cropArea.x, 
      y: e.clientY - rect.top - cropArea.y 
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(rect.width - cropArea.size, e.clientX - rect.left - dragStart.x));
    const newY = Math.max(0, Math.min(rect.height - cropArea.size, e.clientY - rect.top - dragStart.y));
    
    setCropArea(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({ 
      x: touch.clientX - rect.left - cropArea.x, 
      y: touch.clientY - rect.top - cropArea.y 
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(rect.width - cropArea.size, touch.clientX - rect.left - dragStart.x));
    const newY = Math.max(0, Math.min(rect.height - cropArea.size, touch.clientY - rect.top - dragStart.y));
    
    setCropArea(prev => ({ ...prev, x: newX, y: newY }));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const cropImage = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate the scale ratio between displayed image and original image
    const displayedWidth = image.offsetWidth;
    const displayedHeight = image.offsetHeight;
    const scaleX = image.naturalWidth / displayedWidth;
    const scaleY = image.naturalHeight / displayedHeight;

    // Calculate actual crop coordinates in the original image
    const actualX = cropArea.x * scaleX;
    const actualY = cropArea.y * scaleY;
    const actualSize = cropArea.size * Math.min(scaleX, scaleY);

    canvas.width = cropArea.size;
    canvas.height = cropArea.size;

    // Create circular clipping path
    ctx.beginPath();
    ctx.arc(cropArea.size / 2, cropArea.size / 2, cropArea.size / 2, 0, Math.PI * 2);
    ctx.clip();

    // Draw the cropped portion of the original image
    ctx.drawImage(
      image,
      actualX, actualY, actualSize, actualSize,
      0, 0, cropArea.size, cropArea.size
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
        
        <div className="relative mb-4 text-center">
          <div 
            ref={containerRef}
            className="relative inline-block"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ touchAction: 'none' }}
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt="للاقتصاص"
              className="max-w-full h-auto rounded-lg select-none"
              style={{ maxWidth: '300px', maxHeight: '300px' }}
              draggable={false}
            />
            <div
              className="absolute border-2 border-blue-500 cursor-move bg-black/20 rounded-full touch-none"
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.size,
                height: cropArea.size,
              }}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
            >
              <div className="w-full h-full rounded-full border-2 border-white border-dashed opacity-50"></div>
            </div>
          </div>
          <p className="text-sm text-zinc-400 mt-2">اسحب الدائرة لتحديد الجزء المراد اقتصاصه</p>
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
