import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send, Clock, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    setTimeout(() => {
      toast.success('Mesajınız başarıyla gönderildi!', {
        description: 'En kısa sürede size geri dönüş yapacağız.'
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Bizimle İletişime Geçin
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sorularınız, önerileriniz veya rezervasyon talepleriniz için bizimle iletişime geçebilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">İletişim Bilgileri</h3>
              
              <div className="space-y-4">
                {/* Address */}
                <div className="flex items-start space-x-4">
                  <div className="bg-indigo-100 p-3 rounded-lg">
                    <MapPin className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Adres</h4>
                    <p className="text-gray-600 text-sm">
                      Atakent Mahallesi<br />
                      Kutlutaş Sitesi A5 Blok Daire 1<br />
                      Halkalı, Küçükçekmece<br />
                      İstanbul
                    </p>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-start space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Phone className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Telefon</h4>
                    <a 
                      href="tel:+905352439696"
                      className="text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      +90 535 243 96 96
                    </a>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">E-posta</h4>
                    <a 
                      href="mailto:info@meetdelux.com"
                      className="text-gray-600 hover:text-indigo-600 transition-colors"
                    >
                      info@meetdelux.com
                    </a>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start space-x-4">
                  <div className="bg-amber-100 p-3 rounded-lg">
                    <Clock className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Çalışma Saatleri</h4>
                    <p className="text-gray-600 text-sm">
                      Pazartesi - Cuma: 09:00 - 18:00<br />
                      Cumartesi: 10:00 - 16:00<br />
                      Pazar: Kapalı
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <MessageSquare className="h-12 w-12 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Hızlı Destek</h3>
              <p className="text-indigo-100 text-sm mb-4">
                Acil durumlar için 7/24 WhatsApp destek hattımızdan bize ulaşabilirsiniz.
              </p>
              <a
                href="https://wa.me/905352439696"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-white text-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                <Phone className="h-4 w-4" />
                <span className="font-medium">WhatsApp ile İletişim</span>
              </a>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Bize Mesaj Gönderin</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <Label htmlFor="name">Adınız Soyadınız *</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Ali Yılmaz"
                      className="mt-1"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <Label htmlFor="email">E-posta Adresiniz *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="ali@example.com"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone">Telefon Numaranız</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+90 5XX XXX XX XX"
                      className="mt-1"
                    />
                  </div>

                  {/* Subject */}
                  <div>
                    <Label htmlFor="subject">Konu *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="Rezervasyon Talebi"
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="message">Mesajınız *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    required
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Mesajınızı buraya yazın..."
                    rows={6}
                    className="mt-1"
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Gönderiliyor...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <Send className="h-5 w-5 mr-2" />
                      Mesajı Gönder
                    </span>
                  )}
                </Button>
              </form>
            </div>

            {/* Map */}
            <div className="mt-8 bg-white rounded-xl shadow-lg overflow-hidden">
              <h3 className="text-xl font-semibold text-gray-900 p-6 pb-4">Ofis Konumumuz</h3>
              <div className="h-96">
                <iframe
                  src="https://maps.google.com/maps?q=Atakent%20Mahallesi%20Kutluta%C5%9F%20Sitesi%20A5%20Blok%20Halkal%C4%B1%20K%C3%BC%C3%A7%C3%BCk%C3%A7ekmece%20%C4%B0stanbul&t=&z=15&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="MeetDelux Ofis Konumu"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
