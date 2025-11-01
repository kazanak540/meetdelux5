import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { X, Check, Users, MapPin, DollarSign, Star, Calendar } from 'lucide-react';

const RoomComparison = ({ rooms, hotels, onClose }) => {
  const [selectedRooms, setSelectedRooms] = useState(rooms.slice(0, 3));

  const getHotel = (hotelId) => hotels.find(h => h.id === hotelId);

  const removeRoom = (roomId) => {
    setSelectedRooms(prev => prev.filter(room => room.id !== roomId));
  };

  const getFeatureName = (feature) => {
    const names = {
      projector: 'Projektör',
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

  const allFeatures = [...new Set(selectedRooms.flatMap(room => room.features || []))];

  if (selectedRooms.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold mb-4">Karşılaştırma Listesi Boş</h3>
            <p className="text-gray-600 mb-4">Karşılaştırmak için salon seçin</p>
            <Button onClick={onClose}>Kapat</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-gray-900">
            Salon Karşılaştırması ({selectedRooms.length})
          </h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Comparison Table */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {selectedRooms.map((room) => {
              const hotel = getHotel(room.hotel_id);
              return (
                <Card key={room.id} className="relative">
                  {/* Remove Button */}
                  <button
                    onClick={() => removeRoom(room.id)}
                    className="absolute top-3 right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <CardHeader className="pb-4">
                    {/* Room Image */}
                    <div className="h-40 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg mb-4 relative">
                      <div className="absolute inset-0 bg-black/20 rounded-lg"></div>
                      <div className="absolute top-3 left-3 bg-white/90 px-2 py-1 rounded-full text-sm font-medium">
                        <Users className="inline h-4 w-4 mr-1" />
                        {room.capacity} kişi
                      </div>
                    </div>

                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{hotel?.name}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Price */}
                    <div className="bg-indigo-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-600">
                        ₺{room.price_per_day.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">günlük</div>
                      {room.price_per_hour && (
                        <div className="text-sm text-gray-500">
                          ₺{room.price_per_hour}/saat
                        </div>
                      )}
                    </div>

                    {/* Basic Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Kapasite:</span>
                        <span className="font-medium">{room.capacity} kişi</span>
                      </div>
                      {room.area_sqm && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Alan:</span>
                          <span className="font-medium">{room.area_sqm} m²</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Otel Yıldızı:</span>
                        <div className="flex">
                          {[...Array(hotel?.star_rating || 5)].map((_, i) => (
                            <Star key={i} className="h-3 w-3 text-yellow-400 fill-current" />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Features Comparison */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Özellikler</h4>
                      <div className="space-y-1">
                        {allFeatures.map((feature) => {
                          const hasFeature = room.features?.includes(feature);
                          return (
                            <div key={feature} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">{getFeatureName(feature)}</span>
                              {hasFeature ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <X className="h-4 w-4 text-red-400" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Room Type */}
                    <div>
                      <Badge className="bg-purple-100 text-purple-800">
                        {room.room_type === 'conference' ? 'Konferans' :
                         room.room_type === 'meeting' ? 'Toplantı' :
                         room.room_type === 'ballroom' ? 'Balo Salonu' : 'Salon'}
                      </Badge>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-2">
                      <Button 
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                        onClick={() => window.open(`/rooms/${room.id}`, '_blank')}
                      >
                        Detayları Gör
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(`/rooms/${room.id}/booking`, '_blank')}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Rezervasyon Yap
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Best Choice Recommendation */}
          {selectedRooms.length > 1 && (
            <Card className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-4">
                <h3 className="font-semibold text-green-800 mb-2">🏆 En İyi Seçim Önerisi</h3>
                <div className="text-sm text-green-700">
                  <p>
                    <strong>{selectedRooms[0]?.name}</strong> - 
                    En uygun fiyat/performans oranı. {selectedRooms[0]?.capacity} kişilik kapasitesi ve 
                    ₺{selectedRooms[0]?.price_per_day.toLocaleString()} günlük fiyatı ile ideal seçim.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">
                  ₺{Math.min(...selectedRooms.map(r => r.price_per_day)).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">En Düşük Fiyat</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {Math.max(...selectedRooms.map(r => r.capacity))}
                </div>
                <div className="text-sm text-gray-600">En Yüksek Kapasite</div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-50">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-800">
                  {Math.max(...selectedRooms.map(r => r.features?.length || 0))}
                </div>
                <div className="text-sm text-gray-600">En Çok Özellik</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomComparison;