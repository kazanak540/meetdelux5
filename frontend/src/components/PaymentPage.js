import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CheckCircle, XCircle, CreditCard, Clock, ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentPage = () => {
  const { bookingId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [pollingStatus, setPollingStatus] = useState(false);

  // Check if we're returning from Stripe
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  useEffect(() => {
    // If we have a session_id from Stripe redirect, start polling
    if (sessionId) {
      setPollingStatus(true);
      pollPaymentStatus(sessionId);
    }
  }, [sessionId]);

  const fetchBookingDetails = async () => {
    try {
      const response = await axios.get(`${API}/bookings/${bookingId}`);
      setBooking(response.data);
    } catch (error) {
      console.error('Booking fetch error:', error);
      toast.error('Rezervasyon bilgileri yüklenirken hata oluştu');
      navigate('/bookings');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (sessionId, attempts = 0) => {
    const maxAttempts = 10;
    const pollInterval = 3000; // 3 seconds

    if (attempts >= maxAttempts) {
      setPollingStatus(false);
      toast.error('Ödeme durumu kontrol edilirken zaman aşımı oluştu. Lütfen rezervasyonlarınızı kontrol edin.');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/${sessionId}/status`);
      setPayment(response.data);
      
      if (response.data.payment_status === 'paid') {
        setPollingStatus(false);
        toast.success('Ödeme başarılı! Rezervasyonunuz onaylandı.');
        // Refresh booking data
        fetchBookingDetails();
        return;
      } else if (response.data.payment_status === 'failed') {
        setPollingStatus(false);
        toast.error('Ödeme başarısız oldu. Lütfen tekrar deneyin.');
        return;
      }

      // Continue polling if still pending
      setTimeout(() => pollPaymentStatus(sessionId, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Payment status check error:', error);
      setPollingStatus(false);
      toast.error('Ödeme durumu kontrol edilirken hata oluştu');
    }
  };

  const initiatePayment = async () => {
    if (!booking) return;

    setPaymentLoading(true);
    
    try {
      const currentUrl = window.location.origin;
      const successUrl = `${currentUrl}/bookings/${bookingId}/payment?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${currentUrl}/bookings/${bookingId}/payment`;

      const response = await axios.post(`${API}/bookings/${bookingId}/payment`, {
        booking_id: bookingId,
        success_url: successUrl,
        cancel_url: cancelUrl
      });

      // Redirect to Stripe Checkout
      if (response.data.stripe_checkout_url) {
        window.location.href = response.data.stripe_checkout_url;
      } else {
        throw new Error('Ödeme URL\'si alınamadı');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(error.response?.data?.detail || 'Ödeme başlatılırken hata oluştu');
    } finally {
      setPaymentLoading(false);
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

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Rezervasyon bulunamadı</h3>
          <p className="text-gray-500 mb-4">Ödeme yapmak istediğiniz rezervasyon mevcut değil.</p>
          <Button onClick={() => navigate('/bookings')} variant="outline">
            Rezervasyonlara Dön
          </Button>
        </Card>
      </div>
    );
  }

  const getPaymentStatusIcon = () => {
    if (pollingStatus) {
      return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
    }
    
    switch (booking.payment_status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPaymentStatusText = () => {
    if (pollingStatus) {
      return 'Ödeme kontrol ediliyor...';
    }
    
    switch (booking.payment_status) {
      case 'paid':
        return 'Ödeme Tamamlandı';
      case 'failed':
        return 'Ödeme Başarısız';
      default:
        return 'Ödeme Bekleniyor';
    }
  };

  const getPaymentStatusBadge = () => {
    if (pollingStatus) {
      return <Badge className="bg-yellow-100 text-yellow-800">Kontrol Ediliyor</Badge>;
    }
    
    switch (booking.payment_status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Ödendi</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">Başarısız</Badge>;
      default:
        return <Badge className="bg-orange-100 text-orange-800">Ödeme Bekliyor</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/bookings')}
            className="mb-4 flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Rezervasyonlara Dön</span>
          </Button>
          
          <h1 data-testid="payment-title" className="text-3xl font-bold text-gray-900 mb-2">
            Ödeme
          </h1>
          <p className="text-gray-600">
            Rezervasyonunuz için ödeme işlemini tamamlayın
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Payment Status */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getPaymentStatusIcon()}
                  <span>Ödeme Durumu</span>
                  {getPaymentStatusBadge()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {getPaymentStatusText()}
                </p>
                
                {pollingStatus && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                      <span className="text-blue-800 font-medium">Ödeme durumu kontrol ediliyor...</span>
                    </div>
                    <p className="text-blue-600 text-sm mt-2">
                      Stripe'dan ödeme onayı bekleniyor. Bu işlem birkaç saniye sürebilir.
                    </p>
                  </div>
                )}
                
                {booking.payment_status === 'paid' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium">Ödeme başarıyla tamamlandı!</span>
                    </div>
                    <p className="text-green-600 text-sm mt-2">
                      Rezervasyonunuz onaylandı. E-posta adresinize onay mesajı gönderilecektir.
                    </p>
                  </div>
                )}
                
                {booking.payment_status === 'failed' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="text-red-800 font-medium">Ödeme başarısız oldu</span>
                    </div>
                    <p className="text-red-600 text-sm mt-2">
                      Ödeme işlemi tamamlanamadı. Lütfen tekrar deneyin veya farklı bir ödeme yöntemi kullanın.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Actions */}
            {booking.status === 'confirmed' && booking.payment_status !== 'paid' && !pollingStatus && (
              <Card>
                <CardHeader>
                  <CardTitle>Ödeme Yap</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-6">
                    Güvenli ödeme için Stripe ödeme sistemini kullanıyoruz. 
                    Kredi kartı, banka kartı ile ödeme yapabilirsiniz.
                  </p>
                  
                  <div className="flex items-center space-x-4">
                    <Button 
                      onClick={initiatePayment}
                      disabled={paymentLoading}
                      className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-3"
                    >
                      {paymentLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Ödeme sayfasına yönlendiriliyor...
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <CreditCard className="h-5 w-5 mr-2" />
                          Stripe ile Öde
                        </div>
                      )}
                    </Button>
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500">
                    <p>🔒 SSL ile şifrelenmiş güvenli ödeme</p>
                    <p>💳 Visa, Mastercard, American Express kabul edilir</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Booking Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Rezervasyon Özeti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Salon</h4>
                    <p className="text-gray-600">Salon ID: {booking.room_id}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Tarih</h4>
                    <p className="text-gray-600">
                      {new Date(booking.start_date).toLocaleDateString('tr-TR')} - {new Date(booking.end_date).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Süre</h4>
                    <p className="text-gray-600">
                      {booking.total_days} gün
                      {booking.total_hours && ` (${booking.total_hours} saat)`}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Katılımcı</h4>
                    <p className="text-gray-600">{booking.guest_count} kişi</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Salon Ücreti</span>
                      <span className="font-medium">₺{booking.room_price.toLocaleString()}</span>
                    </div>
                    
                    {booking.services_price > 0 && (
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-gray-600">Ek Hizmetler</span>
                        <span>₺{booking.services_price.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-4 pt-2 border-t">
                      <span className="text-lg font-semibold text-gray-900">Toplam</span>
                      <span className="text-lg font-semibold text-indigo-600">
                        ₺{booking.total_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 pt-2">
                    <p>• KDV dahil fiyattır</p>
                    <p>• Ödeme sonrası fatura e-posta ile gönderilecektir</p>
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

export default PaymentPage;