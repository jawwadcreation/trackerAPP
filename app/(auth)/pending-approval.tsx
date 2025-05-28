import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Clock, RefreshCw, LogOut } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PendingApprovalScreen() {
  const { currentUser, logout, checkApprovalStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState(false);

  useEffect(() => {
    checkApprovalStatusAndNavigate();
  }, []);

  const checkApprovalStatusAndNavigate = async () => {
    if (!currentUser) {
      router.replace('/(auth)/login');
      return;
    }

    setIsLoading(true);
    try {
      const isApproved = await checkApprovalStatus(currentUser.uid);
      setApprovalStatus(isApproved);
      
      if (isApproved) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error checking approval status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.contentContainer}>
          <View style={styles.iconContainer}>
            <Clock size={80} color="#3366FF" />
          </View>
          
          <Text style={styles.title}>Approval Pending</Text>
          <Text style={styles.message}>
            Your account is awaiting admin approval. Once approved, you'll be able to access the tracking system.
          </Text>
          <Text style={styles.submessage}>
            This process may take up to 24 hours. Thank you for your patience.
          </Text>
          
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={checkApprovalStatusAndNavigate}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <RefreshCw size={20} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.refreshButtonText}>Check Status</Text>
              </>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <LogOut size={20} color="#3366FF" style={styles.buttonIcon} />
            <Text style={styles.logoutButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#F0F4FF',
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  submessage: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 32,
  },
  refreshButton: {
    backgroundColor: '#3366FF',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    width: '100%',
  },
  refreshButtonText: {
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#F5F5F5',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 24,
    width: '100%',
  },
  logoutButtonText: {
    fontFamily: 'Inter-Medium',
    color: '#3366FF',
    fontSize: 16,
  },
  buttonIcon: {
    marginRight: 8,
  },
});