import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Shield } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { firebase } from '@/services/firebase';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institute, setInstitute] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const { register } = useAuth();

  useEffect(() => {
    if (institute.length >= 2) {
      fetchInstituteSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [institute]);

  const fetchInstituteSuggestions = async () => {
    try {
      const snapshot = await firebase
        .database()
        .ref('institutes')
        .orderByChild('name')
        .startAt(institute)
        .endAt(institute + '\uf8ff')
        .limitToFirst(5)
        .once('value');

      const data = snapshot.val();
      if (data) {
        const instituteNames = Object.values(data).map((inst: any) => inst.name);
        setSuggestions(instituteNames);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  };

  const validatePhone = (phoneNumber: string) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !institute || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      await register(email, password, fullName, phone, institute);
      router.replace('/(auth)/pending-approval');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectInstitute = (selectedInstitute: string) => {
    setInstitute(selectedInstitute);
    setShowSuggestions(false);
  };

  const renderSuggestions = () => {
    if (!showSuggestions || suggestions.length === 0) return null;

    return (
      <View style={styles.suggestionsContainer}>
        {suggestions.map((item, index) => (
          <TouchableOpacity
            key={item}
            style={[
              styles.suggestionItem,
              index === suggestions.length - 1 && styles.lastSuggestionItem,
            ]}
            onPress={() => handleSelectInstitute(item)}
          >
            <Text style={styles.suggestionText}>{item}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        enableAutomaticScroll={Platform.OS === 'ios'}
      >
        <View style={styles.logoContainer}>
          <Shield size={64} color="#3366FF" />
          <Text style={styles.appName}>CarTrack</Text>
        </View>
        
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join our fleet tracking platform</Text>
        
        <View style={styles.formContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            placeholderTextColor="#A0A0A0"
            value={fullName}
            onChangeText={setFullName}
          />
          
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#A0A0A0"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            placeholderTextColor="#A0A0A0"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text style={styles.label}>Institute</Text>
          <TextInput
            style={[styles.input, showSuggestions && suggestions.length > 0 && styles.inputWithSuggestions]}
            placeholder="Enter your institute name"
            placeholderTextColor="#A0A0A0"
            value={institute}
            onChangeText={setInstitute}
            onFocus={() => setShowSuggestions(true)}
          />
          
          {renderSuggestions()}
          
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            placeholderTextColor="#A0A0A0"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            placeholderTextColor="#A0A0A0"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          
          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.registerButtonText}>Register</Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.loginLinkContainer}>
            <Text style={styles.haveAccountText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  appName: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: '#3366FF',
    marginTop: 12,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#666666',
    marginBottom: 32,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    fontFamily: 'Inter-Regular',
    height: 56,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
    marginBottom: 16,
    color: '#333333',
  },
  inputWithSuggestions: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
    marginBottom: 0,
  },
  suggestionsContainer: {
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#E1E1E1',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    maxHeight: 200,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  lastSuggestionItem: {
    borderBottomWidth: 0,
  },
  suggestionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: '#333333',
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    color: '#FF3B30',
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: '#3366FF',
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  registerButtonText: {
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    fontSize: 16,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  haveAccountText: {
    fontFamily: 'Inter-Regular',
    color: '#666666',
    fontSize: 14,
  },
  loginText: {
    fontFamily: 'Inter-Medium',
    color: '#3366FF',
    fontSize: 14,
  },
});