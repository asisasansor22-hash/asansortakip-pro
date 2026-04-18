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
  Toggle,
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

export default function EkstraIsScreen({ data }) {
  const { elevs, ekstraIsler, setEkstraIsler } = data;
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    asansorId: '',
    aciklama: '',
    tutar: '',
    tarih: todayISO(),
    odendi: false,
  });
  const [arama, setArama] = useState('');

  const toplam = useMemo(
    () => ekstraIsler.reduce((a, i) => a + (Number(i.tutar) || 0), 0),
    [ekstraIsler],
  );
  const odenmeyen = useMemo(
    () =>
      ekstraIsler
        .filter((i) => !i.odendi)
        .reduce((a, i) => a + (Number(i.tutar) || 0), 0),
    [ekstraIsler],
  );

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
      aciklama: '',
      tutar: '',
      tarih: todayISO(),
      odendi: false,
    });
    setArama('');
    setModalVisible(true);
  };

  const openEdit = (i) => {
    setEditing(i);
    setForm({
      asansorId: String(i.asansorId),
      aciklama: i.aciklama || '',
      tutar: String(i.tutar || ''),
      tarih: i.tarih || todayISO(),
      odendi: !!i.odendi,
    });
    setArama('');
    setModalVisible(true);
  };

  const save = () => {
    if (!form.asansorId || !form.aciklama.trim() || !form.tutar) {
      Alert.alert('Eksik Bilgi', 'Tüm alanlar zorunlu.');
      return;
    }
    const dataObj = {
      asansorId: Number(form.asansorId),
      aciklama: form.aciklama.trim(),
      tutar: Number(form.tutar),
      tarih: form.tarih,
      odendi: form.odendi,
    };
    if (editing) {
      setEkstraIsler((p) =>
        p.map((x) => (x.id === editing.id ? { ...x, ...dataObj } : x)),
      );
    } else {
      setEkstraIsler((p) => [...p, { id: Date.now(), ...dataObj }]);
    }
    setModalVisible(false);
  };

  const sil = (id) => {
    Alert.alert('Silinsin mi?', '', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => setEkstraIsler((p) => p.filter((x) => x.id !== id)),
      },
    ]);
  };

  const toggleOdeme = (i) => {
    setEkstraIsler((p) =>
      p.map((x) => (x.id === i.id ? { ...x, odendi: !x.odendi } : x)),
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔩 Ekstra İşler</Text>
        <PrimaryButton
          label="+ Ekle"
          onPress={openAdd}
          style={{ paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 }}
        />
      </View>

      <View style={styles.totalsRow}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Toplam Tutar</Text>
          <Text style={[styles.totalValue, { color: '#007AFF' }]}>
            {fmtPara(toplam)}
          </Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Tahsil Edilmemiş</Text>
          <Text style={[styles.totalValue, { color: '#ff9500' }]}>
            {fmtPara(odenmeyen)}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {ekstraIsler.length === 0 ? (
          <Empty text="Henüz ekstra iş yok" />
        ) : (
          [...ekstraIsler]
            .sort((a, b) => String(b.tarih).localeCompare(String(a.tarih)))
            .map((i) => {
              const elev = elevs.find((e) => e.id === i.asansorId);
              return (
                <View key={i.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <View style={styles.flex1}>
                      <Text style={styles.cardTitle}>
                        {elev ? elev.ad : 'Bilinmiyor'}
                      </Text>
                      <Text style={styles.cardAciklama}>{i.aciklama}</Text>
                      <View style={styles.metaRow}>
                        {elev ? <IlceBadge ilce={elev.ilce} /> : null}
                        <Text style={styles.metaText}>{i.tarih}</Text>
                      </View>
                    </View>
                    <View style={styles.tutarBox}>
                      <Text style={styles.tutar}>{fmtPara(i.tutar)}</Text>
                    </View>
                  </View>
                  <View style={styles.actionRow}>
                    <Toggle
                      active={i.odendi}
                      onPress={() => toggleOdeme(i)}
                      onLabel="✅ Ödendi"
                      offLabel="⏳ Bekliyor"
                      color="#34c759"
                    />
                    <View style={styles.actionSpacer} />
                    <IconButton icon="✏️" onPress={() => openEdit(i)} />
                    <IconButton
                      icon="🗑️"
                      danger
                      onPress={() => sil(i.id)}
                    />
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
        title={editing ? 'Düzenle' : 'Ekstra İş Ekle'}
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

        <Field label="Açıklama">
          <Input
            value={form.aciklama}
            onChangeText={(t) => setForm({ ...form, aciklama: t })}
            placeholder="Yapılan iş"
            multiline
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
    fontSize: 15,
    fontWeight: '800',
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
  },
  cardTop: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
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
  cardAciklama: {
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
  tutarBox: {
    justifyContent: 'center',
  },
  tutar: {
    fontSize: 15,
    fontWeight: '800',
    color: '#007AFF',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionSpacer: {
    flex: 1,
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
