import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../App';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, Users, Building2, DollarSign } from 'lucide-react';
import ImageUpload from './ImageUpload';
import VideoUpload from './VideoUpload';
import { toast } from 'sonner';
import { useCurrency } from '../hooks/useCurrency';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateRoomModal = ({ isOpen, onClose, onSuccess, defaultRoomType = 'conference' }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [hotels, setHotels] = useState([]);
  const { getCurrencySymbol } = useCurrency();
  const [formData, setFormData] = useState({
    hotel_id: '',
    room_type: defaultRoomType,
    name: '',
    description: '',
    capacity: '',
    area_sqm: '',
    price_per_day: '',
    price_per_hour: '',
    currency: 'EUR',
    features: [],
    layout_options: [],
    images: [],
    videos: []
  });

  const availableFeatures = [
    'projector', 'sound_system', 'whiteboard', 'wifi', 'air_conditioning', 
    'microphones', 'stage', 'lighting_system', 'screen', 'flipchart',
    'dance_floor', 'bar', 'dj_booth', 'vip_area', 'cloakroom', 
    'photo_booth', 'led_walls', 'mirror_ball', 'fog_machine', 'live_music_setup'
  ];

  const featureNames = {
    projector: 'Projektör',
    sound_system: 'Ses Sistemi',
    whiteboard: 'Beyaz Tahta',
    wifi: 'WiFi',
    air_conditioning: 'Klima',
    microphones: 'Mikrofon',
    stage: 'Sahne',
    lighting_system: 'Işık Sistemi',
    screen: 'Ekran',
    flipchart: 'Flipchart',
    dance_floor: 'Dans Pisti',
    bar: 'Bar',
    dj_booth: 'DJ Kabini',
    vip_area: 'VIP Alan',
    cloakroom: 'Vestiyer',
    photo_booth: 'Fotoğraf Köşesi',
    led_walls: 'LED Ekranlar',
    mirror_ball: 'Ayna Küre',
    fog_machine: 'Sis Makinesi',
    live_music_setup: 'Canlı Müzik Düzeni'
  };

  const availableLayouts = [
    'theater', 'classroom', 'u_shape', 'boardroom', 'banquet', 'cocktail',
    'cabaret', 'hollow_square', 'reception', 'wedding'
  ];

  const layoutNames = {
    theater: 'Tiyatro Düzeni',
    classroom: 'Sınıf Düzeni',
    u_shape: 'U Düzeni',
    boardroom: 'Toplantı Masası',
    banquet: 'Banket Düzeni',
    cocktail: 'Kokteyl Düzeni',
    cabaret: 'Cabaret Düzeni',
    hollow_square: 'Kare Masa Düzeni',
    reception: 'Resepsiyon Düzeni',
    wedding: 'Düğün Düzeni'
  };

  useEffect(() => {
    if (isOpen) {
      fetchUserHotels();
      // Set default room type when modal opens
      setFormData(prev => ({ ...prev, room_type: defaultRoomType }));
    }
  }, [isOpen, defaultRoomType]);

  const fetchUserHotels = async () => {
    try {
      const response = await axios.get(`${API}/hotels`);
      if (user.role === 'hotel_manager') {
        // Filter hotels managed by current user
        const userHotels = response.data.filter(hotel => hotel.manager_id === user.id);
        setHotels(userHotels);
      } else {
        // Admin can see all hotels
        setHotels(response.data);
      }
    } catch (error) {
      console.error('Hotels fetch error:', error);
      toast.error('Oteller yüklenirken hata oluştu');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const handleLayoutToggle = (layout) => {
    setFormData(prev => ({
      ...prev,
      layout_options: prev.layout_options.includes(layout)
        ? prev.layout_options.filter(l => l !== layout)
        : [...prev.layout_options, layout]
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const roomData = {
        ...formData,
        capacity: parseInt(formData.capacity),
        area_sqm: formData.area_sqm ? parseFloat(formData.area_sqm) : null,
        price_per_day: parseFloat(formData.price_per_day),
        price_per_hour: formData.price_per_hour ? parseFloat(formData.price_per_hour) : null,
        images: formData.images,
        is_available: true
      };

      const response = await axios.post(`${API}/hotels/${formData.hotel_id}/rooms`, roomData);
      
      toast.success('Seminer salonu başarıyla oluşturuldu!');
      onSuccess(response.data);
      onClose();
      
      // Reset form
      setFormData({
        hotel_id: '',
        room_type: 'conference',
        name: '',
        description: '',
        capacity: '',
        area_sqm: '',
        price_per_day: '',
        price_per_hour: '',
        currency: 'EUR',
        features: [],
        layout_options: [],
        images: []
      });
    } catch (error) {
      console.error('Room creation error:', error);
      toast.error(error.response?.data?.detail || 'Salon oluşturulurken hata oluştu');
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
            {defaultRoomType === 'ballroom' ? (
              <>
                <span className="text-3xl">🎭</span>
                <h2 className="text-xl font-semibold text-gray-900">Yeni Balo Salonu Ekle</h2>
              </>
            ) : (
              <>
                <Users className="h-6 w-6 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">Yeni Seminer Salonu Ekle</h2>
              </>
            )}
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
          {/* Hotel Selection */}
          <div>
            <Label htmlFor="hotel_id">Otel Seçimi *</Label>
            <Select value={formData.hotel_id} onValueChange={(value) => setFormData(prev => ({ ...prev, hotel_id: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Otel seçin" />
              </SelectTrigger>
              <SelectContent>
                {hotels.map((hotel) => (
                  <SelectItem key={hotel.id} value={hotel.id}>
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4" />
                      <span>{hotel.name} - {hotel.city}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hotels.length === 0 && (
              <p className="text-sm text-red-600 mt-1">
                Henüz otel bulunamadı. Önce bir otel oluşturmanız gerekiyor.
              </p>
            )}
          </div>

          {/* Room Type */}
          <div>
            <Label htmlFor="room_type">Salon Türü</Label>
            <Select value={formData.room_type || 'conference'} onValueChange={(value) => setFormData(prev => ({ ...prev, room_type: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Salon türünü seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conference">
                  <div>
                    <div className="font-medium">Konferans Salonu</div>
                    <div className="text-xs text-gray-500">Büyük etkinlikler için (100+ kişi)</div>
                  </div>
                </SelectItem>
                <SelectItem value="meeting">
                  <div>
                    <div className="font-medium">Toplantı Salonu</div>
                    <div className="text-xs text-gray-500">Küçük grup toplantıları (10-50 kişi)</div>
                  </div>
                </SelectItem>
                <SelectItem value="ballroom">
                  <div>
                    <div className="font-medium">Balo Salonu</div>
                    <div className="text-xs text-gray-500">Gala ve özel etkinlikler (200+ kişi)</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Salon Adı *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="Örn: Executive Konferans Salonu"
              />
            </div>
            
            <div>
              <Label htmlFor="capacity">Kapasite (Kişi) *</Label>
              <div className="relative mt-1">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min="1"
                  required
                  value={formData.capacity}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder="150"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="area_sqm">Alan (m²)</Label>
              <Input
                id="area_sqm"
                name="area_sqm"
                type="number"
                min="0"
                step="0.1"
                value={formData.area_sqm}
                onChange={handleInputChange}
                className="mt-1"
                placeholder="200"
              />
            </div>
          </div>

          {/* Currency Selection */}
          <div>
            <Label htmlFor="currency">Para Birimi *</Label>
            <Select name="currency" value={formData.currency} onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Para birimi seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR (€) - Euro</SelectItem>
                <SelectItem value="USD">USD ($) - Amerikan Doları</SelectItem>
                <SelectItem value="TRY">TRY (₺) - Türk Lirası</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 mt-1">
              💡 EUR/USD bazında fiyat girmeniz önerilir. Müşteriler kendi para birimlerinde görecektir.
            </p>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price_per_day">Günlük Fiyat ({formData.currency === 'EUR' ? '€' : formData.currency === 'USD' ? '$' : '₺'}) *</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="price_per_day"
                  name="price_per_day"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.price_per_day}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder={formData.currency === 'EUR' ? '80' : formData.currency === 'USD' ? '90' : '2500'}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="price_per_hour">Saatlik Fiyat ({formData.currency === 'EUR' ? '€' : formData.currency === 'USD' ? '$' : '₺'})</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="price_per_hour"
                  name="price_per_hour"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price_per_hour}
                  onChange={handleInputChange}
                  className="pl-10"
                  placeholder={formData.currency === 'EUR' ? '12' : formData.currency === 'USD' ? '14' : '350'}
                />
              </div>
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
              placeholder="Salon hakkında detaylı açıklama..."
            />
          </div>

          {/* Images */}
          <div>
            <Label>Salon Görselleri</Label>
            <div className="mt-2">
              <ImageUpload
                onImageUploaded={handleImageUploaded}
                onImageRemoved={handleImageRemoved}
                images={formData.images}
                maxImages={5}
              />
            </div>
            {formData.images.length > 0 && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Salon görseli ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleImageRemoved(image, index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Features */}
          <div>
            <Label>Salon Özellikleri</Label>
            {formData.room_type === 'ballroom' && (
              <div className="mt-2 mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800 font-medium">🎭 Balo Salonu İpuçları:</p>
                <ul className="text-xs text-purple-700 mt-1 ml-4 list-disc space-y-1">
                  <li>Dans pisti, bar ve VIP alan gibi özel özellikleri seçin</li>
                  <li>Işık sistemi ve sahne özellikleri balo salonları için önemlidir</li>
                  <li>Düğün ve gala etkinlikleri için uygun düzenlemeleri işaretleyin</li>
                </ul>
              </div>
            )}
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableFeatures.map((feature) => (
                <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.features.includes(feature)}
                    onChange={() => handleFeatureToggle(feature)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{featureNames[feature]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Layout Options */}
          <div>
            <Label>Oturma Düzenleri</Label>
            {formData.room_type === 'ballroom' && (
              <div className="mt-2 mb-3 p-3 bg-pink-50 border border-pink-200 rounded-lg">
                <p className="text-sm text-pink-800 font-medium">💝 Balo Salonu Düzenleri:</p>
                <ul className="text-xs text-pink-700 mt-1 ml-4 list-disc space-y-1">
                  <li>Banket ve düğün düzenleri balo salonları için idealdir</li>
                  <li>Kokteyl ve resepsiyon düzenleri ayakta parti için uygundur</li>
                  <li>Cabaret düzeni yemekli etkinlikler için önerilir</li>
                </ul>
              </div>
            )}
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableLayouts.map((layout) => (
                <label key={layout} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.layout_options.includes(layout)}
                    onChange={() => handleLayoutToggle(layout)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">{layoutNames[layout]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={onClose}>
              İptal
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.hotel_id} 
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Oluşturuluyor...
                </div>
              ) : (
                'Salon Oluştur'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoomModal;