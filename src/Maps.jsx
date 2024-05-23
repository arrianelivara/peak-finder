import React, { useState, useEffect } from 'react';
import { GoogleMap, HeatmapLayerF, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { AutoCompleteSearch } from './AutoCompleteSearch';
import { APIProvider, useMapsLibrary, useMap, Map } from '@vis.gl/react-google-maps';
import { data } from './assets/data';
import logo2 from './assets/logo2.png';
import externalLink from './assets/external-link.svg';
import loading from './assets/4foo.gif';
import googleIcon from './assets/maps-icon.png';
import waze from './assets/waze.webp';
import { Modal, Tabs } from 'antd';

const Maps = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [destination, setDestination] = useState(null);
    const [formattedAddress, setFormattedAddress] = useState(null);
    const [formattedAddress2, setFormattedAddress2] = useState(null);
    // const [data, setData] = useState({});
    const { isLoaded } = useJsApiLoader({
        libraries: ['visualization'],
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_API_KEY
    });
    const [map, setMap] = useState(null);

    const showModal = () => {
        setIsModalOpen(true);
      };
    
      const handleOk = () => {
        setIsModalOpen(false);
      };
    
      const handleCancel = () => {
        setIsModalOpen(false);
      };

    // useEffect(() => {
    //     if (navigator.geolocation) {
    //         navigator.geolocation.getCurrentPosition((position) => {
    //             fetch(`http://localhost:8000/heatmap?lat=${position.coords.latitude}&long=${position.coords.longitude}`)
    //                 .then(response => response.json())
    //                 .then(data => {
    //                     if (data.status === 'OK') {
    //                         setData(data);
    //                     }
    //                 })
    //                 .catch(error => {
    //                     console.error('Error:', error);
    //             });
    //         }, null, { enableHighAccuracy: true });
    //     }
    // });

    // Use directions service
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setSelectedPlace({ lat: position.coords.latitude, lng: position.coords.longitude });
                const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${position.coords.latitude},${position.coords.longitude}&key=${ import.meta.env.VITE_API_KEY}`;
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
            }, null, { enableHighAccuracy: true });
        } 
    }, []);

    if (!isLoaded) { 
        return <div className='w-full h-screen flex justify-center item-center p-20'>
            <img src={loading} width={800} height="200px"/>
        </div>
    }
    const heatMap = () => {
        const latLngArray = [];
        Object.keys(data).forEach(category => {
            Object.keys(data[category]).forEach(city => {
                data[category][city].forEach(location => {
                    latLngArray.push(new google.maps.LatLng({ location: new google.maps.LatLng(location.latitude, location.longitude), weight: location.pax_count }));
                });
            });
        });
    
        return latLngArray;
    };

    const redirectToGoogleMaps = () => {
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${selectedPlace.lat},${selectedPlace.lng}&destination=${destination.lat},${destination.lng}`;
        window.open(googleMapsUrl, '_blank');
        setIsModalOpen(false);
    };

    const redirectToWaze = () => {
        const wazeUrl = `https://waze.com/ul?ll=${destination.lat},${destination.lng}&navigate=yes&from=${selectedPlace.lat},${selectedPlace.lng}`;
        window.open(wazeUrl, '_blank');
        setIsModalOpen(false);
    };

    const preprocessData = (data) => {
        const sortedData = {};
        Object.keys(data).forEach(category => {
            sortedData[category] = {};
    
            // Create an array of cities with their first child's distance
            const citiesWithDistance = Object.keys(data[category]).map(city => ({
                city,
                distance: data[category][city][0].distance
            }));
    
            // Sort the array of cities based on the distance of their first child
            citiesWithDistance.sort((a, b) => a.distance - b.distance);
    
            // Reconstruct the sorted data object
            citiesWithDistance.forEach(({ city }) => {
                sortedData[category][city] = data[category][city];
            });
        });
        return sortedData;
    };

    const { current, predict } = preprocessData(data);

    return (
        <div style={{ height: '100vh', width: '100%' }}>
            <APIProvider apiKey={import.meta.env.VITE_API_KEY}>
            <div className='bg-white absolute z-10 h-full p-10 w-full md:w-[600px] drop-shadow overflow-auto'>
                <img src={logo2} width={200}/>
                <div className='mt-4'>
                    <text className='font-semibold'>Check your location:</text>
                    <AutoCompleteSearch onPlaceSelect={setSelectedPlace} selectedPlace={formattedAddress} />
                </div>
                <text className='font-semibold'>In-demand Booking Locations:</text>
                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1',
                        label: 'Near You',
                        children: Object.keys(current).map(city =>
                                current[city].map(location => (
                                    <div key={`${city}-${location.latitude}-${location.longitude}`} className={`${location.estimate_location === formattedAddress2 ? "bg-yellow-50" : ''} my-2 flex gap-2 items-start border-solid border-2 border-gray-200 px-6 py-4 rounded-lg hover:border-yellow-200 hover:bg-yellow-50`}>
                                        <div className='flex justify-between gap-4 w-full'>
                                            <div className='flex flex-col' onClick={() => {
                                                if (location.estimate_location === formattedAddress2) {
                                                    setFormattedAddress2(null);
                                                    setDestination(null);
                                                    return;
                                                }
                                                setFormattedAddress2(location.estimate_location);
                                                setDestination({ lat: location.latitude, lng: location.longitude });
                                            }}>
                                                <div className='font-semibold text-lg'>{location.locality}</div>
                                                <div className='italic'>{`near ${location.estimate_location}`}</div>
                                                <div className={location.pax_count > 10 ? 'text-red-500 font-semibold' : ''}>{`${location.pax_count} ${location.pax_count === 1 ? 'person' : 'people'} currently looking for a biker`}</div>
                                                <div>{`Distance from you: ${location.distance.toPrecision(3)} km`}</div>
                                            </div>
                                            <div className='hover:opacity-50' onClick={() => {
                                                setDestination({ lat: location.latitude, lng: location.longitude });
                                            }}>
                                                <img src={externalLink} width={20} onClick={showModal}/>
                                            </div>
                                        </div> 
                                    </div>
                                ))
                            )
                    },
                    {
                        key: '2',
                        label: 'General',
                        children: Object.keys(predict).map(city =>
                            predict[city].map(location => (
                                <div key={`${city}-${location.latitude}-${location.longitude}`} className={`${location.estimate_location === formattedAddress2 ? "bg-yellow-50" : ''} my-2 flex gap-2 items-start border-solid border-2 border-gray-200 px-6 py-4 rounded-lg hover:border-yellow-200 hover:bg-yellow-50`}>
                                    <div className='flex justify-between gap-4 w-full'>
                                        <div className='flex flex-col' onClick={() => {
                                            if (location.estimate_location === formattedAddress2) {
                                                setFormattedAddress2(null);
                                                setDestination(null);
                                                return;
                                            }
                                            setFormattedAddress2(location.estimate_location);
                                            setDestination({ lat: location.latitude, lng: location.longitude });
                                        }}>
                                            <div className='font-semibold text-lg'>{location.locality}</div>
                                            <div className='italic'>{`near ${location.estimate_location}`}</div>
                                            <div className={location.pax_count > 10 ? 'text-red-500' : ''}>{`${location.pax_count} ${location.pax_count === 1 ? 'person' : 'people'} currently looking for a biker`}</div>
                                            <div>{`Distance from you: ${location.distance.toPrecision(2)} km`}</div>
                                        </div>
                                        <div className='hover:opacity-50' onClick={() => {
                                                setDestination({ lat: location.latitude, lng: location.longitude });
                                            }}>
                                                <img src={externalLink} width={20} onClick={showModal}/>
                                        </div>
                                    </div> 
                                </div>
                            ))
                        )
                    },
                ]} />
            </div>
                {formattedAddress && !formattedAddress2 ? <GoogleMap center={selectedPlace} zoom={12} zoomOnClick mapContainerStyle={{
                    position: 'relative', width: '100%', height: '100%'
                    }} 
                    onLoad={(map) => {
                        const bounds = new window.google.maps.LatLngBounds(selectedPlace);
                        map.fitBounds(bounds);
                        setMap(map);
                    }}
                    >
                    <HeatmapLayerF data={heatMap()} 
                            options={{
                                radius: 50,
                            }}
                        />
                        <MarkerF position={selectedPlace}/>
                    <Directions />
                </GoogleMap> : 
                <Map
                    defaultCenter={{lat: 43.65, lng: -79.38}}
                    defaultZoom={9}
                    gestureHandling={'greedy'}
                    fullscreenControl={false}>
                    <Directions origin={formattedAddress} destination={formattedAddress2}/>
                </Map>}
            </APIProvider>
            <Modal title="You are about to leave this page." open={isModalOpen} onOk={handleOk} onCancel={handleCancel} footer={false}>
                <p>Choose below where to open the location:</p>
                <div className='flex justify-center items-center gap-4 mt-4'>
                    <button className='flex gap-2 text-md border-solid border border-gray-200' onClick={() => redirectToGoogleMaps()}>
                        <img src={googleIcon} width={25}/>
                        Google Maps
                    </button>
                    <button className='flex gap-2  border-solid border border-gray-200' onClick={() => redirectToWaze()}>
                        <img src={waze} width={25}/>
                            Waze
                    </button>
                </div>
            </Modal>
        </div>
    );
}

const Directions = ({ origin, destination }) => {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = useState();
    const [directionsRenderer, setDirectionsRenderer] =
      useState();
    const [routes, setRoutes] = useState([]);
    const [routeIndex, setRouteIndex] = useState(0);
    const selected = routes[routeIndex];
    const leg = selected?.legs[0];
  
    // Initialize directions service and renderer
    useEffect(() => {
      if (!routesLibrary || !map) return;
      setDirectionsService(new routesLibrary.DirectionsService());
      setDirectionsRenderer(new routesLibrary.DirectionsRenderer({map}));
    }, [routesLibrary, map, origin, destination]);
  
    // Use directions service
    useEffect(() => {
      if (!directionsService || !directionsRenderer) return;
      directionsService
        .route({
          origin: origin,
          destination: destination,
          travelMode: google.maps.TravelMode.DRIVING,
          provideRouteAlternatives: true
        })
        .then(response => {
          directionsRenderer.setDirections(response);
          setRoutes(response.routes);
        }).catch(e => console.error(e));
      return () => directionsRenderer.setMap(null);
    }, [directionsService, directionsRenderer, origin, destination]);
  
    // Update direction route
    useEffect(() => {
      if (!directionsRenderer) return;
      directionsRenderer.setRouteIndex(routeIndex);
    }, [routeIndex, directionsRenderer, origin, destination]);
  
    if (!origin || !destination) return null;
    return (
      <div className="bg-white rounded absolute z-10 top-8 right-12 p-4">
        <p className='font-semibold'>
          {leg?.start_address.split(',')[0]} to {leg?.end_address.split(',')[0]}
        </p>
        <p className='font-semibold'>Distance: {leg?.distance?.text}</p>
        <p className='font-semibold'>Duration: {leg?.duration?.text}</p>
        <h2 className='font-semibold'>Other Routes:</h2>
        <ul>
          {routes?.map((route, index) => (
            <li key={route.summary} className='mb-2 '>
              <button onClick={() => setRouteIndex(index)}>
                {route?.summary}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
}

export default Maps;
