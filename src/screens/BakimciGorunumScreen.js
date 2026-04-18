import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Empty, IlceBadge } from '../components/UI';
import { MONTHS, getIlceRenk } from '../utils/constants';
import { buildMapsAddress } from '../utils/address';

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

function ayYilStr(ay, yil) {
  return yil + '-' + String(ay + 1).padStart(2, '0');
}

function matchesAyYil(m, ay, yil) {
  if (m.atamaAyYil) return m.atamaAyYil === ayYilStr(ay, yil);
  if (m.tarih) {
    const d = new Date(m.tarih);
    return d.getMonth() === ay && d.getFullYear() === yil;
  }
  return false;
}

export default function BakimciGorunumScreen({ data, auth }) {
  const { elevs, faults, maints, setFaults, setMaints } = data;
  const bakimciId = auth?.aktifBakimci?.id || null;

  const now = new Date();
  const ay = now.getMonth();
  const yil = now.getFullYear();
  const [sekme, setSekme] = useState('bakim');

  const atananArizalar = useMemo(() => {
    return faults.filter((f) => {
      if (f.durum === 'Çözüldü') return false;
      if (!bakimciId) return !!f.bakimciAtandi;
      return f.bakimciId === bakimciId;
    });
  }, [faults, bakimciId]);

  const ayBakimlari = useMemo(
    () => maints.filter((m) => matchesAyYil(m, ay, yil)),
    [maints, ay, yil],
  );

  const yapilanMap = useMemo(() => {
    const m = new Map();
    ayBakimlari.forEach((b) => {
      if (b.durum !== 'atandi') m.set(b.asansorId, b);
    });
    return m;
  }, [ayBakimlari]);

  const benimAtamalarim = useMemo(() => {
    return ayBakimlari.filter(
      (m) =>
        m.durum === 'atandi' &&
        (bakimciId ? m.bakimciId === bakimciId : true) &&
        !yapilanMap.has(m.asansorId),
    );
  }, [ayBakimlari, yapilanMap, bakimciId]);

  const atananElevs = useMemo(() => {
    return benimAtamalarim
      .map((m) => elevs.find((e) => e.id === m.asansorId))
      .filter(Boolean);
  }, [benimAtamalarim, elevs]);

  const benimYaptiklarim = useMemo(() => {
    return ayBakimlari.filter(
      (m) =>
        m.durum !== 'atandi' &&
        (bakimciId ? m.bakimciId === bakimciId : true),
    );
  }, [ayBakimlari, bakimciId]);

  const ilceGruplari = useMemo(() => {
    const grouped = {};
    atananElevs.forEach((e) => {
      const ilce = e.ilce || 'Diğer';
      if (!grouped[ilce]) grouped[ilce] = [];
      grouped[ilce].push(e);
    });
    return Object.keys(grouped)
      .sort()
      .map((ilce) => ({ ilce, items: grouped[ilce] }));
  }, [atananElevs]);

  const bakimTamamla = (elev) => {
    Alert.alert(
      'Bakım Tamamla',
      `${elev.ad} için bakım yapıldı olarak işaretlensin mi?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Tamamla',
          onPress: () => {
            setMaints((p) => [
              ...p,
              {
                id: Date.now(),
                asansorId: elev.id,
                tarih: todayISO(),
                notlar: '',
                bakimciId: bakimciId || undefined,
              },
            ]);
          },
        },
      ],
    );
  };

  const arizaCoz = (f) => {
    Alert.alert('Arıza Çözüldü mü?', f.aciklama || '', [
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
    const addr = encodeURIComponent(buildMapsAddress(elev));
    Linking.openURL(
      'https://www.google.com/maps/search/?api=1&query=' + addr,
    );
  };

  const renderBakimSekmesi = () => (
    <>
      <View style={styles.summaryRow}>
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryValue, { color: '#007AFF' }]}>
            {atananElevs.length}
          </Text>
          <Text style={styles.summaryLabel}>Bana Atanan</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryValue, { color: '#34c759' }]}>
            {benimYaptiklarim.length}
          </Text>
          <Text style={styles.summaryLabel}>Bu Ay Yaptığım</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={[styles.summaryValue, { color: '#f59e0b' }]}>
            {ilceGruplari.length}
          </Text>
          <Text style={styles.summaryLabel}>İlçe</Text>
        </View>
      </View>

      <Text style={styles.ayBilgi}>
        📅 {MONTHS[ay]} {yil}
      </Text>

      <Text style={styles.sectionTitle}>🔧 Bekleyen Bakımlarım</Text>
      {atananElevs.length === 0 ? (
        <Empty text={bakimciId ? 'Size atanmış bakım yok' : 'Bu ay için atama yok'} />
      ) : (
        ilceGruplari.map((g) => {
          const renk = getIlceRenk(g.ilce);
          return (
            <View key={g.ilce} style={styles.ilceSection}>
              <View style={styles.ilceHeader}>
                <View style={[styles.ilceDot, { backgroundColor: renk }]} />
                <Text style={[styles.ilceTitle, { color: renk }]}>
                  {g.ilce}
                </Text>
                <View
                  style={[
                    styles.ilceCount,
                    { backgroundColor: renk + '20' },
                  ]}
                >
                  <Text style={[styles.ilceCountText, { color: renk }]}>
                    {g.items.length}
                  </Text>
                </View>
              </View>
              {g.items.map((e) => (
                <View key={e.id} style={styles.bakimCard}>
                  <View style={styles.flex1}>
                    <Text style={styles.binaAd} numberOfLines={1}>
                      {e.ad}
                    </Text>
                    <Text style={styles.metaText} numberOfLines={1}>
                      {e.semt} · {e.adres}
                    </Text>
                    {e.yonetici ? (
                      <Text style={styles.metaText} numberOfLines={1}>
                        👤 {e.yonetici}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.bakimActions}>
                    <TouchableOpacity
                      style={[styles.gitBtn, { backgroundColor: renk + '25' }]}
                      onPress={() => openMaps(e)}
                    >
                      <Text style={[styles.gitBtnText, { color: renk }]}>
                        🗺️ Git
                      </Text>
                    </TouchableOpacity>
                    {e.tel ? (
                      <TouchableOpacity
                        style={styles.smallBtn}
                        onPress={() => callPhone(e.tel)}
                      >
                        <Text style={styles.smallBtnText}>📞</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      style={styles.tamamBtn}
                      onPress={() => bakimTamamla(e)}
                    >
                      <Text style={styles.tamamBtnText}>✓</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })
      )}
    </>
  );

  const renderArizaSekmesi = () => (
    <>
      <Text style={[styles.sectionTitle, { marginTop: 4 }]}>
        ⚠️ Atanan Arızalar ({atananArizalar.length})
      </Text>
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
                    <Text style={styles.actionText}>🗺️ Git</Text>
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
    </>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabBtn, sekme === 'bakim' && styles.tabBtnActive]}
          onPress={() => setSekme('bakim')}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, sekme === 'bakim' && styles.tabTextActive]}
          >
            🔧 Bakım ({atananElevs.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, sekme === 'ariza' && styles.tabBtnActive]}
          onPress={() => setSekme('ariza')}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.tabText, sekme === 'ariza' && styles.tabTextActive]}
          >
            ⚠️ Arıza ({atananArizalar.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {sekme === 'bakim' ? renderBakimSekmesi() : renderArizaSekmesi()}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#151722',
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a3050',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#34c759',
  },
  tabText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#34c759',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  summaryBox: {
    flex: 1,
    backgroundColor: '#1c1e2a',
    borderRadius: 14,
    padding: 12,
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
  ayBilgi: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 10,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 10,
  },
  ilceSection: {
    marginBottom: 14,
  },
  ilceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  ilceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ilceTitle: {
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  ilceCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ilceCountText: {
    fontSize: 11,
    fontWeight: '800',
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
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 2,
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
    marginTop: 1,
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
    alignItems: 'center',
  },
  gitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  gitBtnText: {
    fontSize: 13,
    fontWeight: '800',
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
  tamamBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#34c75925',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tamamBtnText: {
    color: '#34c759',
    fontSize: 18,
    fontWeight: '900',
  },
});
