import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

const MENU_ITEMS = [
  { key: 'Rota', icon: '🗺️', label: 'Rota Planlama', color: '#ff9500' },
  { key: 'GunlukIsler', icon: '📋', label: 'Günlük İşler', color: '#007AFF' },
  { key: 'Finans', icon: '💰', label: 'Finans', color: '#34c759' },
  { key: 'Giderler', icon: '💸', label: 'Giderler', color: '#ff3b30' },
  { key: 'Notlar', icon: '📝', label: 'Notlar', color: '#8b5cf6' },
  { key: 'EkstraIs', icon: '🔩', label: 'Ekstra İşler', color: '#06b6d4' },
  { key: 'Muayene', icon: '🔍', label: 'Muayene Takibi', color: '#10b981' },
  { key: 'Sozlesmeler', icon: '📄', label: 'Sözleşmeler', color: '#a855f7' },
  { key: 'BinaPortali', icon: '🏢', label: 'Bina Portalı', color: '#64748b' },
  { key: 'Bakimcilar', icon: '👥', label: 'Bakımcılar', color: '#ec4899' },
];

export default function MoreMenuScreen({ navigation }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.grid}>
        {MENU_ITEMS.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.item}
            onPress={() => navigation.navigate(item.key)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: item.color + '20' },
              ]}
            >
              <Text style={styles.icon}>{item.icon}</Text>
            </View>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  content: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  item: {
    width: '48%',
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e0e6f0',
    textAlign: 'center',
  },
});
