import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {
  Card,
  Empty,
  IlceBadge,
  IconButton,
  PrimaryButton,
  SheetModal,
  Field,
  Input,
  Toggle,
  StatGrid,
} from '../components/UI';

const ONCELIK_RENK = {
  Yüksek: '#ef4444',
  Orta: '#f59e0b',
  Düşük: '#64748b',
};

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

export default function ArizaYonetimiScreen({ data }) {
  const { faults, setFaults, elevs } = data;
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    asansorId: '',
    aciklama: '',
    oncelik: 'Orta',
    durum: 'Beklemede',
    tarih: todayISO(),
  });
  const [asansorArama, setAsansorArama] = useState('');

  const stats = useMemo(
    () => [
      { label: 'Toplam', value: faults.length, color: '#64748b' },
      {
        label: 'Yüksek',
        value: faults.filter(
          (f) => f.oncelik === 'Yüksek' && f.durum !== 'Çözüldü',
        ).length,
        color: '#ef4444',
      },
      {
        label: 'Bakımcıda',
        value: faults.filter((f) => f.bakimciAtandi && f.durum !== 'Çözüldü')
          .length,
        color: '#10b981',
      },
      {
        label: 'Çözüldü',
        value: faults.filter((f) => f.durum === 'Çözüldü').length,
        color: '#3b82f6',
      },
    ],
    [faults],
  );

  const openAdd = () => {
    setEditing(null);
    setForm({
      asansorId: '',
      aciklama: '',
      oncelik: 'Orta',
      durum: 'Beklemede',
      tarih: todayISO(),
    });
    setAsansorArama('');
    setModalVisible(true);
  };

  const openEdit = (f) => {
    setEditing(f);
    setForm({
      asansorId: String(f.asansorId || ''),
      aciklama: f.aciklama || '',
      oncelik: f.oncelik || 'Orta',
      durum: f.durum || 'Beklemede',
      tarih: f.tarih || todayISO(),
    });
    setAsansorArama('');
    setModalVisible(true);
  };

  const save = () => {
    if (!form.asansorId || !form.aciklama.trim()) {
      Alert.alert('Eksik Bilgi', 'Asansör ve açıklama zorunlu.');
      return;
    }
    const data = {
      asansorId: Number(form.asansorId),
      aciklama: form.aciklama.trim(),
      oncelik: form.oncelik,
      durum: form.durum,
      tarih: form.tarih,
    };
    if (editing) {
      setFaults((p) =>
        p.map((x) => (x.id === editing.id ? { ...x, ...data } : x)),
      );
    } else {
      setFaults((p) => [
        ...p,
        { id: Date.now(), ...data, bakimciAtandi: false },
      ]);
    }
    setModalVisible(false);
  };

  const del = (id) => {
    Alert.alert('Arıza Silinsin mi?', 'Bu işlem geri alınamaz.', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => setFaults((p) => p.filter((f) => f.id !== id)),
      },
    ]);
  };

  const changeDurum = (f, durum) => {
    setFaults((p) =>
      p.map((x) =>
        x.id === f.id
          ? {
              ...x,
              durum,
              cozumTarih: durum === 'Çözüldü' ? todayISO() : null,
            }
          : x,
      ),
    );
  };

  const toggleBakimci = (f) => {
    setFaults((p) =>
      p.map((x) =>
        x.id === f.id ? { ...x, bakimciAtandi: !x.bakimciAtandi } : x,
      ),
    );
  };

  const whatsappBildir = (f, elev) => {
    if (!elev || !elev.tel) return;
    let tel = (elev.tel || '').replace(/[\s\-\(\)]/g, '');
    if (tel.startsWith('0')) tel = '90' + tel.slice(1);
    else if (!tel.startsWith('90') && !tel.startsWith('+90')) tel = '90' + tel;
    tel = tel.replace(/^\+/, '');
    const mesaj =
      'Sayın ' +
      elev.ad +
      ' Yönetimi,\n\nŞirketimize duyduğunuz güven ve anlayışınız için teşekkür ederiz.\n\n' +
      'Binanızda tespit edilen asansör arızası (' +
      f.aciklama +
      ') teknik ekibimiz tarafından başarıyla giderilmiş olup asansörünüz güvenli bir şekilde kullanıma hazır hale getirilmiştir.\n\n' +
      'Herhangi bir sorunuz veya farklı bir arıza durumunda bizimle iletişime geçmekten lütfen çekinmeyiniz.\n\nSaygılarımızla,\nAsis Asansör';
    Linking.openURL(
      'https://wa.me/' + tel + '?text=' + encodeURIComponent(mesaj),
    );
  };

  const filtreliAsansor = useMemo(() => {
    if (!asansorArama.trim()) return elevs.slice(0, 30);
    const q = asansorArama.toLowerCase();
    return elevs
      .filter(
        (e) =>
          (e.ad || '').toLowerCase().includes(q) ||
          (e.ilce || '').toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [elevs, asansorArama]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚠️ Arıza Takibi</Text>
        <PrimaryButton
          label="+ Ekle"
          onPress={openAdd}
          style={styles.addBtn}
        />
      </View>

      <View style={styles.statContainer}>
        <StatGrid items={stats} />
      </View>

      <FlatList
        data={faults}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Empty text="Kayıtlı arıza yok" />}
        renderItem={({ item: f }) => {
          const elev = elevs.find((e) => e.id === f.asansorId);
          const color =
            f.durum === 'Çözüldü' ? '#34c759' : ONCELIK_RENK[f.oncelik];
          return (
            <View
              style={[
                styles.faultCard,
                { borderColor: color + '44' },
              ]}
            >
              <View style={styles.faultTop}>
                <View
                  style={[styles.dot, { backgroundColor: color }]}
                />
                <View style={styles.flex1}>
                  <Text style={styles.faultAciklama}>
                    {f.aciklama || '—'}
                  </Text>
                  <View style={styles.faultMeta}>
                    {elev ? <IlceBadge ilce={elev.ilce} /> : null}
                    <Text style={styles.metaText}>
                      {elev ? elev.ad : 'Bilinmiyor'} · {f.tarih}
                    </Text>
                  </View>
                  <View style={styles.faultBadges}>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: color + '20' },
                      ]}
                    >
                      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>
                        {f.oncelik}
                      </Text>
                    </View>
                    {f.durum === 'Çözüldü' ? (
                      <Text style={styles.cozumText}>
                        ✅ {f.cozumTarih || ''}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>

              <View style={styles.actionRow}>
                <View style={styles.durumRow}>
                  {['Beklemede', 'Devam Ediyor', 'Çözüldü'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.durumBtn,
                        f.durum === d && {
                          backgroundColor: '#007AFF20',
                          borderColor: '#007AFF',
                        },
                      ]}
                      onPress={() => changeDurum(f, d)}
                    >
                      <Text
                        style={[
                          styles.durumBtnText,
                          f.durum === d && { color: '#007AFF' },
                        ]}
                      >
                        {d}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.bottomActions}>
                  <Toggle
                    active={!!f.bakimciAtandi}
                    onPress={() => toggleBakimci(f)}
                    onLabel="🔧 Bakımcıda"
                    offLabel="📤 Bakımcıya At"
                    color="#34c759"
                  />
                  {f.durum === 'Çözüldü' && elev && elev.tel ? (
                    <TouchableOpacity
                      style={styles.whatsappBtn}
                      onPress={() => whatsappBildir(f, elev)}
                    >
                      <Text style={styles.whatsappText}>💬 WhatsApp</Text>
                    </TouchableOpacity>
                  ) : null}
                  <IconButton icon="✏️" onPress={() => openEdit(f)} />
                  <IconButton
                    icon="🗑️"
                    danger
                    onPress={() => del(f.id)}
                  />
                </View>
              </View>
            </View>
          );
        }}
      />

      <SheetModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={save}
        title={editing ? 'Arıza Düzenle' : 'Arıza Ekle'}
      >
        <Field label="Asansör Ara">
          <Input
            value={asansorArama}
            onChangeText={setAsansorArama}
            placeholder="Asansör adı veya ilçe"
          />
        </Field>

        {!form.asansorId ? (
          <View style={styles.asansorListBox}>
            {filtreliAsansor.map((e) => (
              <TouchableOpacity
                key={e.id}
                style={styles.asansorItem}
                onPress={() =>
                  setForm({ ...form, asansorId: String(e.id) })
                }
              >
                <Text style={styles.asansorItemText}>
                  {e.ad}
                </Text>
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
              {(elevs.find((e) => e.id === Number(form.asansorId)) || {}).ad ||
                '—'}
            </Text>
            <TouchableOpacity
              onPress={() => setForm({ ...form, asansorId: '' })}
            >
              <Text style={styles.changeBtn}>Değiştir</Text>
            </TouchableOpacity>
          </View>
        )}

        <Field label="Açıklama">
          <Input
            value={form.aciklama}
            onChangeText={(t) => setForm({ ...form, aciklama: t })}
            placeholder="Arıza açıklaması"
            multiline
          />
        </Field>

        <Field label="Öncelik">
          <View style={styles.row}>
            {['Düşük', 'Orta', 'Yüksek'].map((o) => (
              <TouchableOpacity
                key={o}
                style={[
                  styles.optionBtn,
                  form.oncelik === o && {
                    backgroundColor: ONCELIK_RENK[o] + '20',
                    borderColor: ONCELIK_RENK[o],
                  },
                ]}
                onPress={() => setForm({ ...form, oncelik: o })}
              >
                <Text
                  style={[
                    styles.optionText,
                    form.oncelik === o && { color: ONCELIK_RENK[o] },
                  ]}
                >
                  {o}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
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
  addBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    minHeight: 36,
  },
  statContainer: {
    paddingHorizontal: 16,
  },
  list: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  faultCard: {
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 0.5,
  },
  faultTop: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  flex1: {
    flex: 1,
  },
  faultAciklama: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 6,
  },
  faultMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  faultBadges: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  priorityBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  cozumText: {
    fontSize: 12,
    color: '#34c759',
  },
  actionRow: {
    marginTop: 8,
    gap: 8,
  },
  durumRow: {
    flexDirection: 'row',
    gap: 6,
  },
  durumBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a3050',
    backgroundColor: '#1a1f2e',
    alignItems: 'center',
  },
  durumBtnText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  whatsappBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0d2518',
    borderWidth: 1,
    borderColor: '#25d36644',
  },
  whatsappText: {
    color: '#25d366',
    fontSize: 11,
    fontWeight: '700',
  },
  asansorListBox: {
    maxHeight: 300,
    marginBottom: 12,
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
  optionText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
