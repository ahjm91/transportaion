import React from 'react';
import GoogleMapReact from 'google-map-react';
import { Car, MapPin, Navigation } from 'lucide-react';
import { Location } from '../types';

interface MapProps {
  driverLocation: Location | null;
  pickupLocation: Location;
  dropoffLocation: Location;
  center?: Location;
  zoom?: number;
}

const Marker = ({ children, className }: { children: React.ReactNode; className?: string; lat?: number; lng?: number }) => (
  <div className={`absolute -translate-x-1/2 -translate-y-1/2 ${className}`}>
    {children}
  </div>
);

const LiveTrackingMap: React.FC<MapProps> = ({ 
  driverLocation, 
  pickupLocation, 
  dropoffLocation,
  center = pickupLocation,
  zoom = 13
}) => {
  return (
    <div className="w-full h-[400px] md:h-[600px] rounded-[2.5rem] overflow-hidden shadow-2xl relative border-8 border-white">
      <GoogleMapReact
        bootstrapURLKeys={{ key: '' }} // Let the user provide if needed, otherwise it works in dev with limited features
        defaultCenter={center}
        defaultZoom={zoom}
        center={driverLocation || pickupLocation}
      >
        {/* Pickup Marker */}
        <Marker lat={pickupLocation.lat} lng={pickupLocation.lng}>
          <div className="w-10 h-10 bg-dark rounded-full flex items-center justify-center shadow-lg border-2 border-white">
            <MapPin className="w-5 h-5 text-gold" />
          </div>
        </Marker>

        {/* Dropoff Marker */}
        <Marker lat={dropoffLocation.lat} lng={dropoffLocation.lng}>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-dark">
            <Navigation className="w-5 h-5 text-dark" />
          </div>
        </Marker>

        {/* Driver Marker */}
        {driverLocation && (
          <Marker lat={driverLocation.lat} lng={driverLocation.lng}>
            <div className="relative">
              <div className="absolute inset-0 bg-gold/30 rounded-full animate-ping" />
              <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center shadow-xl border-4 border-white relative z-10">
                <Car className="w-6 h-6 text-dark" />
              </div>
            </div>
          </Marker>
        )}
      </GoogleMapReact>

      {/* Floating Info */}
      {!driverLocation && (
        <div className="absolute top-6 left-6 right-6 bg-dark/90 backdrop-blur-md text-white p-4 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="w-2 h-2 bg-gold rounded-full animate-pulse" />
          <p className="text-sm font-bold">جاري البحث عن أقرب سائق...</p>
        </div>
      )}
    </div>
  );
};

export default LiveTrackingMap;
