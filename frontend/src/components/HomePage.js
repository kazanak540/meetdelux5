import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Search, MapPin, Users, Star, Building2, Calendar, Wifi, Coffee, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Default banner images
const defaultBanners = [
  {
    id: 1,
    image_url: 'https://images.unsplash.com/photo-1665491961263-2c9f8deebf63',
    title: 'Modern Konferans Salonları',
    description: 'Profesyonel toplantılar için ideal mekanlar'
  },
  {
    id: 2,
    image_url: 'https://images.unsplash.com/photo-1688269910939-4c36b34402b0',
    title: 'Geniş Etkinlik Alanları',
    description: 'Her ölçekte etkinlik için uygun'
  },
  {
    id: 3,
    image_url: 'https://images.unsplash.com/photo-1759519238029-689e99c6d19e',
    title: 'Lüks Balo Salonları',
    description: 'Özel davetler ve galalar için'
  },
  {
    id: 4,
    image_url: 'https://images.unsplash.com/photo-1761116189895-9fa9541520d7',
    title: 'Zarif Yemek Salonları',
    description: 'Unutulmaz akşam yemekleri'
  },
  {
    id: 5,
    image_url: 'https://images.unsplash.com/photo-1761110787206-2cc164e4913c',
    title: 'Düğün Salonları',
    description: 'Hayallerinizdeki düğün için'
  },
  {
    id: 6,
    image_url: 'https://images.unsplash.com/photo-1654336037958-c698d50700b3',
    title: 'Şık Resepsiyon Mekanları',
    description: 'Misafirlerinizi ağırlamak için'
  },
  {
    id: 7,
    image_url: 'https://images.unsplash.com/photo-1720139290958-d8676702c3ed',
    title: 'Toplantı Odaları',
    description: 'İş görüşmeleri için profesyonel ortam'
  },
  {
    id: 8,
    image_url: 'https://images.pexels.com/photos/265947/pexels-photo-265947.jpeg',
    title: 'Banket Salonları',
    description: 'Kurumsal etkinlikler için ideal'
  }
];

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredHotels, setFeaturedHotels] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [banners, setBanners] = useState(defaultBanners);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedRoomType, setSelectedRoomType] = useState('seminar');
  const [searchParams, setSearchParams] = useState({
    city: '',
    startDate: '',
    endDate: '',
    capacity: '',
    roomType: 'seminar'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchFeaturedHotels();
    fetchAdvertisements();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, [banners.length]);

  const nextBanner = () => {
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToBanner = (index) => {
    setCurrentBanner(index);
  };

  const fetchFeaturedHotels = async () => {
    try {
      const response = await axios.get(`${API}/hotels?limit=6`);
      setFeaturedHotels(response.data);
    } catch (error) {
      console.error('Featured hotels fetch error:', error);
      toast.error('Oteller yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdvertisements = async () => {
    try {
      const response = await axios.get(`${API}/advertisements/public`);
      setAdvertisements(response.data);
    } catch (error) {
      console.error('Advertisements fetch error:', error);
    }
  };

  const getAdvertisementsByType = (type) => {
    return advertisements.filter(ad => ad.ad_type === type);
  };

  const handleAdClick = async (ad) => {
    try {
      // Track the click
      await axios.post(`${API}/advertisements/${ad.id}/view`, {
        ad_id: ad.id,
        clicked: true
      });

      // Navigate based on ad type
      if (ad.target_url) {
        if (ad.target_url.startsWith('/')) {
          navigate(ad.target_url);
        } else {
          window.open(ad.target_url, '_blank');
        }
      } else if (ad.target_id) {
        if (ad.ad_type === 'featured_hotel') {
          navigate(`/hotels/${ad.target_id}`);
        } else if (ad.ad_type === 'sponsored_room') {
          navigate(`/rooms/${ad.target_id}`);
        }
      }
    } catch (error) {
      console.error('Ad click tracking error:', error);
      // Still navigate even if tracking fails
      if (ad.target_url) {
        navigate(ad.target_url);
      } else if (ad.target_id) {
        if (ad.ad_type === 'featured_hotel') {
          navigate(`/hotels/${ad.target_id}`);
        } else if (ad.ad_type === 'sponsored_room') {
          navigate(`/rooms/${ad.target_id}`);
        }
      }
    }
  };

  const trackAdView = async (ad) => {
    try {
      await axios.post(`${API}/advertisements/${ad.id}/view`, {
        ad_id: ad.id,
        clicked: false
      });
    } catch (error) {
      console.error('Ad view tracking error:', error);
    }
  };

  const roomTypeOptions = [
    { 
      id: 'seminar', 
      label: 'Seminer Salonu', 
      icon: '🎓',
      description: 'Eğitim ve seminerler için ideal'
    },
    { 
      id: 'meeting', 
      label: 'Toplantı Odası', 
      icon: '💼',
      description: 'İş görüşmeleri ve toplantılar'
    },
    { 
      id: 'ballroom', 
      label: 'Ballroom', 
      icon: '✨',
      description: 'Gala ve özel etkinlikler'
    },
    { 
      id: 'conference', 
      label: 'Konferans Salonu', 
      icon: '🎤',
      description: 'Büyük konferanslar'
    }
  ];

  const handleRoomTypeChange = (typeId) => {
    setSelectedRoomType(typeId);
    setSearchParams({...searchParams, roomType: typeId});
  };

  const handleSearchParamChange = (field, value) => {
    setSearchParams({...searchParams, [field]: value});
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // Build query params
    const params = new URLSearchParams();
    if (searchParams.city) params.append('city', searchParams.city);
    if (searchParams.capacity) params.append('min_capacity', searchParams.capacity);
    if (searchParams.roomType) params.append('room_type', searchParams.roomType);
    
    navigate(`/rooms?${params.toString()}`);
  };

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/rooms?city=${encodeURIComponent(searchQuery)}`);
    }
  };

  const features = [
    {
      icon: <Search className="h-8 w-8 text-indigo-600" />,
      title: "Hızlı Arama",
      description: "Türkiye'deki binlerce seminer salonunu kolayca bulun"
    },
    {
      icon: <Calendar className="h-8 w-8 text-green-600" />,
      title: "Anlık Rezervasyon",
      description: "7/24 online rezervasyon sistemi ile hemen kiralayın"
    },
    {
      icon: <Star className="h-8 w-8 text-yellow-600" />,
      title: "Kaliteli Hizmet",
      description: "Sadece 4-5 yıldızlı otellerin premium salonları"
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: "Esnek Kapasite",
      description: "10 kişilik toplantıdan 1000 kişilik kongrelere"
    }
  ];

  const popularFeatures = [
    { name: "Projeksiyon", icon: "📽️" },
    { name: "Ses Sistemi", icon: "🎵" },
    { name: "WiFi", icon: "📶" },
    { name: "Klima", icon: "❄️" },
    { name: "Catering", icon: "🍽️" },
    { name: "Sahne", icon: "🎭" }
  ];

  return (
    <div className="min-h-screen">
      {/* Banner Carousel */}
      <div className="relative w-full h-[280px] md:h-[350px] overflow-hidden">
        {/* Banner Images */}
        <div className="relative w-full h-full">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentBanner ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/20">
                <div className="max-w-7xl mx-auto px-4 h-full flex items-center">
                  <div className="text-white max-w-2xl">
                    <h2 className="text-4xl md:text-6xl font-bold mb-4">
                      {banner.title}
                    </h2>
                    <p className="text-xl md:text-2xl text-gray-200">
                      {banner.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevBanner}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full transition-all"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          onClick={nextBanner}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-sm text-white p-3 rounded-full transition-all"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToBanner(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentBanner
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Hero Section - Tatilsepeti Style */}
      <section className="relative bg-gradient-to-b from-blue-600 to-blue-700 text-white py-16">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="text-orange-400">Türkiye'nin</span> Toplantı ve Balo Salonu Merkezi
              <br />
              <span className="text-2xl md:text-4xl">MeetDelux</span>
            </h1>
            <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
              En uygun toplantı, seminer ve balo salonları MeetDelux'ta! Hemen rezervasyon yapın, özel indirimleri yakalayın.
            </p>
          </div>

          {/* Main Search Form - Modern & Interactive */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              
              {/* Room Type Tabs */}
              <div className="flex flex-wrap bg-gray-50 border-b border-gray-200">
                {roomTypeOptions.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleRoomTypeChange(type.id)}
                    className={`flex-1 min-w-[150px] px-4 py-4 transition-all duration-200 ${
                      selectedRoomType === type.id
                        ? 'bg-white text-indigo-600 font-semibold border-b-3 border-indigo-600 shadow-sm'
                        : 'text-gray-600 hover:bg-white hover:text-indigo-500'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-1">
                      <span className="text-2xl">{type.icon}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                      <span className="text-xs text-gray-500 hidden md:block">{type.description}</span>
                    </div>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSearch} className="p-6 md:p-8">
                {/* Search Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
                  
                  {/* Location - Larger */}
                  <div className="md:col-span-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <MapPin className="h-4 w-4 mr-1 text-indigo-600" />
                      Şehir / Otel Adı
                    </label>
                    <Input
                      type="text"
                      placeholder="İstanbul, Ankara, İzmir..."
                      value={searchParams.city}
                      onChange={(e) => handleSearchParamChange('city', e.target.value)}
                      className="w-full h-12 px-4 text-gray-700 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  {/* Start Date */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-indigo-600" />
                      Başlangıç
                    </label>
                    <Input
                      type="date"
                      value={searchParams.startDate}
                      onChange={(e) => handleSearchParamChange('startDate', e.target.value)}
                      className="w-full h-12 px-4 text-gray-700 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  {/* End Date */}
                  <div className="md:col-span-3">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-indigo-600" />
                      Bitiş
                    </label>
                    <Input
                      type="date"
                      value={searchParams.endDate}
                      onChange={(e) => handleSearchParamChange('endDate', e.target.value)}
                      className="w-full h-12 px-4 text-gray-700 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>

                  {/* Capacity */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                      <Users className="h-4 w-4 mr-1 text-indigo-600" />
                      Kapasite
                    </label>
                    <Input
                      type="number"
                      placeholder="Kişi"
                      value={searchParams.capacity}
                      onChange={(e) => handleSearchParamChange('capacity', e.target.value)}
                      min="1"
                      className="w-full h-12 px-4 text-gray-700 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <Button
                  type="submit"
                  className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Search className="h-5 w-5 mr-2" />
                  {selectedRoomType === 'seminar' && '🎓 Seminer Salonu Ara'}
                  {selectedRoomType === 'meeting' && '💼 Toplantı Odası Ara'}
                  {selectedRoomType === 'ballroom' && '✨ Ballroom Ara'}
                  {selectedRoomType === 'conference' && '🎤 Konferans Salonu Ara'}
                </Button>

                {/* Quick Tips */}
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => handleSearchParamChange('capacity', '50')}
                    className="px-4 py-2 bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-sm rounded-full transition-colors"
                  >
                    50 Kişilik
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSearchParamChange('capacity', '100')}
                    className="px-4 py-2 bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-sm rounded-full transition-colors"
                  >
                    100 Kişilik
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSearchParamChange('capacity', '200')}
                    className="px-4 py-2 bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-sm rounded-full transition-colors"
                  >
                    200+ Kişilik
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSearchParamChange('city', 'İstanbul')}
                    className="px-4 py-2 bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-sm rounded-full transition-colors"
                  >
                    İstanbul
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSearchParamChange('city', 'Ankara')}
                    className="px-4 py-2 bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-600 text-sm rounded-full transition-colors"
                  >
                    Ankara
                  </button>
                </div>

                {/* Advanced Options - Collapsible */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <span className="mr-2">🔧</span>
                      Gelişmiş Seçenekler
                    </h3>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">📽️ Projeksiyon</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">🎵 Ses Sistemi</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">☕ Catering</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">🚗 Transfer</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">🌐 Wi-Fi</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">🅿️ Otopark</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">❄️ Klima</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">🎬 Video Konferans</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">📊 Whiteboard</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">🎤 Mikrofon</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">💡 Sahne Işıkları</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer group">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500" />
                      <span className="text-sm text-gray-600 group-hover:text-indigo-600 transition-colors">🎭 Sahne</span>
                    </label>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-sm">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <span className="text-green-600 text-lg">✅</span>
                      <span className="font-medium">Ücretsiz İptal</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <span className="text-green-600 text-lg">✅</span>
                      <span className="font-medium">Anında Onay</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <span className="text-green-600 text-lg">✅</span>
                      <span className="font-medium">En İyi Fiyat Garantisi</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <span className="text-green-600 text-lg">✅</span>
                      <span className="font-medium">9 Taksit İmkanı</span>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Quick Stats - Conversion Boosters */}
          <div className="mt-8 text-center">
            <div className="flex flex-wrap justify-center gap-8 text-sm">
              <div className="text-blue-200">
                <div className="text-2xl font-bold text-white">500+</div>
                <div>Premium Salon</div>
              </div>
              <div className="text-blue-200">
                <div className="text-2xl font-bold text-white">50+</div>
                <div>Lüks Otel</div>
              </div>
              <div className="text-blue-200">
                <div className="text-2xl font-bold text-white">10.000+</div>
                <div>Başarılı Etkinlik</div>
              </div>
              <div className="text-blue-200">
                <div className="text-2xl font-bold text-white">%50'ye</div>
                <div>Varan İndirim</div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Featured/Sponsored Hotel Advertisement */}
      <section className="py-12 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden hover:shadow-3xl transition-all duration-300">
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg">
                ⭐ ÖNERLEN OTEL
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-0">
              {/* Image */}
              <div className="relative h-64 md:h-auto">
                <img 
                  src="https://images.unsplash.com/photo-1561501900-3701fa6a0864?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njl8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBob3RlbHxlbnwwfHx8fDE3NjE1NDI5MzF8MA&ixlib=rb-4.1.0&q=85"
                  alt="Grand Horizon Hotel"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="ml-2 text-sm font-semibold text-gray-700">5.0</span>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-8 flex flex-col justify-center">
                <h3 className="text-3xl font-bold text-gray-900 mb-3">
                  Grand Horizon Hotel & Conference Center
                </h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  İstanbul'un kalbinde, lüks konaklama ve dünya standartlarında konferans salonları. 
                  2000 kişilik ana balo salonu, 15 adet toplantı odası ve özel etkinlik alanları.
                </p>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="h-4 w-4 text-indigo-600" />
                    <span>2000 Kişi Kapasite</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="h-4 w-4 text-indigo-600" />
                    <span>15 Toplantı Salonu</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Wifi className="h-4 w-4 text-indigo-600" />
                    <span>Fiber İnternet</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Coffee className="h-4 w-4 text-indigo-600" />
                    <span>Premium Catering</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Günlük fiyat başlangıç</p>
                    <p className="text-3xl font-bold text-indigo-600">₺8,500</p>
                  </div>
                  <Button className="ml-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all">
                    Detayları Gör
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="neden-meetdelux" className="py-20 bg-white scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 data-testid="features-title" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Neden MeetDelux?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              İş dünyasının güvendiği, Türkiye'nin lüks seminer salonu rezervasyon platformu
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-2">
                <div className="mb-4 flex justify-center">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Hero Banner Advertisement */}
      {getAdvertisementsByType('hero_banner').length > 0 && (
        <section className="py-8 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {getAdvertisementsByType('hero_banner').slice(0, 1).map((ad) => (
              <div 
                key={ad.id}
                className="relative rounded-2xl overflow-hidden shadow-xl cursor-pointer transform hover:scale-[1.02] transition-all duration-300"
                onClick={() => handleAdClick(ad)}
                onLoad={() => trackAdView(ad)}
              >
                <div className="relative h-64 md:h-80">
                  <img 
                    src={ad.image_url} 
                    alt={ad.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30"></div>
                  <div className="absolute inset-0 flex items-center">
                    <div className="max-w-4xl mx-auto px-8 text-white">
                      <div className="mb-2">
                        <span className="bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold">
                          SPONSORLU
                        </span>
                      </div>
                      <h2 className="text-3xl md:text-5xl font-bold mb-4">{ad.title}</h2>
                      <p className="text-xl md:text-2xl mb-6 text-gray-200">{ad.description}</p>
                      <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-8 py-3">
                        Detayları Gör
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sponsored Rooms */}
      {getAdvertisementsByType('sponsored_room').length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Öne Çıkan Salonlar</h2>
                <p className="text-gray-600">Bu ay özel fırsatlarla</p>
              </div>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                SPONSORLU
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {getAdvertisementsByType('sponsored_room').slice(0, 3).map((ad) => (
                <div 
                  key={ad.id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 hover:shadow-xl transition-all duration-300"
                  onClick={() => handleAdClick(ad)}
                  onLoad={() => trackAdView(ad)}
                >
                  <div className="relative">
                    <img 
                      src={ad.image_url} 
                      alt={ad.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
                        ÖZEL FIYAT
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{ad.title}</h3>
                    <p className="text-gray-600 text-sm mb-4">{ad.description}</p>
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                      Rezervasyon Yap
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Hotels */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 data-testid="featured-hotels-title" className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Öne Çıkan Oteller
            </h2>
            <p className="text-xl text-gray-600">
              Türkiye'nin en prestijli otellerinin toplantı ve balo salonları
            </p>
          </div>
          
          {/* Sponsored Featured Hotels */}
          {getAdvertisementsByType('featured_hotel').length > 0 && (
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Sponsorlu Oteller</h3>
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                  REKLAM
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                {getAdvertisementsByType('featured_hotel').slice(0, 3).map((ad) => (
                  <div 
                    key={ad.id}
                    className="relative bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 hover:shadow-xl transition-all duration-300 border-2 border-blue-200"
                    onClick={() => handleAdClick(ad)}
                    onLoad={() => trackAdView(ad)}
                  >
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">
                        SPONSORLU
                      </span>
                    </div>
                    <img 
                      src={ad.image_url} 
                      alt={ad.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{ad.title}</h3>
                      <p className="text-gray-600 text-sm mb-4">{ad.description}</p>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        Oteli İncele
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredHotels.map((hotel) => (
                <div key={hotel.id} className="hotel-card group cursor-pointer" onClick={() => navigate(`/hotels/${hotel.id}`)}>
                  <div className="h-48 bg-gradient-to-br from-indigo-400 to-purple-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all duration-300"></div>
                    <div className="absolute top-4 right-4">
                      <div className="flex items-center space-x-1 bg-white/90 px-2 py-1 rounded-full">
                        {[...Array(hotel.star_rating || 5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 text-white">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{hotel.city}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {hotel.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {hotel.description || 'Premium otel konferans salonları'}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Wifi className="h-4 w-4" />
                          <span>WiFi</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Coffee className="h-4 w-4" />
                          <span>Catering</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all">
                        Detaylar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link to="/hotels">
              <Button size="lg" variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white">
                Tüm Otelleri Görüntüle
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom Promotion Banner */}
      {getAdvertisementsByType('bottom_promotion').length > 0 && (
        <section className="py-12 bg-gradient-to-r from-green-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {getAdvertisementsByType('bottom_promotion').slice(0, 1).map((ad) => (
              <div 
                key={ad.id}
                className="relative bg-white rounded-2xl shadow-xl overflow-hidden cursor-pointer transform hover:scale-[1.02] transition-all duration-300"
                onClick={() => handleAdClick(ad)}
                onLoad={() => trackAdView(ad)}
              >
                <div className="flex flex-col md:flex-row items-center">
                  <div className="md:w-1/2 p-8 order-2 md:order-1">
                    <div className="mb-4">
                      <span className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-full text-sm font-bold">
                        ÖZEL KAMPANYA
                      </span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{ad.title}</h2>
                    <p className="text-lg text-gray-600 mb-6">{ad.description}</p>
                    <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-8 py-3">
                      Hemen Kaydol
                    </Button>
                  </div>
                  <div className="md:w-1/2 order-1 md:order-2">
                    <img 
                      src={ad.image_url} 
                      alt={ad.title}
                      className="w-full h-64 md:h-80 object-cover"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Side Banner - Positioned Fixed */}
      {getAdvertisementsByType('side_banner').length > 0 && (
        <div className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 hidden xl:block">
          {getAdvertisementsByType('side_banner').slice(0, 1).map((ad) => (
            <div 
              key={ad.id}
              className="w-80 bg-white rounded-xl shadow-2xl overflow-hidden cursor-pointer transform hover:scale-105 transition-all duration-300 border border-gray-200"
              onClick={() => handleAdClick(ad)}
              onLoad={() => trackAdView(ad)}
            >
              <div className="relative">
                <img 
                  src={ad.image_url} 
                  alt={ad.title}
                  className="w-full h-32 object-cover"
                />
                <div className="absolute top-2 left-2">
                  <span className="bg-purple-500 text-white px-2 py-1 rounded text-xs font-bold">
                    REKLAM
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-2">{ad.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{ad.description}</p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-sm">
                  Detayları Gör
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 data-testid="cta-title" className="text-3xl md:text-4xl font-bold mb-6">
            Otel Sahibi misiniz?
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            Otelinizdeki seminer salonlarını platformumuzda listeleyerek daha fazla müşteriye ulaşın
          </p>
          <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
            <Link to="/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold">
                Otel Kaydı Yap
              </Button>
            </Link>
            <Link to="/register">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 font-semibold">
                Balo Salonu Kaydı
              </Button>
            </Link>
            <Link to="/rooms">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-indigo-600">
                Salon Ara
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Credit */}
      <footer className="py-8 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Payment Methods */}
          <div className="mb-6 text-center">
            <p className="text-gray-400 text-sm mb-4">Güvenli Ödeme Yöntemleri</p>
            <div className="flex justify-center items-center gap-6 flex-wrap">
              {/* Visa */}
              <div className="hover:opacity-80 transition-opacity">
                <img 
                  src="https://customer-assets.emergentagent.com/job_repo-importer-14/artifacts/cofbeh4b_PHOTO-2025-10-27-21-53-39.jpeg" 
                  alt="Visa" 
                  className="h-10 w-16 object-contain"
                />
              </div>
              {/* Mastercard */}
              <div className="hover:opacity-80 transition-opacity">
                <img 
                  src="https://customer-assets.emergentagent.com/job_repo-importer-14/artifacts/tz8nxfmh_PHOTO-2025-10-27-21-54-21.jpeg" 
                  alt="Mastercard" 
                  className="h-10 w-16 object-contain"
                />
              </div>
              {/* Troy */}
              <div className="hover:opacity-80 transition-opacity">
                <img 
                  src="https://customer-assets.emergentagent.com/job_repo-importer-14/artifacts/ssk7tpbs_PHOTO-2025-10-27-21-56-28.jpeg" 
                  alt="Troy" 
                  className="h-10 w-16 object-contain"
                />
              </div>
              {/* American Express */}
              <div className="hover:opacity-80 transition-opacity">
                <img 
                  src="https://customer-assets.emergentagent.com/job_repo-importer-14/artifacts/z61d4eio_PHOTO-2025-10-27-21-57-47.jpeg" 
                  alt="American Express" 
                  className="h-10 w-16 object-contain"
                />
              </div>
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-gray-700 my-6"></div>
          
          {/* Credit */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              by <span className="text-white font-semibold">Kazanak</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;