// LocationContext.tsx
import React, { createContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { firebase } from '@/services/firebase';
import { useAuth } from '@/hooks/useAuth';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  timestamp?: number;
}

interface VanLocation {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  lastUpdated: number;
}

interface VanLocations {
  [vanId: string]: VanLocation;
}

interface LocationContextData {
  userLocation: LocationData | null;
  vanLocations: VanLocations | null;
  hasLocationPermission: boolean;
  isLoading: boolean;
  error: string | null;
  trackingEnabled: boolean;
  toggleTracking: () => void;
  toggleLocationPermission: () => Promise<void>;
}

export const LocationContext = createContext<LocationContextData>({} as LocationContextData);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [vanLocations, setVanLocations] = useState<VanLocations | null>(null);
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const vansRef = firebase.database().ref('van_locations');

    const onVansUpdate = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.keys(data).reduce((acc: any, key) => {
          const item = data[key];
          acc[key] = {
            latitude: item.latitude,
            longitude: item.longitude,
            speed: 0,
            heading: 0,
            lastUpdated: Date.now()
          };
          return acc;
        }, {});
        setVanLocations(parsed);
      }
    };

    vansRef.on('value', onVansUpdate);

    return () => vansRef.off('value', onVansUpdate);
  }, [currentUser]);

  const requestLocationPermission = async () => {
    try {
      setIsLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      const hasPermission = status === 'granted';
      setHasLocationPermission(hasPermission);

      if (hasPermission) {
        await getCurrentLocation();
      } else {
        setError('Permission to access location was denied');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        speed: location.coords.speed,
        timestamp: location.timestamp
      });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleLocationPermission = async () => {
    if (hasLocationPermission) {
      setHasLocationPermission(false);
      setUserLocation(null);
    } else {
      await requestLocationPermission();
    }
  };

  const toggleTracking = () => setTrackingEnabled((prev) => !prev);

  return (
    <LocationContext.Provider
      value={{
        userLocation,
        vanLocations,
        hasLocationPermission,
        isLoading,
        error,
        trackingEnabled,
        toggleTracking,
        toggleLocationPermission,
      }}>
      {children}
    </LocationContext.Provider>
  );
}
