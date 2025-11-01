import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const ImageGalleryModal = ({ images, initialIndex = 0, isOpen, onClose, title }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      } else if (e.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (!isOpen || !images || images.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-95"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-all"
        aria-label="Kapat"
      >
        <X className="h-8 w-8" />
      </button>

      {/* Previous Button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToPrevious();
          }}
          className="absolute left-4 z-50 p-3 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all"
          aria-label="Önceki"
        >
          <ChevronLeft className="h-8 w-8" />
        </button>
      )}

      {/* Image Container */}
      <div 
        className="relative max-w-7xl max-h-[90vh] w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`${title} - Görsel ${currentIndex + 1}`}
          className="w-full h-full object-contain max-h-[90vh]"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/800x600?text=Resim+Yüklenemedi';
          }}
        />
        
        {/* Image Counter */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-full">
          {currentIndex + 1} / {images.length}
        </div>
      </div>

      {/* Next Button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goToNext();
          }}
          className="absolute right-4 z-50 p-3 text-white bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all"
          aria-label="Sonraki"
        >
          <ChevronRight className="h-8 w-8" />
        </button>
      )}

      {/* Thumbnail Strip (optional) */}
      {images.length > 1 && images.length <= 10 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2 bg-black bg-opacity-70 p-3 rounded-lg max-w-[90vw] overflow-x-auto">
          {images.map((image, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
                idx === currentIndex 
                  ? 'border-white scale-110' 
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGalleryModal;
