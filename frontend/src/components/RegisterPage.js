import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { User, Mail, Lock, Phone, Eye, EyeOff, Shield, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRoleChange = (value) => {
    setFormData({
      ...formData,
      role: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      setLoading(false);
      return;
    }

    try {
      const userData = {
        email: formData.email,
        full_name: formData.full_name,
        phone: formData.phone,
        password: formData.password,
        role: formData.role
      };

      const result = await register(userData);
      
      if (result.success) {
        toast.success('Kayıt başarılı! Şimdi giriş yapabilirsiniz.');
        navigate('/login');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { value: 'customer', label: 'Müşteri', description: 'Seminer salonu kiralamak istiyorum' },
    { value: 'hotel_manager', label: 'Otel Yöneticisi', description: 'Otelimizin salonlarını listelemek istiyorum' }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 translate-y-1/2"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <img 
                src="https://customer-assets.emergentagent.com/job_turkce-translator-4/artifacts/jua4tf7e_IMG_0255.png" 
                alt="MeetDelux Logo" 
                className="h-16 w-16 object-contain"
              />
              <h1 className="text-4xl font-bold">
                Meet<span className="text-indigo-200">Delux</span>
              </h1>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Başlamak İçin Sadece Bir Adım Uzaktasınız!
            </h2>
            <p className="text-indigo-100 text-lg mb-8">
              Binlerce lüks otelin seminer salonlarına anında erişim kazanın.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <User className="h-5 w-5" />
                </div>
                Müşteri Olarak
              </h3>
              <ul className="text-indigo-100 text-sm space-y-1 ml-11">
                <li>• Türkiye'nin en iyi seminer salonlarına erişim</li>
                <li>• Anında online rezervasyon</li>
                <li>• Güvenli ödeme sistemi</li>
                <li>• 7/24 müşteri desteği</li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <h3 className="font-semibold mb-2 flex items-center">
                <div className="bg-white/20 p-2 rounded-lg mr-3">
                  <Building2 className="h-5 w-5" />
                </div>
                Otel Yöneticisi Olarak
              </h3>
              <ul className="text-indigo-100 text-sm space-y-1 ml-11">
                <li>• Salonlarınızı geniş kitleye ulaştırın</li>
                <li>• Kolay yönetim paneli</li>
                <li>• Doluluk oranınızı artırın</li>
                <li>• Ödeme takibi ve raporlama</li>
              </ul>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">500+</div>
              <div className="text-indigo-200 text-sm">Salon</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">10K+</div>
              <div className="text-indigo-200 text-sm">Müşteri</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold mb-1">4.9</div>
              <div className="text-indigo-200 text-sm">Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="max-w-lg w-full space-y-6 my-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <img 
                src="https://customer-assets.emergentagent.com/job_turkce-translator-4/artifacts/jua4tf7e_IMG_0255.png" 
                alt="MeetDelux Logo" 
                className="h-12 w-12 object-contain"
              />
              <h1 className="text-2xl font-bold text-gray-900">
                Meet<span className="text-indigo-600">Delux</span>
              </h1>
            </div>
          </div>

          {/* Header */}
          <div className="text-center">
            <h2 data-testid="register-title" className="text-3xl font-bold text-gray-900 mb-2">
              Hesabınızı Oluşturun
            </h2>
            <p className="text-gray-600">
              Zaten hesabınız var mı?{' '}
              <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                Giriş yapın
              </Link>
            </p>
          </div>

          {/* Register Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Role Selection - First */}
              <div>
                <Label className="text-gray-700 font-medium mb-2 block">Hesap Türü Seçin *</Label>
                <Select value={formData.role} onValueChange={handleRoleChange}>
                  <SelectTrigger data-testid="role-select" className="h-12 border-gray-300 focus:border-indigo-500">
                    <SelectValue placeholder="Hesap türünüzü seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="py-1">
                          <div className="font-medium text-gray-900">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <Label htmlFor="full_name" className="text-gray-700 font-medium mb-2 block">
                    Ad Soyad *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      data-testid="full-name-input"
                      id="full_name"
                      name="full_name"
                      type="text"
                      required
                      value={formData.full_name}
                      onChange={handleChange}
                      className="pl-10 h-12 border-gray-300 focus:border-indigo-500"
                      placeholder="Adınız ve soyadınız"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium mb-2 block">
                    E-posta Adresi *
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      data-testid="email-input"
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10 h-12 border-gray-300 focus:border-indigo-500"
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>

              {/* Phone */}
              <div className="md:col-span-2">
                <Label htmlFor="phone" className="text-gray-700 font-medium mb-2 block">
                  Telefon Numarası
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    data-testid="phone-input"
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10 h-12 border-gray-300 focus:border-indigo-500"
                    placeholder="+90 5XX XXX XX XX"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="text-gray-700 font-medium mb-2 block">
                  Şifre *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    data-testid="password-input"
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-12 h-12 border-gray-300 focus:border-indigo-500"
                    placeholder="En az 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium mb-2 block">
                  Şifre Tekrarı *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    data-testid="confirm-password-input"
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-12 h-12 border-gray-300 focus:border-indigo-500"
                    placeholder="Şifrenizi tekrar girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              data-testid="register-submit-button"
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-12 text-base rounded-lg shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Kayıt yapılıyor...
                </div>
              ) : (
                'Hesap Oluştur'
              )}
            </Button>
          </form>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-6">
            Hesap oluşturarak{' '}
            <Link to="/terms" className="text-indigo-600 hover:underline">
              Kullanım Koşullarını
            </Link>
            {' '}ve{' '}
            <Link to="/privacy" className="text-indigo-600 hover:underline">
              Gizlilik Politikasını
            </Link>
            {' '}kabul etmiş olursunuz.
          </p>
        </div>

        {/* Security Badge */}
        <div className="text-center mt-6">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>Bilgileriniz SSL ile korunmaktadır</span>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default RegisterPage;