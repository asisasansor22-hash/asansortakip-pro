import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { getIlceRenk } from '../utils/constants';

function ElevatorCard({ item, onPress }) {
  const renk = getIlceRenk(item.ilce);
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={styles.idBadge}>
          <Text style={styles.idText}>{item.id}</Text>
        </View>
        <View style={styles.flex1}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.ad}
          </Text>
          <Text style={styles.cardAddress} numberOfLines={1}>
            {item.adres}
          </Text>
        </View>
        <View style={[styles.ilceBadge, { backgroundColor: renk + '20' }]}>
          <Text style={[styles.ilceText, { color: renk }]}>{item.ilce}</Text>
        </View>
      </View>
      <View style={styles.cardBottom}>
        <Text style={styles.detailText}>📍 {item.semt}</Text>
        <Text style={styles.detailText}>
          🏢 {item.kat} kat · {item.tip || 'Elektrikli'}
        </Text>
        <Text style={styles.detailText}>
          👤 {item.yonetici || '—'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ElevatorListScreen({ data, navigation }) {
  const { elevs } = data;
  const [arama, setArama] = useState('');
  const [filtre, setFiltre] = useState('Tümü');

  const ilceler = useMemo(() => {
    const set = new Set(elevs.map((e) => e.ilce));
    return ['Tümü', ...Array.from(set).sort()];
  }, [elevs]);

  const filtrelenmis = useMemo(() => {
    let list = elevs;
    if (filtre !== 'Tümü') {
      list = list.filter((e) => e.ilce === filtre);
    }
    if (arama.trim()) {
      const q = arama.toLowerCase();
      list = list.filter(
        (e) =>
          (e.ad || '').toLowerCase().includes(q) ||
          (e.adres || '').toLowerCase().includes(q) ||
          (e.semt || '').toLowerCase().includes(q) ||
          (e.yonetici || '').toLowerCase().includes(q) ||
          String(e.id).includes(q),
      );
    }
    return list;
  }, [elevs, filtre, arama]);

  const handlePress = (item) => {
    navigation.navigate('ElevatorDetail', { elevator: item });
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Asansör ara... (ad, adres, yönetici)"
        placeholderTextColor="#64748b"
        value={arama}
        onChangeText={setArama}
      />

      <FlatList
        horizontal
        data={ilceler}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item: ilce }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              filtre === ilce && styles.filterChipActive,
            ]}
            onPress={() => setFiltre(ilce)}
          >
            <Text
              style={[
                styles.filterText,
                filtre === ilce && styles.filterTextActive,
              ]}
            >
              {ilce}
            </Text>
          </TouchableOpacity>
        )}
      />

      <Text style={styles.countText}>
        {filtrelenmis.length} asansör
      </Text>

      <FlatList
        data={filtrelenmis}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ElevatorCard item={item} onPress={handlePress} />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  searchInput: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#1c1e2a',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    color: '#e0e6f0',
    fontSize: 15,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1c1e2a',
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  filterChipActive: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
  },
  filterText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  filterTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
  countText: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    fontSize: 13,
    color: '#64748b',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  idBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2a2d3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#007AFF',
  },
  flex1: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 2,
  },
  cardAddress: {
    fontSize: 12,
    color: '#94a3b8',
  },
  ilceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  ilceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 0,
    borderTopWidth: 0.5,
    borderTopColor: '#1e2236',
    paddingTop: 10,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
  },
});
