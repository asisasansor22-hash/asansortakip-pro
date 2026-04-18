import React, { useMemo } from 'react';
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
  IlceBadge,
  PrimaryButton,
  Toggle,
} from '../components/UI';

function todayISO() {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function addressLabel(e) {
  return (
    (e.semt ? e.semt + ' Mahallesi, ' : '') +
    (e.adres || '') +
    (e.ilce ? ', ' + e.ilce + ', İstanbul' : '')
  );
}

export default function BakimciGorunumScreen({ data }) {
  const { elevs, faults, maints, setFaults, setMaints } = data;

  const now = new Date();
  const bulunanAy = now.getMonth();
  const bulunanYil = now.getFullYear();

  const atananArizalar = useMemo(() => {
    return faults.filter(
      (f) => f.bakimciAtandi && f.durum !== 'Çözüldü',
    );
  }, [faults]);

  const buAyBakimlar = useMemo(() => {
    return maints.filter((m) => {
      const d = new Date(m.tarih);
      return (
        d.getMonth() === bulunanAy && d.getFullYear() === bulunanYil
      );
    });
  }, [maints, bulunanAy, bulunanYil]);

  const yapildiIds = new Set(buAyBakimlar.map((m) => m.asansorId));
  const bekleyenBakimlar = useMemo(() => {
    return elevs.filter((e) => !yapildiIds.has(e.id));
  }, [elevs, yapildiIds]);

  const bakimYap = (elev) => {
    Alert.alert(
      'Bakım Tamamla',
      `${elev.ad} bakımı yapıldı olarak işaretlensin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Evet',
          onPress: () => {
            setMaints((p) => [
              ...p,
              {
                id: Date.now(),
                asansorId: elev.id,
                tarih: todayISO(),
                notlar: '',
              },
            ]);
          },
        },
      ],
    );
  };

  const arizaCoz = (f) => {
    Alert.alert('Arıza Çözüldü mü?', f.aciklama, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Çözüldü',
        onPress: () => {
          setFaults((p) =>
            p.map((x) =>
              x.id === f.id
                ? { ...x, durum: 'Çözüldü', cozumTarih: todayISO() }
                : x,
            ),
          );
        },
      },
    ]);
  };

  const callPhone = (tel) => {
    if (tel) Linking.openURL('tel:' + tel);
  };

  const openMaps = (elev) => {
    const addr = encodeURIComponent(addressLabel(elev));
    Linking.openURL(
      'https://www.google.com/maps/search/?api=1&query=' + addr,
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>
            {atananArizalar.length}
          </Text>
          <Text style={styles.summaryLabel}>Açık Arıza</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
            {bekleyenBakimlar.length}
          </Text>
          <Text style={styles.summaryLabel}>Bekleyen Bakım</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryValue, { color: '#34c759' }]}>
            {buAyBakimlar.length}
          </Text>
          <Text style={styles.summaryLabel}>Bu Ay Yapılan</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>⚠️ Atanan Arızalar</Text>
      {atananArizalar.length === 0 ? (
        <Empty text="Atanmış arıza yok" />
      ) : (
        atananArizalar.map((f) => {
          const elev = elevs.find((e) => e.id === f.asansorId);
          return (
            <View key={f.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.flex1}>
                  <Text style={styles.aciklama}>{f.aciklama || '—'}</Text>
                  <Text style={styles.binaAd}>
                    {elev ? elev.ad : 'Bilinmiyor'}
                  </Text>
                  <View style={styles.metaRow}>
                    {elev ? <IlceBadge ilce={elev.ilce} /> : null}
                    <Text style={styles.metaText}>
                      {elev ? elev.semt : ''} · {f.tarih}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.actionRow}>
                {elev ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => openMaps(elev)}
                  >
                    <Text style={styles.actionText}>🗺️ Harita</Text>
                  </TouchableOpacity>
                ) : null}
                {elev && elev.tel ? (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => callPhone(elev.tel)}
                  >
                    <Text style={styles.actionText}>📞 Ara</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#34c75925' }]}
                  onPress={() => arizaCoz(f)}
                >
                  <Text style={[styles.actionText, { color: '#34c759' }]}>
                    ✓ Çözüldü
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
        🔧 Bekleyen Bakımlar
      </Text>
      {bekleyenBakimlar.length === 0 ? (
        <Empty text="Bu ayki tüm bakımlar tamamlandı" />
      ) : (
        bekleyenBakimlar.slice(0, 50).map((e) => (
          <TouchableOpacity
            key={e.id}
            style={styles.bakimCard}
            onPress={() => bakimYap(e)}
            activeOpacity={0.7}
          >
            <View style={styles.flex1}>
              <Text style={styles.binaAd}>{e.ad}</Text>
              <View style={styles.metaRow}>
                <IlceBadge ilce={e.ilce} />
                <Text style={styles.metaText}>{e.semt}</Text>
              </View>
            </View>
            <View style={styles.bakimActions}>
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={() => openMaps(e)}
              >
                <Text style={styles.smallBtnText}>🗺️</Text>
              </TouchableOpacity>
              {e.tel ? (
                <TouchableOpacity
                  style={styles.smallBtn}
                  onPress={() => callPhone(e.tel)}
                >
                  <Text style={styles.smallBtnText}>📞</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </TouchableOpacity>
        ))
      )}
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
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#1c1e2a',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#1c1e2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#ef444466',
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  bakimCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1e2a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
    gap: 10,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  cardTop: {
    marginBottom: 10,
  },
  flex1: {
    flex: 1,
  },
  aciklama: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 4,
  },
  binaAd: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e0e6f0',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#2a2d3a',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    color: '#e0e6f0',
    fontWeight: '600',
  },
  bakimActions: {
    flexDirection: 'row',
    gap: 6,
  },
  smallBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2a2d3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnText: {
    fontSize: 14,
  },
});
