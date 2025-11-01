import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { MapPin, Users, Calendar, Clock, Monitor, Volume2, Snowflake, Wifi, Building2, ArrowLeft, Phone, Mail, Coffee, Utensils, Car, Briefcase, Package, Plus, Minus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '../hooks/useCurrency';
import ImageGalleryModal from './ImageGalleryModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RoomDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const { formatPrice, currency } = useCurrency();
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [extraServices, setExtraServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState({});

  useEffect(() => {
    fetchRoomDetails();
  }, [id]);

  const fetchRoomDetails = async () => {
    try {
      const roomResponse = await axios.get(`${API}/rooms/${id}`);
      const roomData = roomResponse.data;
      setRoom(roomData);
      
      // Fetch hotel details
      const hotelResponse = await axios.get(`${API}/hotels/${roomData.hotel_id}`);
      setHotel(hotelResponse.data);
      
      // Fetch extra services
      try {
        const servicesResponse = await axios.get(`${API}/hotels/${roomData.hotel_id}/services`);
        setExtraServices(servicesResponse.data);
      } catch (err) {
        console.log('No extra services available');
      }
    } catch (error) {
      console.error('Room details fetch error:', error);
      toast.error('Salon bilgileri yüklenirken hata oluştu');
      if (error.response?.status === 404) {
        navigate('/rooms');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleServiceQuantityChange = (serviceId, quantity) => {
    setSelectedServices(prev => {
      if (quantity <= 0) {
        const newServices = { ...prev };
        delete newServices[serviceId];
        return newServices;
      }
      return {
        ...prev,
        [serviceId]: quantity
      };
    });
  };

  const calculateTotalExtras = () => {
    return extraServices.reduce((total, service) => {
      const quantity = selectedServices[service.id] || 0;
      return total + (service.price * quantity);
    }, 0);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      catering: <Utensils className="h-5 w-5" />,
      equipment: <Monitor className="h-5 w-5" />,
      service: <Briefcase className="h-5 w-5" />,
      transport: <Car className="h-5 w-5" />,
      refreshment: <Coffee className="h-5 w-5" />
    };
    return icons[category] || <Package className="h-5 w-5" />;
  };

  const getFeatureIcon = (feature) => {
    const icons = {
      projector: <Monitor className="h-5 w-5" />,
      sound_system: <Volume2 className="h-5 w-5" />,
      whiteboard: <Building2 className="h-5 w-5" />,
      wifi: <Wifi className="h-5 w-5" />,
      air_conditioning: <Snowflake className="h-5 w-5" />,
      microphones: <Volume2 className="h-5 w-5" />,
      stage: <Building2 className="h-5 w-5" />,
      lighting_system: <Monitor className="h-5 w-5" />
    };
    return icons[feature] || <Monitor className="h-5 w-5" />;
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

  const getLayoutName = (layout) => {
    const names = {
      theater: 'Tiyatro Düzeni',
      classroom: 'Sınıf Düzeni',
      u_shape: 'U Düzeni',
      boardroom: 'Toplantı Masası',
      banquet: 'Banket Düzeni',
      cocktail: 'Kokteyl Düzeni'
    };
    return names[layout] || layout;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-32 mb-6"></div>
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

  if (!room || !hotel) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Salon bulunamadı</h3>
          <p className="text-gray-500 mb-4">Aradığınız salon mevcut değil.</p>
          <Button onClick={() => navigate('/rooms')} variant="outline">
            Salon Aramaya Dön
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/rooms')}
          className="mb-6 flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Salon Aramaya Dön</span>
        </Button>

        {/* Hero Section */}
        <div className="relative h-64 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg mb-8 overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative h-full flex items-end p-8">
            <div className="text-white">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-5 w-5" />
                <span>{hotel.city}</span>
              </div>
              <h1 data-testid="room-detail-title" className="text-4xl font-bold mb-2">{room.name}</h1>
              <p className="text-indigo-100 text-lg">{hotel.name}</p>
            </div>
            <div className="absolute top-6 right-6 text-right text-white">
              <div className="text-3xl font-bold">
                {formatPrice(room.pricing_info ? room.pricing_info.display_price : room.price_per_day, room.currency || 'EUR')}
              </div>
              <div className="text-indigo-100">günlük fiyat</div>
              {room.price_per_hour && (
                <div className="text-sm text-indigo-200 mt-1">
                  {room.pricing_info?.display_price_per_hour 
                    ? formatPrice(room.pricing_info.display_price_per_hour, room.currency || 'EUR')
                    : formatPrice(room.price_per_hour, room.currency || 'EUR')
                  } / saat
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Room Description */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Salon Hakkında</h2>
                <p className="text-gray-600 text-lg leading-relaxed mb-6">
                  {room.description || 'Bu salon modern donanımları ve profesyonel atmosferi ile seminerleriniz için mükemmel bir seçimdir.'}
                </p>

                {/* Photo Gallery */}
                {room.images && room.images.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Salon Fotoğrafları</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {room.images.map((image, idx) => (
                        <div 
                          key={idx} 
                          className="aspect-video rounded-lg overflow-hidden bg-gray-100 cursor-pointer group relative"
                          onClick={() => {
                            setSelectedImageIndex(idx);
                            setGalleryOpen(true);
                          }}
                        >
                          <img 
                            src={image} 
                            alt={`${room.name} - Görsel ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/400x300?text=Resim+Yüklenemedi';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                              Büyüt
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Video Gallery */}
                {room.videos && room.videos.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Salon Tanıtım Videoları</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {room.videos.map((video, idx) => (
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
                
                {/* Key Features */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-indigo-50 p-4 rounded-lg text-center">
                    <Users className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-indigo-600">{room.capacity}</div>
                    <div className="text-sm text-gray-600">Kişi Kapasitesi</div>
                  </div>
                  {room.area_sqm && (
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <Building2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-600">{room.area_sqm}</div>
                      <div className="text-sm text-gray-600">m² Alan</div>
                    </div>
                  )}
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <Calendar className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-xl font-bold text-purple-600">7/24</div>
                    <div className="text-sm text-gray-600">Rezervasyon</div>
                  </div>
                  {room.price_per_hour && (
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <div className="text-xl font-bold text-orange-600">Esnek</div>
                      <div className="text-sm text-gray-600">Saatlik Kiralama</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Features & Equipment */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">Teknik Donanım ve Özellikler</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {room.features?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Mevcut Donanımlar</h3>
                      <div className="space-y-3">
                        {room.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                            {getFeatureIcon(feature)}
                            <span className="text-gray-700">{getFeatureName(feature)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {room.layout_options?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Oturma Düzenleri</h3>
                      <div className="space-y-3">
                        {room.layout_options.map((layout, index) => (
                          <div key={index} className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                            <Users className="h-5 w-5 text-blue-600" />
                            <span className="text-gray-700">{getLayoutName(layout)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Hotel Information */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Otel Bilgileri</h2>
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{hotel.name}</h3>
                    <p className="text-gray-600 mb-2">{hotel.description}</p>
                    <div className="flex items-center space-x-2 text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span>{hotel.address}</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate(`/hotels/${hotel.id}`)}
                    className="ml-4"
                  >
                    Otel Detayı
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Extra Services Card */}
            {extraServices && extraServices.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ekstra Hizmetler</h3>
                  <div className="space-y-4">
                    {extraServices.map((service) => (
                      <div key={service.id} className="border rounded-lg p-4 hover:border-indigo-300 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="text-indigo-600">
                              {getCategoryIcon(service.category)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{service.name}</p>
                              <p className="text-sm text-gray-500">
                                {formatPrice(service.price, service.currency)} / {
                                  service.unit === 'person' ? 'Kişi' :
                                  service.unit === 'hour' ? 'Saat' :
                                  service.unit === 'day' ? 'Gün' :
                                  service.unit === 'package' ? 'Paket' : 'Adet'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                        {service.description && (
                          <p className="text-sm text-gray-600 mb-3">{service.description}</p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleServiceQuantityChange(service.id, (selectedServices[service.id] || 0) - 1)}
                              className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
                              disabled={!selectedServices[service.id]}
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center font-medium">
                              {selectedServices[service.id] || 0}
                            </span>
                            <button
                              onClick={() => handleServiceQuantityChange(service.id, (selectedServices[service.id] || 0) + 1)}
                              className="p-1 rounded-full hover:bg-gray-200"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          {selectedServices[service.id] > 0 && (
                            <div className="flex items-center text-green-600">
                              <Check className="h-4 w-4 mr-1" />
                              <span className="text-sm font-medium">
                                {formatPrice(service.price * selectedServices[service.id], service.currency)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {Object.keys(selectedServices).length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-900">Ekstra Hizmetler Toplamı:</span>
                        <span className="text-lg font-bold text-indigo-600">
                          {formatPrice(calculateTotalExtras(), currency)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Booking Card */}
            <Card className="border-2 border-indigo-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rezervasyon Yap</h3>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Günlük Fiyat</span>
                    <span className="text-2xl font-bold text-indigo-600">
                      {formatPrice(room.pricing_info ? room.pricing_info.display_price : room.price_per_day, room.currency || 'EUR')}
                    </span>
                  </div>
                  {room.price_per_hour && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Saatlik Fiyat</span>
                      <span className="text-lg font-semibold text-gray-700">
                        {room.pricing_info?.display_price_per_hour 
                          ? formatPrice(room.pricing_info.display_price_per_hour, room.currency || 'EUR')
                          : formatPrice(room.price_per_hour, room.currency || 'EUR')
                        }
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-lg py-3"
                    onClick={() => navigate(`/rooms/${room.id}/booking`)}
                  >
                    Rezervasyon Yap
                  </Button>
                  <Button variant="outline" className="w-full">
                    Fiyat Teklifi Al
                  </Button>
                </div>
                
                <div className="mt-4 text-center text-sm text-gray-500">
                  ✓ Ücretsiz iptal hakkı<br/>
                  ✓ Anlık rezervasyon onayı<br/>
                  ✓ 7/24 müşteri desteği
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">İletişim</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">{hotel.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <span className="text-gray-600">{hotel.email}</span>
                  </div>
                </div>
                
                <div className="mt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(`tel:${hotel.phone}`)}
                  >
                    Hemen Ara
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.open(`mailto:${hotel.email}`)}
                  >
                    E-posta Gönder
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Room Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Salon İstatistikleri</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Toplam Rezervasyon</span>
                    <span className="font-medium">{room.total_bookings || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Değerlendirme</span>
                    <span className="font-medium">{room.average_rating.toFixed(1)} / 5.0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Durum</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      room.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {room.is_available ? 'Müsait' : 'Dolu'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Gallery Modal */}
      <ImageGalleryModal
        images={room?.images || []}
        initialIndex={selectedImageIndex}
        isOpen={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        title={room?.name}
      />
    </div>
  );
};

export default RoomDetail;