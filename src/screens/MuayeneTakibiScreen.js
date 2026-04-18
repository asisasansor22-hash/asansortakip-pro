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

function gunlerArasi(tarih) {
  if (!tarih) return null;
  const d1 = new Date(tarih);
  const d2 = new Date();
  return Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
}

export default function MuayeneTakibiScreen({ data }) {
  const { elevs, muayeneler, setMuayeneler } = data;
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    asansorId: '',
    sonMuayene: todayISO(),
    muayeneTuru: 'Yıllık',
    sonuc: 'Yeşil',
    notlar: '',
  });
  const [arama, setArama] = useState('');

  const stats = useMemo(() => {
    const yesil = muayeneler.filter((m) => m.sonuc === 'Yeşil').length;
    const sari = muayeneler.filter((m) => m.sonuc === 'Sarı').length;
    const kirmizi = muayeneler.filter((m) => m.sonuc === 'Kırmızı').length;
    return [
      { label: 'Toplam', value: String(muayeneler.length), color: '#64748b' },
      { label: 'Yeşil', value: String(yesil), color: '#34c759' },
      { label: 'Sarı', value: String(sari), color: '#f59e0b' },
      { label: 'Kırmızı', value: String(kirmizi), color: '#ef4444' },
    ];
  }, [muayeneler]);

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
      sonMuayene: todayISO(),
      muayeneTuru: 'Yıllık',
      sonuc: 'Yeşil',
      notlar: '',
    });
    setArama('');
    setModalVisible(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setForm({
      asansorId: String(m.asansorId),
      sonMuayene: m.sonMuayene || todayISO(),
      muayeneTuru: m.muayeneTuru || 'Yıllık',
      sonuc: m.sonuc || 'Yeşil',
      notlar: m.notlar || '',
    });
    setArama('');
    setModalVisible(true);
  };

  const save = () => {
    if (!form.asansorId) {
      Alert.alert('Eksik Bilgi', 'Asansör zorunlu.');
      return;
    }
    const dataObj = {
      asansorId: Number(form.asansorId),
      sonMuayene: form.sonMuayene,
      muayeneTuru: form.muayeneTuru,
      sonuc: form.sonuc,
      notlar: form.notlar,
    };
    if (editing) {
      setMuayeneler((p) =>
        p.map((x) => (x.id === editing.id ? { ...x, ...dataObj } : x)),
      );
    } else {
      setMuayeneler((p) => [...p, { id: Date.now(), ...dataObj }]);
    }
    setModalVisible(false);
  };

  const sil = (id) => {
    Alert.alert('Silinsin mi?', '', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => setMuayeneler((p) => p.filter((x) => x.id !== id)),
      },
    ]);
  };

  const sonucRenk = {
    Yeşil: '#34c759',
    Sarı: '#f59e0b',
    Kırmızı: '#ef4444',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔍 Muayene Takibi</Text>
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
        {muayeneler.length === 0 ? (
          <Empty text="Henüz muayene kaydı yok" />
        ) : (
          [...muayeneler]
            .sort((a, b) =>
              String(b.sonMuayene).localeCompare(String(a.sonMuayene)),
            )
            .map((m) => {
              const elev = elevs.find((e) => e.id === m.asansorId);
              const renk = sonucRenk[m.sonuc] || '#64748b';
              const gecenGun = gunlerArasi(m.sonMuayene);
              return (
                <View
                  key={m.id}
                  style={[styles.card, { borderLeftColor: renk }]}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.flex1}>
                      <Text style={styles.cardTitle}>
                        {elev ? elev.ad : 'Bilinmiyor'}
                      </Text>
                      <View style={styles.metaRow}>
                        {elev ? <IlceBadge ilce={elev.ilce} /> : null}
                        <Text style={styles.metaText}>
                          {m.muayeneTuru} · {m.sonMuayene}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.sonucBadge,
                        { backgroundColor: renk + '25' },
                      ]}
                    >
                      <Text style={[styles.sonucText, { color: renk }]}>
                        {m.sonuc}
                      </Text>
                    </View>
                  </View>
                  {m.notlar ? (
                    <Text style={styles.notlar}>{m.notlar}</Text>
                  ) : null}
                  <View style={styles.bottomRow}>
                    <Text style={styles.gecen}>
                      {gecenGun != null
                        ? gecenGun + ' gün önce'
                        : ''}
                    </Text>
                    <View style={{ flex: 1 }} />
                    <IconButton icon="✏️" onPress={() => openEdit(m)} />
                    <IconButton icon="🗑️" danger onPress={() => sil(m.id)} />
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
        title={editing ? 'Düzenle' : 'Muayene Kaydı'}
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
              <View style={{ maxHeight: 220, marginBottom: 12 }}>
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

        <Field label="Muayene Türü">
          <View style={styles.row}>
            {['Yıllık', 'Periyodik', 'İlk'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  styles.optionBtn,
                  form.muayeneTuru === t && styles.optionBtnActive,
                ]}
                onPress={() => setForm({ ...form, muayeneTuru: t })}
              >
                <Text
                  style={[
                    styles.optionText,
                    form.muayeneTuru === t && { color: '#007AFF' },
                  ]}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Sonuç">
          <View style={styles.row}>
            {['Yeşil', 'Sarı', 'Kırmızı'].map((s) => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.optionBtn,
                  form.sonuc === s && {
                    backgroundColor: sonucRenk[s] + '20',
                    borderColor: sonucRenk[s],
                  },
                ]}
                onPress={() => setForm({ ...form, sonuc: s })}
              >
                <Text
                  style={[
                    styles.optionText,
                    form.sonuc === s && { color: sonucRenk[s] },
                  ]}
                >
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Field>

        <Field label="Tarih">
          <Input
            value={form.sonMuayene}
            onChangeText={(t) => setForm({ ...form, sonMuayene: t })}
            placeholder="YYYY-MM-DD"
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
    marginBottom: 6,
  },
  flex1: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 4,
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
  },
  sonucBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  sonucText: {
    fontSize: 12,
    fontWeight: '700',
  },
  notlar: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gecen: {
    fontSize: 11,
    color: '#64748b',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2a3050',
    backgroundColor: '#2a2d3a',
    alignItems: 'center',
  },
  optionBtnActive: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
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
