import React, { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Upload, X, Video as VideoIcon, Play } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const VideoUpload = ({ entityId, entityType, videos = [], onVideoUploaded, onVideoRemoved }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (file) => {
    if (!file || !file.type.startsWith('video/')) {
      toast.error('Lütfen sadece video dosyası seçin');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      toast.error('Video boyutu 100MB\'dan küçük olmalıdır');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const endpoint = entityType === 'hotel' 
        ? `${API}/hotels/${entityId}/upload-video`
        : `${API}/rooms/${entityId}/upload-video`;

      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        toast.success('Video başarıyla yüklendi!');
        onVideoUploaded && onVideoUploaded(response.data.video_url);
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Video upload error:', error);
      toast.error(error.response?.data?.detail || 'Video yüklenirken hata oluştu');
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveVideo = async (videoUrl) => {
    try {
      const token = localStorage.getItem('token');
      const endpoint = entityType === 'hotel'
        ? `${API}/hotels/${entityId}/videos/${encodeURIComponent(videoUrl)}`
        : `${API}/rooms/${entityId}/videos/${encodeURIComponent(videoUrl)}`;

      await axios.delete(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      toast.success('Video silindi!');
      onVideoRemoved && onVideoRemoved(videoUrl);
    } catch (error) {
      console.error('Video delete error:', error);
      toast.error('Video silinirken hata oluştu');
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
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <VideoIcon className={`mx-auto h-12 w-12 ${dragOver ? 'text-purple-500' : 'text-gray-400'}`} />
        <div className="mt-4">
          <label htmlFor={`video-upload-${entityType}-${entityId}`}>
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => document.getElementById(`video-upload-${entityType}-${entityId}`).click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? `Yükleniyor ${uploadProgress}%` : 'Video Seç'}
            </Button>
          </label>
          <input
            id={`video-upload-${entityType}-${entityId}`}
            type="file"
            className="hidden"
            accept="video/*"
            onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
            disabled={uploading}
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Veya video dosyasını buraya sürükleyin
        </p>
        <p className="mt-1 text-xs text-gray-400">
          MP4, MOV, AVI, WebM (Maks. 100MB)
        </p>
      </div>

      {/* Upload Progress */}
      {uploading && uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
      )}

      {/* Video Grid */}
      {videos && videos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((video, index) => (
            <div key={index} className="relative group">
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video 
                  controls 
                  className="w-full h-full object-cover"
                  preload="metadata"
                >
                  <source src={video} type="video/mp4" />
                  <source src={video} type="video/webm" />
                  Tarayıcınız video etiketini desteklemiyor.
                </video>
              </div>
              <button
                onClick={() => handleRemoveVideo(video)}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Videoyu Sil"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
