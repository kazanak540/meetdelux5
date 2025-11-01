import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Star, User, Calendar, Users, MessageSquare, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const StarRating = ({ rating, onRatingChange, readonly = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform`}
          onClick={() => !readonly && onRatingChange(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          onMouseLeave={() => !readonly && setHoverRating(0)}
        >
          <Star
            className={`h-5 w-5 ${
              star <= (hoverRating || rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const ReviewForm = ({ booking, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    hotel_rating: 5,
    room_rating: 5,
    service_rating: 5,
    catering_rating: 5,
    overall_rating: 5,
    title: '',
    comment: '',
    would_recommend: true,
    event_type: 'seminer'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const reviewData = {
        booking_id: booking.id,
        ...formData,
        attendee_count: booking.guest_count
      };

      await axios.post(`${API}/reviews`, reviewData);
      toast.success('Değerlendirmeniz başarıyla gönderildi!');
      onSubmit();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Değerlendirme gönderilirken hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Star className="h-6 w-6 text-yellow-500" />
          <span>Etkinliğinizi Değerlendirin</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label>Otel Genel (Konum, Temizlik, Personel)</Label>
              <div className="mt-2">
                <StarRating 
                  rating={formData.hotel_rating} 
                  onRatingChange={(rating) => setFormData(prev => ({ ...prev, hotel_rating: rating }))}
                />
              </div>
            </div>

            <div>
              <Label>Salon Kalitesi (Donanım, Akustik, Aydınlatma)</Label>
              <div className="mt-2">
                <StarRating 
                  rating={formData.room_rating} 
                  onRatingChange={(rating) => setFormData(prev => ({ ...prev, room_rating: rating }))}
                />
              </div>
            </div>

            <div>
              <Label>Hizmet Kalitesi (Yardımcı Personel, Teknik Destek)</Label>
              <div className="mt-2">
                <StarRating 
                  rating={formData.service_rating} 
                  onRatingChange={(rating) => setFormData(prev => ({ ...prev, service_rating: rating }))}
                />
              </div>
            </div>

            <div>
              <Label>Catering & İkramlar</Label>
              <div className="mt-2">
                <StarRating 
                  rating={formData.catering_rating} 
                  onRatingChange={(rating) => setFormData(prev => ({ ...prev, catering_rating: rating }))}
                />
              </div>
            </div>
          </div>

          {/* Overall Rating */}
          <div className="bg-indigo-50 p-4 rounded-lg">
            <Label className="text-lg font-semibold">Genel Memnuniyet</Label>
            <div className="mt-2 flex items-center space-x-3">
              <StarRating 
                rating={formData.overall_rating} 
                onRatingChange={(rating) => setFormData(prev => ({ ...prev, overall_rating: rating }))}
              />
              <span className="text-lg font-medium text-indigo-600">
                {formData.overall_rating}/5
              </span>
            </div>
          </div>

          {/* Event Type */}
          <div>
            <Label htmlFor="event_type">Etkinlik Türü</Label>
            <select
              id="event_type"
              value={formData.event_type}
              onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
            >
              <option value="seminer">Seminer</option>
              <option value="toplanti">Toplantı</option>
              <option value="workshop">Workshop</option>
              <option value="gala">Gala/Etkinlik</option>
              <option value="konferans">Konferans</option>
            </select>
          </div>

          {/* Review Title */}
          <div>
            <Label htmlFor="title">Değerlendirme Başlığı</Label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Örn: Mükemmel bir seminer deneyimi"
              className="mt-1"
              required
              maxLength={100}
            />
          </div>

          {/* Comment */}
          <div>
            <Label htmlFor="comment">Detaylı Yorum</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Etkinliğiniz hakkında detaylı görüşlerinizi paylaşın..."
              className="mt-1"
              rows={4}
              required
              maxLength={1000}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.comment.length}/1000 karakter
            </div>
          </div>

          {/* Recommendation */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="would_recommend"
              checked={formData.would_recommend}
              onChange={(e) => setFormData(prev => ({ ...prev, would_recommend: e.target.checked }))}
              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <Label htmlFor="would_recommend" className="text-sm">
              Bu oteli ve salonu başkalarına tavsiye ederim
            </Label>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              İptal
            </Button>
            <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Gönderiliyor...
                </div>
              ) : (
                'Değerlendirmeyi Gönder'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const ReviewDisplay = ({ reviews, showHotelResponse = false }) => {
  const getEventTypeLabel = (type) => {
    const labels = {
      seminer: 'Seminer',
      toplanti: 'Toplantı', 
      workshop: 'Workshop',
      gala: 'Gala/Etkinlik',
      konferans: 'Konferans'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (reviews.length === 0) {
    return (
      <Card className="p-8 text-center">
        <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz değerlendirme yok</h3>
        <p className="text-gray-500">Bu salon için ilk değerlendirmeyi siz yapın!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <Card key={review.id} className="overflow-hidden">
          <CardContent className="p-6">
            {/* Review Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{review.customer_name}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(review.created_at)}</span>
                    <span>•</span>
                    <Users className="h-4 w-4" />
                    <span>{review.attendee_count} kişi</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-1 mb-1">
                  <StarRating rating={review.overall_rating} readonly />
                  <span className="text-sm text-gray-600">({review.overall_rating}/5)</span>
                </div>
                <Badge className="bg-purple-100 text-purple-800">
                  {getEventTypeLabel(review.event_type)}
                </Badge>
              </div>
            </div>

            {/* Review Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{review.title}</h3>

            {/* Review Content */}
            <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>

            {/* Detailed Ratings */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <div className="text-xs text-gray-500 mb-1">Otel</div>
                <StarRating rating={review.hotel_rating} readonly />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Salon</div>
                <StarRating rating={review.room_rating} readonly />
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Hizmet</div>
                <StarRating rating={review.service_rating} readonly />
              </div>
              {review.catering_rating && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Catering</div>
                  <StarRating rating={review.catering_rating} readonly />
                </div>
              )}
            </div>

            {/* Recommendation */}
            {review.would_recommend && (
              <div className="flex items-center space-x-2 text-green-600 mb-4">
                <ThumbsUp className="h-4 w-4" />
                <span className="text-sm font-medium">Tavsiye ediyor</span>
              </div>
            )}

            {/* Hotel Response */}
            {showHotelResponse && review.hotel_response && (
              <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Otel Yanıtı</span>
                  <span className="text-xs text-blue-600">
                    {formatDate(review.hotel_response_date)}
                  </span>
                </div>
                <p className="text-blue-800 text-sm">{review.hotel_response}</p>
              </div>
            )}

            {/* Verified Badge */}
            {review.is_verified && (
              <div className="mt-3 flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 font-medium">Doğrulanmış Rezervasyon</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export { ReviewForm, ReviewDisplay, StarRating };