import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { getIlceRenk } from '../utils/constants';
import { SheetModal } from '../components/UI';

const ILCE_LISTESI = [
  'Bahçelievler', 'Esenyurt', 'Başakşehir', 'Küçükçekmece',
  'Beylikdüzü', 'Bakırköy', 'Avcılar', 'Fatih',
  'Zeytinburnu', 'Bağcılar', 'Arnavutköy', 'Eyüpsultan',
  'Sultangazi', 'Gaziosmanpaşa', 'Sancaktepe', 'Diğer',
];

export default function ElevatorListScreen({ data, navigation }) {
  const { elevs, setElevs } = data;
  const [arama, setArama] = useState('');
  const [acilanIlce, setAcilanIlce] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
  const [form, setForm] = useState({
    ad: '', semt: '', ilce: '', adres: '',
    yonetici: '', tel: '', bakimGunu: '', tip: 'Elektrikli', kat: '',
  });

  const ilceler = useMemo(() => {
    let list = elevs;
    if (arama.trim()) {
      const q = arama.toLowerCase();
      list = list.filter(
        (e) =>
          (e.ad || '').toLowerCase().includes(q) ||
          (e.adres || '').toLowerCase().includes(q) ||
          (e.semt || '').toLowerCase().includes(q) ||
          (e.yonetici || '').toLowerCase().includes(q) ||
          String(e.id).includes(q),
      );
    }
    const grouped = {};
    list.forEach((e) => {
      const ilce = e.ilce || 'Diğer';
      if (!grouped[ilce]) grouped[ilce] = [];
      grouped[ilce].push(e);
    });
    return Object.keys(grouped)
      .sort()
      .map((ilce) => ({
        ilce,
        items: grouped[ilce],
        count: grouped[ilce].length,
      }));
  }, [elevs, arama]);

  const totalCount = ilceler.reduce((s, g) => s + g.count, 0);

  const ilceDetay = useMemo(() => {
    if (!acilanIlce) return null;
    return ilceler.find((x) => x.ilce === acilanIlce);
  }, [ilceler, acilanIlce]);

  const handlePress = (item) => {
    navigation.navigate('ElevatorDetail', { elevator: item });
  };

  const resetForm = () => {
    setForm({
      ad: '', semt: '', ilce: acilanIlce || '', adres: '',
      yonetici: '', tel: '', bakimGunu: '', tip: 'Elektrikli', kat: '',
    });
  };

  const openForm = () => {
    resetForm();
    setFormVisible(true);
  };

  const kaydet = () => {
    if (!form.ad.trim()) {
      Alert.alert('Hata', 'Bina adı zorunludur.');
      return;
    }
    if (!form.ilce.trim()) {
      Alert.alert('Hata', 'İlçe seçimi zorunludur.');
      return;
    }
    const maxId = elevs.reduce((mx, e) => Math.max(mx, e.id || 0), 0);
    const yeni = {
      id: maxId + 1,
      ad: form.ad.trim(),
      semt: form.semt.trim(),
      ilce: form.ilce.trim(),
      adres: form.adres.trim(),
      yonetici: form.yonetici.trim(),
      tel: form.tel.trim(),
      bakimGunu: form.bakimGunu.trim(),
      tip: form.tip || 'Elektrikli',
      kat: parseInt(form.kat, 10) || 0,
      kapasite: 0,
      aylikUcret: 0,
      kdv: false,
      bakiyeDevir: 0,
    };
    setElevs((p) => [...p, yeni]);
    setFormVisible(false);
    Alert.alert('Başarılı', `${yeni.ad} eklendi.`);
  };

  const updateField = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const modal = (
    <SheetModal
      visible={formVisible}
      onClose={() => setFormVisible(false)}
      title="Yeni Asansör Ekle"
    >
      {renderForm()}
    </SheetModal>
  );

  if (acilanIlce && ilceDetay) {
    const renk = getIlceRenk(acilanIlce);
    return (
      <View style={styles.container}>
        <View style={styles.detayHeader}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setAcilanIlce(null)}
            activeOpacity={0.7}
          >
            <Text style={styles.backBtnText}>‹ Geri</Text>
          </TouchableOpacity>
          <View style={styles.flex1}>
            <Text style={[styles.detayTitle, { color: renk }]}>
              {acilanIlce}
            </Text>
            <Text style={styles.detaySub}>
              {ilceDetay.count} asansör
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtnSmall, { backgroundColor: renk + '25' }]}
            onPress={openForm}
            activeOpacity={0.7}
          >
            <Text style={[styles.addBtnSmallText, { color: renk }]}>+ Ekle</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.listContent}>
          {ilceDetay.items
            .slice()
            .sort((a, b) => (a.ad || '').localeCompare(b.ad || ''))
            .map((item) => {
              const r = getIlceRenk(item.ilce);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  onPress={() => handlePress(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.idBadge}>
                      <Text style={styles.idText}>{item.id}</Text>
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.ad}
                      </Text>
                      <Text style={styles.cardAddress} numberOfLines={1}>
                        {item.adres}
                      </Text>
                    </View>
                    {item.bakimGunu ? (
                      <View style={styles.gunBadge}>
                        <Text style={styles.gunBadgeText}>
                          📅 {item.bakimGunu}.
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.cardBottom}>
                    <Text style={styles.detailText}>📍 {item.semt}</Text>
                    <Text style={styles.detailText}>
                      🏢 {item.kat} kat · {item.tip || 'Elektrikli'}
                    </Text>
                    <Text style={styles.detailText}>
                      👤 {item.yonetici || '—'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
        </ScrollView>
        {modal}
      </View>
    );
  }

  function renderForm() {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.formLabel}>Bina Adı *</Text>
        <TextInput
          style={styles.formInput}
          value={form.ad}
          onChangeText={(v) => updateField('ad', v)}
          placeholder="Örn: YILMAZ APT."
          placeholderTextColor="#64748b"
        />

        <Text style={styles.formLabel}>İlçe *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ilceScroll}>
          <View style={styles.ilceChipRow}>
            {ILCE_LISTESI.map((il) => {
              const r = getIlceRenk(il);
              const secili = form.ilce === il;
              return (
                <TouchableOpacity
                  key={il}
                  style={[
                    styles.ilceChip,
                    secili && { backgroundColor: r + '30', borderColor: r },
                  ]}
                  onPress={() => updateField('ilce', il)}
                >
                  <Text
                    style={[
                      styles.ilceChipText,
                      secili && { color: r, fontWeight: '800' },
                    ]}
                  >
                    {il}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <Text style={styles.formLabel}>Semt / Mahalle</Text>
        <TextInput
          style={styles.formInput}
          value={form.semt}
          onChangeText={(v) => updateField('semt', v)}
          placeholder="Örn: Yenibosna"
          placeholderTextColor="#64748b"
        />

        <Text style={styles.formLabel}>Adres</Text>
        <TextInput
          style={styles.formInput}
          value={form.adres}
          onChangeText={(v) => updateField('adres', v)}
          placeholder="Örn: HÜRRİYET MAH. ÇİMEN SOK. NO:5"
          placeholderTextColor="#64748b"
        />

        <View style={styles.formRow}>
          <View style={styles.formHalf}>
            <Text style={styles.formLabel}>Yönetici</Text>
            <TextInput
              style={styles.formInput}
              value={form.yonetici}
              onChangeText={(v) => updateField('yonetici', v)}
              placeholder="Ad soyad"
              placeholderTextColor="#64748b"
            />
          </View>
          <View style={styles.formHalf}>
            <Text style={styles.formLabel}>Telefon</Text>
            <TextInput
              style={styles.formInput}
              value={form.tel}
              onChangeText={(v) => updateField('tel', v)}
              placeholder="05XX..."
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.formHalf}>
            <Text style={styles.formLabel}>Bakım Günü</Text>
            <TextInput
              style={styles.formInput}
              value={form.bakimGunu}
              onChangeText={(v) => updateField('bakimGunu', v)}
              placeholder="1-31"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>
          <View style={styles.formHalf}>
            <Text style={styles.formLabel}>Kat Sayısı</Text>
            <TextInput
              style={styles.formInput}
              value={form.kat}
              onChangeText={(v) => updateField('kat', v)}
              placeholder="Örn: 8"
              placeholderTextColor="#64748b"
              keyboardType="number-pad"
            />
          </View>
        </View>

        <Text style={styles.formLabel}>Tip</Text>
        <View style={styles.tipRow}>
          {['Elektrikli', 'Hidrolik'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.tipChip,
                form.tip === t && styles.tipChipActive,
              ]}
              onPress={() => updateField('tip', t)}
            >
              <Text
                style={[
                  styles.tipChipText,
                  form.tip === t && styles.tipChipTextActive,
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={kaydet}>
          <Text style={styles.saveBtnText}>Asansör Kaydet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Asansör ara... (ad, adres, yönetici)"
          placeholderTextColor="#64748b"
          value={arama}
          onChangeText={setArama}
        />
        <TouchableOpacity style={styles.addBtn} onPress={openForm}>
          <Text style={styles.addBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryRow}>
        <Text style={styles.countText}>{totalCount} asansör</Text>
        <Text style={styles.countText}>{ilceler.length} ilçe</Text>
      </View>

      <ScrollView contentContainerStyle={styles.listContent}>
        {ilceler.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Sonuç bulunamadı</Text>
          </View>
        ) : (
          ilceler.map((g) => {
            const renk = getIlceRenk(g.ilce);
            return (
              <TouchableOpacity
                key={g.ilce}
                style={styles.ilceCard}
                onPress={() => setAcilanIlce(g.ilce)}
                activeOpacity={0.7}
              >
                <View style={[styles.ilceBar, { backgroundColor: renk }]} />
                <View style={styles.ilceContent}>
                  <View style={styles.ilceTopRow}>
                    <View style={[styles.ilceDot, { backgroundColor: renk }]} />
                    <Text style={[styles.ilceTitle, { color: renk }]}>
                      {g.ilce}
                    </Text>
                    <View
                      style={[styles.ilceCount, { backgroundColor: renk + '20' }]}
                    >
                      <Text style={[styles.ilceCountText, { color: renk }]}>
                        {g.count}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {modal}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1c1e2a',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    color: '#e0e6f0',
    fontSize: 15,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '700',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  countText: {
    fontSize: 13,
    color: '#64748b',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },
  ilceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1e2a',
    borderRadius: 14,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  ilceBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  ilceContent: {
    flex: 1,
    padding: 14,
    paddingLeft: 12,
  },
  ilceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ilceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ilceTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  ilceCount: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ilceCountText: {
    fontSize: 13,
    fontWeight: '800',
  },
  chevron: {
    fontSize: 22,
    color: '#64748b',
    paddingRight: 14,
  },
  detayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#1e2236',
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backBtnText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: '700',
  },
  flex1: { flex: 1 },
  detayTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  detaySub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  addBtnSmall: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnSmallText: {
    fontSize: 13,
    fontWeight: '800',
  },
  card: {
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  idBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2a2d3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#007AFF',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 2,
  },
  cardAddress: {
    fontSize: 12,
    color: '#94a3b8',
  },
  gunBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: '#f59e0b20',
  },
  gunBadgeText: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '700',
  },
  cardBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#1e2236',
    paddingTop: 10,
  },
  detailText: {
    fontSize: 12,
    color: '#64748b',
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  formContainer: {
    paddingBottom: 20,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
    marginTop: 12,
  },
  formInput: {
    backgroundColor: '#1a1d28',
    borderRadius: 10,
    padding: 12,
    color: '#e0e6f0',
    fontSize: 14,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  formRow: {
    flexDirection: 'row',
    gap: 10,
  },
  formHalf: {
    flex: 1,
  },
  ilceScroll: {
    maxHeight: 42,
  },
  ilceChipRow: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 2,
  },
  ilceChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#1a1d28',
    borderWidth: 1,
    borderColor: '#2a3050',
  },
  ilceChipText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tipChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#1a1d28',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a3050',
  },
  tipChipActive: {
    backgroundColor: '#007AFF20',
    borderColor: '#007AFF',
  },
  tipChipText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  tipChipTextActive: {
    color: '#007AFF',
    fontWeight: '800',
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
