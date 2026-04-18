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
import { Empty } from '../components/UI';
import { getIlceRenk } from '../utils/constants';
import { buildMapsAddress } from '../utils/address';

export default function RotaScreen({ data, auth }) {
  const { elevs, faults } = data;
  const [seciliIds, setSeciliIds] = useState([]);
  const [acilanIlce, setAcilanIlce] = useState(null);

  const fIds = useMemo(
    () =>
      faults.filter((f) => f.durum !== 'Çözüldü').map((f) => f.asansorId),
    [faults],
  );

  const onerilen = useMemo(
    () => elevs.filter((e) => fIds.includes(e.id)),
    [elevs, fIds],
  );

  const ilceler = useMemo(() => {
    const grouped = {};
    elevs.forEach((e) => {
      const ilce = e.ilce || 'Diğer';
      if (!grouped[ilce]) grouped[ilce] = [];
      grouped[ilce].push(e);
    });
    return Object.keys(grouped)
      .sort()
      .map((ilce) => {
        const items = grouped[ilce];
        const secili = items.filter((e) => seciliIds.includes(e.id)).length;
        const arizali = items.filter((e) => fIds.includes(e.id)).length;
        return {
          ilce,
          items,
          toplam: items.length,
          secili,
          arizali,
        };
      });
  }, [elevs, seciliIds, fIds]);

  const ilceDetay = useMemo(() => {
    if (!acilanIlce) return null;
    return ilceler.find((x) => x.ilce === acilanIlce);
  }, [ilceler, acilanIlce]);

  const toggle = (id) => {
    setSeciliIds((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id],
    );
  };

  const toggleIlceTumu = (ilce) => {
    const ilceItems = elevs.filter((e) => (e.ilce || 'Diğer') === ilce);
    const tumSecili = ilceItems.every((e) => seciliIds.includes(e.id));
    if (tumSecili) {
      const ilceIds = new Set(ilceItems.map((e) => e.id));
      setSeciliIds((p) => p.filter((x) => !ilceIds.has(x)));
    } else {
      const yeniIds = ilceItems.map((e) => e.id);
      setSeciliIds((p) => [...new Set([...p, ...yeniIds])]);
    }
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

    seciliElevs.sort((a, b) => {
      const ai = a.ilce || '';
      const bi = b.ilce || '';
      if (ai !== bi) return ai.localeCompare(bi);
      return (a.semt || '').localeCompare(b.semt || '');
    });

    const adresler = seciliElevs.map(buildMapsAddress);
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

  if (acilanIlce && ilceDetay) {
    const renk = getIlceRenk(acilanIlce);
    const tumSecili = ilceDetay.items.every((e) =>
      seciliIds.includes(e.id),
    );
    return (
      <View style={styles.container}>
        <View style={styles.detayHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setAcilanIlce(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>‹ Geri</Text>
          </TouchableOpacity>
          <View style={styles.flex1}>
            <Text style={[styles.detayTitle, { color: renk }]}>
              {acilanIlce}
            </Text>
            <Text style={styles.detaySub}>
              {ilceDetay.secili}/{ilceDetay.toplam} seçili
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.tumuBtn, { backgroundColor: renk + '25' }]}
            onPress={() => toggleIlceTumu(acilanIlce)}
          >
            <Text style={[styles.tumuBtnText, { color: renk }]}>
              {tumSecili ? 'Temizle' : 'Tümü'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {ilceDetay.items.length === 0 ? (
            <Empty text="Bu ilçede asansör yok" />
          ) : (
            ilceDetay.items
              .slice()
              .sort((a, b) => (a.semt || '').localeCompare(b.semt || ''))
              .map((e) => {
                const secili = seciliIds.includes(e.id);
                const arizali = fIds.includes(e.id);
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
                      style={[styles.checkbox, secili && styles.checkboxDone]}
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
                      <Text style={styles.metaText} numberOfLines={1}>
                        {e.semt} · {e.adres}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
          )}
        </ScrollView>

        {seciliIds.length > 0 ? (
          <View style={styles.floatBar}>
            <Text style={styles.floatText}>
              {seciliIds.length} asansör seçili
            </Text>
            <TouchableOpacity style={styles.rotaBtn} onPress={acRota}>
              <Text style={styles.rotaBtnText}>🗺️ Rotayı Aç</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🗺️ Rota Planlama</Text>
        <Text style={styles.subtitle}>
          {seciliIds.length} asansör seçili · {elevs.length} toplam
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
              ⚠️ Arızalı ({onerilen.length})
            </Text>
          </TouchableOpacity>
        ) : null}
        {seciliIds.length > 0 ? (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#ff3b3020', flex: 0, paddingHorizontal: 14 }]}
            onPress={temizle}
          >
            <Text style={[styles.actionBtnText, { color: '#ff3b30' }]}>🗑️</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <Text style={styles.sectionLabel}>İLÇELER — bina seçmek için dokunun</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {ilceler.length === 0 ? (
          <Empty text="Asansör yok" />
        ) : (
          ilceler.map((g) => {
            const renk = getIlceRenk(g.ilce);
            const pct =
              g.toplam > 0 ? Math.round((g.secili / g.toplam) * 100) : 0;
            return (
              <TouchableOpacity
                key={g.ilce}
                style={styles.ilceCard}
                onPress={() => setAcilanIlce(g.ilce)}
                activeOpacity={0.7}
              >
                <View style={[styles.ilceBar, { backgroundColor: renk }]} />
                <View style={styles.flex1}>
                  <View style={styles.ilceTopRow}>
                    <Text style={[styles.ilceTitle, { color: renk }]}>
                      {g.ilce}
                    </Text>
                    <Text style={styles.ilceToplam}>{g.toplam} bina</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: pct + '%', backgroundColor: renk },
                      ]}
                    />
                  </View>
                  <View style={styles.ilceStatRow}>
                    <Text style={[styles.statChip, { color: '#007AFF' }]}>
                      ✓ {g.secili} seçili
                    </Text>
                    {g.arizali > 0 ? (
                      <Text style={[styles.statChip, { color: '#ff9500' }]}>
                        ⚠️ {g.arizali}
                      </Text>
                    ) : null}
                    <Text style={styles.yuzdeText}>%{pct}</Text>
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
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
  sectionLabel: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  list: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  ilceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1e2a',
    borderRadius: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#2a3050',
    overflow: 'hidden',
  },
  ilceBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  flex1: {
    flex: 1,
    padding: 12,
    paddingLeft: 8,
  },
  ilceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ilceTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  ilceToplam: {
    fontSize: 12,
    color: '#94a3b8',
  },
  progressBarBg: {
    height: 5,
    backgroundColor: '#2a2d3a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  ilceStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statChip: {
    fontSize: 12,
    fontWeight: '700',
  },
  yuzdeText: {
    marginLeft: 'auto',
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  chevron: {
    fontSize: 22,
    color: '#64748b',
    paddingRight: 12,
  },
  detayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e2236',
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backBtnText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '700',
  },
  detayTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  detaySub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  tumuBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tumuBtnText: {
    fontSize: 13,
    fontWeight: '800',
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
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  floatBar: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1e2a',
    borderRadius: 14,
    padding: 12,
    borderWidth: 0.5,
    borderColor: '#007AFF',
    gap: 10,
  },
  floatText: {
    flex: 1,
    color: '#e0e6f0',
    fontSize: 13,
    fontWeight: '700',
  },
  rotaBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  rotaBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
});
