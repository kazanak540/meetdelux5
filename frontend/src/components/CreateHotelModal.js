import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Building2, MapPin, Mail, Phone, Globe, Star, CheckCircle2 } from 'lucide-react';
import ImageUpload from './ImageUpload';
import VideoUpload from './VideoUpload';
import GooglePlacesAutocomplete from './GooglePlacesAutocomplete';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateHotelModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [placeSelected, setPlaceSelected] = useState(false);
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
    images: []
  });

  const availableFacilities = [
    'wifi', 'parking', 'restaurant', 'gym', 'fitness', 'spa', 
    'business_center', 'concierge', 'pool', 'bar', 'room_service'
  ];

  const facilityNames = {
    wifi: 'WiFi',
    parking: 'Otopark',
    restaurant: 'Restoran',
    gym: 'Spor Salonu',
    fitness: 'Fitness',
    spa: 'Spa',
    business_center: 'İş Merkezi',
    concierge: 'Konsiyerj',
    pool: 'Havuz',
    bar: 'Bar',
    room_service: 'Oda Servisi'
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const handleImageRemoved = (imageUrl, index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handlePlaceSelected = (place) => {
    if (place) {
      setFormData(prev => ({
        ...prev,
        name: place.name || '',
        address: place.formatted_address || '',
        city: place.city || '',
        phone: place.phone || '',
        website: place.website || '',
        latitude: place.geometry?.location?.lat()?.toString() || '',
        longitude: place.geometry?.location?.lng()?.toString() || ''
      }));
      setPlaceSelected(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const hotelData = {
        name: formData.name,
        description: formData.description,
        address: formData.address,
        city: formData.city,
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        star_rating: parseInt(formData.star_rating),
        facilities: formData.facilities,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        images: [] // Empty initially
      };

      // Create hotel first
      const response = await axios.post(`${API}/hotels`, hotelData);
      const createdHotel = response.data;
      
      toast.success('Otel başarıyla oluşturuldu!');
      
      // Upload images if any
      if (formData.images.length > 0) {
        toast.info(`${formData.images.length} fotoğraf yükleniyor...`);
        
        const uploadPromises = formData.images.map(async (imageData) => {
          if (imageData.isTemp && imageData.file) {
            const formDataUpload = new FormData();
            formDataUpload.append('file', imageData.file);
            
            try {
              await axios.post(
                `${API}/hotels/${createdHotel.id}/upload-image`, 
                formDataUpload,
                { headers: { 'Content-Type': 'multipart/form-data' } }
              );
            } catch (err) {
              console.error('Image upload error:', err);
            }
          }
        });
        
        await Promise.all(uploadPromises);
        toast.success('Tüm fotoğraflar yüklendi!');
      }
      
      onSuccess(createdHotel);
      onClose();
      
      // Reset form
      setFormData({
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
        images: []
      });
    } catch (error) {
      console.error('Hotel creation error:', error);
      toast.error(error.response?.data?.detail || 'Otel oluşturulurken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">Yeni Otel Ekle</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Otel Adı *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="Örn: Swissotel Istanbul"
              />
            </div>
            
            <div>
              <Label htmlFor="city">Şehir *</Label>
              <div className="relative mt-1">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="city"
                  name="city"
                  type="text"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="İstanbul"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="star_rating">Yıldız Sayısı</Label>
              <Select value={formData.star_rating.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, star_rating: parseInt(value) }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <SelectItem key={star} value={star.toString()}>
                      <div className="flex items-center space-x-2">
                        <div className="flex">
                          {[...Array(star)].map((_, i) => (
                            <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <span>{star} Yıldız</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Adres *</Label>
            <Input
              id="address"
              name="address"
              type="text"
              required
              value={formData.address}
              onChange={handleInputChange}
              className="mt-1"
              placeholder="Tam adres bilgisi"
            />
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Telefon *</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="+90 212 XXX XX XX"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="email">E-posta *</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="info@otel.com"
                />
              </div>
            </div>
          </div>

          {/* Website */}
          <div>
            <Label htmlFor="website">Web Sitesi</Label>
            <div className="relative mt-1">
              <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                className="pl-10"
                placeholder="https://www.otel.com"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1"
              rows={3}
              placeholder="Otel hakkında kısa açıklama..."
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Enlem (Latitude)</Label>
              <Input
                id="latitude"
                name="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="41.0082"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Boylam (Longitude)</Label>
              <Input
                id="longitude"
                name="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="28.9784"
              />
            </div>
          </div>

          {/* Facilities */}
          <div>
            <Label>Otel Olanakları</Label>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableFacilities.map((facility) => (
                <label key={facility} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.facilities.includes(facility)}
                    onChange={() => handleFacilityToggle(facility)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{facilityNames[facility]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <Label>Otel Fotoğrafları</Label>
            <div className="mt-2">
              <ImageUpload
                entityId="temp-hotel"
                entityType="hotel"
                tempMode={true}
                images={formData.images}
                onImageUploaded={handleImageUploaded}
                onImageRemoved={handleImageRemoved}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Oluşturuluyor...
                </div>
              ) : (
                'Otel Oluştur'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateHotelModal;