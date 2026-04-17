import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { getTheme } from '../utils/theme';
import AdminNavigator from './AdminNavigator';
import TechnicianNavigator from './TechnicianNavigator';

export default function AppNavigator({ rol, data, onLogout, onRefresh }) {
  const theme = getTheme('dark');

  return (
    <NavigationContainer theme={theme}>
      {rol === 'yonetici' ? (
        <AdminNavigator data={data} onLogout={onLogout} onRefresh={onRefresh} />
      ) : (
        <TechnicianNavigator data={data} onLogout={onLogout} />
      )}
    </NavigationContainer>
  );
}
