import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Empty,
  SheetModal,
  Field,
  Input,
  PrimaryButton,
  StatGrid,
} from '../components/UI';
import { MONTHS } from '../utils/constants';

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

function fmtPara(n) {
  const x = Number(n) || 0;
  return x.toLocaleString('tr-TR') + ' ₺';
}

export default function FinansScreen({ data }) {
  const { elevs, sonOdemeler, setSonOdemeler, aylikKapamalar } = data;
  const [odemeModal, setOdemeModal] = useState(false);
  const [form, setForm] = useState({
    asansorId: '',
    tutar: '',
    tarih: todayISO(),
  });
  const [arama, setArama] = useState('');

  const now = new Date();
  const bulunanAy = now.getMonth();
  const bulunanYil = now.getFullYear();

  const buAyOdemeler = useMemo(() => {
    return sonOdemeler.filter((o) => {
      const d = new Date(o.tarih);
      return d.getMonth() === bulunanAy && d.getFullYear() === bulunanYil;
    });
  }, [sonOdemeler, bulunanAy, bulunanYil]);

  const toplam = buAyOdemeler.reduce((a, o) => a + (Number(o.tutar) || 0), 0);
  const beklenenToplam = elevs.reduce(
    (a, e) => a + (Number(e.aylikUcret) || 0),
    0,
  );
  const bakiyeDevir = elevs.reduce(
    (a, e) => a + (Number(e.bakiyeDevir) || 0),
    0,
  );

  const stats = [
    { label: 'Tahsil Edilen', value: fmtPara(toplam), color: '#34c759' },
    { label: 'Beklenen', value: fmtPara(beklenenToplam), color: '#007AFF' },
    { label: 'Bakiye', value: fmtPara(bakiyeDevir), color: '#ff9500' },
    {
      label: 'Ödeme Sayısı',
      value: String(buAyOdemeler.length),
      color: '#8b5cf6',
    },
  ];

  const filtreliAsansor = useMemo(() => {
    if (!arama.trim()) return elevs.slice(0, 30);
    const q = arama.toLowerCase();
    return elevs
      .filter(
        (e) =>
          (e.ad || '').toLowerCase().includes(q) ||
          (e.ilce || '').toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [elevs, arama]);

  const save = () => {
    if (!form.asansorId || !form.tutar) {
      Alert.alert('Eksik Bilgi', 'Asansör ve tutar zorunlu.');
      return;
    }
    setSonOdemeler((p) => [
      ...p,
      {
        id: Date.now(),
        asansorId: Number(form.asansorId),
        tutar: Number(form.tutar),
        tarih: form.tarih,
      },
    ]);
    setForm({ asansorId: '', tutar: '', tarih: todayISO() });
    setOdemeModal(false);
  };

  const sil = (id) => {
    Alert.alert('Ödeme Silinsin mi?', '', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => setSonOdemeler((p) => p.filter((o) => o.id !== id)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          💰 {MONTHS[bulunanAy]} Finans
        </Text>
        <PrimaryButton
          label="+ Ödeme"
          onPress={() => {
            setForm({ asansorId: '', tutar: '', tarih: todayISO() });
            setArama('');
            setOdemeModal(true);
          }}
          color="#34c759"
          style={{ paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 }}
        />
      </View>

      <View style={styles.statContainer}>
        <StatGrid items={stats} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Son Ödemeler</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {sonOdemeler.length === 0 ? (
          <Empty text="Henüz ödeme yok" />
        ) : (
          [...sonOdemeler]
            .sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)))
            .map((o) => {
              const elev = elevs.find((e) => e.id === o.asansorId);
              return (
                <TouchableOpacity
                  key={o.id}
                  style={styles.card}
                  onLongPress={() => sil(o.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.flex1}>
                    <Text style={styles.cardTitle}>
                      {elev ? elev.ad : 'Bilinmiyor'}
                    </Text>
                    <Text style={styles.cardDate}>{o.tarih}</Text>
                  </View>
                  <Text style={styles.tutar}>{fmtPara(o.tutar)}</Text>
                </TouchableOpacity>
              );
            })
        )}
        <Text style={styles.hint}>💡 Silmek için uzun basın</Text>
      </ScrollView>

      <SheetModal
        visible={odemeModal}
        onClose={() => setOdemeModal(false)}
        onSave={save}
        title="Ödeme Ekle"
      >
        <Field label="Asansör Ara">
          <Input
            value={arama}
            onChangeText={setArama}
            placeholder="Bina adı"
          />
        </Field>
        {!form.asansorId ? (
          <View style={{ maxHeight: 250, marginBottom: 12 }}>
            {filtreliAsansor.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={styles.asansorItem}
                onPress={() =>
                  setForm({
                    ...form,
                    asansorId: String(e.id),
                    tutar: String(e.aylikUcret || ''),
                  })
                }
              >
                <Text style={styles.asansorItemText}>{e.ad}</Text>
                <Text style={styles.asansorItemSub}>
                  {e.ilce} · {fmtPara(e.aylikUcret || 0)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.selectedBox}>
            <Text style={styles.selectedLabel}>Seçilen:</Text>
            <Text style={styles.selectedName}>
              {(elevs.find((e) => e.id === Number(form.asansorId)) || {}).ad ||
                '—'}
            </Text>
            <TouchableOpacity
              onPress={() => setForm({ ...form, asansorId: '', tutar: '' })}
            >
              <Text style={styles.changeBtn}>Değiştir</Text>
            </TouchableOpacity>
          </View>
        )}
        <Field label="Tutar (₺)">
          <Input
            value={String(form.tutar)}
            onChangeText={(t) => setForm({ ...form, tutar: t })}
            placeholder="0"
            keyboardType="numeric"
          />
        </Field>
        <Field label="Tarih">
          <Input
            value={form.tarih}
            onChangeText={(t) => setForm({ ...form, tarih: t })}
            placeholder="YYYY-MM-DD"
          />
        </Field>
      </SheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#e0e6f0',
  },
  statContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    padding: 14,
    marginBottom: 6,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  flex1: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e0e6f0',
  },
  cardDate: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  tutar: {
    fontSize: 15,
    fontWeight: '800',
    color: '#34c759',
  },
  hint: {
    marginTop: 10,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 11,
  },
  asansorItem: {
    padding: 12,
    backgroundColor: '#2a2d3a',
    borderRadius: 10,
    marginBottom: 6,
  },
  asansorItemText: {
    color: '#e0e6f0',
    fontSize: 14,
    fontWeight: '600',
  },
  asansorItemSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  selectedBox: {
    padding: 12,
    backgroundColor: '#34c75915',
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#34c75944',
  },
  selectedLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  selectedName: {
    fontSize: 15,
    color: '#e0e6f0',
    fontWeight: '700',
    marginVertical: 4,
  },
  changeBtn: {
    fontSize: 12,
    color: '#34c759',
    fontWeight: '600',
  },
});
