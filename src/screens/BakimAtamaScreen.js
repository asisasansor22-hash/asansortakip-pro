import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MONTHS, getIlceRenk } from '../utils/constants';
import { Empty, PrimaryButton } from '../components/UI';

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

export default function BakimAtamaScreen({ data }) {
  const { elevs, maints, setMaints, bakimcilar } = data;
  const [seciliAy, setSeciliAy] = useState(new Date().getMonth());
  const [seciliYil] = useState(new Date().getFullYear());
  const [filtre, setFiltre] = useState('hepsi'); // hepsi | yapildi | yapilmadi

  const ayBakimlari = useMemo(() => {
    return maints.filter((m) => {
      const d = new Date(m.tarih);
      return (
        d.getMonth() === seciliAy && d.getFullYear() === seciliYil
      );
    });
  }, [maints, seciliAy, seciliYil]);

  const yapildiIds = new Set(ayBakimlari.map((m) => m.asansorId));

  const filtrelenmisAsansorler = useMemo(() => {
    let list = elevs.slice();
    if (filtre === 'yapildi') {
      list = list.filter((e) => yapildiIds.has(e.id));
    } else if (filtre === 'yapilmadi') {
      list = list.filter((e) => !yapildiIds.has(e.id));
    }
    return list.sort((a, b) => {
      const ay = String(a.bakimGunu || 99).padStart(2, '0');
      const by = String(b.bakimGunu || 99).padStart(2, '0');
      return ay.localeCompare(by);
    });
  }, [elevs, filtre, yapildiIds]);

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
                  d.getMonth() !== seciliAy ||
                  d.getFullYear() !== seciliYil
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

  const tamamlananYuzde =
    elevs.length > 0
      ? Math.round((ayBakimlari.length / elevs.length) * 100)
      : 0;

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
            style={[
              styles.progressFill,
              { width: tamamlananYuzde + '%' },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {ayBakimlari.length}/{elevs.length} · %{tamamlananYuzde}
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

      <ScrollView contentContainerStyle={styles.list}>
        {filtrelenmisAsansorler.length === 0 ? (
          <Empty text="Bu kriterlere uygun asansör yok" />
        ) : (
          filtrelenmisAsansorler.map((e) => {
            const yapildi = yapildiIds.has(e.id);
            const renk = getIlceRenk(e.ilce);
            return (
              <TouchableOpacity
                key={e.id}
                style={[
                  styles.card,
                  yapildi && styles.cardDone,
                ]}
                onPress={() => bakimEkle(e)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.checkbox,
                    yapildi && styles.checkboxDone,
                  ]}
                >
                  {yapildi ? (
                    <Text style={styles.checkmark}>✓</Text>
                  ) : null}
                </View>
                <View style={styles.flex1}>
                  <Text
                    style={[
                      styles.cardTitle,
                      yapildi && styles.textDone,
                    ]}
                  >
                    {e.ad}
                  </Text>
                  <View style={styles.cardMetaRow}>
                    <View
                      style={[
                        styles.ilceBadge,
                        { backgroundColor: renk + '20' },
                      ]}
                    >
                      <Text style={[styles.ilceText, { color: renk }]}>
                        {e.ilce}
                      </Text>
                    </View>
                    <Text style={styles.metaText}>{e.semt}</Text>
                    {e.bakimGunu ? (
                      <Text style={styles.gunText}>
                        📅 {e.bakimGunu}. gün
                      </Text>
                    ) : null}
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
  list: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1e2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
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
  ilceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  ilceText: {
    fontSize: 11,
    fontWeight: '600',
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
});
