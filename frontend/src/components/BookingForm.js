import React, { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Calendar, Clock, Users, Building2, Phone, Mail, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '../hooks/useCurrency';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingForm = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Dates, 2: Details, 3: Confirmation
  const { formatPrice, currency } = useCurrency();
  
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
    start_time: '09:00',
    end_time: '17:00',
    guest_count: '',
    booking_type: 'daily',
    special_requests: '',
    contact_person: user?.full_name || '',
    contact_phone: user?.phone || '',
    contact_email: user?.email || '',
    company_name: ''
  });
  
  const [pricing, setPricing] = useState({
    days: 0,
    hours: 0,
    roomPrice: 0,
    servicesPrice: 0,
    totalPrice: 0
  });
  
  const [extraServices, setExtraServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails();
    }
  }, [roomId]);

  useEffect(() => {
    calculatePricing();
  }, [formData.start_date, formData.end_date, formData.start_time, formData.end_time, formData.booking_type, room, selectedServices]);

  const fetchRoomDetails = async () => {
    try {
      const roomResponse = await axios.get(`${API}/rooms/${roomId}`);
      const roomData = roomResponse.data;
      setRoom(roomData);
      
      const hotelResponse = await axios.get(`${API}/hotels/${roomData.hotel_id}`);
      setHotel(hotelResponse.data);
      
      // Fetch extra services
      const servicesResponse = await axios.get(`${API}/hotels/${roomData.hotel_id}/services`);
      setExtraServices(servicesResponse.data);
    } catch (error) {
      console.error('Room details fetch error:', error);
      toast.error('Salon bilgileri yüklenirken hata oluştu');
      navigate('/rooms');
    } finally {
      setLoading(false);
    }
  };

  const calculatePricing = () => {
    if (!room || !formData.start_date || !formData.end_date) return;

    try {
      const startDate = new Date(`${formData.start_date}T${formData.start_time}:00`);
      const endDate = new Date(`${formData.end_date}T${formData.end_time}:00`);
      
      if (startDate >= endDate) {
        setPricing({ days: 0, hours: 0, roomPrice: 0, servicesPrice: 0, totalPrice: 0 });
        return;
      }

      let roomPrice = 0;
      let days = 0;
      let hours = 0;

      if (formData.booking_type === 'daily') {
        days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (days < 1) days = 1;
        roomPrice = room.price_per_day * days;
      } else if (formData.booking_type === 'hourly' && room.price_per_hour) {
        hours = Math.ceil((endDate - startDate) / (1000 * 60 * 60));
        roomPrice = room.price_per_hour * hours;
      }

      // Calculate services price
      const servicesPrice = selectedServices.reduce((total, service) => {
        const servicePrice = service.pricing_info ? service.pricing_info.display_price : service.price;
        return total + (servicePrice * service.quantity);
      }, 0);

      setPricing({
        days,
        hours,
        roomPrice,
        servicesPrice,
        totalPrice: roomPrice + servicesPrice
      });
    } catch (error) {
      console.error('Pricing calculation error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceToggle = (service) => {
    const existingIndex = selectedServices.findIndex(s => s.id === service.id);
    if (existingIndex >= 0) {
      // Remove service
      setSelectedServices(prev => prev.filter(s => s.id !== service.id));
    } else {
      // Add service with default quantity 1
      setSelectedServices(prev => [...prev, { ...service, quantity: 1 }]);
    }
  };

  const handleServiceQuantityChange = (serviceId, quantity) => {
    const qty = Math.max(1, parseInt(quantity) || 1);
    setSelectedServices(prev => prev.map(service => 
      service.id === serviceId ? { ...service, quantity: qty } : service
    ));
  };

  const isServiceSelected = (serviceId) => {
    return selectedServices.some(s => s.id === serviceId);
  };

  const getServiceQuantity = (serviceId) => {
    const service = selectedServices.find(s => s.id === serviceId);
    return service?.quantity || 1;
  };

  const validateStep1 = () => {
    if (!formData.start_date || !formData.end_date || !formData.guest_count) {
      toast.error('Lütfen tüm gerekli alanları doldurun');
      return false;
    }
    
    if (parseInt(formData.guest_count) > room.capacity) {
      toast.error(`Maksimum kapasite ${room.capacity} kişidir`);
      return false;
    }
    
    const startDate = new Date(`${formData.start_date}T${formData.start_time}:00`);
    const endDate = new Date(`${formData.end_date}T${formData.end_time}:00`);
    
    if (startDate >= endDate) {
      toast.error('Bitiş tarihi başlangıç tarihinden sonra olmalıdır');
      return false;
    }
    
    if (startDate < new Date()) {
      toast.error('Başlangıç tarihi bugünden sonra olmalıdır');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    if (!formData.contact_person || !formData.contact_phone || !formData.contact_email) {
      toast.error('Lütfen iletişim bilgilerini doldurun');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Rezervasyon yapmak için giriş yapmalısınız');
      navigate('/login');
      return;
    }

    setSubmitting(true);
    
    try {
      const startDateTime = `${formData.start_date}T${formData.start_time}:00`;
      const endDateTime = `${formData.end_date}T${formData.end_time}:00`;
      
      const bookingData = {
        room_id: roomId,
        start_date: startDateTime,
        end_date: endDateTime,
        guest_count: parseInt(formData.guest_count),
        booking_type: formData.booking_type,
        special_requests: formData.special_requests,
        extra_services: selectedServices.map(service => ({
          service_id: service.id,
          quantity: service.quantity,
          unit_price: service.pricing_info ? service.pricing_info.display_price : service.price,
          total_price: (service.pricing_info ? service.pricing_info.display_price : service.price) * service.quantity
        })),
        contact_person: formData.contact_person,
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
        company_name: formData.company_name
      };

      const response = await axios.post(`${API}/bookings`, bookingData);
      
      toast.success('Rezervasyon talebiniz başarıyla oluşturuldu!');
      
      // Navigate to payment page if booking is confirmed, otherwise to bookings list
      if (response.data.status === 'confirmed') {
        navigate(`/bookings/${response.data.id}/payment`);
      } else {
        navigate('/bookings');
      }
    } catch (error) {
      console.error('Booking creation error:', error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Rezervasyon oluşturulurken hata oluştu');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-64 mb-8"></div>
            <div className="h-96 bg-gray-300 rounded"></div>
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
          <p className="text-gray-500 mb-4">Rezervasyon yapmak istediğiniz salon mevcut değil.</p>
          <Button onClick={() => navigate('/rooms')} variant="outline">
            Salon Aramaya Dön
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/rooms/${roomId}`)}
            className="mb-4 flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Salon Detayına Dön</span>
          </Button>
          
          <h1 data-testid="booking-form-title" className="text-3xl font-bold text-gray-900 mb-2">
            Rezervasyon Yap
          </h1>
          <p className="text-gray-600">
            {room.name} - {hotel.name}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  step >= stepNum 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNum ? <Check className="h-5 w-5" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-16 h-1 mx-2 ${
                    step > stepNum ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-8 text-sm text-gray-600">
              <span className={step >= 1 ? 'text-indigo-600 font-medium' : ''}>Tarih Seçimi</span>
              <span className={step >= 2 ? 'text-indigo-600 font-medium' : ''}>Detaylar</span>
              <span className={step >= 3 ? 'text-indigo-600 font-medium' : ''}>Onay</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {/* Step 1: Date Selection */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tarih ve Saat Seçimi</h3>
                    </div>
                    
                    {/* Booking Type */}
                    <div>
                      <Label className="text-base font-medium">Kiralama Türü</Label>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, booking_type: 'daily' }))}
                          className={`p-4 border rounded-lg text-left ${
                            formData.booking_type === 'daily'
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Calendar className="h-5 w-5 mb-2" />
                          <div className="font-medium">Günlük Kiralama</div>
                          <div className="text-sm text-gray-500">₺{room.price_per_day.toLocaleString()} / gün</div>
                        </button>
                        
                        {room.price_per_hour && (
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, booking_type: 'hourly' }))}
                            className={`p-4 border rounded-lg text-left ${
                              formData.booking_type === 'hourly'
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Clock className="h-5 w-5 mb-2" />
                            <div className="font-medium">Saatlik Kiralama</div>
                            <div className="text-sm text-gray-500">₺{room.price_per_hour.toLocaleString()} / saat</div>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Date Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_date">Başlangıç Tarihi</Label>
                        <Input
                          data-testid="start-date-input"
                          id="start_date"
                          name="start_date"
                          type="date"
                          value={formData.start_date}
                          onChange={handleInputChange}
                          min={new Date().toISOString().split('T')[0]}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_date">Bitiş Tarihi</Label>
                        <Input
                          data-testid="end-date-input"
                          id="end_date"
                          name="end_date"
                          type="date"
                          value={formData.end_date}
                          onChange={handleInputChange}
                          min={formData.start_date || new Date().toISOString().split('T')[0]}
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Time Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start_time">Başlangıç Saati</Label>
                        <Input
                          data-testid="start-time-input"
                          id="start_time"
                          name="start_time"
                          type="time"
                          value={formData.start_time}
                          onChange={handleInputChange}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="end_time">Bitiş Saati</Label>
                        <Input
                          data-testid="end-time-input"
                          id="end_time"
                          name="end_time"
                          type="time"
                          value={formData.end_time}
                          onChange={handleInputChange}
                          className="mt-1"
                          required
                        />
                      </div>
                    </div>
                    
                    {/* Guest Count */}
                    <div>
                      <Label htmlFor="guest_count">Katılımcı Sayısı</Label>
                      <div className="relative mt-1">
                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <Input
                          data-testid="guest-count-input"
                          id="guest_count"
                          name="guest_count"
                          type="number"
                          min="1"
                          max={room.capacity}
                          value={formData.guest_count}
                          onChange={handleInputChange}
                          className="pl-10"
                          placeholder={`Maksimum ${room.capacity} kişi`}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700">
                        Devam Et
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Step 2: Contact Details */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">İletişim Bilgileri</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact_person">İletişim Kişisi</Label>
                        <Input
                          data-testid="contact-person-input"
                          id="contact_person"
                          name="contact_person"
                          type="text"
                          value={formData.contact_person}
                          onChange={handleInputChange}
                          className="mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="company_name">Firma Adı (Opsiyonel)</Label>
                        <Input
                          data-testid="company-name-input"
                          id="company_name"
                          name="company_name"
                          type="text"
                          value={formData.company_name}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="contact_phone">Telefon</Label>
                        <div className="relative mt-1">
                          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <Input
                            data-testid="contact-phone-input"
                            id="contact_phone"
                            name="contact_phone"
                            type="tel"
                            value={formData.contact_phone}
                            onChange={handleInputChange}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="contact_email">E-posta</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                          <Input
                            data-testid="contact-email-input"
                            id="contact_email"
                            name="contact_email"
                            type="email"
                            value={formData.contact_email}
                            onChange={handleInputChange}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="special_requests">Özel İstekler (Opsiyonel)</Label>
                      <Textarea
                        data-testid="special-requests-input"
                        id="special_requests"
                        name="special_requests"
                        value={formData.special_requests}
                        onChange={handleInputChange}
                        className="mt-1"
                        rows={4}
                        placeholder="Özel isteklerinizi, catering, ekstra donanım vb. buraya yazabilirsiniz..."
                      />
                    </div>

                    {/* Extra Services */}
                    {extraServices.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ekstra Hizmetler</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {extraServices.map((service) => (
                            <Card key={service.id} className={`cursor-pointer transition-all ${
                              isServiceSelected(service.id) ? 'border-indigo-500 bg-indigo-50' : 'hover:bg-gray-50'
                            }`}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                      <input
                                        type="checkbox"
                                        checked={isServiceSelected(service.id)}
                                        onChange={() => handleServiceToggle(service)}
                                        className="h-4 w-4 text-indigo-600 rounded"
                                      />
                                      <div>
                                        <h4 className="font-medium text-gray-900">{service.name}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                        <div className="mt-2">
                                          <span className="text-lg font-semibold text-indigo-600">
                                            {formatPrice(
                                              service.pricing_info ? service.pricing_info.display_price : service.price, 
                                              service.currency || 'EUR'
                                            )}
                                          </span>
                                          <span className="text-sm text-gray-500 ml-1">/ {service.unit}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {isServiceSelected(service.id) && (
                                      <div className="mt-3 pl-7">
                                        <Label htmlFor={`quantity-${service.id}`} className="text-sm">Adet/Miktar</Label>
                                        <Input
                                          id={`quantity-${service.id}`}
                                          type="number"
                                          min="1"
                                          value={getServiceQuantity(service.id)}
                                          onChange={(e) => handleServiceQuantityChange(service.id, e.target.value)}
                                          className="mt-1 w-20"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                        
                        {selectedServices.length > 0 && (
                          <Card className="mt-4 bg-indigo-50 border-indigo-200">
                            <CardContent className="p-4">
                              <h4 className="font-medium text-gray-900 mb-3">Seçilen Hizmetler:</h4>
                              <div className="space-y-2">
                                {selectedServices.map((service) => (
                                  <div key={service.id} className="flex justify-between items-center text-sm">
                                    <span>{service.name} x {service.quantity}</span>
                                    <span className="font-medium">
                                      {formatPrice(
                                        (service.pricing_info ? service.pricing_info.display_price : service.price) * service.quantity,
                                        service.currency || 'EUR'
                                      )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              <div className="border-t border-indigo-200 mt-3 pt-3">
                                <div className="flex justify-between items-center font-semibold">
                                  <span>Ekstra Hizmetler Toplamı:</span>
                                  <span className="text-indigo-600">
                                    {formatPrice(pricing.servicesPrice, currency)}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <Button onClick={handleBack} variant="outline">
                        Geri
                      </Button>
                      <Button onClick={handleNext} className="bg-indigo-600 hover:bg-indigo-700">
                        Devam Et
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Step 3: Confirmation */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Rezervasyon Özeti</h3>
                    </div>
                    
                    {/* Booking Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Salon:</span>
                        <span className="font-medium">{room.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Otel:</span>
                        <span className="font-medium">{hotel.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tarih:</span>
                        <span className="font-medium">
                          {new Date(formData.start_date).toLocaleDateString('tr-TR')} - {new Date(formData.end_date).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Saat:</span>
                        <span className="font-medium">{formData.start_time} - {formData.end_time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Katılımcı:</span>
                        <span className="font-medium">{formData.guest_count} kişi</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">İletişim:</span>
                        <span className="font-medium">{formData.contact_person}</span>
                      </div>
                      {formData.special_requests && (
                        <div className="pt-2 border-t border-gray-200">
                          <span className="text-gray-600">Özel İstekler:</span>
                          <p className="text-sm text-gray-700 mt-1">{formData.special_requests}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex justify-between">
                      <Button onClick={handleBack} variant="outline">
                        Geri
                      </Button>
                      <Button 
                        onClick={handleSubmit} 
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {submitting ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Rezervasyon Yapılıyor...
                          </div>
                        ) : (
                          'Rezervasyonu Onayla'
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Pricing Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Fiyat Detayı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {formData.booking_type === 'daily' && pricing.days > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{pricing.days} gün</span>
                      <span className="font-medium">{formatPrice(pricing.roomPrice, currency)}</span>
                    </div>
                  )}
                  
                  {formData.booking_type === 'hourly' && pricing.hours > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{pricing.hours} saat</span>
                      <span className="font-medium">{formatPrice(pricing.roomPrice, currency)}</span>
                    </div>
                  )}
                  
                  {pricing.servicesPrice > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ekstra Hizmetler</span>
                      <span className="font-medium">{formatPrice(pricing.servicesPrice, currency)}</span>
                    </div>
                  )}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Toplam</span>
                      <span className="text-indigo-600">{formatPrice(pricing.totalPrice, currency)}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 pt-2">
                    <p>• Fiyatlara KDV dahildir</p>
                    <p>• Rezervasyon ücretsiz iptal edilebilir</p>
                    <p>• Ödeme etkinlik sonrası yapılır</p>
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

export default BookingForm;