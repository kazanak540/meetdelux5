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
    const url = `https://www.google.com/maps/search/?api=1&query=${hotel.latitude},${hotel.longitude}`;
    window.open(url, '_blank');
  };

  const getDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${hotel.latitude},${hotel.longitude}`;
    window.open(url, '_blank');
  };

  if (!hotel || !hotel.latitude || !hotel.longitude) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Konum bilgisi mevcut değil</p>
        <p className="text-gray-400 text-xs mt-1">{hotel?.address}</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Map Container */}
      <div className="relative">
        <div
          id={`map-${hotel.id}`}
          className="w-full h-64 bg-gray-200 rounded-lg"
          style={{ minHeight: '256px' }}
        >
          {!mapLoaded && (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
        </div>
        
        {/* Map Controls */}
        <div className="absolute top-3 right-3 space-y-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-white/90 backdrop-blur-sm shadow-lg"
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
            <p className="text-xs text-gray-500">
              Koordinatlar: {hotel.latitude}, {hotel.longitude}
            </p>
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