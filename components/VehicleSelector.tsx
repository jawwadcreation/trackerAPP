import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { Truck, ChevronDown } from 'lucide-react-native';

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

interface VehicleSelectorProps {
  selectedVan: string | null;
  onSelectVan: (vanId: string) => void;
  vanLocations: VanLocations | null;
}

export default function VehicleSelector({
  selectedVan,
  onSelectVan,
  vanLocations,
}: VehicleSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);

  if (!vanLocations) {
    return (
      <View style={styles.noVehiclesContainer}>
        <Text style={styles.noVehiclesText}>No vehicles available</Text>
      </View>
    );
  }

  const vanIds = Object.keys(vanLocations);

  const handleSelectVan = (vanId: string) => {
    onSelectVan(vanId);
    setModalVisible(false);
  };

  const renderVehicleItem = ({ item: vanId }: { item: string }) => {
    const van = vanLocations[vanId];
    const isSelected = selectedVan === vanId;
    const speed = van.speed ? `${Math.round(van.speed)} km/h` : 'Stationary';

    return (
      <TouchableOpacity
        style={[
          styles.vehicleItem,
          isSelected && styles.vehicleItemSelected,
        ]}
        onPress={() => handleSelectVan(vanId)}
      >
        <View
          style={[
            styles.vehicleIconContainer,
            isSelected && styles.vehicleIconContainerSelected,
          ]}
        >
          <Truck size={24} color={isSelected ? '#FFFFFF' : '#3366FF'} />
        </View>
        <View style={styles.vehicleInfo}>
          <Text
            style={[
              styles.vehicleName,
              isSelected && styles.vehicleNameSelected,
            ]}
          >
            {vanId.replace('-', ' #').toUpperCase()}
          </Text>
          <Text
            style={[
              styles.vehicleStatus,
              isSelected && styles.vehicleStatusSelected,
            ]}
          >
            {speed}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      {/* Button */}
      <TouchableOpacity
        style={styles.selectButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.selectButtonText}>
          {selectedVan
            ? `Selected: ${selectedVan.replace('-', ' #').toUpperCase()}`
            : 'Select Your Van'}
        </Text>
        <ChevronDown size={16} color="#000" />
      </TouchableOpacity>

      {/* Modal Popup */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <FlatList
              data={vanIds}
              renderItem={renderVehicleItem}
              keyExtractor={(item) => item}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={true}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
    justifyContent: 'space-between',
  },
  selectButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    maxHeight: '60%', // Fixed height with scroll
    padding: 16,
  },
  noVehiclesContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  noVehiclesText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#888888',
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  vehicleItemSelected: {
    backgroundColor: '#3366FF',
  },
  vehicleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleIconContainerSelected: {
    backgroundColor: '#1E40AF',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  vehicleNameSelected: {
    color: '#FFFFFF',
  },
  vehicleStatus: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#666666',
  },
  vehicleStatusSelected: {
    color: '#E0E0E0',
  },
  separator: {
    height: 8,
  },
});
