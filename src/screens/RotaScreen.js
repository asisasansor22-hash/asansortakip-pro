import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {
  Empty,
  PrimaryButton,
  IlceBadge,
  IconButton,
} from '../components/UI';

function addressLabel(e) {
  return (
    (e.semt ? e.semt + ' Mahallesi, ' : '') +
    (e.adres || '') +
    (e.ilce ? ', ' + e.ilce + ', İstanbul' : '')
  );
}

export default function RotaScreen({ data }) {
  const { elevs, faults, maints } = data;
  const [seciliIds, setSeciliIds] = useState([]);
  const [filtreIlce, setFiltreIlce] = useState('Tümü');

  const ilceler = useMemo(() => {
    const set = new Set(elevs.map((e) => e.ilce));
    return ['Tümü', ...Array.from(set).sort()];
  }, [elevs]);

  // Otomatik öneri: Açık arızaları olan asansörler
  const onerilen = useMemo(() => {
    const fIds = faults
      .filter((f) => f.durum !== 'Çözüldü')
      .map((f) => f.asansorId);
    return elevs.filter((e) => fIds.includes(e.id));
  }, [elevs, faults]);

  const gosterilenElevs = useMemo(() => {
    if (filtreIlce === 'Tümü') return elevs;
    return elevs.filter((e) => e.ilce === filtreIlce);
  }, [elevs, filtreIlce]);

  const toggle = (id) => {
    setSeciliIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  };

  const ekleOnerilenler = () => {
    const yeniler = onerilen.map((e) => e.id);
    setSeciliIds((p) => [...new Set([...p, ...yeniler])]);
  };

  const temizle = () => setSeciliIds([]);

  const acRota = () => {
    if (seciliIds.length === 0) {
      Alert.alert('Boş Liste', 'En az 1 asansör seçin.');
      return;
    }
    const seciliElevs = seciliIds
      .map((id) => elevs.find((e) => e.id === id))
      .filter(Boolean);

    // İlçe→Semt gruplama (basit sıralama)
    seciliElevs.sort((a, b) => {
      const ai = a.ilce || '';
      const bi = b.ilce || '';
      if (ai !== bi) return ai.localeCompare(bi);
      return (a.semt || '').localeCompare(b.semt || '');
    });

    const adresler = seciliElevs.map(addressLabel);
    if (adresler.length === 1) {
      Linking.openURL(
        'https://www.google.com/maps/search/?api=1&query=' +
          encodeURIComponent(adresler[0]),
      );
      return;
    }

    const origin = encodeURIComponent(adresler[0]);
    const destination = encodeURIComponent(adresler[adresler.length - 1]);
    const waypoints = adresler
      .slice(1, -1)
      .map((a) => encodeURIComponent(a))
      .join('|');

    let url =
      'https://www.google.com/maps/dir/?api=1&origin=' +
      origin +
      '&destination=' +
      destination +
      '&travelmode=driving';
    if (waypoints) url += '&waypoints=' + waypoints;

    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Rota Planlama</Text>
        <Text style={styles.subtitle}>
          {seciliIds.length} asansör seçildi
        </Text>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: '#007AFF' }]}
          onPress={acRota}
        >
          <Text style={styles.actionBtnText}>🗺️ Rotayı Aç</Text>
        </TouchableOpacity>
        {onerilen.length > 0 ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ff9500' }]}
            onPress={ekleOnerilenler}
          >
            <Text style={styles.actionBtnText}>
              ⚠️ Arızalıları Ekle ({onerilen.length})
            </Text>
          </TouchableOpacity>
        ) : null}
        {seciliIds.length > 0 ? (
          <IconButton icon="🗑️" danger onPress={temizle} />
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtreRow}
      >
        {ilceler.map((ilce) => (
          <TouchableOpacity
            key={ilce}
            style={[
              styles.filtreChip,
              filtreIlce === ilce && styles.filtreChipActive,
            ]}
            onPress={() => setFiltreIlce(ilce)}
          >
            <Text
              style={[
                styles.filtreText,
                filtreIlce === ilce && styles.filtreTextActive,
              ]}
            >
              {ilce}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list}>
        {gosterilenElevs.length === 0 ? (
          <Empty text="Asansör bulunamadı" />
        ) : (
          gosterilenElevs.map((e) => {
            const secili = seciliIds.includes(e.id);
            const arizali = onerilen.some((o) => o.id === e.id);
            return (
              <TouchableOpacity
                key={e.id}
                style={[
                  styles.card,
                  secili && styles.cardSelected,
                  arizali && styles.cardFault,
                ]}
                onPress={() => toggle(e.id)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    secili && styles.checkboxDone,
                  ]}
                >
                  {secili ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : null}
                </View>
                <View style={styles.flex1}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {e.ad}
                    </Text>
                    {arizali ? (
                      <Text style={styles.faultBadge}>⚠️</Text>
                    ) : null}
                  </View>
                  <View style={styles.metaRow}>
                    <IlceBadge ilce={e.ilce} />
                    <Text style={styles.metaText} numberOfLines={1}>
                      {e.semt} · {e.adres}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e0e6f0',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  filtreRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 6,
    flexDirection: 'row',
  },
  filtreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1c1e2a',
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  filtreChipActive: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
  },
  filtreText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filtreTextActive: {
    color: '#007AFF',
  },
  list: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1e2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  cardSelected: {
    backgroundColor: '#007AFF15',
    borderColor: '#007AFF',
  },
  cardFault: {
    borderColor: '#ff9500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
  },
  flex1: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#e0e6f0',
  },
  faultBadge: {
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    flex: 1,
    fontSize: 12,
    color: '#94a3b8',
  },
});
