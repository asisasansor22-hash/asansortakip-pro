import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BakimciGorunumScreen from '../screens/BakimciGorunumScreen';
import RotaScreen from '../screens/RotaScreen';
import NotlarScreen from '../screens/NotlarScreen';
import EkstraIsScreen from '../screens/EkstraIsScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji }) {
  return <Text style={{ fontSize: 22 }}>{emoji}</Text>;
}

function LogoutButton({ onPress }) {
  return (
    <Text
      onPress={onPress}
      style={{
        fontSize: 14,
        color: '#ff3b30',
        marginRight: 16,
        fontWeight: '600',
      }}
    >
      Çıkış
    </Text>
  );
}

export default function TechnicianNavigator({ data, onLogout, auth }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1c1e2a',
          borderTopColor: '#2a3050',
          borderTopWidth: 0.5,
          height: 85,
          paddingBottom: 25,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#34c759',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerStyle: { backgroundColor: '#1c1e2a' },
        headerTintColor: '#e0e6f0',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="BakimArizalar"
        options={{
          title: 'Bakım & Arıza',
          tabBarIcon: () => <TabIcon emoji="🔧" />,
          headerRight: () => <LogoutButton onPress={onLogout} />,
        }}
      >
        {() => <BakimciGorunumScreen data={data} />}
      </Tab.Screen>

      <Tab.Screen
        name="Rota"
        options={{
          title: 'Rota',
          tabBarIcon: () => <TabIcon emoji="🗺️" />,
        }}
      >
        {() => <RotaScreen data={data} />}
      </Tab.Screen>

      <Tab.Screen
        name="Notlar"
        options={{
          title: 'Notlar',
          tabBarIcon: () => <TabIcon emoji="📝" />,
        }}
      >
        {() => <NotlarScreen data={data} auth={auth} />}
      </Tab.Screen>

      <Tab.Screen
        name="EkstraIs"
        options={{
          title: 'Ekstra İş',
          tabBarIcon: () => <TabIcon emoji="🔩" />,
        }}
      >
        {() => <EkstraIsScreen data={data} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
