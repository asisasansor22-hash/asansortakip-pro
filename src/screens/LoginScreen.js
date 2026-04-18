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
} from 'react-native';
import { dbGet } from '../config/firebase';
import { lsGet, lsSet } from '../utils/storage';

export default function LoginScreen({ onLogin, firma, onFirmaDegistir }) {
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [sifreAcik, setSifreAcik] = useState(false);
  const [bakimcilar, setBakimcilar] = useState([]);
  const [bakimciSec, setBakimciSec] = useState(null);
  const [bakimciSifre, setBakimciSifre] = useState('');
  const [bakimciHata, setBakimciHata] = useState('');
  const [listAcik, setListAcik] = useState(false);

  const firmaId = firma?.id || null;

  useEffect(() => {
    (async () => {
      try {
        const r = await dbGet('at_bakimcilar', firmaId);
        const d = Array.isArray(r) ? r : r && typeof r === 'string' ? JSON.parse(r) : null;
        if (Array.isArray(d) && d.length > 0) {
          setBakimcilar(d);
          await lsSet('ls_bakimcilar', d);
        } else {
          const backup = await lsGet('ls_bakimcilar');
          if (Array.isArray(backup)) setBakimcilar(backup);
        }
      } catch {}
    })();
  }, [firmaId]);

  const yoneticiGiris = async () => {
    setYukleniyor(true);
    setHata('');
    const res = await onLogin('yonetici', sifre);
    setYukleniyor(false);
    if (!res.success) {
      setHata(res.error || 'Giriş hatası');
      setSifre('');
    }
  };

  const bakimciSecFunc = async (b) => {
    setBakimciSec(b);
    setBakimciSifre('');
    setBakimciHata('');
    if (!b.sifre) {
      setYukleniyor(true);
      const res = await onLogin('bakimci', null, b);
      setYukleniyor(false);
      if (!res.success) setBakimciHata('Giriş hatası');
    }
  };

  const bakimciGiris = async () => {
    if (!bakimciSec) return;
    if (bakimciSifre !== bakimciSec.sifre) {
      setBakimciHata('Şifre hatalı!');
      setBakimciSifre('');
      return;
    }
    setYukleniyor(true);
    setBakimciHata('');
    const res = await onLogin('bakimci', bakimciSec.sifre, bakimciSec);
    setYukleniyor(false);
    if (!res.success) setBakimciHata(res.error || 'Giriş hatası');
  };

  if (yukleniyor) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Giriş yapılıyor...</Text>
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
          <Text style={styles.logoIcon}>🛗</Text>
          <Text style={styles.logoTitle}>AsansörTakip</Text>
          <Text style={styles.logoSub}>Pro</Text>
        </View>

        {firma && (
          <TouchableOpacity
            style={styles.firmaBanner}
            onPress={onFirmaDegistir}
            activeOpacity={0.7}
          >
            <View style={styles.firmaBannerIcon}>
              <Text style={styles.firmaBannerIconText}>
                {(firma.ad || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.firmaBannerAd}>{firma.ad}</Text>
              <Text style={styles.firmaBannerSub}>Firma degistir ›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Bakimci Section */}
        {bakimcilar.length > 0 ? (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.cardHeader}
              onPress={() => {
                setListAcik(!listAcik);
                setBakimciSec(null);
                setBakimciHata('');
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: 'rgba(52,199,89,0.15)' }]}>
                <Text style={styles.iconEmoji}>🔧</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={styles.cardTitle}>Bakımcı Girişi</Text>
                <Text style={styles.cardSub}>
                  {bakimcilar.length} bakımcı kayıtlı
                </Text>
              </View>
              <Text style={styles.chevron}>{listAcik ? '⌃' : '›'}</Text>
            </TouchableOpacity>

            {listAcik && (
              <View style={styles.listContainer}>
                {bakimciSec && bakimciSec.sifre ? (
                  <View style={styles.sifreBox}>
                    <View style={styles.bakimciRow}>
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: bakimciSec.renk || '#3b82f6' },
                        ]}
                      >
                        <Text style={styles.avatarText}>
                          {(bakimciSec.ad || '?')[0].toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.flex1}>
                        <Text style={styles.bakimciAd}>{bakimciSec.ad}</Text>
                        <Text style={styles.bakimciSub}>Şifrenizi girin</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          setBakimciSec(null);
                          setBakimciHata('');
                        }}
                      >
                        <Text style={styles.backBtn}>←</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.inputRow}>
                      <TextInput
                        style={[
                          styles.input,
                          bakimciHata ? styles.inputError : null,
                        ]}
                        secureTextEntry
                        value={bakimciSifre}
                        onChangeText={(t) => {
                          setBakimciSifre(t);
                          setBakimciHata('');
                        }}
                        placeholder="Şifre"
                        placeholderTextColor="#64748b"
                        onSubmitEditing={bakimciGiris}
                        autoFocus
                      />
                      <TouchableOpacity
                        style={styles.girisBtn}
                        onPress={bakimciGiris}
                      >
                        <Text style={styles.girisBtnText}>Giriş</Text>
                      </TouchableOpacity>
                    </View>
                    {bakimciHata ? (
                      <View style={styles.errorBox}>
                        <Text style={styles.errorText}>🚫 {bakimciHata}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : (
                  bakimcilar.map((b) => (
                    <TouchableOpacity
                      key={b.id}
                      style={styles.bakimciItem}
                      onPress={() => bakimciSecFunc(b)}
                      activeOpacity={0.6}
                    >
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
                        <Text style={styles.bakimciAd}>{b.ad}</Text>
                        <Text style={styles.bakimciSub}>
                          {b.sifre ? '🔒 Şifre gerekli' : '🔓 Şifresiz giriş'}
                        </Text>
                      </View>
                      <Text style={styles.chevronSmall}>›</Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        ) : (
          <TouchableOpacity
            style={styles.card}
            onPress={async () => {
              setYukleniyor(true);
              const res = await onLogin('bakimci_genel');
              setYukleniyor(false);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(52,199,89,0.15)' }]}>
                <Text style={styles.iconEmoji}>🔧</Text>
              </View>
              <View style={styles.flex1}>
                <Text style={styles.cardTitle}>Bakımcı Girişi</Text>
                <Text style={styles.cardSub}>Atanan bakım ve arızaları gör</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Yonetici Section */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.cardHeader}
            onPress={() => {
              setSifreAcik(!sifreAcik);
              setHata('');
              setSifre('');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(0,122,255,0.15)' }]}>
              <Text style={styles.iconEmoji}>👔</Text>
            </View>
            <View style={styles.flex1}>
              <Text style={styles.cardTitle}>Yönetici Girişi</Text>
              <Text style={styles.cardSub}>Tam yönetim · Şifre gerekli</Text>
            </View>
            <Text style={styles.chevron}>
              {sifreAcik ? '⌃' : '🔒'}
            </Text>
          </TouchableOpacity>

          {sifreAcik && (
            <View style={styles.sifreContainer}>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, hata ? styles.inputError : null]}
                  secureTextEntry
                  value={sifre}
                  onChangeText={(t) => {
                    setSifre(t);
                    setHata('');
                  }}
                  placeholder="Şifre"
                  placeholderTextColor="#64748b"
                  onSubmitEditing={yoneticiGiris}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.girisBtn, { backgroundColor: '#007AFF' }]}
                  onPress={yoneticiGiris}
                >
                  <Text style={styles.girisBtnText}>Giriş</Text>
                </TouchableOpacity>
              </View>
              {hata ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>🚫 {hata}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1117',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  loadingBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
  },
  logoBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 60,
    marginBottom: 8,
  },
  logoTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#e0e6f0',
    letterSpacing: -1,
  },
  logoSub: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  firmaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a2744',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#007AFF44',
  },
  firmaBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  firmaBannerIconText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
  },
  firmaBannerAd: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e0e6f0',
  },
  firmaBannerSub: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#1c1e2a',
    borderRadius: 20,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#2a3050',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 26,
  },
  flex1: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#e0e6f0',
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 13,
    color: '#94a3b8',
  },
  chevron: {
    fontSize: 18,
    color: '#64748b',
  },
  chevronSmall: {
    fontSize: 16,
    color: '#64748b',
  },
  listContainer: {
    borderTopWidth: 0.5,
    borderTopColor: '#1e2236',
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
  },
  bakimciItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#fff',
  },
  bakimciAd: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e0e6f0',
  },
  bakimciSub: {
    fontSize: 12,
    color: '#94a3b8',
  },
  sifreBox: {
    padding: 8,
  },
  bakimciRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  backBtn: {
    fontSize: 18,
    color: '#94a3b8',
    padding: 4,
  },
  sifreContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 0.5,
    borderTopColor: '#1e2236',
    paddingTop: 14,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2d3a',
    borderRadius: 12,
    padding: 12,
    paddingHorizontal: 14,
    color: '#e0e6f0',
    fontSize: 16,
  },
  inputError: {
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  girisBtn: {
    backgroundColor: '#34c759',
    borderRadius: 12,
    paddingHorizontal: 18,
    justifyContent: 'center',
    minHeight: 44,
  },
  girisBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  errorBox: {
    marginTop: 10,
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#ff3b30',
  },
});
