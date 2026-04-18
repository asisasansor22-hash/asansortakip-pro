import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MONTHS, getIlceRenk } from '../utils/constants';
import { Empty, SheetModal } from '../components/UI';

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

export default function BakimAtamaScreen({ data }) {
  const { elevs, maints, setMaints, bakimcilar } = data;
  const [seciliAy, setSeciliAy] = useState(new Date().getMonth());
  const [seciliYil] = useState(new Date().getFullYear());
  const [acilanIlce, setAcilanIlce] = useState(null);
  const [atamaElev, setAtamaElev] = useState(null);

  const ayBakimlari = useMemo(
    () => maints.filter((m) => matchesAyYil(m, seciliAy, seciliYil)),
    [maints, seciliAy, seciliYil],
  );

  const yapilanMap = useMemo(() => {
    const m = new Map();
    ayBakimlari.forEach((b) => {
      if (b.durum !== 'atandi') m.set(b.asansorId, b);
    });
    return m;
  }, [ayBakimlari]);

  const atananMap = useMemo(() => {
    const m = new Map();
    ayBakimlari.forEach((b) => {
      if (b.durum === 'atandi' && !yapilanMap.has(b.asansorId)) {
        m.set(b.asansorId, b);
      }
    });
    return m;
  }, [ayBakimlari, yapilanMap]);

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
        const yapilan = items.filter((e) => yapilanMap.has(e.id)).length;
        const atanan = items.filter((e) => atananMap.has(e.id)).length;
        return {
          ilce,
          items,
          toplam: items.length,
          yapilan,
          atanan,
          kalan: items.length - yapilan - atanan,
        };
      });
  }, [elevs, yapilanMap, atananMap]);

  const ilceDetay = useMemo(() => {
    if (!acilanIlce) return null;
    return ilceler.find((x) => x.ilce === acilanIlce);
  }, [ilceler, acilanIlce]);

  const ayDegistir = (dir) => {
    let y = seciliAy + dir;
    if (y < 0) y = 11;
    if (y > 11) y = 0;
    setSeciliAy(y);
  };

  const toplamYapilan = Array.from(yapilanMap.keys()).length;
  const toplamAtanan = Array.from(atananMap.keys()).length;

  const bakimciAta = (bakimci) => {
    if (!atamaElev) return;
    const elevId = atamaElev.id;
    const ayYil = ayYilStr(seciliAy, seciliYil);
    const mevcut = ayBakimlari.find(
      (m) => m.asansorId === elevId && m.durum === 'atandi',
    );
    if (mevcut) {
      setMaints((p) =>
        p.map((m) =>
          m.id === mevcut.id ? { ...m, bakimciId: bakimci.id } : m,
        ),
      );
    } else {
      setMaints((p) => [
        ...p,
        {
          id: Date.now(),
          asansorId: elevId,
          atamaAyYil: ayYil,
          bakimciId: bakimci.id,
          durum: 'atandi',
          atamaTarihi: todayISO(),
        },
      ]);
    }
    setAtamaElev(null);
  };

  const atamayiKaldir = () => {
    if (!atamaElev) return;
    const elevId = atamaElev.id;
    setMaints((p) =>
      p.filter((m) => {
        if (m.asansorId !== elevId) return true;
        if (m.durum !== 'atandi') return true;
        return !matchesAyYil(m, seciliAy, seciliYil);
      }),
    );
    setAtamaElev(null);
  };

  const bakimiYapildiIsaretle = (elev) => {
    const yapildi = yapilanMap.has(elev.id);
    if (yapildi) {
      Alert.alert('Bakım İptal', `${elev.ad} için bakım kaydı silinsin mi?`, [
        { text: 'Hayır', style: 'cancel' },
        {
          text: 'Evet, Sil',
          style: 'destructive',
          onPress: () => {
            setMaints((p) =>
              p.filter((m) => {
                if (m.asansorId !== elev.id) return true;
                if (m.durum === 'atandi') return true;
                return !matchesAyYil(m, seciliAy, seciliYil);
              }),
            );
          },
        },
      ]);
    } else {
      const atama = atananMap.get(elev.id);
      setMaints((p) => [
        ...p,
        {
          id: Date.now(),
          asansorId: elev.id,
          tarih: todayISO(),
          notlar: '',
          bakimciId: atama ? atama.bakimciId : undefined,
        },
      ]);
    }
  };

  const getBakimci = (id) =>
    (bakimcilar || []).find((b) => b.id === id) || null;

  if (acilanIlce && ilceDetay) {
    const renk = getIlceRenk(acilanIlce);
    const gunGruplari = {};
    ilceDetay.items.forEach((e) => {
      const gun = e.bakimGunu ? String(parseInt(e.bakimGunu, 10) || e.bakimGunu) : '—';
      if (!gunGruplari[gun]) gunGruplari[gun] = [];
      gunGruplari[gun].push(e);
    });
    const sirali = Object.keys(gunGruplari).sort((a, b) => {
      if (a === '—') return 1;
      if (b === '—') return -1;
      return parseInt(a, 10) - parseInt(b, 10);
    });
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
              {MONTHS[seciliAy]} {seciliYil} · {ilceDetay.yapilan}/{ilceDetay.toplam} yapıldı
            </Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.list}>
          {ilceDetay.items.length === 0 ? (
            <Empty text="Bu ilçede asansör yok" />
          ) : (
            sirali.map((gun) => {
              const items = gunGruplari[gun].slice().sort((a, b) => {
                const ay = yapilanMap.has(a.id) ? 2 : atananMap.has(a.id) ? 1 : 0;
                const by = yapilanMap.has(b.id) ? 2 : atananMap.has(b.id) ? 1 : 0;
                if (ay !== by) return ay - by;
                return (a.ad || '').localeCompare(b.ad || '');
              });
              const gunYapilan = items.filter((e) => yapilanMap.has(e.id)).length;
              return (
                <View key={gun} style={styles.gunGrup}>
                  <View style={[styles.gunHeader, { backgroundColor: renk + '15', borderColor: renk + '40' }]}>
                    <Text style={[styles.gunEmoji]}>📅</Text>
                    <Text style={[styles.gunTitle, { color: renk }]}>
                      {gun === '—' ? 'Bakım günü belirlenmemiş' : 'Her ayın ' + gun + '. günü'}
                    </Text>
                    <View style={[styles.gunCount, { backgroundColor: renk + '30' }]}>
                      <Text style={[styles.gunCountText, { color: renk }]}>
                        {gunYapilan}/{items.length}
                      </Text>
                    </View>
                  </View>
                  {items.map((e) => {
                    const yapildi = yapilanMap.has(e.id);
                    const atama = atananMap.get(e.id);
                    const bakimci = atama ? getBakimci(atama.bakimciId) : null;
                    return (
                      <View key={e.id} style={styles.card}>
                        <TouchableOpacity
                          style={[styles.checkbox, yapildi && styles.checkboxDone]}
                          onPress={() => bakimiYapildiIsaretle(e)}
                          activeOpacity={0.7}
                        >
                          {yapildi ? (
                            <Text style={styles.checkmark}>✓</Text>
                          ) : null}
                        </TouchableOpacity>
                        <View style={styles.flex1}>
                          <Text
                            style={[styles.cardTitle, yapildi && styles.textDone]}
                            numberOfLines={1}
                          >
                            {e.ad}
                          </Text>
                          <Text style={styles.metaText} numberOfLines={1}>
                            {e.semt}
                          </Text>
                          {bakimci ? (
                            <View style={styles.bakimciRow}>
                              <View
                                style={[
                                  styles.bakimciDot,
                                  { backgroundColor: bakimci.renk || '#007AFF' },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.bakimciAd,
                                  { color: bakimci.renk || '#007AFF' },
                                ]}
                              >
                                {bakimci.ad}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          style={[
                            styles.atamaBtn,
                            bakimci && {
                              backgroundColor: (bakimci.renk || '#007AFF') + '25',
                            },
                          ]}
                          onPress={() => setAtamaElev(e)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.atamaBtnText,
                              bakimci && { color: bakimci.renk || '#007AFF' },
                            ]}
                          >
                            {bakimci ? 'Değiştir' : '+ Ata'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              );
            })
          )}
        </ScrollView>

        <SheetModal
          visible={!!atamaElev}
          onClose={() => setAtamaElev(null)}
          title={atamaElev ? 'Bakımcı Ata: ' + atamaElev.ad : 'Bakımcı Ata'}
        >
          {(bakimcilar || []).length === 0 ? (
            <Empty text="Bakımcı kaydı yok. Bakımcılar ekranından ekleyin." />
          ) : (
            <View style={{ paddingBottom: 10 }}>
              {(bakimcilar || []).map((b) => {
                const seciliMi =
                  atamaElev && atananMap.get(atamaElev.id)?.bakimciId === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.bakimciSecenek,
                      seciliMi && {
                        backgroundColor: (b.renk || '#007AFF') + '20',
                        borderColor: b.renk || '#007AFF',
                      },
                    ]}
                    onPress={() => bakimciAta(b)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: b.renk || '#3b82f6' },
                      ]}
                    >
                      <Text style={styles.avatarText}>
                        {(b.ad || '?')[0].toUpperCase()}
                      </Text>
                    </View>
                    <Text style={styles.bakimciSecenekAd}>{b.ad}</Text>
                    {seciliMi ? (
                      <Text style={styles.seciliCheck}>✓</Text>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
              {atamaElev && atananMap.has(atamaElev.id) ? (
                <TouchableOpacity
                  style={styles.kaldirBtn}
                  onPress={atamayiKaldir}
                >
                  <Text style={styles.kaldirBtnText}>✕ Atamayı Kaldır</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </SheetModal>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.ayHeader}>
        <TouchableOpacity
          style={styles.ayBtn}
          onPress={() => ayDegistir(-1)}
        >
          <Text style={styles.ayBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.ayText}>
          {MONTHS[seciliAy]} {seciliYil}
        </Text>
        <TouchableOpacity
          style={styles.ayBtn}
          onPress={() => ayDegistir(1)}
        >
          <Text style={styles.ayBtnText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statRow}>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#34c759' }]}>
            {toplamYapilan}
          </Text>
          <Text style={styles.statLabel}>Yapılan</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#007AFF' }]}>
            {toplamAtanan}
          </Text>
          <Text style={styles.statLabel}>Atanan</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>
            {elevs.length - toplamYapilan - toplamAtanan}
          </Text>
          <Text style={styles.statLabel}>Kalan</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>İLÇELER — atama yapmak için seçin</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {ilceler.length === 0 ? (
          <Empty text="Asansör yok" />
        ) : (
          ilceler.map((g) => {
            const renk = getIlceRenk(g.ilce);
            const pct =
              g.toplam > 0 ? Math.round((g.yapilan / g.toplam) * 100) : 0;
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
                    <Text style={[styles.statChip, { color: '#34c759' }]}>
                      ✓ {g.yapilan}
                    </Text>
                    <Text style={[styles.statChip, { color: '#007AFF' }]}>
                      ◉ {g.atanan}
                    </Text>
                    <Text style={[styles.statChip, { color: '#94a3b8' }]}>
                      · {g.kalan}
                    </Text>
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
  container: { flex: 1, backgroundColor: '#0f1117' },
  ayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 16,
  },
  ayBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1c1e2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ayBtnText: { fontSize: 24, color: '#007AFF', fontWeight: '700' },
  ayText: { fontSize: 18, fontWeight: '800', color: '#e0e6f0' },
  statRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1c1e2a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  sectionLabel: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  list: { padding: 16, paddingTop: 4, paddingBottom: 40 },
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
  ilceBar: { width: 4, alignSelf: 'stretch' },
  flex1: { flex: 1, padding: 12, paddingLeft: 8 },
  ilceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ilceTitle: { fontSize: 16, fontWeight: '800' },
  ilceToplam: { fontSize: 12, color: '#94a3b8' },
  progressBarBg: {
    height: 5,
    backgroundColor: '#2a2d3a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 3 },
  ilceStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statChip: { fontSize: 12, fontWeight: '700' },
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
  backBtnText: { color: '#007AFF', fontSize: 15, fontWeight: '700' },
  detayTitle: { fontSize: 20, fontWeight: '800' },
  detaySub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  gunGrup: { marginBottom: 14 },
  gunHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 0.5,
    marginBottom: 6,
  },
  gunEmoji: { fontSize: 14 },
  gunTitle: { flex: 1, fontSize: 13, fontWeight: '800' },
  gunCount: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  gunCountText: { fontSize: 11, fontWeight: '800' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1e2a',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: { backgroundColor: '#34c759', borderColor: '#34c759' },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '900' },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e0e6f0',
  },
  textDone: { textDecorationLine: 'line-through', opacity: 0.5 },
  metaText: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  bakimciRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  bakimciDot: { width: 8, height: 8, borderRadius: 4 },
  bakimciAd: { fontSize: 12, fontWeight: '700' },
  atamaBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#2a2d3a',
  },
  atamaBtnText: { fontSize: 12, fontWeight: '700', color: '#94a3b8' },
  bakimciSecenek: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#2a3050',
    backgroundColor: '#1a1d28',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '900', color: '#fff' },
  bakimciSecenekAd: { flex: 1, fontSize: 15, color: '#e0e6f0', fontWeight: '700' },
  seciliCheck: { fontSize: 18, fontWeight: '900', color: '#34c759' },
  kaldirBtn: {
    marginTop: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#ff3b3015',
    alignItems: 'center',
  },
  kaldirBtnText: { color: '#ff3b30', fontWeight: '700', fontSize: 14 },
});
