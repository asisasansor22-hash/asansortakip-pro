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
  IconButton,
  SheetModal,
  Field,
  Input,
  PrimaryButton,
  IlceBadge,
} from '../components/UI';

function simdi() {
  const d = new Date();
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0') +
    ' ' +
    String(d.getHours()).padStart(2, '0') +
    ':' +
    String(d.getMinutes()).padStart(2, '0')
  );
}

export default function NotlarScreen({ data, auth }) {
  const { elevs, notlar, setNotlar } = data;
  const rol = auth?.rol || 'yonetici';
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ asansorId: '', metin: '' });
  const [arama, setArama] = useState('');
  const [filtreBinaId, setFiltreBinaId] = useState(null);

  const sortedNotlar = useMemo(() => {
    let list = [...notlar].sort((a, b) =>
      String(b.tarihSaat).localeCompare(String(a.tarihSaat)),
    );
    if (filtreBinaId) {
      list = list.filter(
        (n) => String(n.asansorId) === String(filtreBinaId),
      );
    }
    return list;
  }, [notlar, filtreBinaId]);

  const notluBinaIds = useMemo(() => {
    return [...new Set(notlar.map((n) => n.asansorId))];
  }, [notlar]);

  const notluBinalar = useMemo(() => {
    return elevs.filter((e) => notluBinaIds.includes(e.id));
  }, [elevs, notluBinaIds]);

  const binaAdi = (id) => {
    const b = elevs.find((e) => e.id === id);
    return b ? b.ad : 'Bilinmiyor';
  };
  const binaIlce = (id) => {
    const b = elevs.find((e) => e.id === id);
    return b ? b.ilce || '' : '';
  };

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
    setForm({ asansorId: '', metin: '' });
    setArama('');
    setModalVisible(true);
  };

  const openEdit = (n) => {
    setEditing(n);
    setForm({ asansorId: String(n.asansorId), metin: n.metin });
    setArama('');
    setModalVisible(true);
  };

  const save = () => {
    if (!form.asansorId || !form.metin.trim()) {
      Alert.alert('Eksik Bilgi', 'Bina ve not metni zorunlu.');
      return;
    }
    if (editing) {
      setNotlar((p) =>
        p.map((n) =>
          n.id === editing.id
            ? {
                ...n,
                metin: form.metin.trim(),
                duzenlendi: simdi(),
                duzenlemeRol: rol,
              }
            : n,
        ),
      );
    } else {
      setNotlar((p) => [
        ...p,
        {
          id: Date.now(),
          asansorId: Number(form.asansorId),
          metin: form.metin.trim(),
          tarihSaat: simdi(),
          rol,
        },
      ]);
    }
    setModalVisible(false);
  };

  const del = (id) => {
    Alert.alert('Not Silinsin mi?', '', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => setNotlar((p) => p.filter((n) => n.id !== id)),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📝 Notlar</Text>
        <PrimaryButton
          label="+ Ekle"
          onPress={openAdd}
          style={{ paddingVertical: 8, paddingHorizontal: 14, minHeight: 36 }}
        />
      </View>

      {notluBinalar.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtreRow}
        >
          <TouchableOpacity
            style={[
              styles.filtreChip,
              !filtreBinaId && styles.filtreChipActive,
            ]}
            onPress={() => setFiltreBinaId(null)}
          >
            <Text
              style={[
                styles.filtreText,
                !filtreBinaId && styles.filtreTextActive,
              ]}
            >
              Tümü ({notlar.length})
            </Text>
          </TouchableOpacity>
          {notluBinalar.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={[
                styles.filtreChip,
                filtreBinaId === b.id && styles.filtreChipActive,
              ]}
              onPress={() => setFiltreBinaId(b.id)}
            >
              <Text
                style={[
                  styles.filtreText,
                  filtreBinaId === b.id && styles.filtreTextActive,
                ]}
                numberOfLines={1}
              >
                {b.ad}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}

      <ScrollView contentContainerStyle={styles.list}>
        {sortedNotlar.length === 0 ? (
          <Empty text="Henüz not yok" />
        ) : (
          sortedNotlar.map((n) => (
            <View key={n.id} style={styles.notCard}>
              <View style={styles.notHeader}>
                <View style={styles.flex1}>
                  <Text style={styles.notBina}>{binaAdi(n.asansorId)}</Text>
                  <View style={styles.notMeta}>
                    {binaIlce(n.asansorId) ? (
                      <IlceBadge ilce={binaIlce(n.asansorId)} />
                    ) : null}
                    <Text style={styles.notTarih}>{n.tarihSaat}</Text>
                  </View>
                </View>
                <View style={styles.notActions}>
                  <IconButton icon="✏️" onPress={() => openEdit(n)} />
                  <IconButton icon="🗑️" danger onPress={() => del(n.id)} />
                </View>
              </View>
              <Text style={styles.notMetin}>{n.metin}</Text>
              {n.duzenlendi ? (
                <Text style={styles.duzenlendi}>
                  ✏️ Düzenlendi: {n.duzenlendi}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>

      <SheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={save}
        title={editing ? 'Not Düzenle' : 'Yeni Not'}
      >
        {!editing && (
          <>
            <Field label="Asansör Ara">
              <Input
                value={arama}
                onChangeText={setArama}
                placeholder="Bina adı veya ilçe"
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
                <Text style={styles.selectedLabel}>Seçilen:</Text>
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

        <Field label="Not Metni">
          <Input
            value={form.metin}
            onChangeText={(t) => setForm({ ...form, metin: t })}
            placeholder="Notunuzu yazın..."
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
  filtreRow: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 6,
    flexDirection: 'row',
  },
  filtreChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1c1e2a',
    borderWidth: 0.5,
    borderColor: '#2a3050',
    maxWidth: 200,
  },
  filtreChipActive: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
  },
  filtreText: {
    fontSize: 12,
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
  notCard: {
    backgroundColor: '#1c1e2a',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  notHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  notBina: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 4,
  },
  notMeta: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  notTarih: {
    fontSize: 11,
    color: '#64748b',
  },
  notActions: {
    flexDirection: 'row',
    gap: 6,
  },
  notMetin: {
    fontSize: 14,
    color: '#e0e6f0',
    lineHeight: 20,
  },
  duzenlendi: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 8,
    fontStyle: 'italic',
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
    color: '#007AFF',
    fontWeight: '600',
  },
});
