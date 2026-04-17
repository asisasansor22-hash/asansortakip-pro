import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  StyleSheet,
} from 'react-native';
import { getIlceRenk } from '../utils/constants';

function InfoRow({ label, value, icon }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.flex1}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export default function ElevatorDetailScreen({ route }) {
  const { elevator: e } = route.params;
  const renk = getIlceRenk(e.ilce);

  const openMaps = () => {
    const addr = encodeURIComponent(
      (e.semt ? e.semt + ' Mahallesi, ' : '') +
      (e.adres || '') +
      (e.ilce ? ', ' + e.ilce + ', İstanbul' : ''),
    );
    Linking.openURL('https://www.google.com/maps/search/?api=1&query=' + addr);
  };

  const callPhone = () => {
    if (e.tel) Linking.openURL('tel:' + e.tel);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={styles.idBox}>
            <Text style={styles.idText}>{e.id}</Text>
          </View>
          <View style={styles.flex1}>
            <Text style={styles.title}>{e.ad}</Text>
            <View style={[styles.ilceBadge, { backgroundColor: renk + '20' }]}>
              <Text style={[styles.ilceText, { color: renk }]}>
                {e.ilce} · {e.semt}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={openMaps}>
            <Text style={styles.actionIcon}>🗺️</Text>
            <Text style={styles.actionLabel}>Haritada Göster</Text>
          </TouchableOpacity>
          {e.tel ? (
            <TouchableOpacity style={styles.actionBtn} onPress={callPhone}>
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionLabel}>Ara</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Genel Bilgiler</Text>
        <InfoRow icon="📍" label="Adres" value={e.adres} />
        <InfoRow icon="🏢" label="Kat" value={e.kat ? e.kat + ' kat' : null} />
        <InfoRow icon="⚙️" label="Tip" value={e.tip} />
        <InfoRow icon="👥" label="Kapasite" value={e.kapasite ? e.kapasite + ' kişi' : null} />
        <InfoRow icon="📅" label="Bakım Günü" value={e.bakimGunu ? 'Her ayın ' + e.bakimGunu + '. günü' : null} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Yönetici</Text>
        <InfoRow icon="👤" label="Ad" value={e.yonetici} />
        <InfoRow icon="📞" label="Telefon" value={e.tel} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Finansal</Text>
        <InfoRow icon="💰" label="Aylık Ücret" value={e.aylikUcret ? e.aylikUcret + ' ₺' : null} />
        <InfoRow icon="📊" label="KDV" value={e.kdv ? 'Dahil' : 'Hariç'} />
        <InfoRow icon="💳" label="Bakiye Devir" value={e.bakiyeDevir != null ? e.bakiyeDevir + ' ₺' : null} />
      </View>

      <View style={{ height: 40 }} />
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
  headerCard: {
    backgroundColor: '#1c1e2a',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  idBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#2a2d3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#007AFF',
  },
  flex1: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e0e6f0',
    marginBottom: 6,
  },
  ilceBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  ilceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2a2d3a',
    borderRadius: 12,
    padding: 12,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e0e6f0',
  },
  section: {
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  sectionTitle: {
    padding: 14,
    fontSize: 14,
    fontWeight: '700',
    color: '#e0e6f0',
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e2236',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e2236',
  },
  infoIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#e0e6f0',
    fontWeight: '500',
  },
});
