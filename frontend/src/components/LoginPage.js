import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Building2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
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
        toast.success('Giriş başarılı!');
        navigate('/');
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const testUsers = [
    { email: 'admin@hotelbook.com', password: 'admin123', role: 'Admin' },
    { email: 'manager@swissotel.com', password: 'manager123', role: 'Otel Yöneticisi' },
    { email: 'manager@hilton.com', password: 'hilton123', role: 'Otel Yöneticisi' }
  ];

  const fillTestUser = (email, password) => {
    setFormData({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center">
            <Building2 className="h-12 w-12 text-indigo-600" />
          </div>
          <h2 data-testid="login-title" className="mt-6 text-3xl font-extrabold text-gray-900">
            Hesabınıza giriş yapın
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Hesabınız yok mu?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Üye olun
            </Link>
          </p>
        </div>

        {/* Test Users */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-800">Test Hesapları</CardTitle>
            <CardDescription className="text-xs text-blue-600">
              Demo için aşağıdaki hesapları kullanabilirsiniz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {testUsers.map((user, index) => (
              <button
                key={index}
                onClick={() => fillTestUser(user.email, user.password)}
                className="w-full text-left p-2 text-xs bg-white rounded border hover:bg-gray-50 transition-colors"
              >
                <div className="font-medium text-gray-900">{user.role}</div>
                <div className="text-gray-600">{user.email}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Login Form */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email" className="sr-only">
                  E-posta adresi
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
                    className="pl-10"
                    placeholder="E-posta adresiniz"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className="sr-only">
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
                    className="pl-10 pr-10"
                    placeholder="Şifreniz"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Şifrenizi unuttunuz mu?
                  </a>
                </div>
              </div>

              <Button
                data-testid="login-submit-button"
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;