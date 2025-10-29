import React, { useState, useEffect } from 'react';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { Button } from './ui/button';

const GoogleMap = ({ hotel, className = '' }) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Load Google Maps JavaScript API
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (mapLoaded && hotel && hotel.latitude && hotel.longitude) {
      initializeMap();
    }
  }, [mapLoaded, hotel]);

  const initializeMap = () => {
    const mapElement = document.getElementById(`map-${hotel.id}`);
    if (!mapElement) return;

    const position = {
      lat: parseFloat(hotel.latitude),
      lng: parseFloat(hotel.longitude)
    };

    const map = new window.google.maps.Map(mapElement, {
      zoom: 15,
      center: position,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    // Custom marker icon
    const marker = new window.google.maps.Marker({
      position: position,
      map: map,
      title: hotel.name,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="12" fill="#4F46E5"/>
            <path d="M16 8C13.2386 8 11 10.2386 11 13C11 17.25 16 24 16 24S21 17.25 21 13C21 10.2386 18.7614 8 16 8ZM16 15.5C14.6193 15.5 13.5 14.3807 13.5 13C13.5 11.6193 14.6193 10.5 16 10.5C17.3807 10.5 18.5 11.6193 18.5 13C18.5 14.3807 17.3807 15.5 16 15.5Z" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32)
      }
    });

    // Info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; max-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold; color: #1f2937;">${hotel.name}</h3>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280;">${hotel.address}</p>
          <div style="display: flex; align-items: center; margin: 4px 0;">
            <span style="color: #f59e0b;">★</span>
            <span style="margin-left: 4px; font-size: 12px; color: #6b7280;">${hotel.star_rating} Yıldızlı Otel</span>
          </div>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });
  };

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