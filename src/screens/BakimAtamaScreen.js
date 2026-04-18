import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MONTHS, getIlceRenk } from '../utils/constants';
import { Empty } from '../components/UI';

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

function SectionHeader({ ilce, yapilan, toplam, collapsed, onToggle }) {
  const renk = getIlceRenk(ilce);
  const pct = toplam > 0 ? Math.round((yapilan / toplam) * 100) : 0;
  return (
    <TouchableOpacity
      style={styles.sectionHeader}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View style={[styles.sectionDot, { backgroundColor: renk }]} />
      <Text style={[styles.sectionTitle, { color: renk }]}>{ilce}</Text>
      <View style={styles.sectionProgress}>
        <View style={styles.sectionProgressBar}>
          <View
            style={[
              styles.sectionProgressFill,
              { width: pct + '%', backgroundColor: renk },
            ]}
          />
        </View>
      </View>
      <View style={[styles.sectionCount, { backgroundColor: renk + '20' }]}>
        <Text style={[styles.sectionCountText, { color: renk }]}>
          {yapilan}/{toplam}
        </Text>
      </View>
      <Text style={styles.sectionChevron}>{collapsed ? '›' : '⌄'}</Text>
    </TouchableOpacity>
  );
}

export default function BakimAtamaScreen({ data }) {
  const { elevs, maints, setMaints } = data;
  const [seciliAy, setSeciliAy] = useState(new Date().getMonth());
  const [seciliYil] = useState(new Date().getFullYear());
  const [filtre, setFiltre] = useState('hepsi');
  const [collapsed, setCollapsed] = useState({});

  const toggleSection = useCallback((ilce) => {
    setCollapsed((prev) => ({ ...prev, [ilce]: !prev[ilce] }));
  }, []);

  const ayBakimlari = useMemo(() => {
    return maints.filter((m) => {
      const d = new Date(m.tarih);
      return d.getMonth() === seciliAy && d.getFullYear() === seciliYil;
    });
  }, [maints, seciliAy, seciliYil]);

  const yapildiIds = useMemo(
    () => new Set(ayBakimlari.map((m) => m.asansorId)),
    [ayBakimlari],
  );

  const sections = useMemo(() => {
    let list = elevs.slice();
    if (filtre === 'yapildi') {
      list = list.filter((e) => yapildiIds.has(e.id));
    } else if (filtre === 'yapilmadi') {
      list = list.filter((e) => !yapildiIds.has(e.id));
    }

    const grouped = {};
    list.forEach((e) => {
      const ilce = e.ilce || 'Diğer';
      if (!grouped[ilce]) grouped[ilce] = { all: [], items: [] };
      grouped[ilce].items.push(e);
    });

    elevs.forEach((e) => {
      const ilce = e.ilce || 'Diğer';
      if (!grouped[ilce]) return;
      grouped[ilce].all.push(e);
    });

    return Object.keys(grouped)
      .sort()
      .map((ilce) => {
        const allIds = grouped[ilce].all.map((e) => e.id);
        const yapilan = allIds.filter((id) => yapildiIds.has(id)).length;
        const items = grouped[ilce].items.sort((a, b) => {
          const av = yapildiIds.has(a.id) ? 1 : 0;
          const bv = yapildiIds.has(b.id) ? 1 : 0;
          if (av !== bv) return av - bv;
          return (a.bakimGunu || 99) - (b.bakimGunu || 99);
        });
        return {
          ilce,
          yapilan,
          toplam: allIds.length,
          data: collapsed[ilce] ? [] : items,
        };
      });
  }, [elevs, filtre, yapildiIds, collapsed]);

  const bakimEkle = (elev) => {
    const yapildi = yapildiIds.has(elev.id);
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
                const d = new Date(m.tarih);
                return (
                  d.getMonth() !== seciliAy || d.getFullYear() !== seciliYil
                );
              }),
            );
          },
        },
      ]);
    } else {
      setMaints((p) => [
        ...p,
        {
          id: Date.now(),
          asansorId: elev.id,
          tarih: todayISO(),
          notlar: '',
        },
      ]);
    }
  };

  const ayDegistir = (dir) => {
    let y = seciliAy + dir;
    if (y < 0) y = 11;
    if (y > 11) y = 0;
    setSeciliAy(y);
  };

  const toplamYapilan = ayBakimlari.length;
  const tamamlananYuzde =
    elevs.length > 0 ? Math.round((toplamYapilan / elevs.length) * 100) : 0;

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

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: tamamlananYuzde + '%' }]}
          />
        </View>
        <Text style={styles.progressText}>
          {toplamYapilan}/{elevs.length} · %{tamamlananYuzde}
        </Text>
      </View>

      <View style={styles.filtreRow}>
        {[
          { k: 'hepsi', l: 'Hepsi' },
          { k: 'yapilmadi', l: 'Yapılmadı' },
          { k: 'yapildi', l: 'Yapıldı' },
        ].map((f) => (
          <TouchableOpacity
            key={f.k}
            style={[
              styles.filtreChip,
              filtre === f.k && styles.filtreChipActive,
            ]}
            onPress={() => setFiltre(f.k)}
          >
            <Text
              style={[
                styles.filtreText,
                filtre === f.k && styles.filtreTextActive,
              ]}
            >
              {f.l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderSectionHeader={({ section }) => (
          <SectionHeader
            ilce={section.ilce}
            yapilan={section.yapilan}
            toplam={section.toplam}
            collapsed={!!collapsed[section.ilce]}
            onToggle={() => toggleSection(section.ilce)}
          />
        )}
        renderItem={({ item }) => {
          const yapildi = yapildiIds.has(item.id);
          const renk = getIlceRenk(item.ilce);
          return (
            <TouchableOpacity
              style={[styles.card, yapildi && styles.cardDone]}
              onPress={() => bakimEkle(item)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.checkbox, yapildi && styles.checkboxDone]}
              >
                {yapildi ? (
                  <Text style={styles.checkmark}>✓</Text>
                ) : null}
              </View>
              <View style={styles.flex1}>
                <Text
                  style={[styles.cardTitle, yapildi && styles.textDone]}
                >
                  {item.ad}
                </Text>
                <View style={styles.cardMetaRow}>
                  <Text style={styles.metaText}>{item.semt}</Text>
                  {item.bakimGunu ? (
                    <Text style={styles.gunText}>
                      📅 {item.bakimGunu}. gün
                    </Text>
                  ) : null}
                </View>
              </View>
              <View style={[styles.sideDot, { backgroundColor: renk }]} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Empty text="Bu kriterlere uygun asansör yok" />}
        contentContainerStyle={styles.list}
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
  ayBtnText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '700',
  },
  ayText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#e0e6f0',
  },
  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#1c1e2a',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34c759',
  },
  progressText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'right',
    marginTop: 6,
  },
  filtreRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filtreChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1c1e2a',
    borderWidth: 0.5,
    borderColor: '#2a3050',
    alignItems: 'center',
  },
  filtreChipActive: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
  },
  filtreText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  filtreTextActive: {
    color: '#007AFF',
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
  },
  sectionProgress: {
    flex: 1,
    paddingHorizontal: 4,
  },
  sectionProgressBar: {
    height: 4,
    backgroundColor: '#2a2d3a',
    borderRadius: 2,
    overflow: 'hidden',
  },
  sectionProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  sectionCount: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  sectionCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  sectionChevron: {
    fontSize: 16,
    color: '#64748b',
    width: 20,
    textAlign: 'center',
  },
  list: {
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1e2a',
    borderRadius: 14,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 14,
    gap: 12,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  cardDone: {
    opacity: 0.5,
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
  checkboxDone: {
    backgroundColor: '#34c759',
    borderColor: '#34c759',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  flex1: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 4,
  },
  textDone: {
    textDecorationLine: 'line-through',
  },
  cardMetaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  gunText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  sideDot: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
});
