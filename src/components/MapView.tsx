import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useApp } from '../context/AppContext';

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
}

export const MapView: React.FC<MapViewProps> = ({ center = [-34.5889, -58.4318], zoom = 14 }) => {
  const { activeRide, driverLocation } = useApp();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  
  // Marker references
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create map instance
    const map = L.map(mapContainerRef.current, {
      zoomControl: false, // Custom placed zoom controls in CSS if needed, or default
      attributionControl: false // Cleaner UI
    }).setView(center, zoom);

    // Add OpenStreetMap tile layer (No API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Add standard zoom controls to bottom-right (away from bottom sheet overlays)
    L.control.zoom({ position: 'topright' }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update Markers and Routes dynamically based on ride state
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // 1. Reset existing markers and lines if no active ride
    if (!activeRide) {
      if (pickupMarkerRef.current) { pickupMarkerRef.current.remove(); pickupMarkerRef.current = null; }
      if (dropoffMarkerRef.current) { dropoffMarkerRef.current.remove(); dropoffMarkerRef.current = null; }
      if (driverMarkerRef.current) { driverMarkerRef.current.remove(); driverMarkerRef.current = null; }
      if (routeLineRef.current) { routeLineRef.current.remove(); routeLineRef.current = null; }
      map.setView(center, zoom);
      return;
    }

    const { status, pickupCoords, dropoffCoords } = activeRide;

    // Define custom HSL div icons (100% reliable SVG/CSS - no broken image URLs)
    const pickupIcon = L.divIcon({
      html: '🐾',
      className: 'custom-pin',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const dropoffIcon = L.divIcon({
      html: '🏁',
      className: 'custom-pin custom-pin-dest',
      iconSize: [36, 36],
      iconAnchor: [18, 18]
    });

    const driverIcon = L.divIcon({
      html: '🚗',
      className: 'custom-pin custom-pin-driver',
      iconSize: [38, 38],
      iconAnchor: [19, 19]
    });

    // 2. Manage Pickup Marker
    if (!pickupMarkerRef.current) {
      pickupMarkerRef.current = L.marker(pickupCoords, { icon: pickupIcon }).addTo(map);
    } else {
      pickupMarkerRef.current.setLatLng(pickupCoords);
    }

    // 3. Manage Dropoff Marker
    if (!dropoffMarkerRef.current) {
      dropoffMarkerRef.current = L.marker(dropoffCoords, { icon: dropoffIcon }).addTo(map);
    } else {
      dropoffMarkerRef.current.setLatLng(dropoffCoords);
    }

    // 4. Manage Route Line
    if (!routeLineRef.current) {
      routeLineRef.current = L.polyline([pickupCoords, dropoffCoords], {
        color: '#6366f1',
        weight: 4,
        opacity: 0.8,
        dashArray: '8, 8',
        lineCap: 'round'
      }).addTo(map);
    } else {
      routeLineRef.current.setLatLngs([pickupCoords, dropoffCoords]);
    }

    // Fit bounds on request
    if (status === 'requested') {
      const bounds = L.latLngBounds([pickupCoords, dropoffCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }

    // 5. Manage Driver Marker
    if (status !== 'requested') {
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker(driverLocation, { icon: driverIcon }).addTo(map);
      } else {
        driverMarkerRef.current.setLatLng(driverLocation);
      }
      
      // Auto pan map to keep driver in view if ride is in progress
      if (status === 'accepted') {
        // Show route from driver to pickup
        const bounds = L.latLngBounds([driverLocation, pickupCoords]);
        map.fitBounds(bounds, { padding: [40, 40] });
      } else if (status === 'started') {
        // Show route from driver/pickup to dropoff
        const bounds = L.latLngBounds([driverLocation, dropoffCoords]);
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    } else {
      if (driverMarkerRef.current) {
        driverMarkerRef.current.remove();
        driverMarkerRef.current = null;
      }
    }
  }, [activeRide, driverLocation, center, zoom]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
