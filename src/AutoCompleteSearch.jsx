import React, {useRef, useEffect, useState} from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

export const AutoCompleteSearch = ({ onPlaceSelect, selectedPlace }) => {
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
      onPlaceSelect({ lat, lng });
    });
  }, [onPlaceSelect, placeAutocomplete]);

  return (
    <div className="autocomplete-container">
      <input ref={inputRef} value={selectedPlace} className="w-full mb-3 p-3 rounded-md border border-gray-300 focus:border-blue-500 focus:ring focus:ring-blue-200 focus:outline-none shadow-md"/>
    </div>
  );
};