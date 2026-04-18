import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
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

function SectionHeader({ ilce, count, collapsed, onToggle }) {
  const renk = getIlceRenk(ilce);
  return (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.sectionDot, { backgroundColor: renk }]} />
      <Text style={[styles.sectionTitle, { color: renk }]}>{ilce}</Text>
      <View style={[styles.sectionCount, { backgroundColor: renk + '20' }]}>
        <Text style={[styles.sectionCountText, { color: renk }]}>{count}</Text>
      </View>
      <Text style={styles.sectionChevron}>{collapsed ? '›' : '⌄'}</Text>
    </TouchableOpacity>
  );
}

export default function ElevatorListScreen({ data, navigation }) {
  const { elevs } = data;
  const [arama, setArama] = useState('');
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = useCallback((ilce) => {
    setCollapsed((prev) => ({ ...prev, [ilce]: !prev[ilce] }));
  }, []);

  const sections = useMemo(() => {
    let list = elevs;
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

    const grouped = {};
    list.forEach((e) => {
      const ilce = e.ilce || 'Diğer';
      if (!grouped[ilce]) grouped[ilce] = [];
      grouped[ilce].push(e);
    });

    return Object.keys(grouped)
      .sort()
      .map((ilce) => ({
        ilce,
        count: grouped[ilce].length,
        data: collapsed[ilce] ? [] : grouped[ilce],
      }));
  }, [elevs, arama, collapsed]);

  const totalCount = sections.reduce((s, sec) => s + sec.count, 0);

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

      <View style={styles.summaryRow}>
        <Text style={styles.countText}>{totalCount} asansör</Text>
        <Text style={styles.countText}>{sections.length} ilçe</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ElevatorCard item={item} onPress={handlePress} />
        )}
        renderSectionHeader={({ section }) => (
          <SectionHeader
            ilce={section.ilce}
            count={section.count}
            collapsed={!!collapsed[section.ilce]}
            onToggle={() => toggleSection(section.ilce)}
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={true}
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  countText: {
    fontSize: 13,
    color: '#64748b',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151722',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a3050',
  },
  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  sectionCount: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '800',
  },
  sectionChevron: {
    fontSize: 16,
    color: '#64748b',
    width: 20,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
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
    borderTopWidth: 0.5,
    borderTopColor: '#1e2236',
    paddingTop: 10,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
  },
});
