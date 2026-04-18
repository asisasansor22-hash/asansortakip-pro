import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Empty, IlceBadge, Input, Field } from '../components/UI';

function fmtPara(n) {
  return (Number(n) || 0).toLocaleString('tr-TR') + ' ₺';
}

export default function YoneticiPortaliScreen({ data }) {
  const { elevs, maints, faults, sonOdemeler } = data;
  const [arama, setArama] = useState('');
  const [secili, setSecili] = useState(null);

  const filtreliElevs = useMemo(() => {
    if (!arama.trim()) return elevs.slice(0, 30);
    const q = arama.toLowerCase();
    return elevs.filter(
      (e) =>
        (e.ad || '').toLowerCase().includes(q) ||
        (e.yonetici || '').toLowerCase().includes(q) ||
        (e.ilce || '').toLowerCase().includes(q),
    );
  }, [elevs, arama]);

  const binaBakimlari = useMemo(() => {
    if (!secili) return [];
    return maints
      .filter((m) => m.asansorId === secili.id)
      .sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)));
  }, [maints, secili]);

  const binaArizalari = useMemo(() => {
    if (!secili) return [];
    return faults
      .filter((f) => f.asansorId === secili.id)
      .sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)));
  }, [faults, secili]);

  const binaOdemeleri = useMemo(() => {
    if (!secili) return [];
    return sonOdemeler
      .filter((o) => o.asansorId === secili.id)
      .sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)));
  }, [sonOdemeler, secili]);

  const toplamOdeme = binaOdemeleri.reduce(
    (a, o) => a + (Number(o.tutar) || 0),
    0,
  );

  const callPhone = (tel) => {
    if (tel) Linking.openURL('tel:' + tel);
  };

  if (secili) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.detailContent}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setSecili(null)}
        >
          <Text style={styles.backBtnText}>← Geri</Text>
        </TouchableOpacity>

        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>{secili.ad}</Text>
          <View style={styles.row}>
            <IlceBadge ilce={secili.ilce} />
            <Text style={styles.detailSubtitle}>{secili.semt}</Text>
          </View>
          <Text style={styles.detailAddress}>{secili.adres}</Text>
        </View>

        <View style={styles.summarySection}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Bakım Sayısı</Text>
            <Text style={styles.summaryValue}>{binaBakimlari.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Arıza Sayısı</Text>
            <Text style={styles.summaryValue}>{binaArizalari.length}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Toplam Ödeme</Text>
            <Text style={[styles.summaryValue, { color: '#34c759' }]}>
              {fmtPara(toplamOdeme)}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Yönetici</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Ad</Text>
            <Text style={styles.infoValue}>{secili.yonetici || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Telefon</Text>
            <View style={styles.row}>
              <Text style={styles.infoValue}>{secili.tel || '—'}</Text>
              {secili.tel ? (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => callPhone(secili.tel)}
                >
                  <Text style={styles.callBtnText}>📞 Ara</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {binaArizalari.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Arıza Geçmişi</Text>
            {binaArizalari.slice(0, 10).map((f) => (
              <View key={f.id} style={styles.histRow}>
                <View style={styles.flex1}>
                  <Text style={styles.histText}>{f.aciklama}</Text>
                  <Text style={styles.histDate}>{f.tarih}</Text>
                </View>
                <Text
                  style={[
                    styles.histStatus,
                    {
                      color: f.durum === 'Çözüldü' ? '#34c759' : '#f59e0b',
                    },
                  ]}
                >
                  {f.durum}
                </Text>
              </View>
            ))}
          </View>
        )}

        {binaBakimlari.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Bakım Geçmişi</Text>
            {binaBakimlari.slice(0, 12).map((m) => (
              <View key={m.id} style={styles.histRow}>
                <Text style={styles.histDate}>{m.tarih}</Text>
                {m.notlar ? (
                  <Text style={styles.histText}>{m.notlar}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}

        {binaOdemeleri.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Ödeme Geçmişi</Text>
            {binaOdemeleri.slice(0, 12).map((o) => (
              <View key={o.id} style={styles.histRow}>
                <Text style={styles.histDate}>{o.tarih}</Text>
                <Text style={[styles.histText, { color: '#34c759' }]}>
                  {fmtPara(o.tutar)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🏢 Bina Portali</Text>
      </View>

      <Field label="Bina veya Yönetici Ara">
        <Input
          value={arama}
          onChangeText={setArama}
          placeholder="Ad, yönetici veya ilçe"
          style={{ marginHorizontal: 16 }}
        />
      </Field>

      <ScrollView contentContainerStyle={styles.list}>
        {filtreliElevs.length === 0 ? (
          <Empty text="Asansör bulunamadı" />
        ) : (
          filtreliElevs.map((e) => (
            <TouchableOpacity
              key={e.id}
              style={styles.card}
              onPress={() => setSecili(e)}
              activeOpacity={0.7}
            >
              <View style={styles.flex1}>
                <Text style={styles.cardTitle}>{e.ad}</Text>
                <Text style={styles.cardSub}>
                  👤 {e.yonetici || 'Yönetici bilgisi yok'}
                </Text>
                <View style={styles.metaRow}>
                  <IlceBadge ilce={e.ilce} />
                  <Text style={styles.metaText}>{e.semt}</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
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
  flex1: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  chevron: {
    fontSize: 22,
    color: '#64748b',
  },
  detailContent: {
    padding: 16,
    paddingBottom: 40,
  },
  backBtn: {
    marginBottom: 12,
  },
  backBtnText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '600',
  },
  detailHeader: {
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e0e6f0',
    marginBottom: 8,
  },
  detailSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  detailAddress: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  summarySection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: '#1c1e2a',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e0e6f0',
  },
  section: {
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a3050',
  },
  infoLabel: {
    width: 70,
    fontSize: 13,
    color: '#94a3b8',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#e0e6f0',
    fontWeight: '500',
  },
  callBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#34c75925',
  },
  callBtnText: {
    color: '#34c759',
    fontSize: 12,
    fontWeight: '700',
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2a3050',
  },
  histDate: {
    fontSize: 12,
    color: '#64748b',
    minWidth: 90,
  },
  histText: {
    flex: 1,
    fontSize: 13,
    color: '#e0e6f0',
  },
  histStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
});
