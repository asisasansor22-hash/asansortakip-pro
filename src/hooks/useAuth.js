import { useState, useEffect, useCallback, useRef } from 'react';
import { firebaseLogin, firebaseLogout, onAuthChange, ASIS_FIRMA_ID } from '../config/firebase';
import { lsGet, lsSet } from '../utils/storage';

function safeStr(s) {
  return (s || '')
    .toLowerCase()
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ğ/g, 'g')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/[^a-z0-9]/g, '');
}

function makeEmail(rol, bakimci, firmaId) {
  const isAsis = !firmaId || firmaId === ASIS_FIRMA_ID;
  const suffix = isAsis ? '' : '_' + safeStr(firmaId);
  if (rol === 'yonetici') return 'yonetici' + suffix + '@asistakip.app';
  if (bakimci && bakimci.ad) {
    return 'bakimci_' + safeStr(bakimci.ad) + suffix + '@asistakip.app';
  }
  return 'bakimci' + suffix + '@asistakip.app';
}

export function useAuth() {
  const [firma, setFirma] = useState(null);
  const [rol, setRol] = useState(null);
  const [aktifBakimci, setAktifBakimci] = useState(null);
  const [loading, setLoading] = useState(true);
  const firmaLoaded = useRef(false);
  const authLoaded = useRef(false);

  useEffect(() => {
    (async () => {
      const savedFirma = await lsGet('at_firma');
      if (savedFirma && savedFirma.id) setFirma(savedFirma);
      firmaLoaded.current = true;
      if (authLoaded.current) setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (user) {
        const savedRol = await lsGet('at_rol');
        const savedBakimci = await lsGet('at_aktif_bakimci');
        if (savedRol) {
          setRol(savedRol);
          if (savedBakimci) setAktifBakimci(savedBakimci);
        }
      } else {
        setRol(null);
        setAktifBakimci(null);
      }
      authLoaded.current = true;
      if (firmaLoaded.current) setLoading(false);
    });
    return unsub;
  }, []);

  const selectFirma = useCallback(async (f) => {
    setFirma(f);
    await lsSet('at_firma', f);
  }, []);

  const clearFirma = useCallback(async () => {
    await firebaseLogout();
    setRol(null);
    setAktifBakimci(null);
    setFirma(null);
    await lsSet('at_firma', null);
    await lsSet('at_rol', null);
    await lsSet('at_aktif_bakimci', null);
  }, []);

  const loginYonetici = useCallback(async (sifre) => {
    if (!firma) return { success: false, error: 'Firma seçilmedi' };
    const dogruSifre = firma.yoneticiSifre || 'asis94';
    if (sifre !== dogruSifre) return { success: false, error: 'Şifre hatalı!' };
    const res = await firebaseLogin(makeEmail('yonetici', null, firma.id), dogruSifre);
    if (res.success) {
      setRol('yonetici');
      await lsSet('at_rol', 'yonetici');
    }
    return res;
  }, [firma]);

  const loginBakimci = useCallback(async (bakimci, sifre) => {
    if (!firma) return { success: false, error: 'Firma seçilmedi' };
    if (bakimci.sifre && sifre !== bakimci.sifre) {
      return { success: false, error: 'Şifre hatalı!' };
    }
    const pw = bakimci.sifre || 'bakimci_' + (bakimci.id || 'nosifre');
    const res = await firebaseLogin(makeEmail('bakimci', bakimci, firma.id), pw);
    if (res.success) {
      setRol('bakimci');
      setAktifBakimci(bakimci);
      await lsSet('at_rol', 'bakimci');
      await lsSet('at_aktif_bakimci', bakimci);
    }
    return res;
  }, [firma]);

  const loginBakimciGenel = useCallback(async () => {
    if (!firma) return { success: false, error: 'Firma seçilmedi' };
    const res = await firebaseLogin(makeEmail('bakimci', null, firma.id), 'bakimci_genel');
    if (res.success) {
      setRol('bakimci');
      await lsSet('at_rol', 'bakimci');
    }
    return res;
  }, [firma]);

  const logout = useCallback(async () => {
    await firebaseLogout();
    setRol(null);
    setAktifBakimci(null);
    await lsSet('at_rol', null);
    await lsSet('at_aktif_bakimci', null);
  }, []);

  return {
    firma,
    firmaId: firma?.id || null,
    rol,
    aktifBakimci,
    loading,
    selectFirma,
    clearFirma,
    loginYonetici,
    loginBakimci,
    loginBakimciGenel,
    logout,
  };
}
