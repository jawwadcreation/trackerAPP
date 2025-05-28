import React, { createContext, useState, useEffect } from 'react';
import { firebase } from '@/services/firebase';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextData {
  isLoggedIn: boolean;
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, fullName: string, phone: string, institute: string) => Promise<void>;
  logout: () => Promise<void>;
  checkApprovalStatus: (uid: string) => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });
      } else {
        setCurrentUser(null);
      }
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const login = async (email: string, password: string): Promise<User> => {
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      if (!userCredential.user) {
        throw new Error('Login failed');
      }
      
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
      };
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('User not found');
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Invalid password');
      } else {
        throw new Error(error.message);
      }
    }
  };
  
  const register = async (email: string, password: string, fullName: string, phone: string, institute: string): Promise<void> => {
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      
      // Update user profile with full name
      await userCredential.user?.updateProfile({
        displayName: fullName,
      });
      
      // Add user to database with approval status, phone number, and institute
      await firebase.database().ref(`users/${userCredential.user?.uid}`).set({
        email,
        fullName,
        phone,
        institute,
        isApproved: false,
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      });

      // Update institute reference count
      const instituteRef = firebase.database().ref('institutes');
      const snapshot = await instituteRef
        .orderByChild('name')
        .equalTo(institute)
        .once('value');
      
      if (snapshot.exists()) {
        // Institute exists, update reference count
        const instituteKey = Object.keys(snapshot.val())[0];
        await instituteRef.child(instituteKey).update({
          referenceCount: firebase.database.ServerValue.increment(1)
        });
      } else {
        // Create new institute entry
        await instituteRef.push({
          name: institute,
          referenceCount: 1,
          createdAt: firebase.database.ServerValue.TIMESTAMP
        });
      }
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already in use');
      } else {
        throw new Error(error.message);
      }
    }
  };
  
  const logout = async (): Promise<void> => {
    try {
      await firebase.auth().signOut();
    } catch (error: any) {
      throw new Error(error.message);
    }
  };
  
  const checkApprovalStatus = async (uid: string): Promise<boolean> => {
    try {
      const snapshot = await firebase.database().ref(`users/${uid}`).once('value');
      const userData = snapshot.val();
      return userData?.isApproved || false;
    } catch (error) {
      console.error('Error checking approval status:', error);
      return false;
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!currentUser,
        currentUser,
        isLoading,
        login,
        register,
        logout,
        checkApprovalStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}