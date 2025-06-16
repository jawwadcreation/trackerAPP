import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, Platform, Pressable, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { MapPin, Navigation, Truck, Check, Plus, X, Edit3, Trash2 } from 'lucide-react-native';
import { useLocation } from '@/hooks/useLocation';

const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = 0.01;

interface PickupPoint {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
}

export default function MapScreen() {
  const { userLocation, vanLocations, hasLocationPermission, toggleLocationPermission } = useLocation();
  const [selectedVan, setSelectedVan] = useState<string | null>(null);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [showVanSelection, setShowVanSelection] = useState(false);
  const [pickupPoints, setPickupPoints] = useState<PickupPoint[]>([]);
  const [isAddingPickupPoint, setIsAddingPickupPoint] = useState(false);
  const [selectedPickupPoint, setSelectedPickupPoint] = useState<string | null>(null);
  const [showPickupPointActions, setShowPickupPointActions] = useState(false);
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

  const handleMapPress = (event: any) => {
    if (!isAddingPickupPoint) return;

    const { coordinate } = event.nativeEvent;
    const newPickupPoint: PickupPoint = {
      id: `pickup-${Date.now()}`,
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      title: `Pickup Point ${pickupPoints.length + 1}`,
    };

    setPickupPoints(prev => [...prev, newPickupPoint]);
    setIsAddingPickupPoint(false);
  };

  const handlePickupPointPress = (pointId: string) => {
    setSelectedPickupPoint(pointId);
    setShowPickupPointActions(true);
  };

  const removePickupPoint = (pointId: string) => {
    setPickupPoints(prev => prev.filter(point => point.id !== pointId));
    setShowPickupPointActions(false);
    setSelectedPickupPoint(null);
  };

  const changePickupPointLocation = (pointId: string) => {
    setShowPickupPointActions(false);
    setSelectedPickupPoint(null);
    setIsAddingPickupPoint(true);
    
    // Remove the old pickup point and let user add a new one
    setPickupPoints(prev => prev.filter(point => point.id !== pointId));
  };

  const toggleAddPickupPoint = () => {
    setIsAddingPickupPoint(!isAddingPickupPoint);
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

  const renderPickupPointMarkers = () => {
    return pickupPoints.map((point) => (
      <Marker
        key={point.id}
        coordinate={{
          latitude: point.latitude,
          longitude: point.longitude,
        }}
        title={point.title}
        onPress={() => handlePickupPointPress(point.id)}
      >
        <View style={styles.pickupMarkerContainer}>
          <MapPin size={20} color="#FF6B35" />
        </View>
      </Marker>
    ));
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
        onPress={handleMapPress}
      >
        {renderVanMarkers()}
        {renderPickupPointMarkers()}
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
    const selectedPoint = pickupPoints.find(point => point.id === selectedPickupPoint);
    if (!selectedPoint) return null;

    return (
      <Modal visible={showPickupPointActions} animationType="slide" transparent>
        <View style={styles.actionOverlay}>
          <View style={styles.actionModal}>
            <View style={styles.actionHeader}>
              <Text style={styles.actionTitle}>{selectedPoint.title}</Text>
              <Text style={styles.actionSubtitle}>What would you like to do?</Text>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.changeLocationButton]} 
                onPress={() => changePickupPointLocation(selectedPoint.id)}
              >
                <Edit3 size={20} color="#3366FF" />
                <Text style={styles.changeLocationButtonText}>Change Location</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.removeButton]} 
                onPress={() => removePickupPoint(selectedPoint.id)}
              >
                <Trash2 size={20} color="#FF3B30" />
                <Text style={styles.removeButtonText}>Remove Point</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => {
                setShowPickupPointActions(false);
                setSelectedPickupPoint(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
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

        {/* Pickup Points Info Bar */}
        {selectedVan && (
          <View style={styles.infoBar}>
            <Text style={styles.infoText}>
              {pickupPoints.length} pickup point{pickupPoints.length !== 1 ? 's' : ''} added
            </Text>
            {isAddingPickupPoint && (
              <Text style={styles.instructionText}>Tap on map to add pickup point</Text>
            )}
          </View>
        )}

        <View style={styles.mapContainer}>
          {renderMap()}
          
          {/* Map Controls */}
          {Platform.OS !== 'web' && hasLocationPermission && selectedVan && (
            <View style={styles.mapControls}>
              <Pressable style={styles.myLocationButton} onPress={handleMyLocation}>
                <Navigation size={24} color="#3366FF" />
              </Pressable>
              
              <Pressable 
                style={[
                  styles.addPickupButton,
                  isAddingPickupPoint && styles.addPickupButtonActive
                ]} 
                onPress={toggleAddPickupPoint}
              >
                {isAddingPickupPoint ? (
                  <X size={24} color="#FFFFFF" />
                ) : (
                  <Plus size={24} color="#FFFFFF" />
                )}
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
  instructionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#FF6B35',
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
  addPickupButtonActive: {
    backgroundColor: '#E55A2B',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 6,
    borderWidth: 2,
    borderColor: '#FF6B35',
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