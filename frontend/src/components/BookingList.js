import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, MapPin, Users, Clock, Building2, Phone, Mail, Eye, X, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingList = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState({});
  const [rooms, setRooms] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, confirmed, cancelled

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  const fetchBookings = async () => {
    try {
      const [bookingsResponse, hotelsResponse, roomsResponse] = await Promise.all([
        axios.get(`${API}/bookings`),
        axios.get(`${API}/hotels`),
        axios.get(`${API}/rooms`)
      ]);
      
      setBookings(bookingsResponse.data);
      
      // Create lookup objects for hotels and rooms
      const hotelsLookup = {};
      const roomsLookup = {};
      
      hotelsResponse.data.forEach(hotel => {
        hotelsLookup[hotel.id] = hotel;
      });
      
      roomsResponse.data.forEach(room => {
        roomsLookup[room.id] = room;
      });
      
      setHotels(hotelsLookup);
      setRooms(roomsLookup);
    } catch (error) {
      console.error('Bookings fetch error:', error);
      toast.error('Rezervasyonlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Rezervasyonu iptal etmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await axios.patch(
        `${API}/bookings/${bookingId}/status`,
        { status: 'cancelled', notes: 'Müşteri tarafından iptal edildi' }
      );
      
      toast.success('Rezervasyon başarıyla iptal edildi');
      fetchBookings(); // Refresh the list
    } catch (error) {
      console.error('Booking cancellation error:', error);
      toast.error('Rezervasyon iptal edilirken hata oluştu');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: 'Bekliyor' },
      confirmed: { color: 'bg-green-100 text-green-800', text: 'Onaylandı' },
      cancelled: { color: 'bg-red-100 text-red-800', text: 'İptal Edildi' },
      completed: { color: 'bg-blue-100 text-blue-800', text: 'Tamamlandı' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} font-medium`}>
        {config.text}
      </Badge>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-orange-100 text-orange-800', text: 'Ödeme Bekliyor' },
      paid: { color: 'bg-green-100 text-green-800', text: 'Ödendi' },
      failed: { color: 'bg-red-100 text-red-800', text: 'Ödeme Başarısız' },
      refunded: { color: 'bg-purple-100 text-purple-800', text: 'İade Edildi' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge className={`${config.color} font-medium`}>
        {config.text}
      </Badge>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h3 className="text-xl font-medium text-gray-900 mb-2">Giriş Gerekli</h3>
          <p className="text-gray-500 mb-4">Rezervasyonlarınızı görmek için giriş yapmalısınız.</p>
          <Button onClick={() => navigate('/login')} className="bg-indigo-600 hover:bg-indigo-700">
            Giriş Yap
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="space-y-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-48 bg-gray-300 rounded"></div>
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
          <h1 data-testid="bookings-title" className="text-3xl font-bold text-gray-900 mb-4">
            Rezervasyonlarım
          </h1>
          <p className="text-gray-600">
            Geçmiş ve mevcut rezervasyonlarınızı bu sayfadan takip edebilirsiniz.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'Tümü', count: bookings.length },
                { key: 'pending', label: 'Bekleyen', count: bookings.filter(b => b.status === 'pending').length },
                { key: 'confirmed', label: 'Onaylanan', count: bookings.filter(b => b.status === 'confirmed').length },
                { key: 'cancelled', label: 'İptal Edilen', count: bookings.filter(b => b.status === 'cancelled').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                      filter === tab.key
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <Calendar className="h-16 w-16 text-gray-300" />
              <h3 className="text-xl font-medium text-gray-900">
                {filter === 'all' ? 'Henüz rezervasyon yok' : `${filter === 'pending' ? 'Bekleyen' : filter === 'confirmed' ? 'Onaylanan' : 'İptal edilen'} rezervasyon bulunamadı`}
              </h3>
              <p className="text-gray-500 max-w-md">
                {filter === 'all' 
                  ? 'İlk rezervasyonunuzu yapmak için salon aramaya başlayın.'
                  : 'Bu kategoride rezervasyon bulunmuyor.'
                }
              </p>
              {filter === 'all' && (
                <Button onClick={() => navigate('/rooms')} className="bg-indigo-600 hover:bg-indigo-700">
                  Salon Ara
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => {
              const room = rooms[booking.room_id];
              const hotel = room ? hotels[room.hotel_id] : null;
              
              return (
                <Card key={booking.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {room?.name || 'Salon Bilgisi Yüklenemedi'}
                          </h3>
                          {getStatusBadge(booking.status)}
                          {getPaymentStatusBadge(booking.payment_status)}
                        </div>
                        
                        {hotel && (
                          <div className="flex items-center space-x-2 text-indigo-600 mb-3">
                            <Building2 className="h-4 w-4" />
                            <span className="font-medium">{hotel.name}</span>
                            <span className="text-gray-400">•</span>
                            <MapPin className="h-4 w-4" />
                            <span>{hotel.city}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">
                          ₺{booking.total_price.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">toplam fiyat</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <div>
                          <div className="font-medium">
                            {new Date(booking.start_date).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-sm">
                            {booking.total_days} gün
                            {booking.total_hours && ` (${booking.total_hours} saat)`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock className="h-4 w-4" />
                        <div>
                          <div className="font-medium">
                            {new Date(booking.start_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(booking.end_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-sm">{booking.booking_type === 'daily' ? 'Günlük' : 'Saatlik'}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Users className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{booking.guest_count} kişi</div>
                          <div className="text-sm">katılımcı</div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">İletişim Bilgileri</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{booking.contact_person}</span>
                          <span className="text-gray-400">•</span>
                          <span>{booking.contact_phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span>{booking.contact_email}</span>
                        </div>
                        {booking.company_name && (
                          <div className="md:col-span-2">
                            <span className="font-medium">Firma:</span> {booking.company_name}
                          </div>
                        )}
                      </div>
                    </div>

                    {booking.special_requests && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Özel İstekler</h4>
                        <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded-lg">
                          {booking.special_requests}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        Rezervasyon Tarihi: {new Date(booking.created_at).toLocaleDateString('tr-TR')}
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/rooms/${booking.room_id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Salon Detayı
                        </Button>
                        
                        {booking.status === 'confirmed' && booking.payment_status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => navigate(`/bookings/${booking.id}/payment`)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Ödeme Yap
                          </Button>
                        )}
                        
                        {booking.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelBooking(booking.id)}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <X className="h-4 w-4 mr-2" />
                            İptal Et
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingList;