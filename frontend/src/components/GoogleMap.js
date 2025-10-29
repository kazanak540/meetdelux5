import React from 'react';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { Button } from './ui/button';

const GoogleMap = ({ hotel, className = '' }) => {
  // Generate Google Maps iframe URL
  const getMapUrl = () => {
    if (hotel.latitude && hotel.longitude) {
      // Use coordinates for precise location
      return `https://maps.google.com/maps?q=${hotel.latitude},${hotel.longitude}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    } else if (hotel.address) {
      // Fallback to address search
      const encodedAddress = encodeURIComponent(`${hotel.name}, ${hotel.address}`);
      return `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }
    return null;
  };

  const mapUrl = getMapUrl();

  const openInGoogleMaps = () => {
    if (hotel.latitude && hotel.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}`;
      window.open(url, '_blank');
    } else if (hotel.address) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel.address)}`;
      window.open(url, '_blank');
    }
  };

  const getDirections = () => {
    if (hotel.latitude && hotel.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`;
      window.open(url, '_blank');
    } else if (hotel.address) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(hotel.address)}`;
      window.open(url, '_blank');
    }
  };

  if (!hotel || (!hotel.latitude && !hotel.longitude && !hotel.address)) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Konum bilgisi mevcut değil</p>
        {hotel?.address && <p className="text-gray-400 text-xs mt-1">{hotel.address}</p>}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Container with iframe */}
      <div className="relative rounded-lg overflow-hidden shadow-lg">
        {mapUrl ? (
          <iframe
            src={mapUrl}
            width="100%"
            height="400"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${hotel.name} Konumu`}
            className="w-full h-96"
          />
        ) : (
          <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Harita yüklenemedi</p>
            </div>
          </div>
        )}
        
        {/* Map Controls */}
        <div className="absolute top-3 right-3 space-y-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
            onClick={openInGoogleMaps}
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            Haritada Aç
          </Button>
        </div>
      </div>

      {/* Location Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-5 w-5 text-indigo-600" />
              <h4 className="font-medium text-gray-900">{hotel.name}</h4>
            </div>
            <p className="text-sm text-gray-600 mb-3">{hotel.address}</p>
            {hotel.latitude && hotel.longitude && (
              <p className="text-xs text-gray-500">
                Koordinatlar: {hotel.latitude}, {hotel.longitude}
              </p>
            )}
          </div>
          
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white ml-3"
            onClick={getDirections}
          >
            <Navigation className="h-4 w-4 mr-1" />
            Yol Tarifi
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GoogleMap;