import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from './src/hooks/useAuth';
import { useFirebaseData } from './src/hooks/useFirebaseData';
import FirmaSecimScreen from './src/screens/FirmaSecimScreen';
import LoginScreen from './src/screens/LoginScreen';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  const auth = useAuth();
  const data = useFirebaseData(auth.rol, auth.firmaId);

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

  if (!auth.firma) {
    return (
      <>
        <FirmaSecimScreen onSelect={auth.selectFirma} />
        <StatusBar style="light" />
      </>
    );
  }

  if (!auth.rol) {
    return (
      <>
        <LoginScreen
          onLogin={handleLogin}
          firma={auth.firma}
          onFirmaDegistir={auth.clearFirma}
        />
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
        auth={auth}
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
