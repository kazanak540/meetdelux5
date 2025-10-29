import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, MapPin, Users, TrendingUp, Wifi, Mic, Monitor, Snowflake, Volume2, Presentation, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '../hooks/useCurrency';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RoomSearch = () => {
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { formatPrice, currency, loading: currencyLoading } = useCurrency();

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    min_capacity: '',
    max_price: '',
    features: []
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!loading) {
      searchRooms();
    }
  }, [filters, loading]);

  const fetchInitialData = async () => {
    try {
      const [roomsResponse, hotelsResponse] = await Promise.all([
        axios.get(`${API}/rooms`),
        axios.get(`${API}/hotels`)
      ]);
      
      setRooms(roomsResponse.data);
      setHotels(hotelsResponse.data);
      
      // If there's a city parameter, trigger search immediately
      if (searchParams.get('city')) {
        searchRooms();
      }
    } catch (error) {
      console.error('Initial data fetch error:', error);
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const searchRooms = async () => {
    try {
      const params = new URLSearchParams();
      
      if (filters.city) params.append('city', filters.city);
      if (filters.min_capacity) params.append('min_capacity', filters.min_capacity);
      if (filters.max_price) params.append('max_price', filters.max_price);
      if (filters.features.length > 0) params.append('features', filters.features.join(','));
      
      const response = await axios.get(`${API}/rooms?${params.toString()}`);
      setRooms(response.data);
    } catch (error) {
      console.error('Room search error:', error);
      toast.error('Arama sırasında hata oluştu');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFilters(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const clearFilters = () => {
    setFilters({
      city: '',
      min_capacity: '',
      max_price: '',
      features: []
    });
  };

  const getHotelName = (hotelId) => {
    const hotel = hotels.find(h => h.id === hotelId);
    return hotel ? hotel.name : 'Bilinmeyen Otel';
  };

  const getHotelCity = (hotelId) => {
    const hotel = hotels.find(h => h.id === hotelId);
    return hotel ? hotel.city : 'Bilinmeyen Şehir';
  };

  const getFeatureIcon = (feature) => {
    const icons = {
      projector: <Monitor className="h-4 w-4" />,
      sound_system: <Volume2 className="h-4 w-4" />,
      whiteboard: <Presentation className="h-4 w-4" />,
      wifi: <Wifi className="h-4 w-4" />,
      air_conditioning: <Snowflake className="h-4 w-4" />,
      microphones: <Mic className="h-4 w-4" />
    };
    return icons[feature] || <Monitor className="h-4 w-4" />;
  };

  const getFeatureName = (feature) => {
    const names = {
      projector: 'Projeksiör',
      sound_system: 'Ses Sistemi',
      whiteboard: 'Beyaz Tahta',
      wifi: 'WiFi',
      air_conditioning: 'Klima',
      microphones: 'Mikrofon',
      stage: 'Sahne',
      lighting_system: 'Işık Sistemi'
    };
    return names[feature] || feature;
  };

  const availableFeatures = [
    'projector', 'sound_system', 'whiteboard', 'wifi', 'air_conditioning', 'microphones'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="flex gap-8">
              <div className="w-80 h-96 bg-gray-300 rounded"></div>
              <div className="flex-1 space-y-6">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-48 bg-gray-300 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 data-testid="room-search-title" className="text-3xl font-bold text-gray-900 mb-4">
            Seminer Salonu Ara
          </h1>
          <p className="text-gray-600">
            İhtiyacınıza uygun seminer salonunu bulun ve rezervasyon yapın
          </p>
        </div>

        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-80">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5" />
                  <span>Filtreler</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* City Filter */}
                <div>
                  <Label htmlFor="city">Şehir</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      data-testid="city-filter-input"
                      id="city"
                      type="text"
                      placeholder="Şehir adı..."
                      value={filters.city}
                      onChange={(e) => handleFilterChange('city', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Capacity Filter */}
                <div>
                  <Label htmlFor="min_capacity">Minimum Kapasite</Label>
                  <div className="relative mt-1">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      data-testid="capacity-filter-input"
                      id="min_capacity"
                      type="number"
                      placeholder="Minimum kişi sayısı..."
                      value={filters.min_capacity}
                      onChange={(e) => handleFilterChange('min_capacity', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <Label htmlFor="max_price">Maksimum Fiyat (Günlük)</Label>
                  <div className="relative mt-1">
                    <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      data-testid="price-filter-input"
                      id="max_price"
                      type="number"
                      placeholder="Maksimum fiyat..."
                      value={filters.max_price}
                      onChange={(e) => handleFilterChange('max_price', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Features Filter */}
                <div>
                  <Label>Özellikler</Label>
                  <div className="mt-2 space-y-2">
                    {availableFeatures.map((feature) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={feature}
                          checked={filters.features.includes(feature)}
                          onChange={() => handleFeatureToggle(feature)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor={feature} className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                          {getFeatureIcon(feature)}
                          <span>{getFeatureName(feature)}</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Filtreleri Temizle
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="flex-1">
            {/* Results Summary */}
            <div className="mb-6">
              <p className="text-gray-600">
                <span className="font-semibold">{rooms.length}</span> seminer salonu bulundu
              </p>
            </div>

            {/* Rooms List */}
            {rooms.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <Search className="h-16 w-16 text-gray-300" />
                  <h3 className="text-xl font-medium text-gray-900">
                    Arama sonuç bulunamadı
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    Arama kriterlerinizi değiştirerek tekrar deneyin.
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Filtreleri Temizle
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-6">
                {rooms.map((room) => (
                  <Card 
                    key={room.id} 
                    className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/rooms/${room.id}`)}
                  >
                    <div className="flex">
                      {/* Room Image */}
                      <div className="w-80 h-64 bg-gradient-to-br from-purple-400 to-indigo-500 relative">
                        <div className="absolute inset-0 bg-black/20"></div>
                        <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-sm font-medium">
                          <Users className="inline h-4 w-4 mr-1" />
                          {room.capacity} kişi
                        </div>
                        <div className="absolute bottom-4 left-4 text-white">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span className="text-sm">{getHotelCity(room.hotel_id)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Room Details */}
                      <CardContent className="flex-1 p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                              {room.name}
                            </h3>
                            <p className="text-indigo-600 font-medium mb-1">
                              {getHotelName(room.hotel_id)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-indigo-600">
                              {formatPrice(room.pricing_info ? room.pricing_info.display_price : room.price_per_day, room.currency || 'EUR')}
                            </div>
                            <div className="text-sm text-gray-500">günlük</div>
                            {room.price_per_hour && (
                              <div className="text-sm text-gray-600 mt-1">
                                {room.pricing_info?.display_price_per_hour 
                                  ? formatPrice(room.pricing_info.display_price_per_hour, room.currency || 'EUR')
                                  : formatPrice(room.price_per_hour, room.currency || 'EUR')
                                } / saat
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {room.description}
                        </p>
                        
                        {/* Room Details */}
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Kapasite:</span> {room.capacity} kişi
                          </div>
                          {room.area_sqm && (
                            <div>
                              <span className="font-medium">Alan:</span> {room.area_sqm} m²
                            </div>
                          )}
                        </div>
                        
                        {/* Features */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {room.features?.slice(0, 6).map((feature, index) => (
                            <div key={index} className="flex items-center space-x-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs">
                              {getFeatureIcon(feature)}
                              <span>{getFeatureName(feature)}</span>
                            </div>
                          ))}
                          {room.features?.length > 6 && (
                            <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                              +{room.features.length - 6} daha
                            </div>
                          )}
                        </div>
                        
                        {/* Action */}
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">{room.total_bookings || 0}</span> rezervasyon
                          </div>
                          <Button className="bg-indigo-600 hover:bg-indigo-700">
                            Detayları Gör
                          </Button>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomSearch;