import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { X, DollarSign } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateExtraServiceModal = ({ isOpen, onClose, hotelId, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'TRY',
    unit: 'person',
    category: 'catering',
    service_type: '',
    duration_minutes: '',
    capacity_per_service: '',
  });

  const categories = {
    catering: 'Yiyecek & İçecek',
    equipment: 'Ekipman',
    service: 'Hizmet',
    transport: 'Ulaşım',
    refreshment: 'İkramlar'
  };

  const serviceTypes = {
    breakfast: 'Kahvaltı',
    lunch: 'Öğle Yemeği',
    dinner: 'Akşam Yemeği',
    coffee_break: 'Kahve Molası',
    airport_transfer: 'Havaalanı Transferi',
    city_transfer: 'Şehir İçi Transfer',
  };

  const units = {
    person: 'Kişi Başı',
    piece: 'Adet',
    hour: 'Saat',
    day: 'Gün',
    package: 'Paket'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        capacity_per_service: formData.capacity_per_service ? parseInt(formData.capacity_per_service) : null,
      };

      await axios.post(`${API}/hotels/${hotelId}/services`, payload, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      toast.success('Ekstra hizmet başarıyla eklendi!');
      onSuccess && onSuccess();
      handleClose();
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error(error.response?.data?.detail || 'Hizmet eklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'TRY',
      unit: 'person',
      category: 'catering',
      service_type: '',
      duration_minutes: '',
      capacity_per_service: '',
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Yeni Ekstra Hizmet Ekle</span>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Category */}
          <div>
            <Label>Kategori *</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categories).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Service Type (Optional) */}
          {(formData.category === 'catering' || formData.category === 'transport') && (
            <div>
              <Label>Hizmet Tipi</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, service_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Hizmet tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(serviceTypes)
                    .filter(([key]) => {
                      if (formData.category === 'catering') {
                        return ['breakfast', 'lunch', 'dinner', 'coffee_break'].includes(key);
                      }
                      if (formData.category === 'transport') {
                        return ['airport_transfer', 'city_transfer'].includes(key);
                      }
                      return false;
                    })
                    .map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Name */}
          <div>
            <Label>Hizmet Adı *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Örn: Kahve Molası Paketi, Garson Hizmeti"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label>Açıklama</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Hizmet hakkında detaylı bilgi..."
              rows={3}
            />
          </div>

          {/* Price & Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fiyat *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label>Para Birimi *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRY">TRY (₺)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Unit */}
          <div>
            <Label>Birim *</Label>
            <Select
              value={formData.unit}
              onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(units).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Duration (for transport/service) */}
          {(formData.category === 'transport' || formData.category === 'service') && (
            <div>
              <Label>Süre (Dakika)</Label>
              <Input
                type="number"
                min="0"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                placeholder="Örn: 60"
              />
            </div>
          )}

          {/* Capacity */}
          <div>
            <Label>Kapasite (Kaç kişilik)</Label>
            <Input
              type="number"
              min="0"
              value={formData.capacity_per_service}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity_per_service: e.target.value }))}
              placeholder="Örn: 50"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Ekleniyor...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" />
                  Hizmeti Ekle
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateExtraServiceModal;
