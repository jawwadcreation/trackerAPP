import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, Platform, Pressable, TouchableWithoutFeedback, Keyboard, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Navigation, Truck, Check, Plus, X, Edit3, Trash2, Target } from 'lucide-react-native';
import { useLocation } from '@/hooks/useLocation';

const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = 0.01;

interface PickupPoint {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  address?: string;
}

export default function MapScreen() {
  const { userLocation, vanLocations, hasLocationPermission, toggleLocationPermission } = useLocation();
  const [selectedVan, setSelectedVan] = useState<string | null>(null);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [showVanSelection, setShowVanSelection] = useState(false);
  const [pickupPoint, setPickupPoint] = useState<PickupPoint | null>(null); // Changed to single pickup point
  const [isAddingPickupPoint, setIsAddingPickupPoint] = useState(false);
  const [showPickupPointActions, setShowPickupPointActions] = useState(false);
  const [mapCenter, setMapCenter] = useState({
    latitude: 24.8607,
    longitude: 67.0011,
  });
  const [isMapMoving, setIsMapMoving] = useState(false);
  const mapRef = useRef<MapView>(null);
  const pinAnimatedValue = useRef(new Animated.Value(0)).current;

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

  // Animate pin when map is moving
  useEffect(() => {
    Animated.timing(pinAnimatedValue, {
      toValue: isMapMoving ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isMapMoving]);

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

  const handleMapRegionChangeStart = () => {
    if (isAddingPickupPoint) {
      setIsMapMoving(true);
    }
  };

  const handleMapRegionChangeComplete = (region: any) => {
    if (isAddingPickupPoint) {
      setMapCenter({
        latitude: region.latitude,
        longitude: region.longitude,
      });
      setIsMapMoving(false);
    }
  };

  const confirmPickupLocation = () => {
    const newPickupPoint: PickupPoint = {
      id: `pickup-${Date.now()}`,
      latitude: mapCenter.latitude,
      longitude: mapCenter.longitude,
      title: 'Pickup Point',
      address: `${mapCenter.latitude.toFixed(4)}, ${mapCenter.longitude.toFixed(4)}`,
    };

    setPickupPoint(newPickupPoint); // Set single pickup point
    setIsAddingPickupPoint(false);
  };

  const handlePickupPointPress = () => {
    setShowPickupPointActions(true);
  };

  const removePickupPoint = () => {
    setPickupPoint(null); // Remove the single pickup point
    setShowPickupPointActions(false);
  };

  const changePickupPointLocation = () => {
    setShowPickupPointActions(false);
    
    // Remove the pickup point and enter location selection mode
    setPickupPoint(null);
    setIsAddingPickupPoint(true);
  };

  const toggleAddPickupPoint = () => {
    setIsAddingPickupPoint(!isAddingPickupPoint);
    if (!isAddingPickupPoint) {
      // Set initial center to current map center or user location
      if (userLocation) {
        setMapCenter({
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        });
      }
    }
  };

  const renderVanMarkers = () => {
    if (!vanLocations || !selectedVan) return null;

    const van = vanLocations[selectedVan];
    return (
      <Marker
        key={selectedVan}
        coordinate={{
          latitude: van.latitude,
          longitude: van.longitude,
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

  const renderPickupPointMarker = () => {
    if (!pickupPoint) return null;

    return (
      <Marker
        key={pickupPoint.id}
        coordinate={{
          latitude: pickupPoint.latitude,
          longitude: pickupPoint.longitude,
        }}
        title={pickupPoint.title}
        description={pickupPoint.address}
        onPress={handlePickupPointPress}
      >
        <View style={styles.pickupMarkerContainer}>
          <MapPin size={40} color="#FF6B35" />
        </View>
      </Marker>
    );
  };

  const renderCenterPin = () => {
    if (!isAddingPickupPoint) return null;

    const pinTransform = {
      transform: [
        {
          translateY: pinAnimatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -10],
          }),
        },
        {
          scale: pinAnimatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.1],
          }),
        },
      ],
    };

    return (
      <View style={styles.centerPinContainer} pointerEvents="none">
        <Animated.View style={[styles.centerPin, pinTransform]}>
          <View style={styles.centerPinIcon}>
            <MapPin size={32} color="#FF6B35" />
          </View>
          <View style={styles.centerPinShadow} />
        </Animated.View>
      </View>
    );
  };

  const renderLocationConfirmation = () => {
    if (!isAddingPickupPoint) return null;

    const isReplacing = pickupPoint !== null;

    return (
      <View style={styles.locationConfirmationContainer}>
        <View style={styles.locationInfo}>
          <Text style={styles.locationTitle}>
            {isReplacing ? 'Replace Pickup Location' : 'Set Pickup Location'}
          </Text>
          <Text style={styles.locationCoordinates}>
            {mapCenter.latitude.toFixed(4)}, {mapCenter.longitude.toFixed(4)}
          </Text>
          <Text style={styles.locationInstruction}>
            {isReplacing 
              ? 'Move the map to set your new pickup location' 
              : 'Move the map to position the pin at your desired pickup location'
            }
          </Text>
        </View>
        <View style={styles.locationActions}>
          <TouchableOpacity
            style={styles.cancelLocationButton}
            onPress={() => setIsAddingPickupPoint(false)}
          >
            <X size={20} color="#666666" />
            <Text style={styles.cancelLocationText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.confirmLocationButton}
            onPress={confirmPickupLocation}
          >
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.confirmLocationText}>
              {isReplacing ? 'Replace Location' : 'Confirm Location'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
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
        onRegionChangeStart={handleMapRegionChangeStart}
        onRegionChangeComplete={handleMapRegionChangeComplete}
      >
        {renderVanMarkers()}
        {renderPickupPointMarker()}
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

  const renderPickupPointActionsModal = () => {
    if (!pickupPoint) return null;

    return (
      <Modal visible={showPickupPointActions} animationType="slide" transparent>
        <View style={styles.actionOverlay}>
          <View style={styles.actionModal}>
            <View style={styles.actionHeader}>
              <Text style={styles.actionTitle}>{pickupPoint.title}</Text>
              <Text style={styles.actionSubtitle}>{pickupPoint.address}</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.changeLocationButton]} 
                onPress={changePickupPointLocation}
              >
                <Edit3 size={20} color="#3366FF" />
                <Text style={styles.changeLocationButtonText}>Change Location</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.removeButton]} 
                onPress={removePickupPoint}
              >
                <Trash2 size={20} color="#FF3B30" />
                <Text style={styles.removeButtonText}>Remove Point</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setShowPickupPointActions(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  // Updated button text and icon based on whether pickup point exists
  const getAddButtonContent = () => {
    if (pickupPoint) {
      return {
        icon: <Edit3 size={20} color="#FFFFFF" />,
        style: [styles.addPickupButton, styles.editPickupButton]
      };
    }
    return {
      icon: <Plus size={24} color="#FFFFFF" />,
      style: styles.addPickupButton
    };
  };

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

        {/* Pickup Point Info Bar */}
        {selectedVan && !isAddingPickupPoint && (
          <View style={styles.infoBar}>
            <Text style={styles.infoText}>
              {pickupPoint ? 'Pickup point set' : 'No pickup point set'}
            </Text>
            {pickupPoint && (
              <Text style={styles.infoSubText}>
                {pickupPoint.address}
              </Text>
            )}
          </View>
        )}

        <View style={styles.mapContainer}>
          {renderMap()}
          
          {/* Center Pin Overlay */}
          {renderCenterPin()}
          
          {/* Location Confirmation Panel */}
          {renderLocationConfirmation()}
          
          {/* Map Controls */}
          {Platform.OS !== 'web' && hasLocationPermission && selectedVan && !isAddingPickupPoint && (
            <View style={styles.mapControls}>
              <Pressable style={styles.myLocationButton} onPress={handleMyLocation}>
                <Navigation size={24} color="#3366FF" />
              </Pressable>
              
              <Pressable style={getAddButtonContent().style} onPress={toggleAddPickupPoint}>
                {getAddButtonContent().icon}
              </Pressable>
            </View>
          )}
        </View>

        {renderLocationPermissionModal()}
        {renderVanSelectionModal()}
        {renderPickupPointActionsModal()}
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

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
  infoBar: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  infoText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333333',
  },
  infoSubText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
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
  centerPinContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerPin: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPinIcon: {
    backgroundColor: '',
    borderRadius: 25,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1,
    height: 70,
  },
  centerPinShadow: {
    position: 'absolute',
    bottom: 30,
    width: 10,
    height: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    transform: [{ scaleX: 1.5 }],
  },
  locationConfirmationContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 15,
  },
  locationInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  locationTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: '#333333',
    marginBottom: 4,
  },
  locationCoordinates: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  locationInstruction: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 16,
  },
  locationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelLocationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelLocationText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#666666',
  },
  confirmLocationButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmLocationText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    gap: 12,
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
  addPickupButton: {
    backgroundColor: '#FF6B35',
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
  editPickupButton: {
    backgroundColor: '#3366FF',
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
  pickupMarkerContainer: {
    borderRadius: 15,
    padding: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 0 },
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
  actionOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  actionModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  actionHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#333333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#666666',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
  },
  changeLocationButton: {
    backgroundColor: '#F0F4FF',
  },
  changeLocationButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#3366FF',
    marginLeft: 8,
  },
  removeButton: {
    backgroundColor: '#FFF5F5',
  },
  removeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#FF3B30',
    marginLeft: 8,
  },
  cancelButton: {
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#666666',
  },
});