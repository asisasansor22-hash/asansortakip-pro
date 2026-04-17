import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from './src/hooks/useAuth';
import { useFirebaseData } from './src/hooks/useFirebaseData';
import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const auth = useAuth();
  const data = useFirebaseData(auth.rol);

  const handleLogin = async (rolType, sifre, bakimci) => {
    if (rolType === 'yonetici') {
      return await auth.loginYonetici(sifre);
    }
    if (rolType === 'bakimci_genel') {
      return await auth.loginBakimciGenel();
    }
    return await auth.loginBakimci(bakimci, sifre);
  };

  if (auth.loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#007AFF" />
        <StatusBar style="light" />
      </View>
    );
  }

  if (!auth.rol) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        <StatusBar style="light" />
      </>
    );
  }

  return (
    <>
      <AppNavigator
        rol={auth.rol}
        data={data}
        onLogout={auth.logout}
        onRefresh={data.reload}
      />
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0f1117',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
