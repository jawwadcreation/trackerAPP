import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Truck } from 'lucide-react-native';

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

export default function VehicleSelector({ selectedVan, onSelectVan, vanLocations }: VehicleSelectorProps) {
  if (!vanLocations) {
    return (
      <View style={styles.noVehiclesContainer}>
        <Text style={styles.noVehiclesText}>No vehicles available</Text>
      </View>
    );
  }
  
  const vanIds = Object.keys(vanLocations);
  
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {vanIds.map((vanId) => {
          const van = vanLocations[vanId];
          const isSelected = selectedVan === vanId;
          const speed = van.speed ? `${Math.round(van.speed)} km/h` : 'Stationary';
          
          return (
            <TouchableOpacity
              key={vanId}
              style={[
                styles.vehicleItem,
                isSelected && styles.vehicleItemSelected,
              ]}
              onPress={() => onSelectVan(vanId)}
            >
              <View style={styles.vehicleIconContainer}>
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
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  noVehiclesContainer: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 8,
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
    marginRight: 12,
    minWidth: 150,
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
});