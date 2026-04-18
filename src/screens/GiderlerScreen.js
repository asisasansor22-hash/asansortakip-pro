import React, { useState, useMemo } from 'react';
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

function fmtPara(n) {
  return (Number(n) || 0).toLocaleString('tr-TR') + ' ₺';
}

export default function GiderlerScreen({ data }) {
  const { giderler, setGiderler } = data;
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({
    tarih: todayISO(),
    aciklama: '',
    tutar: '',
  });

  const toplam = useMemo(
    () => giderler.reduce((a, g) => a + (Number(g.tutar) || 0), 0),
    [giderler],
  );

  const buHaftaToplam = useMemo(() => {
    const now = new Date();
    const haftaBasi = new Date(now);
    haftaBasi.setDate(now.getDate() - now.getDay());
    haftaBasi.setHours(0, 0, 0, 0);
    return giderler
      .filter((g) => new Date(g.tarih) >= haftaBasi)
      .reduce((a, g) => a + (Number(g.tutar) || 0), 0);
  }, [giderler]);

  const buAyToplam = useMemo(() => {
    const now = new Date();
    const ayBasi = new Date(now.getFullYear(), now.getMonth(), 1);
    return giderler
      .filter((g) => new Date(g.tarih) >= ayBasi)
      .reduce((a, g) => a + (Number(g.tutar) || 0), 0);
  }, [giderler]);

  const save = () => {
    if (!form.aciklama.trim() || !form.tutar) {
      Alert.alert('Eksik Bilgi', 'Açıklama ve tutar zorunlu.');
      return;
    }
    setGiderler((p) => [
      ...p,
      {
        id: Date.now(),
        tarih: form.tarih,
        aciklama: form.aciklama.trim(),
        tutar: Number(form.tutar),
      },
    ]);
    setForm({ tarih: todayISO(), aciklama: '', tutar: '' });
    setModalVisible(false);
  };

  const sil = (id) => {
    Alert.alert('Gider Silinsin mi?', '', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => setGiderler((p) => p.filter((g) => g.id !== id)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>💸 Giderler</Text>
        <PrimaryButton
          label="+ Ekle"
          onPress={() => {
            setForm({ tarih: todayISO(), aciklama: '', tutar: '' });
            setModalVisible(true);
          }}
          color="#ff3b30"
          style={{ paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 }}
        />
      </View>

      <View style={styles.totalsRow}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Bu Hafta</Text>
          <Text style={styles.totalValue}>{fmtPara(buHaftaToplam)}</Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Bu Ay</Text>
          <Text style={styles.totalValue}>{fmtPara(buAyToplam)}</Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Toplam</Text>
          <Text style={styles.totalValue}>{fmtPara(toplam)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {giderler.length === 0 ? (
          <Empty text="Henüz gider yok" />
        ) : (
          [...giderler]
            .sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)))
            .map((g) => (
              <TouchableOpacity
                key={g.id}
                style={styles.card}
                onLongPress={() => sil(g.id)}
                activeOpacity={0.8}
              >
                <View style={styles.flex1}>
                  <Text style={styles.cardAciklama}>{g.aciklama}</Text>
                  <Text style={styles.cardDate}>{g.tarih}</Text>
                </View>
                <Text style={styles.tutar}>-{fmtPara(g.tutar)}</Text>
              </TouchableOpacity>
            ))
        )}
        <Text style={styles.hint}>💡 Silmek için uzun basın</Text>
      </ScrollView>

      <SheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={save}
        title="Gider Ekle"
      >
        <Field label="Açıklama">
          <Input
            value={form.aciklama}
            onChangeText={(t) => setForm({ ...form, aciklama: t })}
            placeholder="Örn: Malzeme alımı"
          />
        </Field>
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
  totalsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  totalBox: {
    flex: 1,
    backgroundColor: '#1c1e2a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  totalLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ff3b30',
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
  cardAciklama: {
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
    color: '#ff3b30',
  },
  hint: {
    marginTop: 10,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 11,
  },
});
