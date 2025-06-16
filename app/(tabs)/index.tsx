import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, Platform, Pressable, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Navigation, Truck, Check } from 'lucide-react-native';
import { useLocation } from '@/hooks/useLocation';

const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = 0.01;

export default function MapScreen() {
  const { userLocation, vanLocations, hasLocationPermission, toggleLocationPermission } = useLocation();
  const [selectedVan, setSelectedVan] = useState<string | null>(null);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [showVanSelection, setShowVanSelection] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!hasLocationPermission) {
      setShowLocationPermission(true);
    } else if (!selectedVan) {
      setShowVanSelection(true);
    }
  }, [hasLocationPermission, selectedVan]);

  useEffect(() => {
    if (selectedVan && vanLocations?.[selectedVan] && mapRef.current) {
      const van = vanLocations[selectedVan];
      mapRef.current.animateToRegion({
        latitude: van.latitude,
        longitude: van.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 1000);
    }
  }, [selectedVan, vanLocations]);

  const handleLocationPermissionRequest = async () => {
    await toggleLocationPermission();
    setShowLocationPermission(false);
    if (!selectedVan) {
      setShowVanSelection(true);
    }
  };

  const handleVanSelection = (vanId: string) => {
    setSelectedVan(vanId);
    setShowVanSelection(false);
  };

  const handleMyLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }, 1000);
    }
  };

  const renderMap = () => {
    const initialRegion = userLocation
      ? {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        }
      : {
          latitude: 24.8607,
          longitude: 67.0011,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };

    return Platform.OS === 'web' ? (
      <View style={styles.webMapPlaceholder}>
        <Text style={styles.webMapText}>Map view is not available on web platform</Text>
        <Text style={styles.webMapSubText}>Please use the mobile app for full functionality</Text>
      </View>
    ) : (
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={initialRegion}
      >
        {selectedVan && vanLocations?.[selectedVan] && (
          <Marker
            coordinate={{
              latitude: vanLocations[selectedVan].latitude,
              longitude: vanLocations[selectedVan].longitude,
            }}
            title={`Van ${selectedVan.replace('van-', '')}`}
            description={`Speed: ${vanLocations[selectedVan].speed || 0} km/h`}
          >
            <View style={styles.vanMarkerContainer}>
              <Truck size={24} color="#3366FF" />
            </View>
          </Marker>
        )}
      </MapView>
    );
  };

  const renderVanSelectionModal = () => {
    if (!vanLocations) return null;
    const vanIds = Object.keys(vanLocations);

    return (
      <Modal visible={showVanSelection} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select a Vehicle</Text>
            <Text style={styles.modalSubtitle}>Choose a van to track on the map</Text>
          </View>
          <FlatList
            data={vanIds}
            renderItem={({ item: vanId }) => {
              const van = vanLocations[vanId];
              const speed = van.speed ? `${Math.round(van.speed)} km/h` : 'Stationary';
              return (
                <TouchableOpacity style={styles.vanItem} onPress={() => handleVanSelection(vanId)}>
                  <View style={styles.vanIconContainer}>
                    <Truck size={24} color="#3366FF" />
                  </View>
                  <View style={styles.vanInfo}>
                    <Text style={styles.vanName}>{vanId.replace('-', ' #').toUpperCase()}</Text>
                    <Text style={styles.vanStatus}>{speed}</Text>
                  </View>
                  <Check size={20} color="#3366FF" />
                </TouchableOpacity>
              );
            }}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.vanListContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </SafeAreaView>
      </Modal>
    );
  };

  const renderLocationPermissionModal = () => (
    <Modal visible={showLocationPermission} animationType="fade" transparent>
      <View style={styles.permissionOverlay}>
        <View style={styles.permissionModal}>
          <View style={styles.permissionIconContainer}>
            <MapPin size={48} color="#3366FF" />
          </View>
          <Text style={styles.permissionTitle}>Enable Location</Text>
          <Text style={styles.permissionMessage}>
            We need access to your location to show nearby vehicles and provide accurate tracking.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={handleLocationPermissionRequest}>
            <Text style={styles.permissionButtonText}>Allow Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Vehicle Tracker</Text>
          {selectedVan && (
            <TouchableOpacity style={styles.changeVanButton} onPress={() => setShowVanSelection(true)}>
              <Text style={styles.changeVanText}>{selectedVan.replace('-', ' #').toUpperCase()}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.mapContainer}>
          {renderMap()}
          {Platform.OS !== 'web' && hasLocationPermission && (
            <View style={styles.mapControls}>
              <Pressable style={styles.myLocationButton} onPress={handleMyLocation}>
                <Navigation size={24} color="#3366FF" />
              </Pressable>
            </View>
          )}
        </View>
        {renderLocationPermissionModal()}
        {renderVanSelectionModal()}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#333333',
  },
  changeVanButton: {
    backgroundColor: '#F0F4FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeVanText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#3366FF',
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
    bottom: 16,
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
  permissionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  permissionIconContainer: {
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#333333',
    marginBottom: 8,
  },
  permissionMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#3366FF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#333333',
  },
  modalSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
    marginTop: 4,
  },
  vanItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  vanIconContainer: {
    marginRight: 12,
  },
  vanInfo: {
    flex: 1,
  },
  vanName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#333333',
  },
  vanStatus: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#888888',
  },
  vanListContent: {
    paddingBottom: 32,
  },
  separator: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 16,
  },
});