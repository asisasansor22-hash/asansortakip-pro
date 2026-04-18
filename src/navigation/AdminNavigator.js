import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DashboardScreen from '../screens/DashboardScreen';
import ElevatorListScreen from '../screens/ElevatorListScreen';
import ElevatorDetailScreen from '../screens/ElevatorDetailScreen';
import BakimAtamaScreen from '../screens/BakimAtamaScreen';
import ArizaYonetimiScreen from '../screens/ArizaYonetimiScreen';
import MoreMenuScreen from '../screens/MoreMenuScreen';
import RotaScreen from '../screens/RotaScreen';
import GunlukIslerScreen from '../screens/GunlukIslerScreen';
import FinansScreen from '../screens/FinansScreen';
import GiderlerScreen from '../screens/GiderlerScreen';
import NotlarScreen from '../screens/NotlarScreen';
import EkstraIsScreen from '../screens/EkstraIsScreen';
import MuayeneTakibiScreen from '../screens/MuayeneTakibiScreen';
import SozlesmeYonetimiScreen from '../screens/SozlesmeYonetimiScreen';
import YoneticiPortaliScreen from '../screens/YoneticiPortaliScreen';
import BakimciYonetimScreen from '../screens/BakimciYonetimScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const stackScreenOptions = {
  headerStyle: { backgroundColor: '#1c1e2a' },
  headerTintColor: '#e0e6f0',
  headerTitleStyle: { fontWeight: '700' },
};

function ElevatorStack({ data }) {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
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

function MoreStack({ data, auth }) {
  return (
    <Stack.Navigator screenOptions={stackScreenOptions}>
      <Stack.Screen name="MoreMenu" component={MoreMenuScreen} options={{ title: 'Daha Fazla' }} />
      <Stack.Screen name="Rota" options={{ title: 'Rota Planlama' }}>
        {() => <RotaScreen data={data} />}
      </Stack.Screen>
      <Stack.Screen name="GunlukIsler" options={{ title: 'Günlük İşler' }}>
        {() => <GunlukIslerScreen data={data} />}
      </Stack.Screen>
      <Stack.Screen name="Finans" options={{ title: 'Finans' }}>
        {() => <FinansScreen data={data} />}
      </Stack.Screen>
      <Stack.Screen name="Giderler" options={{ title: 'Giderler' }}>
        {() => <GiderlerScreen data={data} />}
      </Stack.Screen>
      <Stack.Screen name="Notlar" options={{ title: 'Notlar' }}>
        {() => <NotlarScreen data={data} auth={auth} />}
      </Stack.Screen>
      <Stack.Screen name="EkstraIs" options={{ title: 'Ekstra İşler' }}>
        {() => <EkstraIsScreen data={data} />}
      </Stack.Screen>
      <Stack.Screen name="Muayene" options={{ title: 'Muayene Takibi' }}>
        {() => <MuayeneTakibiScreen data={data} />}
      </Stack.Screen>
      <Stack.Screen name="Sozlesmeler" options={{ title: 'Sözleşmeler' }}>
        {() => <SozlesmeYonetimiScreen data={data} />}
      </Stack.Screen>
      <Stack.Screen name="BinaPortali" options={{ title: 'Bina Portalı' }}>
        {() => <YoneticiPortaliScreen data={data} />}
      </Stack.Screen>
      <Stack.Screen name="Bakimcilar" options={{ title: 'Bakımcılar' }}>
        {() => <BakimciYonetimScreen data={data} />}
      </Stack.Screen>
    </Stack.Navigator>
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

export default function AdminNavigator({ data, onLogout, onRefresh, auth }) {
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
          tabBarIcon: () => <TabIcon emoji="📊" />,
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
          tabBarIcon: () => <TabIcon emoji="🛗" />,
        }}
      >
        {() => <ElevatorStack data={data} />}
      </Tab.Screen>

      <Tab.Screen
        name="BakimAtama"
        options={{
          title: 'Bakım',
          tabBarIcon: () => <TabIcon emoji="🔧" />,
        }}
      >
        {() => <BakimAtamaScreen data={data} />}
      </Tab.Screen>

      <Tab.Screen
        name="Arizalar"
        options={{
          title: 'Arızalar',
          tabBarIcon: () => <TabIcon emoji="⚠️" />,
        }}
      >
        {() => <ArizaYonetimiScreen data={data} />}
      </Tab.Screen>

      <Tab.Screen
        name="Daha"
        options={{
          title: 'Daha Fazla',
          headerShown: false,
          tabBarIcon: () => <TabIcon emoji="⋯" />,
        }}
      >
        {() => <MoreStack data={data} auth={auth} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
