import React, { useState } from 'react';
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
  IconButton,
} from '../components/UI';

const RENKLER = [
  '#3b82f6',
  '#34c759',
  '#ff9500',
  '#ff3b30',
  '#af52de',
  '#00c7be',
  '#ffcc00',
  '#5856d6',
];

export default function BakimciYonetimScreen({ data }) {
  const { bakimcilar, setBakimcilar } = data;
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    ad: '',
    telefon: '',
    sifre: '',
    renk: RENKLER[0],
  });

  const openAdd = () => {
    setEditing(null);
    setForm({ ad: '', telefon: '', sifre: '', renk: RENKLER[0] });
    setModalVisible(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({
      ad: b.ad || '',
      telefon: b.telefon || '',
      sifre: b.sifre || '',
      renk: b.renk || RENKLER[0],
    });
    setModalVisible(true);
  };

  const save = () => {
    if (!form.ad.trim()) {
      Alert.alert('Eksik Bilgi', 'Ad zorunlu.');
      return;
    }
    const dataObj = {
      ad: form.ad.trim(),
      telefon: form.telefon.trim(),
      sifre: form.sifre.trim(),
      renk: form.renk,
    };
    if (editing) {
      setBakimcilar((p) =>
        p.map((x) => (x.id === editing.id ? { ...x, ...dataObj } : x)),
      );
    } else {
      setBakimcilar((p) => [...p, { id: Date.now(), ...dataObj }]);
    }
    setModalVisible(false);
  };

  const sil = (id) => {
    Alert.alert('Bakımcı Silinsin mi?', '', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => setBakimcilar((p) => p.filter((b) => b.id !== id)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👥 Bakımcılar</Text>
        <PrimaryButton
          label="+ Ekle"
          onPress={openAdd}
          style={{ paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {bakimcilar.length === 0 ? (
          <Empty text="Henüz bakımcı yok" />
        ) : (
          bakimcilar.map((b) => (
            <View key={b.id} style={styles.card}>
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
              <View style={styles.flex1}>
                <Text style={styles.cardTitle}>{b.ad}</Text>
                <Text style={styles.cardSub}>
                  {b.telefon || 'Telefon yok'} ·{' '}
                  {b.sifre ? '🔒 Şifreli' : '🔓 Şifresiz'}
                </Text>
              </View>
              <IconButton icon="✏️" onPress={() => openEdit(b)} />
              <IconButton icon="🗑️" danger onPress={() => sil(b.id)} />
            </View>
          ))
        )}
      </ScrollView>

      <SheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={save}
        title={editing ? 'Düzenle' : 'Bakımcı Ekle'}
      >
        <Field label="Ad Soyad">
          <Input
            value={form.ad}
            onChangeText={(t) => setForm({ ...form, ad: t })}
            placeholder="Örn: Ahmet Yılmaz"
          />
        </Field>
        <Field label="Telefon">
          <Input
            value={form.telefon}
            onChangeText={(t) => setForm({ ...form, telefon: t })}
            placeholder="05XX XXX XX XX"
            keyboardType="phone-pad"
          />
        </Field>
        <Field label="Şifre (opsiyonel)">
          <Input
            value={form.sifre}
            onChangeText={(t) => setForm({ ...form, sifre: t })}
            placeholder="Boş bırakılırsa şifresiz giriş"
          />
        </Field>
        <Field label="Renk">
          <View style={styles.renkRow}>
            {RENKLER.map((r) => (
              <TouchableOpacity
                key={r}
                style={[
                  styles.renkDot,
                  { backgroundColor: r },
                  form.renk === r && styles.renkDotActive,
                ]}
                onPress={() => setForm({ ...form, renk: r })}
              />
            ))}
          </View>
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  flex1: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 12,
    color: '#94a3b8',
  },
  renkRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  renkDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  renkDotActive: {
    borderColor: '#e0e6f0',
  },
});
