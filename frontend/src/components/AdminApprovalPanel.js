import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { CheckCircle, XCircle, Building2, DoorOpen, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminApprovalPanel = () => {
  const { user } = useContext(AuthContext);
  const [pendingHotels, setPendingHotels] = useState([]);
  const [pendingRooms, setPendingRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hotels'); // 'hotels' or 'rooms'

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchPendingItems();
    }
  }, [user]);

  const fetchPendingItems = async () => {
    setLoading(true);
    try {
      const [hotelsRes, roomsRes] = await Promise.all([
        axios.get(`${API}/admin/hotels/pending`),
        axios.get(`${API}/admin/rooms/pending`)
      ]);
      
      setPendingHotels(hotelsRes.data);
      setPendingRooms(roomsRes.data);
    } catch (error) {
      console.error('Error fetching pending items:', error);
      toast.error('Onay bekleyen öğeler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveHotel = async (hotelId) => {
    try {
      await axios.put(`${API}/admin/hotels/${hotelId}/approve`);
      toast.success('Otel onaylandı!');
      fetchPendingItems();
    } catch (error) {
      console.error('Error approving hotel:', error);
      toast.error('Otel onaylanırken hata oluştu');
    }
  };

  const handleRejectHotel = async (hotelId) => {
    const reason = prompt('Red nedeni (opsiyonel):');
    try {
      await axios.put(`${API}/admin/hotels/${hotelId}/reject`, null, {
        params: { reason }
      });
      toast.success('Otel reddedildi');
      fetchPendingItems();
    } catch (error) {
      console.error('Error rejecting hotel:', error);
      toast.error('Otel reddedilirken hata oluştu');
    }
  };

  const handleApproveRoom = async (roomId) => {
    try {
      await axios.put(`${API}/admin/rooms/${roomId}/approve`);
      toast.success('Salon onaylandı!');
      fetchPendingItems();
    } catch (error) {
      console.error('Error approving room:', error);
      toast.error('Salon onaylanırken hata oluştu');
    }
  };

  const handleRejectRoom = async (roomId) => {
    const reason = prompt('Red nedeni (opsiyonel):');
    try {
      await axios.put(`${API}/admin/rooms/${roomId}/reject`, null, {
        params: { reason }
      });
      toast.success('Salon reddedildi');
      fetchPendingItems();
    } catch (error) {
      console.error('Error rejecting room:', error);
      toast.error('Salon reddedilirken hata oluştu');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-center space-x-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <p className="text-red-800">Bu sayfaya erişim yetkiniz yok.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Yönetici Onay Paneli</h1>
        <p className="text-gray-600">Onay bekleyen otelleri ve salonları görüntüleyin ve onaylayın</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('hotels')}
          className={`pb-4 px-2 font-medium transition-colors relative ${
            activeTab === 'hotels'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Oteller</span>
            {pendingHotels.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {pendingHotels.length}
              </span>
            )}
          </div>
        </button>
        
        <button
          onClick={() => setActiveTab('rooms')}
          className={`pb-4 px-2 font-medium transition-colors relative ${
            activeTab === 'rooms'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center space-x-2">
            <DoorOpen className="h-5 w-5" />
            <span>Salonlar</span>
            {pendingRooms.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                {pendingRooms.length}
              </span>
            )}
          </div>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Yükleniyor...</p>
        </div>
      ) : (
        <>
          {/* Hotels Tab */}
          {activeTab === 'hotels' && (
            <div className="space-y-4">
              {pendingHotels.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-12 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Onay bekleyen otel yok</p>
                </div>
              ) : (
                pendingHotels.map((hotel) => (
                  <div key={hotel.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <Building2 className="h-6 w-6 text-indigo-600" />
                          <h3 className="text-xl font-semibold text-gray-900">{hotel.name}</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-500">Şehir</p>
                            <p className="font-medium">{hotel.city}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Yıldız</p>
                            <p className="font-medium">{'⭐'.repeat(hotel.star_rating || 0)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Telefon</p>
                            <p className="font-medium">{hotel.phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium">{hotel.email}</p>
                          </div>
                        </div>
                        
                        {hotel.description && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-500">Açıklama</p>
                            <p className="text-gray-700 mt-1">{hotel.description}</p>
                          </div>
                        )}
                        
                        {hotel.images && hotel.images.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-500 mb-2">Fotoğraflar ({hotel.images.length})</p>
                            <div className="grid grid-cols-4 gap-2">
                              {hotel.images.slice(0, 4).map((img, idx) => (
                                <img 
                                  key={idx} 
                                  src={img} 
                                  alt={`Hotel ${idx + 1}`}
                                  className="w-full h-20 object-cover rounded"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-6">
                        <Button
                          onClick={() => handleApproveHotel(hotel.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Onayla
                        </Button>
                        <Button
                          onClick={() => handleRejectHotel(hotel.id)}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reddet
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Rooms Tab */}
          {activeTab === 'rooms' && (
            <div className="space-y-4">
              {pendingRooms.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-12 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Onay bekleyen salon yok</p>
                </div>
              ) : (
                pendingRooms.map((room) => (
                  <div key={room.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <DoorOpen className="h-6 w-6 text-indigo-600" />
                          <h3 className="text-xl font-semibold text-gray-900">{room.name}</h3>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-500">Kapasite</p>
                            <p className="font-medium">{room.capacity} kişi</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Alan</p>
                            <p className="font-medium">{room.area_sqm} m²</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Günlük Fiyat</p>
                            <p className="font-medium">{room.price_per_day} {room.currency}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Tip</p>
                            <p className="font-medium">{room.room_type}</p>
                          </div>
                        </div>
                        
                        {room.description && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-500">Açıklama</p>
                            <p className="text-gray-700 mt-1">{room.description}</p>
                          </div>
                        )}
                        
                        {room.features && room.features.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-500 mb-2">Özellikler</p>
                            <div className="flex flex-wrap gap-2">
                              {room.features.map((feature, idx) => (
                                <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {room.images && room.images.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-500 mb-2">Fotoğraflar ({room.images.length})</p>
                            <div className="grid grid-cols-4 gap-2">
                              {room.images.slice(0, 4).map((img, idx) => (
                                <img 
                                  key={idx} 
                                  src={img} 
                                  alt={`Room ${idx + 1}`}
                                  className="w-full h-20 object-cover rounded"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-6">
                        <Button
                          onClick={() => handleApproveRoom(room.id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Onayla
                        </Button>
                        <Button
                          onClick={() => handleRejectRoom(room.id)}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reddet
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminApprovalPanel;
