import React, { useEffect, useRef, useState } from 'react';
import { Input } from './ui/input';
import { MapPin, Loader2 } from 'lucide-react';

const GooglePlacesAutocomplete = ({ 
  value, 
  onChange, 
  onPlaceSelected, 
  placeholder = "Otel adını veya adresini yazın...",
  className = ""
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      setScriptLoaded(true);
      setIsLoading(false);
      return;
    }

    // Load Google Maps script
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key is missing');
      setIsLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&language=tr`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setScriptLoaded(true);
      setIsLoading(false);
    };
    
    script.onerror = () => {
      console.error('Failed to load Google Maps script');
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  useEffect(() => {
    if (!scriptLoaded || !inputRef.current || !window.google) {
      return;
    }

    // Initialize Google Places Autocomplete
    const options = {
      types: ['establishment'], // Only show businesses/establishments
      fields: [
        'name',
        'formatted_address', 
        'address_components',
        'geometry',
        'place_id',
        'formatted_phone_number',
        'website',
        'rating',
        'types'
      ],
      componentRestrictions: { country: 'tr' } // Restrict to Turkey
    };

    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      options
    );

    // Listen for place selection
    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();

      if (!place.geometry || !place.geometry.location) {
        console.error('No details available for input:', place.name);
        return;
      }

      // Extract city from address components
      let city = '';
      let postalCode = '';
      let country = '';
      
      if (place.address_components) {
        place.address_components.forEach(component => {
          if (component.types.includes('administrative_area_level_1')) {
            city = component.long_name;
          }
          if (component.types.includes('locality') && !city) {
            city = component.long_name;
          }
          if (component.types.includes('postal_code')) {
            postalCode = component.long_name;
          }
          if (component.types.includes('country')) {
            country = component.long_name;
          }
        });
      }

      // Prepare hotel data
      const hotelData = {
        name: place.name || '',
        address: place.formatted_address || '',
        city: city || '',
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng(),
        phone: place.formatted_phone_number || '',
        website: place.website || '',
        place_id: place.place_id || '',
        rating: place.rating || null,
        postal_code: postalCode || '',
        country: country || 'Türkiye'
      };

      // Call the callback with extracted data
      if (onPlaceSelected) {
        onPlaceSelected(hotelData);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [scriptLoaded, onPlaceSelected]);

  if (!process.env.REACT_APP_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`pl-10 ${className}`}
        />
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <p className="text-xs text-amber-600 mt-1">
          Google Maps API anahtarı eksik - manuel giriş yapabilirsiniz
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`pl-10 ${className}`}
        disabled={isLoading}
      />
      {isLoading ? (
        <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
      ) : (
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-600 h-4 w-4" />
      )}
      
      {scriptLoaded && (
        <p className="text-xs text-gray-500 mt-1">
          💡 Yazmaya başlayın, otomatik öneriler göreceksiniz
        </p>
      )}
    </div>
  );
};

export default GooglePlacesAutocomplete;
