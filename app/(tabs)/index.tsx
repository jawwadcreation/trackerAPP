import React, { useRef, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { AlertCircle, MapPin, Navigation, Truck } from 'lucide-react-native';
import { useLocation } from '@/hooks/useLocation';
import BottomSheet from '@/components/BottomSheet';
import VehicleSelector from '@/components/VehicleSelector';

const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = 0.0421;

export default function MapScreen() {
  const [selectedVan, setSelectedVan] = useState<string | null>(null);
  const [pickupLocation, setPickupLocation] = useState<any>(null);
  const [alertLocation, setAlertLocation] = useState<any>(null);
  const [mapMarkerMode, setMapMarkerMode] = useState<'none' | 'pickup' | 'alert'>('none');
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef(null);

  const {
    userLocation,
    vanLocations,
    trackingEnabled,
    toggleTracking,
    isLoading
  } = useLocation();

  useEffect(() => {
    if (Platform.OS !== 'web' && userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      });
    }
  }, [userLocation]);

  const handleMapPress = (event: any) => {
    if (Platform.OS === 'web') return;
    const { coordinate } = event.nativeEvent;
    
    if (mapMarkerMode === 'pickup') {
      setPickupLocation(coordinate);
      setMapMarkerMode('none');
    } else if (mapMarkerMode === 'alert') {
      setAlertLocation(coordinate);
      setMapMarkerMode('none');
    }
  };

  const handleAddPickup = () => {
    if (Platform.OS !== 'web') {
      setMapMarkerMode(prevMode => prevMode === 'pickup' ? 'none' : 'pickup');
    }
  };

  const handleAddAlert = () => {
    if (Platform.OS !== 'web') {
      setMapMarkerMode(prevMode => prevMode === 'alert' ? 'none' : 'alert');
    }
  };

  const handleMyLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA
      });
    }
  };

  const renderVanMarkers = () => {
    if (Platform.OS === 'web' || !vanLocations || !selectedVan) return null;
    
    const van = vanLocations[selectedVan];
    if (!van) return null;

    return (
      <Marker
        coordinate={{
          latitude: van.latitude,
          longitude: van.longitude
        }}
        title={`Van ${selectedVan.replace('van-', '')}`}
        description={`Speed: ${van.speed || 0} km/h`}
      >
        <View style={styles.vanMarkerContainer}>
          <Truck size={24} color="#3366FF" />
        </View>
      </Marker>
    );
  };

  const renderMap = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webMapPlaceholder}>
          <Text style={styles.webMapText}>Map view is not available on web platform</Text>
          <Text style={styles.webMapSubText}>Please use the mobile app for full functionality</Text>
        </View>
      );
    }

    return (
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation
        showsMyLocationButton={false}
        onPress={handleMapPress}
        initialRegion={userLocation ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA
        } : undefined}
      >
        {renderVanMarkers()}
        
        {pickupLocation && (
          <Marker 
            coordinate={pickupLocation}
            title="Pickup Location"
          >
            <View style={[styles.markerContainer, styles.pickupMarker]}>
              <MapPin size={24} color="#FFFFFF" />
            </View>
          </Marker>
        )}
        
        {alertLocation && (
          <Marker 
            coordinate={alertLocation}
            title="Alert Location"
          >
            <View style={[styles.markerContainer, styles.alertMarker]}>
              <AlertCircle size={24} color="#FFFFFF" />
            </View>
          </Marker>
        )}
      </MapView>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.mapContainer}>
          {renderMap()}
          
          {mapMarkerMode !== 'none' && Platform.OS !== 'web' && (
            <View style={styles.markerInstructionContainer}>
              <Text style={styles.markerInstructionText}>
                Tap on the map to place {mapMarkerMode === 'pickup' ? 'pickup' : 'alert'} marker
              </Text>
            </View>
          )}
          
          {Platform.OS !== 'web' && (
            <View style={styles.mapControls}>
              <Pressable
                style={styles.myLocationButton}
                onPress={handleMyLocation}
              >
                <Navigation size={24} color="#3366FF" />
              </Pressable>
            </View>
          )}
        </View>

        <BottomSheet ref={bottomSheetRef}>
          <View style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.bottomSheetTitle}>Track Vehicle</Text>
            
            <VehicleSelector
              selectedVan={selectedVan}
              onSelectVan={setSelectedVan}
              vanLocations={vanLocations}
            />
            
            <View style={styles.actionsContainer}>
              <Pressable
                style={[
                  styles.actionButton,
                  mapMarkerMode === 'pickup' && styles.actionButtonActive
                ]}
                onPress={handleAddPickup}
                disabled={Platform.OS === 'web'}
              >
                <MapPin 
                  size={20} 
                  color={mapMarkerMode === 'pickup' ? '#FFFFFF' : '#00C853'} 
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    mapMarkerMode === 'pickup' && styles.actionButtonTextActive
                  ]}
                >
                  {pickupLocation ? 'Change Pickup' : 'Add Pickup'}
                </Text>
              </Pressable>
              
              <Pressable
                style={[
                  styles.actionButton,
                  mapMarkerMode === 'alert' && styles.actionButtonActive
                ]}
                onPress={handleAddAlert}
                disabled={Platform.OS === 'web'}
              >
                <AlertCircle 
                  size={20} 
                  color={mapMarkerMode === 'alert' ? '#FFFFFF' : '#FF9800'} 
                />
                <Text
                  style={[
                    styles.actionButtonText,
                    mapMarkerMode === 'alert' && styles.actionButtonTextActive
                  ]}
                >
                  {alertLocation ? 'Change Alert' : 'Set Alert'}
                </Text>
              </Pressable>
            </View>
            
            <Pressable
              style={[
                styles.trackingButton,
                trackingEnabled && styles.trackingButtonActive
              ]}
              onPress={toggleTracking}
            >
              <Text
                style={[
                  styles.trackingButtonText,
                  trackingEnabled && styles.trackingButtonTextActive
                ]}
              >
                {trackingEnabled ? 'Stop Tracking' : 'Start Tracking'}
              </Text>
            </Pressable>
          </View>
        </BottomSheet>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  webMapText: {
    fontFamily: 'Inter-Medium',
    fontSize: 18,
    color: '#333333',
    marginBottom: 8,
  },
  webMapSubText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#666666',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    bottom: 200,
  },
  myLocationButton: {
    backgroundColor: '#FFFFFF',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  markerInstructionContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  markerInstructionText: {
    fontFamily: 'Inter-Medium',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    fontSize: 14,
  },
  vanMarkerContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  markerContainer: {
    padding: 8,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  pickupMarker: {
    backgroundColor: '#00C853',
  },
  alertMarker: {
    backgroundColor: '#FF9800',
  },
  bottomSheetContent: {
    padding: 16,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#333333',
    marginBottom: 16,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  actionButtonActive: {
    backgroundColor: '#3366FF',
    borderColor: '#3366FF',
  },
  actionButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333333',
  },
  actionButtonTextActive: {
    color: '#FFFFFF',
  },
  trackingButton: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  trackingButtonActive: {
    backgroundColor: '#3366FF',
  },
  trackingButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#333333',
  },
  trackingButtonTextActive: {
    color: '#FFFFFF',
  },
});