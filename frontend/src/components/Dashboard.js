import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Building2, Users, Calendar, TrendingUp, Plus, Edit, Trash2, Coffee, Utensils, Car, Briefcase, Package, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import CreateHotelModal from './CreateHotelModal';
import CreateRoomModal from './CreateRoomModal';
import CreateExtraServiceModal from './CreateExtraServiceModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [hotels, setHotels] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [ballrooms, setBallrooms] = useState([]);
  const [advertisements, setAdvertisements] = useState([]);
  const [banners, setBanners] = useState([]);
  const [extraServices, setExtraServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateHotelModal, setShowCreateHotelModal] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [showCreateBallroomModal, setShowCreateBallroomModal] = useState(false);
  const [showBannerModal, setShowBannerModal] = useState(false);
  const [showCreateServiceModal, setShowCreateServiceModal] = useState(false);
  const [selectedHotelForService, setSelectedHotelForService] = useState(null);
  const [editingBanner, setEditingBanner] = useState(null);
  const [stats, setStats] = useState({
    totalHotels: 0,
    totalRooms: 0,
    totalBallrooms: 0,
    totalBookings: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      if (user.role === 'admin') {
        // Admin sees all data
        const [hotelsResponse, roomsResponse, adsResponse] = await Promise.all([
          axios.get(`${API}/hotels`),
          axios.get(`${API}/rooms`),
          axios.get(`${API}/advertisements`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          })
        ]);
        setHotels(hotelsResponse.data);
        
        // Separate ballrooms from other rooms
        const allRoomsList = roomsResponse.data;
        const ballroomsList = allRoomsList.filter(room => room.room_type === 'ballroom');
        const otherRoomsList = allRoomsList.filter(room => room.room_type !== 'ballroom');
        
        setRooms(otherRoomsList);
        setBallrooms(ballroomsList);
        setAdvertisements(adsResponse.data);
        
        setStats({
          totalHotels: hotelsResponse.data.length,
          totalRooms: otherRoomsList.length,
          totalBallrooms: ballroomsList.length,
          totalBookings: allRoomsList.reduce((sum, room) => sum + (room.total_bookings || 0), 0),
          totalRevenue: allRoomsList.reduce((sum, room) => sum + (room.price_per_day * (room.total_bookings || 0)), 0)
        });
      } else if (user.role === 'hotel_manager') {
        // Hotel manager sees only their data
        const hotelsResponse = await axios.get(`${API}/hotels`);
        const userHotels = hotelsResponse.data.filter(hotel => hotel.manager_id === user.id);
        setHotels(userHotels);
        
        // Fetch rooms for user's hotels
        const allRooms = [];
        for (const hotel of userHotels) {
          try {
            const roomsResponse = await axios.get(`${API}/hotels/${hotel.id}/rooms`);
            allRooms.push(...roomsResponse.data);
          } catch (error) {
            console.error(`Error fetching rooms for hotel ${hotel.id}:`, error);
          }
        }
        
        // Separate ballrooms from other rooms
        const ballroomsList = allRooms.filter(room => room.room_type === 'ballroom');
        const otherRoomsList = allRooms.filter(room => room.room_type !== 'ballroom');
        
        setRooms(otherRoomsList);
        setBallrooms(ballroomsList);
        
        // Fetch user's advertisements
        try {
          const adsResponse = await axios.get(`${API}/advertisements`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setAdvertisements(adsResponse.data);
        } catch (error) {
          console.error('Error fetching advertisements:', error);
        }
        
        setStats({
          totalHotels: userHotels.length,
          totalRooms: otherRoomsList.length,
          totalBallrooms: ballroomsList.length,
          totalBookings: allRooms.reduce((sum, room) => sum + (room.total_bookings || 0), 0),
          totalRevenue: allRooms.reduce((sum, room) => sum + (room.price_per_day * (room.total_bookings || 0)), 0)
        });
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      toast.error('Dashboard verileri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHotel = async (hotelId) => {
    if (!window.confirm('Bu oteli silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/hotels/${hotelId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Otel başarıyla silindi');
      fetchDashboardData();
    } catch (error) {
      console.error('Delete hotel error:', error);
      toast.error('Otel silinirken hata oluştu');
    }
  };

  const handleEditHotel = (hotel) => {
    console.log('Edit hotel:', hotel);
    toast.info('Edit özelliği yakında eklenecek');
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Bu salonu silmek istediğinizden emin misiniz?')) {
      return;
    }
    
    try {
      await axios.delete(`${API}/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success('Salon başarıyla silindi');
      fetchDashboardData();
    } catch (error) {
      console.error('Delete room error:', error);
      toast.error('Salon silinirken hata oluştu');
    }
  };

  const handleEditRoom = (room) => {
    console.log('Edit room:', room);
    toast.info('Edit özelliği yakında eklenecek');
  };


  const handleHotelCreated = (newHotel) => {
    setHotels(prev => [...prev, newHotel]);
    setStats(prev => ({
      ...prev,
      totalHotels: prev.totalHotels + 1
    }));
    // Refresh data to get updated stats
    fetchDashboardData();
  };

  const handleRoomCreated = (newRoom) => {
    setRooms(prev => [...prev, newRoom]);
    setStats(prev => ({
      ...prev,
      totalRooms: prev.totalRooms + 1
    }));
    // Refresh data to get updated stats
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="h-96 bg-gray-300 rounded"></div>
              <div className="h-96 bg-gray-300 rounded"></div>
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
          <h1 data-testid="dashboard-title" className="text-3xl font-bold text-gray-900 mb-2">
            Yönetim Paneli
          </h1>
          <p className="text-gray-600">
            Hoş geldiniz, {user.full_name} - {user.role === 'admin' ? 'Sistem Yöneticisi' : 'Otel Yöneticisi'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Toplam Otel</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalHotels}</p>
                </div>
                <Building2 className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Seminer Salonları</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalRooms}</p>
                </div>
                <Users className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Balo Salonları</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalBallrooms}</p>
                </div>
                <div className="text-3xl">🎭</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Toplam Rezervasyon</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                </div>
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Toplam Gelir</p>
                  <p className="text-3xl font-bold text-gray-900">₺{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Hotels Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Otellerim</span>
                {user.role === 'hotel_manager' && (
                  <Button 
                    size="sm" 
                    className="bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => setShowCreateHotelModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Otel
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hotels.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz hiç otel eklenmemiş.</p>
                  {user.role === 'hotel_manager' && (
                    <Button 
                      className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => setShowCreateHotelModal(true)}
                    >
                      İlk Otelimi Ekle
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {hotels.map((hotel) => (
                    <div key={hotel.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">{hotel.name}</h3>
                        <p className="text-sm text-gray-500">{hotel.city}</p>
                        <p className="text-xs text-gray-400">
                          {rooms.filter(room => room.hotel_id === hotel.id).length} salon
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditHotel(hotel)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteHotel(hotel.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Rooms Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Seminer Salonları</span>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setShowCreateRoomModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Salon
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rooms.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Henüz hiç salon eklenmemiş.</p>
                  <Button 
                    className="mt-4 bg-green-600 hover:bg-green-700"
                    onClick={() => setShowCreateRoomModal(true)}
                  >
                    İlk Salonumu Ekle
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {rooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">{room.name}</h3>
                        <p className="text-sm text-gray-500">{room.capacity} kişi kapasitesi</p>
                        <p className="text-xs text-indigo-600 font-medium">
                          ₺{room.price_per_day.toLocaleString()} / gün
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditRoom(room)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ballrooms Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span>🎭</span>
                  <span>Balo Salonları</span>
                </span>
                <Button 
                  size="sm" 
                  className="bg-pink-600 hover:bg-pink-700"
                  onClick={() => setShowCreateBallroomModal(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Balo Salonu
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ballrooms.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mx-auto mb-4">🎭</div>
                  <p className="text-gray-500">Henüz hiç balo salonu eklenmemiş.</p>
                  <Button 
                    className="mt-4 bg-pink-600 hover:bg-pink-700"
                    onClick={() => setShowCreateBallroomModal(true)}
                  >
                    İlk Balo Salonumu Ekle
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 max-h-80 overflow-y-auto">
                  {ballrooms.map((room) => (
                    <div key={room.id} className="flex items-center justify-between p-4 border border-pink-200 rounded-lg bg-pink-50">
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <span>🎭</span>
                          {room.name}
                        </h3>
                        <p className="text-sm text-gray-500">{room.capacity} kişi kapasitesi</p>
                        <p className="text-xs text-pink-600 font-medium">
                          ₺{room.price_per_day.toLocaleString()} / gün
                        </p>
                        {room.features.includes('dance_floor') && (
                          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded mt-1 inline-block">
                            🕺 Dans Pisti
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditRoom(room)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDeleteRoom(room.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Banner Management - Ana Sayfa Carousel */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🎨</span>
                <span>Ana Sayfa Banner Yönetimi</span>
              </span>
              <div className="text-sm text-gray-500">
                8 banner'dan {banners.length} tanesi aktif
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                💡 <strong>İpucu:</strong> Ana sayfadaki kayan banner'lar otomatik olarak yerleşik görselleri kullanıyor. 
                Gelecek güncellemelerde özel banner yükleme özelliği eklenecek.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <div key={num} className="relative group">
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                    Banner {num}
                  </div>
                  <div className="mt-2 text-xs text-center text-gray-600">
                    Aktif
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Advertisements Management */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>📢</span>
                <span>Reklam Yönetimi</span>
              </span>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                onClick={() => window.location.href = '/reklam-paketleri'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Reklam Satın Al
              </Button>
            </CardTitle>
            <p className="text-sm text-gray-500 mt-2">
              💰 Ücretli reklam paketleri ile otel ve salonlarınızı öne çıkarın
            </p>
          </CardHeader>
          <CardContent>
            {/* Reklam Paketleri Bilgi Kutusu */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🥉</span>
                  <span className="text-xs font-bold text-blue-600">7 GÜN</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">7 Günlük Reklam</h4>
                <p className="text-2xl font-bold text-indigo-600 mb-2">₺2,800</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ 7 gün gösterim</li>
                  <li>✓ Ana sayfa yerleşimi</li>
                  <li>✓ Performans takibi</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🥈</span>
                  <span className="text-xs font-bold text-purple-600">15 GÜN</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">15 Günlük Reklam</h4>
                <p className="text-2xl font-bold text-purple-600 mb-2">₺5,000</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ 15 gün gösterim</li>
                  <li>✓ Üst sıra garantisi</li>
                  <li>✓ Detaylı analiz</li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-lg border-2 border-yellow-400">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">🥇</span>
                  <span className="text-xs font-bold text-orange-600">30 GÜN</span>
                </div>
                <h4 className="font-bold text-gray-900 mb-1">30 Günlük Reklam</h4>
                <p className="text-2xl font-bold text-orange-600 mb-2">₺9,500</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✓ 30 gün gösterim</li>
                  <li>✓ Premium yerleşim</li>
                  <li>✓ Öncelikli destek</li>
                </ul>
              </div>
            </div>

            {advertisements.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <div className="text-6xl mx-auto mb-4">📢</div>
                <p className="text-gray-500 mb-4">Henüz hiç reklam satın almadınız.</p>
                <Button 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  onClick={() => window.location.href = '/reklam-paketleri'}
                >
                  İlk Reklamımı Satın Al
                </Button>
              </div>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {advertisements.map((ad) => (
                  <div key={ad.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={ad.image_url} 
                        alt={ad.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{ad.title}</h3>
                        <p className="text-sm text-gray-500">{ad.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            ad.status === 'active' ? 'bg-green-100 text-green-800' :
                            ad.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {ad.status === 'active' ? 'Aktif' :
                             ad.status === 'inactive' ? 'Pasif' : 'Süresi Dolmuş'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {ad.ad_type === 'hero_banner' ? 'Hero Banner' :
                             ad.ad_type === 'featured_hotel' ? 'Öne Çıkan Otel' :
                             ad.ad_type === 'sponsored_room' ? 'Sponsorlu Salon' :
                             ad.ad_type === 'side_banner' ? 'Yan Banner' :
                             'Alt Promosyon'}
                          </span>
                          <span className="text-xs text-gray-500">
                            👁 {ad.total_views} · 🖱 {ad.total_clicks}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                          <Edit className="h-4 w-4" />
                        </Button>
                      <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Henüz aktivite bulunmuyor.</p>
              <p className="text-sm text-gray-400 mt-2">
                Rezervasyonlar ve diğer aktiviteler burada görünecek.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        <CreateHotelModal 
          isOpen={showCreateHotelModal}
          onClose={() => setShowCreateHotelModal(false)}
          onSuccess={handleHotelCreated}
        />
        
        <CreateRoomModal 
          isOpen={showCreateRoomModal}
          onClose={() => setShowCreateRoomModal(false)}
          onSuccess={handleRoomCreated}
        />

        <CreateRoomModal 
          isOpen={showCreateBallroomModal}
          onClose={() => setShowCreateBallroomModal(false)}
          onSuccess={handleRoomCreated}
          defaultRoomType="ballroom"
        />
      </div>
    </div>
  );
};

export default Dashboard;