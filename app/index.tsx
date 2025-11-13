import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { initializeDatabase, seedDatabase } from '@/services/database';
import { useAuthStore } from '@/store/authStore';
import { LoginScreen } from '@/components/LoginScreen';
import { SignupScreen } from '@/components/SignupScreen';
import MainApp from '@/app/MainApp';

type AuthScreen = 'login' | 'signup';

export default function RootApp() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [authScreen, setAuthScreen] = useState<AuthScreen>('login');
  const { isLoggedIn, user, getCurrentUser } = useAuthStore();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeDatabase();
        await seedDatabase();
        
        // Check if user was previously logged in
        await getCurrentUser();
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true); // Continue anyway
      }
    };

    initializeApp();
  }, [getCurrentUser]);

  if (!isInitialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1976d2" />
      </View>
    );
  }

  return (
    <PaperProvider>
      {isLoggedIn && user ? (
        <MainApp />
      ) : authScreen === 'login' ? (
        <LoginScreen
          onLoginSuccess={() => setAuthScreen('login')}
          onNavigateToSignup={() => setAuthScreen('signup')}
        />
      ) : (
        <SignupScreen
          onSignupSuccess={() => setAuthScreen('login')}
          onNavigateToLogin={() => setAuthScreen('login')}
        />
      )}
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
