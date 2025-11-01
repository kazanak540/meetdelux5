import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Save, Building2, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import ImageUpload from './ImageUpload';
import VideoUpload from './VideoUpload';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const EditHotelModal = ({ isOpen, onClose, hotel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    website: '',
    star_rating: 5,
    facilities: [],
    latitude: '',
    longitude: '',
    images: [],
    videos: []
  });

  const facilities = {
    wifi: 'Wi-Fi',
    parking: 'Otopark',
    restaurant: 'Restoran',
    gym: 'Spor Salonu',
    pool: 'Yüzme Havuzu',
    spa: 'Spa',
    business_center: 'İş Merkezi',
    concierge: 'Konsiyerj',
    room_service: 'Oda Servisi',
    bar: 'Bar',
    conference_rooms: 'Toplantı Salonları',
    laundry: 'Çamaşırhane',
    airport_shuttle: 'Havaalanı Servisi',
    pet_friendly: 'Evcil Hayvan Dostu'
  };

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name || '',
        description: hotel.description || '',
        address: hotel.address || '',
        city: hotel.city || '',
        phone: hotel.phone || '',
        email: hotel.email || '',
        website: hotel.website || '',
        star_rating: hotel.star_rating || 5,
        facilities: hotel.facilities || [],
        latitude: hotel.latitude || '',
        longitude: hotel.longitude || '',
        images: hotel.images || [],
        videos: hotel.videos || []
      });
    }
  }, [hotel]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/hotels/${hotel.id}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      toast.success('Otel bilgileri başarıyla güncellendi!');
      onSuccess && onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error updating hotel:', error);
      toast.error(error.response?.data?.detail || 'Otel güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleFacilityToggle = (facility) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.includes(facility)
        ? prev.facilities.filter(f => f !== facility)
        : [...prev.facilities, facility]
    }));
  };

  const handleImageUploaded = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl]
    }));
  };

  const handleImageRemoved = (imageUrl) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageUrl)
    }));
  };

  const handleVideoUploaded = (videoUrl) => {
    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, videoUrl]
    }));
  };

  const handleVideoRemoved = (videoUrl) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter(v => v !== videoUrl)
    }));
  };

  const handlePlaceSelected = (place) => {
    if (place) {
      setFormData(prev => ({
        ...prev,
        address: place.formatted_address,
        city: place.city || prev.city,
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng()
      }));
    }
  };

  if (!hotel) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="h-6 w-6 text-indigo-600" />
              <span>Otel Düzenle: {hotel.name}</span>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Temel Bilgiler</h3>
            
            {/* Hotel Name */}
            <div>
              <Label>Otel Adı *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Örn: Grand Hotel İstanbul"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label>Açıklama</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Otel hakkında detaylı bilgi..."
                rows={4}
              />
            </div>

            {/* Star Rating */}
            <div>
              <Label>Yıldız Sayısı</Label>
              <Select
                value={formData.star_rating?.toString()}
                onValueChange={(value) => setFormData(prev => ({ ...prev, star_rating: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(star => (
                    <SelectItem key={star} value={star.toString()}>
                      {'⭐'.repeat(star)} ({star} Yıldız)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Konum Bilgileri</h3>
            
            {/* Google Places */}
            <div>
              <Label>Adres Ara (Google Maps)</Label>
              <GooglePlacesAutocomplete
                onPlaceSelected={handlePlaceSelected}
                placeholder="Adres arayın..."
              />
            </div>

            {/* Address */}
            <div>
              <Label>Adres *</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Tam adres"
                required
              />
            </div>

            {/* City */}
            <div>
              <Label>Şehir *</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Örn: İstanbul"
                required
              />
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Enlem (Latitude)</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, latitude: e.target.value }))}
                  placeholder="41.0082"
                />
              </div>
              <div>
                <Label>Boylam (Longitude)</Label>
                <Input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData(prev => ({ ...prev, longitude: e.target.value }))}
                  placeholder="28.9784"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">İletişim Bilgileri</h3>
            
            {/* Phone */}
            <div>
              <Label>Telefon *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+90 212 XXX XX XX"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label>E-posta *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="info@hotel.com"
                required
              />
            </div>

            {/* Website */}
            <div>
              <Label>Website</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://www.hotel.com"
              />
            </div>
          </div>

          {/* Facilities */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Otel Olanakları</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(facilities).map(([key, label]) => (
                <Label key={key} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(key)}
                    onChange={() => handleFacilityToggle(key)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">{label}</span>
                </Label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Otel Fotoğrafları</h3>
            <ImageUpload
              entityId={hotel.id}
              entityType="hotel"
              images={formData.images}
              onImageUploaded={handleImageUploaded}
              onImageRemoved={handleImageRemoved}
            />
          </div>

          {/* Videos */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">Tanıtım Videoları</h3>
            <VideoUpload
              entityId={hotel.id}
              entityType="hotel"
              videos={formData.videos}
              onVideoUploaded={handleVideoUploaded}
              onVideoRemoved={handleVideoRemoved}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Değişiklikleri Kaydet
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditHotelModal;
