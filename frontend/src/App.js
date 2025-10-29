import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import HotelList from './components/HotelList';
import RoomSearch from './components/RoomSearch';
import HotelDetail from './components/HotelDetail';
import RoomDetail from './components/RoomDetail';
import Dashboard from './components/Dashboard';
import BookingForm from './components/BookingForm';
import BookingList from './components/BookingList';
import PaymentPage from './components/PaymentPage';
import AdminApprovalPanel from './components/AdminApprovalPanel';
import ContactPage from './components/ContactPage';
import { Toaster } from 'sonner';
import { CurrencyProvider } from './hooks/useCurrency';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Auth Context
export const AuthContext = React.createContext();

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Giriş başarısız' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API}/auth/register`, userData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.detail || 'Kayıt başarısız' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <CurrencyProvider>
      <AuthContext.Provider value={{ user, login, register, logout }}>
        <BrowserRouter>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
            <Navbar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={!user ? <LoginPage /> : <Navigate to={user.role === 'customer' ? '/' : '/dashboard'} />} />
                <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to={user.role === 'customer' ? '/' : '/dashboard'} />} />
                <Route path="/hotels" element={<HotelList />} />
                <Route path="/hotels/:id" element={<HotelDetail />} />
                <Route path="/rooms" element={<RoomSearch />} />
                <Route path="/rooms/:id" element={<RoomDetail />} />
                <Route path="/rooms/:roomId/booking" element={user ? <BookingForm /> : <Navigate to="/login" />} />
                <Route path="/bookings" element={user ? <BookingList /> : <Navigate to="/login" />} />
                <Route path="/bookings/:bookingId/payment" element={user ? <PaymentPage /> : <Navigate to="/login" />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route 
                  path="/dashboard" 
                  element={
                    user && (user.role === 'hotel_manager' || user.role === 'admin') 
                      ? <Dashboard /> 
                      : <Navigate to="/login" />
                  } 
                />
                <Route 
                  path="/admin/approvals" 
                  element={
                    user && user.role === 'admin' 
                      ? <AdminApprovalPanel /> 
                      : <Navigate to="/login" />
                  } 
                />
              </Routes>
            </main>
            <Footer />
            <Toaster position="top-right" richColors />
          </div>
        </BrowserRouter>
      </AuthContext.Provider>
    </CurrencyProvider>
  );
}

export default App;