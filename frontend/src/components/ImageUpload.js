import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ImageUpload = ({ entityId, entityType, images = [], onImageUploaded, onImageRemoved, tempMode = false }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Lütfen sadece resim dosyası seçin');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    // If in temp mode (creating new entity), just store file for preview
    if (tempMode || entityId === 'temp-hotel' || entityId === 'temp-room') {
      const reader = new FileReader();
      reader.onloadend = () => {
        const previewData = {
          file: file,
          preview: reader.result,
          isTemp: true
        };
        onImageUploaded && onImageUploaded(previewData);
        toast.success('Fotoğraf eklendi! Kaydettiğinizde yüklenecek.');
      };
      reader.readAsDataURL(file);
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = entityType === 'hotel' 
        ? `${API}/hotels/${entityId}/upload-image`
        : `${API}/rooms/${entityId}/upload-image`;

      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Fotoğraf başarıyla yüklendi!');
        onImageUploaded && onImageUploaded(response.data.image_url);
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(error.response?.data?.detail || 'Fotoğraf yüklenirken hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          className="hidden"
          id={`image-upload-${entityId}`}
        />
        
        <div className="space-y-3">
          <Upload className="h-12 w-12 text-gray-400 mx-auto" />
          <div>
            <p className="text-sm text-gray-600">
              Fotoğrafı buraya sürükleyin veya 
              <label 
                htmlFor={`image-upload-${entityId}`}
                className="text-indigo-600 hover:text-indigo-700 cursor-pointer font-medium ml-1"
              >
                dosya seçin
              </label>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF formatları desteklenir (Maksimum 5MB)
            </p>
          </div>
          
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => document.getElementById(`image-upload-${entityId}`).click()}
          >
            {uploading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                Yükleniyor...
              </div>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Fotoğraf Seç
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Yüklenen Fotoğraflar ({images.length})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((imageData, index) => {
              const imageUrl = typeof imageData === 'string' ? imageData : imageData.preview;
              const isTemp = typeof imageData === 'object' && imageData.isTemp;
              
              return (
              <div key={index} className="relative group aspect-square">
                {isTemp && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded z-10">
                    Bekliyor
                  </div>
                )}
                <img
                  src={imageUrl}
                  alt={`Uploaded image ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="%23f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="%236b7280">Resim Yüklenemedi</text></svg>';
                  }}
                />
                
                {/* Remove button */}
                {onImageRemoved && (
                  <button
                    onClick={() => onImageRemoved(imageData, index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
                
                {/* View button */}
                {!isTemp && (
                  <button
                    onClick={() => window.open(imageUrl, '_blank')}
                    className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-opacity-75"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;