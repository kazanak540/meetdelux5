import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { MapPin, Star, Phone, Mail, Globe, Users, Wifi, Car, Utensils, Dumbbell, Coffee, Building2, Monitor, Volume2, Snowflake } from 'lucide-react';
import GoogleMap from './GoogleMap';
import { toast } from 'sonner';
import useCurrency from '../hooks/useCurrency';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { formatPrice, currency } = useCurrency();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  
  // Check if user is admin
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (e) {
        console.error('Error parsing user:', e);
      }
    }
  }, []);

  useEffect(() => {
    fetchHotelDetails();
  }, [id]);

  const fetchHotelDetails = async () => {
    try {
      const [hotelResponse, roomsResponse, servicesResponse] = await Promise.all([
        axios.get(`${API}/hotels/${id}`),
        axios.get(`${API}/hotels/${id}/rooms`),
        axios.get(`${API}/hotels/${id}/services`).catch(() => ({ data: [] }))
      ]);
      
      setHotel(hotelResponse.data);
      setRooms(roomsResponse.data);
      setServices(servicesResponse.data);
    } catch (error) {
      console.error('Hotel details fetch error:', error);
      toast.error('Otel bilgileri yüklenirken hata oluştu');
      if (error.response?.status === 404) {
        navigate('/hotels');
      }
    } finally {
      setLoading(false);
    }
  };

  const getFacilityIcon = (facility) => {
    const icons = {
      wifi: <Wifi className="h-5 w-5" />,
      parking: <Car className="h-5 w-5" />,
      restaurant: <Utensils className="h-5 w-5" />,
      gym: <Dumbbell className="h-5 w-5" />,
      fitness: <Dumbbell className="h-5 w-5" />,
      spa: <Coffee className="h-5 w-5" />,
      business_center: <Building2 className="h-5 w-5" />,
      concierge: <Users className="h-5 w-5" />
    };
    return icons[facility] || <Building2 className="h-5 w-5" />;
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

  const getFeatureIcon = (feature) => {
    const icons = {
      projector: <Monitor className="h-4 w-4" />,
      sound_system: <Volume2 className="h-4 w-4" />,
      whiteboard: <Building2 className="h-4 w-4" />,
      wifi: <Wifi className="h-4 w-4" />,
      air_conditioning: <Snowflake className="h-4 w-4" />,
      microphones: <Volume2 className="h-4 w-4" />
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-64 bg-gray-300 rounded-lg mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                <div className="h-20 bg-gray-300 rounded"></div>
                <div className="h-40 bg-gray-300 rounded"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-gray-300 rounded"></div>
                <div className="h-48 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Otel bulunamadı</h3>
          <p className="text-gray-500 mb-4">Aradığınız otel mevcut değil.</p>
          <Button onClick={() => navigate('/hotels')} variant="outline">
            Otellere Dön
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-64 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-8">
          <div className="text-white">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-5 w-5" />
              <span>{hotel.city}</span>
            </div>
            <h1 data-testid="hotel-detail-title" className="text-4xl font-bold mb-2">{hotel.name}</h1>
            <div className="flex items-center space-x-1">
              {[...Array(hotel.star_rating || 5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
              ))}
              <span className="ml-2 text-indigo-100">{hotel.star_rating} yıldızlı otel</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hotel Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Otel Hakkında</h2>
                <p className="text-gray-600 mb-6">
                  {hotel.description || 'Bu otel modern seminer salonları ile iş dünyasının ihtiyaçlarını karşılayan premium hizmetler sunmaktadır.'}
                </p>
                
                {/* Address */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Adres</h3>
                  <p className="text-gray-600 flex items-start space-x-2">
                    <MapPin className="h-5 w-5 mt-0.5 text-gray-400" />
                    <span>{hotel.address}</span>
                  </p>
                </div>

                {/* Photo Gallery */}
                {hotel.images && hotel.images.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Otel Fotoğrafları</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {hotel.images.map((image, idx) => (
                        <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                          <img 
                            src={image} 
                            alt={`${hotel.name} - Görsel ${idx + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300 cursor-pointer"
                            onClick={() => window.open(image, '_blank')}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/400x300?text=Resim+Yüklenemedi';
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Gallery */}
                {hotel.videos && hotel.videos.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Tanıtım Videoları</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {hotel.videos.map((video, idx) => (
                        <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-gray-900">
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
                      ))}
                    </div>
                  </div>
                )}

                {/* Facilities */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Otel Olanakları</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {hotel.facilities?.map((facility, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        {getFacilityIcon(facility)}
                        <span className="text-gray-700">{getFacilityName(facility)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Conference Rooms */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Seminer Salonları</h2>
                
                {rooms.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Bu otelde henüz seminer salonu bulunmuyor.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {rooms.map((room) => (
                      <div 
                        key={room.id} 
                        className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/rooms/${room.id}`)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{room.name}</h3>
                            <p className="text-gray-600 mb-2">{room.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-indigo-600">
                              {formatPrice(
                                room.pricing_info ? room.pricing_info.display_price : room.price_per_day,
                                room.pricing_info ? room.pricing_info.display_currency : (room.currency || 'EUR')
                              )}
                            </div>
                            <div className="text-sm text-gray-500">günlük</div>
                            {room.pricing_info && room.pricing_info.display_currency !== room.currency && (
                              <div className="text-xs text-gray-400 mt-1">
                                ~€{room.price_per_day.toLocaleString()}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4" />
                            <span>{room.capacity} kişi</span>
                          </div>
                          {room.area_sqm && (
                            <div>
                              <span className="font-medium">Alan:</span> {room.area_sqm} m²
                            </div>
                          )}
                          {room.price_per_hour && (
                            <div>
                              <span className="font-medium">Saatlik:</span> ₺{room.price_per_hour}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {room.features?.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-1 bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full text-xs">
                              {getFeatureIcon(feature)}
                              <span>{getFeatureName(feature)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Google Maps */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Konum ve Ulaşım</h2>
                <GoogleMap hotel={hotel} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">İletişim Bilgileri</h3>
                {currentUser?.role === 'admin' ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">{hotel.phone}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-600">{hotel.email}</span>
                    </div>
                    {hotel.website && (
                      <div className="flex items-center space-x-3">
                        <Globe className="h-5 w-5 text-gray-400" />
                        <a 
                          href={hotel.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700"
                        >
                          Web Sitesi
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 text-center">
                      📞 İletişim bilgilerini görmek için rezervasyon yapmalısınız
                    </p>
                    <Button 
                      className="w-full mt-3 bg-blue-600 hover:bg-blue-700"
                      onClick={() => navigate('/rooms', { state: { hotelFilter: hotel.id } })}
                    >
                      Rezervasyon Yap
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hızlı İşlemler</h3>
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => navigate('/rooms', { state: { hotelFilter: hotel.id } })}
                  >
                    Salon Ara
                  </Button>
                  {currentUser?.role === 'admin' && (
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(`tel:${hotel.phone}`)}
                    >
                      Hemen Ara
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Extra Services */}
            {services.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ek Hizmetler</h3>
                  <div className="space-y-3">
                    {services.slice(0, 5).map((service, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm">{service.name}</span>
                        <span className="text-indigo-600 font-medium text-sm">
                          ₺{service.price} / {service.unit}
                        </span>
                      </div>
                    ))}
                    {services.length > 5 && (
                      <p className="text-xs text-gray-500 text-center pt-2">
                        +{services.length - 5} daha fazla hizmet
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hotel Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Otel İstatistikleri</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Toplam Salon</span>
                    <span className="font-medium">{rooms.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Değerlendirme</span>
                    <span className="font-medium">{hotel.average_rating.toFixed(1)} / 5.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Toplam Yorum</span>
                    <span className="font-medium">{hotel.total_reviews}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetail;