import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import ElevatorListScreen from '../screens/ElevatorListScreen';
import ElevatorDetailScreen from '../screens/ElevatorDetailScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#1c1e2a' },
  headerTintColor: '#e0e6f0',
  headerTitleStyle: { fontWeight: '700' },
};

function ElevatorStack({ data }) {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ElevatorList" options={{ title: 'Asansörler' }}>
        {(props) => <ElevatorListScreen {...props} data={data} />}
      </Stack.Screen>
      <Stack.Screen
        name="ElevatorDetail"
        component={ElevatorDetailScreen}
        options={({ route }) => ({
          title: route.params?.elevator?.ad || 'Detay',
        })}
      />
    </Stack.Navigator>
  );
}

export default function AdminNavigator({ data, onLogout, onRefresh }) {
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
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        headerStyle: { backgroundColor: '#1c1e2a' },
        headerTintColor: '#e0e6f0',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="📊" color={color} />
          ),
          headerRight: () => <LogoutButton onPress={onLogout} />,
        }}
      >
        {() => <DashboardScreen data={data} onRefresh={onRefresh} />}
      </Tab.Screen>

      <Tab.Screen
        name="Elevators"
        options={{
          title: 'Asansörler',
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="🛗" color={color} />
          ),
        }}
      >
        {() => <ElevatorStack data={data} />}
      </Tab.Screen>

      <Tab.Screen
        name="BakimAtama"
        options={{
          title: 'Bakım',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="🔧" color={color} />
          ),
        }}
      >
        {() => (
          <PlaceholderScreen route={{ params: { title: 'Bakım Atama' } }} />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Arizalar"
        options={{
          title: 'Arızalar',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="⚠️" color={color} />
          ),
        }}
      >
        {() => (
          <PlaceholderScreen route={{ params: { title: 'Arıza Yönetimi' } }} />
        )}
      </Tab.Screen>

      <Tab.Screen
        name="Daha"
        options={{
          title: 'Daha Fazla',
          tabBarIcon: ({ color }) => (
            <TabIcon emoji="⋯" color={color} />
          ),
        }}
      >
        {() => (
          <PlaceholderScreen
            route={{
              params: {
                title: 'Rota · Finans · Giderler · Notlar · Ekstra İş · Muayene · Sözleşmeler · Bakımcılar',
              },
            }}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

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
