import React, { useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { User, LogOut, Settings, Building2, Search, Home, Calendar } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  const handleLogoClick = (e) => {
    e.preventDefault();
    if (location.pathname === '/') {
      // Ana sayfadaysa "Neden MeetDelux?" bölümüne scroll yap
      const element = document.getElementById('neden-meetdelux');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Başka sayfadaysa ana sayfaya git
      navigate('/');
    }
  };

  return (
    <nav className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <a href="/" onClick={handleLogoClick} className="flex items-center space-x-3 cursor-pointer">
            <img 
              src="https://customer-assets.emergentagent.com/job_turkce-translator-4/artifacts/jua4tf7e_IMG_0255.png" 
              alt="MeetDelux Logo" 
              className="h-16 w-16 object-contain bg-transparent"
              style={{filter: 'drop-shadow(0 0 0 transparent)'}}
            />
            <span className="text-2xl font-bold text-gray-900">
              Meet<span className="text-indigo-600">Delux</span>
            </span>
          </a>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/') 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Ana Sayfa</span>
            </Link>
            
            <Link
              to="/rooms"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/rooms') 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Salon Ara</span>
            </Link>
            
            <Link
              to="/hotels"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/hotels') 
                ? 'text-indigo-600 bg-indigo-50' 
                : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Oteller</span>
            </Link>
            
            {user && (
              <Link
                to="/bookings"
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive('/bookings') 
                  ? 'text-indigo-600 bg-indigo-50' 
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Rezervasyonlarım</span>
              </Link>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:block">{user.full_name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-indigo-600 capitalize">
                      {user.role === 'hotel_manager' ? 'Otel Yöneticisi' : 
                       user.role === 'admin' ? 'Yönetici' : 'Müşteri'}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  
                  {(user.role === 'hotel_manager' || user.role === 'admin') && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Yönetim Paneli</span>
                      </DropdownMenuItem>
                      {user.role === 'admin' && (
                        <DropdownMenuItem onClick={() => navigate('/admin/approvals')}>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Onay Paneli</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                    </>
                  )}
                  
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Çıkış Yap</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link to="/login">
                  <Button variant="ghost" className="text-gray-700 hover:text-indigo-600">
                    Giriş Yap
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Üye Ol
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;