import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Building2, Mail, Lock, Eye, EyeOff, Shield, Users, Star, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        toast.success('Hoş geldiniz!', {
          description: 'Başarıyla giriş yaptınız.'
        });
        navigate('/');
      } else {
        toast.error('Giriş başarısız', {
          description: result.error
        });
      }
    } catch (error) {
      toast.error('Bir hata oluştu', {
        description: 'Lütfen tekrar deneyin.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info('Şifre sıfırlama', {
      description: 'Lütfen info@meetdelux.com adresine email gönderin.'
    });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2"></div>
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
              Türkiye'nin En Prestijli Seminer Salonu Platformu
            </h2>
            <p className="text-indigo-100 text-lg mb-8">
              Lüks otellerin konferans salonlarını keşfedin, anında rezervasyon yapın.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <CheckCircle className="h-5 w-5" />
              </div>
              <span className="text-indigo-100">500+ Lüks Seminer Salonu</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-indigo-100">Güvenli Ödeme Sistemi</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <span className="text-indigo-100">10.000+ Mutlu Müşteri</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg">
                <Star className="h-5 w-5" />
              </div>
              <span className="text-indigo-100">4.9/5 Müşteri Memnuniyeti</span>
            </div>
          </div>

          {/* Testimonial */}
          <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6">
            <p className="text-indigo-50 italic mb-4">
              "MeetDelux sayesinde şirket toplantılarımız için mükemmel salonlar buluyoruz. 
              Rezervasyon süreci son derece kolay ve hızlı!"
            </p>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-400 rounded-full flex items-center justify-center font-bold">
                AY
              </div>
              <div>
                <p className="font-semibold">Ayşe Yılmaz</p>
                <p className="text-sm text-indigo-200">Kurumsal Etkinlik Yöneticisi</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8">
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
            <h2 data-testid="login-title" className="text-3xl font-bold text-gray-900 mb-2">
              Hoş Geldiniz
            </h2>
            <p className="text-gray-600">
              Hesabınıza giriş yaparak devam edin
            </p>
          </div>

          {/* Login Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium mb-2 block">
                  E-posta Adresi
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
                    className="pl-10 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="ornek@email.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password" className="text-gray-700 font-medium mb-2 block">
                  Şifre
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    data-testid="password-input"
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-12 h-12 border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="••••••••"
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

              {/* Forgot Password */}
              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Şifrenizi mi unuttunuz?
                </button>
              </div>

              {/* Submit Button */}
              <Button
                data-testid="login-submit-button"
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold h-12 text-base rounded-lg shadow-lg hover:shadow-xl transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  'Giriş Yap'
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">veya</span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-600">
                Hesabınız yok mu?{' '}
                <Link 
                  to="/register" 
                  className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors"
                >
                  Hemen üye olun
                </Link>
              </p>
            </div>
          </div>

          {/* Security Badge */}
          <div className="text-center">
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

export default LoginPage;