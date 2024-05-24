import React, {useRef, useEffect, useState} from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

export const AutoCompleteSearch = ({ onPlaceSelect, selectedPlace, setFormattedAddres, fetchData }) => {
  const [placeAutocomplete, setPlaceAutocomplete] = useState(null);
  const inputRef = useRef(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const options = {
      fields: ['geometry', 'name', 'formatted_address']
    };

    setPlaceAutocomplete(new places.Autocomplete(inputRef.current, options));
  }, [places]);

  useEffect(() => {
    if (!placeAutocomplete) return;

    placeAutocomplete.addListener('place_changed', () => {
      const place = placeAutocomplete.getPlace();
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      fetchData(lat, lng);
      onPlaceSelect({ lat, lng });
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${ import.meta.env.VITE_API_KEY}`;
      fetch(geocodeUrl)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'OK') {
                    const formattedAddress = data.results[0].formatted_address;
                    setFormattedAddress(formattedAddress)
                } else {
                }
            })
            .catch(error => {
                console.error('Error:', error);
        });
    });
  }, [onPlaceSelect, placeAutocomplete]);

  return (
    <div className="autocomplete-container">
      <input ref={inputRef} 
          // value={selectedPlace} 
          className="w-full mb-3 p-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:outline-none shadow-md"/>
    </div>
  );
};
