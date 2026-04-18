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
  IlceBadge,
  IconButton,
  StatGrid,
} from '../components/UI';

function gunlerArasi(tarih) {
  if (!tarih) return null;
  const d1 = new Date(tarih);
  const d2 = new Date();
  return Math.ceil((d1 - d2) / (1000 * 60 * 60 * 24));
}

export default function SozlesmeYonetimiScreen({ data }) {
  const { elevs, sozlesmeler, setSozlesmeler } = data;
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    asansorId: '',
    baslangic: '',
    bitis: '',
    tutar: '',
    notlar: '',
  });
  const [arama, setArama] = useState('');

  const stats = useMemo(() => {
    const aktif = sozlesmeler.filter((s) => {
      const kalan = gunlerArasi(s.bitis);
      return kalan != null && kalan > 30;
    }).length;
    const bitecek = sozlesmeler.filter((s) => {
      const kalan = gunlerArasi(s.bitis);
      return kalan != null && kalan >= 0 && kalan <= 30;
    }).length;
    const bitti = sozlesmeler.filter((s) => {
      const kalan = gunlerArasi(s.bitis);
      return kalan != null && kalan < 0;
    }).length;
    return [
      { label: 'Toplam', value: String(sozlesmeler.length), color: '#64748b' },
      { label: 'Aktif', value: String(aktif), color: '#34c759' },
      { label: 'Yakında Bitecek', value: String(bitecek), color: '#f59e0b' },
      { label: 'Bitmiş', value: String(bitti), color: '#ef4444' },
    ];
  }, [sozlesmeler]);

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

  const openAdd = () => {
    setEditing(null);
    setForm({
      asansorId: '',
      baslangic: '',
      bitis: '',
      tutar: '',
      notlar: '',
    });
    setArama('');
    setModalVisible(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      asansorId: String(s.asansorId),
      baslangic: s.baslangic || '',
      bitis: s.bitis || '',
      tutar: String(s.tutar || ''),
      notlar: s.notlar || '',
    });
    setArama('');
    setModalVisible(true);
  };

  const save = () => {
    if (!form.asansorId || !form.baslangic || !form.bitis) {
      Alert.alert('Eksik Bilgi', 'Asansör ve tarihler zorunlu.');
      return;
    }
    const dataObj = {
      asansorId: Number(form.asansorId),
      baslangic: form.baslangic,
      bitis: form.bitis,
      tutar: Number(form.tutar) || 0,
      notlar: form.notlar,
    };
    if (editing) {
      setSozlesmeler((p) =>
        p.map((x) => (x.id === editing.id ? { ...x, ...dataObj } : x)),
      );
    } else {
      setSozlesmeler((p) => [...p, { id: Date.now(), ...dataObj }]);
    }
    setModalVisible(false);
  };

  const sil = (id) => {
    Alert.alert('Silinsin mi?', '', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => setSozlesmeler((p) => p.filter((x) => x.id !== id)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📄 Sözleşmeler</Text>
        <PrimaryButton
          label="+ Ekle"
          onPress={openAdd}
          style={{ paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 }}
        />
      </View>

      <View style={{ paddingHorizontal: 16 }}>
        <StatGrid items={stats} />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {sozlesmeler.length === 0 ? (
          <Empty text="Henüz sözleşme yok" />
        ) : (
          [...sozlesmeler]
            .sort((a, b) => {
              const ka = gunlerArasi(a.bitis) ?? 9999;
              const kb = gunlerArasi(b.bitis) ?? 9999;
              return ka - kb;
            })
            .map((s) => {
              const elev = elevs.find((e) => e.id === s.asansorId);
              const kalan = gunlerArasi(s.bitis);
              let renk = '#34c759';
              let statusText = 'Aktif';
              if (kalan != null) {
                if (kalan < 0) {
                  renk = '#ef4444';
                  statusText = Math.abs(kalan) + ' gün önce bitti';
                } else if (kalan <= 30) {
                  renk = '#f59e0b';
                  statusText = kalan + ' gün kaldı';
                } else {
                  statusText = kalan + ' gün kaldı';
                }
              }
              return (
                <View
                  key={s.id}
                  style={[styles.card, { borderLeftColor: renk }]}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.flex1}>
                      <Text style={styles.cardTitle}>
                        {elev ? elev.ad : 'Bilinmiyor'}
                      </Text>
                      <View style={styles.metaRow}>
                        {elev ? <IlceBadge ilce={elev.ilce} /> : null}
                      </View>
                      <Text style={styles.dateRange}>
                        {s.baslangic} → {s.bitis}
                      </Text>
                      <Text style={[styles.statusText, { color: renk }]}>
                        {statusText}
                      </Text>
                    </View>
                  </View>
                  {s.notlar ? (
                    <Text style={styles.notlar}>{s.notlar}</Text>
                  ) : null}
                  <View style={styles.bottomRow}>
                    {s.tutar ? (
                      <Text style={styles.tutar}>
                        {Number(s.tutar).toLocaleString('tr-TR')} ₺
                      </Text>
                    ) : null}
                    <View style={{ flex: 1 }} />
                    <IconButton icon="✏️" onPress={() => openEdit(s)} />
                    <IconButton icon="🗑️" danger onPress={() => sil(s.id)} />
                  </View>
                </View>
              );
            })
        )}
      </ScrollView>

      <SheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={save}
        title={editing ? 'Düzenle' : 'Sözleşme Ekle'}
      >
        {!editing && (
          <>
            <Field label="Asansör Ara">
              <Input
                value={arama}
                onChangeText={setArama}
                placeholder="Bina adı"
              />
            </Field>
            {!form.asansorId ? (
              <View style={{ maxHeight: 200, marginBottom: 12 }}>
                {filtreliAsansor.map((e) => (
                  <TouchableOpacity
                    key={e.id}
                    style={styles.asansorItem}
                    onPress={() =>
                      setForm({ ...form, asansorId: String(e.id) })
                    }
                  >
                    <Text style={styles.asansorItemText}>{e.ad}</Text>
                    <Text style={styles.asansorItemSub}>
                      {e.ilce} · {e.semt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.selectedBox}>
                <Text style={styles.selectedName}>
                  {(elevs.find((e) => e.id === Number(form.asansorId)) || {})
                    .ad || '—'}
                </Text>
                <TouchableOpacity
                  onPress={() => setForm({ ...form, asansorId: '' })}
                >
                  <Text style={styles.changeBtn}>Değiştir</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <Field label="Başlangıç">
          <Input
            value={form.baslangic}
            onChangeText={(t) => setForm({ ...form, baslangic: t })}
            placeholder="YYYY-MM-DD"
          />
        </Field>
        <Field label="Bitiş">
          <Input
            value={form.bitis}
            onChangeText={(t) => setForm({ ...form, bitis: t })}
            placeholder="YYYY-MM-DD"
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
        <Field label="Notlar">
          <Input
            value={form.notlar}
            onChangeText={(t) => setForm({ ...form, notlar: t })}
            placeholder="Ek notlar..."
            multiline
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
  list: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1c1e2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 0.5,
    borderColor: '#2a3050',
    borderLeftWidth: 3,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notlar: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  tutar: {
    fontSize: 14,
    fontWeight: '800',
    color: '#007AFF',
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
    backgroundColor: '#007AFF15',
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#007AFF44',
  },
  selectedName: {
    fontSize: 15,
    color: '#e0e6f0',
    fontWeight: '700',
    marginBottom: 4,
  },
  changeBtn: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
});
