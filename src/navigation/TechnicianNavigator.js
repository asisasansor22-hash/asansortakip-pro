import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PlaceholderScreen from '../screens/PlaceholderScreen';

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

export default function TechnicianNavigator({ data, onLogout }) {
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
        {() => (
          <PlaceholderScreen
            route={{ params: { title: 'Bakım & Arızalar' } }}
          />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Rota"
        options={{
          title: 'Rota',
          tabBarIcon: () => <TabIcon emoji="🗺️" />,
        }}
      >
        {() => (
          <PlaceholderScreen route={{ params: { title: 'Rota Planlama' } }} />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Notlar"
        options={{
          title: 'Notlar',
          tabBarIcon: () => <TabIcon emoji="📝" />,
        }}
      >
        {() => (
          <PlaceholderScreen route={{ params: { title: 'Notlar' } }} />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="EkstraIs"
        options={{
          title: 'Ekstra İş',
          tabBarIcon: () => <TabIcon emoji="🔩" />,
        }}
      >
        {() => (
          <PlaceholderScreen route={{ params: { title: 'Ekstra İşler' } }} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
