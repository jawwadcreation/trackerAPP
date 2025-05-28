import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bell, Check, AlertTriangle } from 'lucide-react-native';
import { useLocation } from '@/hooks/useLocation';
import { formatDistanceToNow } from '@/utils/date';

interface Alert {
  id: string;
  vehicleId: string;
  type: 'proximity' | 'speed' | 'system';
  message: string;
  timestamp: number;
  read: boolean;
}

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const { vanLocations } = useLocation();
  
  useEffect(() => {
    // This would normally fetch from Firebase
    // For demo, we'll create some mock alerts
    const mockAlerts: Alert[] = [
      {
        id: '1',
        vehicleId: 'van-001',
        type: 'proximity',
        message: 'Van #001 has arrived at pickup location',
        timestamp: Date.now() - 1000 * 60 * 10, // 10 minutes ago
        read: false,
      },
      {
        id: '2',
        vehicleId: 'van-002',
        type: 'speed',
        message: 'Van #002 exceeded speed limit',
        timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
        read: true,
      },
      {
        id: '3',
        vehicleId: 'van-001',
        type: 'system',
        message: 'System maintenance scheduled',
        timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        read: false,
      },
    ];
    
    setAlerts(mockAlerts);
  }, []);
  
  const markAsRead = (alertId: string) => {
    setAlerts((prevAlerts) =>
      prevAlerts.map((alert) =>
        alert.id === alertId ? { ...alert, read: true } : alert
      )
    );
  };
  
  const renderAlertItem = ({ item }: { item: Alert }) => {
    const getBgColor = () => {
      if (item.read) return styles.alertItemRead;
      switch (item.type) {
        case 'proximity':
          return styles.alertItemProximity;
        case 'speed':
          return styles.alertItemSpeed;
        case 'system':
          return styles.alertItemSystem;
        default:
          return {};
      }
    };
    
    const getIconColor = () => {
      switch (item.type) {
        case 'proximity':
          return '#00C853';
        case 'speed':
          return '#FF9800';
        case 'system':
          return '#3366FF';
        default:
          return '#333333';
      }
    };
    
    const getIcon = () => {
      switch (item.type) {
        case 'proximity':
          return <Check size={24} color={getIconColor()} />;
        case 'speed':
          return <AlertTriangle size={24} color={getIconColor()} />;
        case 'system':
          return <Bell size={24} color={getIconColor()} />;
        default:
          return <Bell size={24} color={getIconColor()} />;
      }
    };
    
    return (
      <TouchableOpacity
        style={[styles.alertItem, getBgColor()]}
        onPress={() => markAsRead(item.id)}
      >
        <View style={styles.alertIconContainer}>
          {getIcon()}
        </View>
        <View style={styles.alertContent}>
          <Text style={styles.alertMessage}>{item.message}</Text>
          <Text style={styles.alertTime}>
            {formatDistanceToNow(item.timestamp)}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadIndicator} />}
      </TouchableOpacity>
    );
  };
  
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Bell size={64} color="#DDDDDD" />
      <Text style={styles.emptyText}>No alerts available</Text>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
      </View>
      
      <FlatList
        data={alerts}
        renderItem={renderAlertItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyComponent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  headerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#333333',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  alertItem: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#F9F9F9',
    alignItems: 'center',
  },
  alertItemRead: {
    backgroundColor: '#F5F5F5',
  },
  alertItemProximity: {
    backgroundColor: '#E8F5E9',
  },
  alertItemSpeed: {
    backgroundColor: '#FFF3E0',
  },
  alertItemSystem: {
    backgroundColor: '#E3F2FD',
  },
  alertIconContainer: {
    width: 40,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  alertTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#888888',
  },
  unreadIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3366FF',
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#888888',
    marginTop: 16,
  },
});