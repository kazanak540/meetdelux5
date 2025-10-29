import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Search, MapPin, Star, Building2, Users, Wifi, Coffee, Car, Dumbbell, Utensils } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HotelList = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredHotels, setFilteredHotels] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHotels();
  }, []);

  useEffect(() => {
    filterHotels();
  }, [hotels, searchQuery]);

  const fetchHotels = async () => {
    try {
      const response = await axios.get(`${API}/hotels`);
      setHotels(response.data);
    } catch (error) {
      console.error('Hotels fetch error:', error);
      toast.error('Oteller yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filterHotels = () => {
    if (!searchQuery.trim()) {
      setFilteredHotels(hotels);
      return;
    }

    const filtered = hotels.filter(hotel => 
      hotel.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hotel.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredHotels(filtered);
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const getFacilityIcon = (facility) => {
    const icons = {
      wifi: <Wifi className="h-4 w-4" />,
      parking: <Car className="h-4 w-4" />,
      restaurant: <Utensils className="h-4 w-4" />,
      gym: <Dumbbell className="h-4 w-4" />,
      fitness: <Dumbbell className="h-4 w-4" />,
      spa: <Coffee className="h-4 w-4" />,
      business_center: <Building2 className="h-4 w-4" />,
      concierge: <Users className="h-4 w-4" />
    };
    return icons[facility] || <Building2 className="h-4 w-4" />;
  };

  const getFacilityName = (facility) => {
    const names = {
      wifi: 'WiFi',
      parking: 'Otopark',
      restaurant: 'Restoran',
      gym: 'Spor Salonu',
      fitness: 'Fitness',
      spa: 'Spa',
      business_center: 'İş Merkezi',
      concierge: 'Konsiyerj'
    };
    return names[facility] || facility;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="h-12 bg-gray-300 rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="h-48 bg-gray-300"></div>
                  <div className="p-6">
                    <div className="h-4 bg-gray-300 rounded mb-4"></div>
                    <div className="h-3 bg-gray-300 rounded mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded mb-4"></div>
                    <div className="h-8 bg-gray-300 rounded"></div>
                  </div>
                </div>
              ))}
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
          <h1 data-testid="hotels-title" className="text-3xl font-bold text-gray-900 mb-4">
            Tüm Oteller
          </h1>
          <p className="text-gray-600 mb-6">
            Türkiye'nin en prestijli otellerinin seminer salonlarını keşfedin
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              data-testid="hotel-search-input"
              type="text"
              placeholder="Otel adı veya şehir ara..."
              value={searchQuery}
              onChange={handleSearch}
              className="pl-10 py-3"
            />
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6">
          <p className="text-gray-600">
            <span className="font-semibold">{filteredHotels.length}</span> otel bulundu
            {searchQuery && (
              <span>
                {' '}"
                <span className="font-medium text-indigo-600">{searchQuery}</span>
                " için
              </span>
            )}
          </p>
        </div>

        {/* Hotels Grid */}
        {filteredHotels.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Building2 className="h-16 w-16 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-900">
                {searchQuery ? 'Arama sonuç bulunamadı' : 'Henüz otel bulunmuyor'}
              </h3>
              <p className="text-gray-500 max-w-md">
                {searchQuery 
                  ? 'Arama kriterlerinizi değiştirerek tekrar deneyin.'
                  : 'Yakında daha fazla otel eklenecek.'
                }
              </p>
              {searchQuery && (
                <Button onClick={() => setSearchQuery('')} variant="outline">
                  Aramayı Temizle
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHotels.map((hotel) => (
              <Card 
                key={hotel.id} 
                className="overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
                onClick={() => navigate(`/hotels/${hotel.id}`)}
              >
                {/* Hotel Image */}
                <div className="h-48 bg-gradient-to-br from-indigo-400 to-purple-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all duration-300"></div>
                  
                  {/* Star Rating */}
                  <div className="absolute top-4 right-4">
                    <div className="flex items-center space-x-1 bg-white/90 px-2 py-1 rounded-full">
                      {[...Array(hotel.star_rating || 5)].map((_, i) => (
                        <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                  
                  {/* Location */}
                  <div className="absolute bottom-4 left-4 text-white">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm font-medium">{hotel.city}</span>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  {/* Hotel Name */}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {hotel.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {hotel.description || 'Premium otel konferans salonları'}
                  </p>
                  
                  {/* Address */}
                  <p className="text-sm text-gray-500 mb-4">
                    {hotel.address}
                  </p>
                  
                  {/* Facilities */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {hotel.facilities?.slice(0, 4).map((facility, index) => (
                      <div key={index} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-full text-xs text-gray-700">
                        {getFacilityIcon(facility)}
                        <span>{getFacilityName(facility)}</span>
                      </div>
                    ))}
                    {hotel.facilities?.length > 4 && (
                      <div className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs">
                        +{hotel.facilities.length - 4} daha
                      </div>
                    )}
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">{hotel.total_reviews || 0}</span> değerlendirme
                    </div>
                    <Button 
                      size="sm" 
                      className="group-hover:bg-indigo-600 group-hover:text-white transition-all"
                      variant="outline"
                    >
                      Detayları Gör
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelList;