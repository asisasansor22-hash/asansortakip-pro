import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  firmaGetAll,
  firmaGet,
  firmaSet,
  firmaSlug,
  ASIS_FIRMA_ID,
} from '../config/firebase';
import { lsGet, lsSet } from '../utils/storage';

const ASIS_VARSAYILAN = {
  ad: 'Asis Asansör',
  yoneticiSifre: 'asis94',
  olusturma: 0,
};

export default function FirmaSecimScreen({ onSelect }) {
  const [firmalar, setFirmalar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [yeniAcik, setYeniAcik] = useState(false);
  const [yeniAd, setYeniAd] = useState('');
  const [yeniSifre, setYeniSifre] = useState('');
  const [yeniSifre2, setYeniSifre2] = useState('');
  const [hata, setHata] = useState('');
  const [kayitYukleniyor, setKayitYukleniyor] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await firmaGetAll();
        const list = [];
        list.push({ id: ASIS_FIRMA_ID, ...ASIS_VARSAYILAN });
        if (data && typeof data === 'object') {
          Object.keys(data).forEach((id) => {
            if (id !== ASIS_FIRMA_ID) list.push({ id, ...data[id] });
          });
        }
        setFirmalar(list);
        await lsSet('ls_firmalar', list);
      } catch {
        const backup = await lsGet('ls_firmalar');
        if (Array.isArray(backup) && backup.length > 0) setFirmalar(backup);
        else setFirmalar([{ id: ASIS_FIRMA_ID, ...ASIS_VARSAYILAN }]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const firmaSecFunc = async (firma) => {
    await lsSet('at_firma', firma);
    onSelect(firma);
  };

  const yeniFirmaKaydet = async () => {
    setHata('');
    const ad = yeniAd.trim();
    if (!ad || ad.length < 3) {
      setHata('Firma adı en az 3 karakter olmalı');
      return;
    }
    if (!yeniSifre || yeniSifre.length < 4) {
      setHata('Şifre en az 4 karakter olmalı');
      return;
    }
    if (yeniSifre !== yeniSifre2) {
      setHata('Şifreler eşleşmiyor');
      return;
    }
    const id = firmaSlug(ad);
    if (!id || id.length < 3) {
      setHata('Geçersiz firma adı (sadece harf/rakam)');
      return;
    }
    if (id === ASIS_FIRMA_ID) {
      setHata('Bu firma adı kullanılamaz');
      return;
    }
    setKayitYukleniyor(true);
    try {
      const mevcut = await firmaGet(id);
      if (mevcut) {
        setHata('Bu firma zaten kayıtlı');
        setKayitYukleniyor(false);
        return;
      }
      const yeniFirma = {
        ad,
        yoneticiSifre: yeniSifre,
        olusturma: Date.now(),
      };
      await firmaSet(id, yeniFirma);
      const tam = { id, ...yeniFirma };
      const yeniListe = [...firmalar, tam];
      setFirmalar(yeniListe);
      await lsSet('ls_firmalar', yeniListe);
      setYeniAcik(false);
      setYeniAd('');
      setYeniSifre('');
      setYeniSifre2('');
      Alert.alert('Başarılı', 'Firma kaydedildi. Şimdi giriş yapabilirsiniz.');
      await firmaSecFunc(tam);
    } catch (e) {
      setHata('Kayıt başarısız: ' + (e.message || 'bilinmeyen hata'));
    } finally {
      setKayitYukleniyor(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Firmalar yükleniyor...</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>🏢</Text>
          <Text style={styles.logoTitle}>Firma Seç</Text>
          <Text style={styles.logoSub}>Hangi firmayla giriş yapacaksın?</Text>
        </View>

        {firmalar.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={styles.firmaCard}
            onPress={() => firmaSecFunc(f)}
            activeOpacity={0.7}
          >
            <View style={styles.firmaIcon}>
              <Text style={styles.firmaIconText}>
                {(f.ad || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.firmaAd}>{f.ad}</Text>
              <Text style={styles.firmaSub}>
                {f.id === ASIS_FIRMA_ID ? 'Ana firma' : 'Kayıtlı firma'}
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}

        {!yeniAcik ? (
          <TouchableOpacity
            style={styles.yeniBtn}
            onPress={() => setYeniAcik(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.yeniBtnText}>+ Yeni Firma Kaydet</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.yeniBox}>
            <Text style={styles.yeniBaslik}>Yeni Firma Kaydı</Text>

            <Text style={styles.label}>Firma Adı</Text>
            <TextInput
              style={styles.input}
              value={yeniAd}
              onChangeText={(t) => {
                setYeniAd(t);
                setHata('');
              }}
              placeholder="Örn: Mavi Asansör"
              placeholderTextColor="#64748b"
              autoCapitalize="words"
            />

            <Text style={styles.label}>Yönetici Şifresi</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={yeniSifre}
              onChangeText={(t) => {
                setYeniSifre(t);
                setHata('');
              }}
              placeholder="En az 4 karakter"
              placeholderTextColor="#64748b"
            />

            <Text style={styles.label}>Şifre Tekrar</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={yeniSifre2}
              onChangeText={(t) => {
                setYeniSifre2(t);
                setHata('');
              }}
              placeholder="Şifreyi tekrar gir"
              placeholderTextColor="#64748b"
            />

            {hata ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>🚫 {hata}</Text>
              </View>
            ) : null}

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#2a2d3a' }]}
                onPress={() => {
                  setYeniAcik(false);
                  setHata('');
                }}
                disabled={kayitYukleniyor}
              >
                <Text style={styles.btnTextMuted}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#007AFF' }]}
                onPress={yeniFirmaKaydet}
                disabled={kayitYukleniyor}
              >
                {kayitYukleniyor ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Kaydet</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f1117' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#94a3b8' },
  logoBox: { alignItems: 'center', marginBottom: 32 },
  logoIcon: { fontSize: 60, marginBottom: 8 },
  logoTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#e0e6f0',
    letterSpacing: -1,
  },
  logoSub: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  firmaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  firmaIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  firmaIconText: { fontSize: 22, fontWeight: '900', color: '#fff' },
  flex1: { flex: 1 },
  firmaAd: { fontSize: 16, fontWeight: '700', color: '#e0e6f0' },
  firmaSub: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  chevron: { fontSize: 20, color: '#64748b' },
  yeniBtn: {
    marginTop: 8,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a3050',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  yeniBtnText: { color: '#34c759', fontWeight: '700', fontSize: 15 },
  yeniBox: {
    marginTop: 8,
    backgroundColor: '#1c1e2a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  yeniBaslik: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#2a2d3a',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    color: '#e0e6f0',
    fontSize: 15,
    minHeight: 44,
    marginBottom: 12,
  },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 46,
    justifyContent: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnTextMuted: { color: '#94a3b8', fontWeight: '600', fontSize: 15 },
  errorBox: {
    marginTop: 4,
    marginBottom: 8,
    padding: 10,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 10,
  },
  errorText: { fontSize: 13, color: '#ff3b30' },
});
