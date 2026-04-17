import { useState, useEffect, useCallback } from 'react';
import { firebaseLogin, firebaseLogout, onAuthChange } from '../config/firebase';
import { lsGet, lsSet } from '../utils/storage';

function makeEmail(rol, bakimci) {
  if (rol === 'yonetici') return 'yonetici@asistakip.app';
  if (bakimci && bakimci.ad) {
    const safe = bakimci.ad
      .toLowerCase()
      .replace(/ş/g, 's')
      .replace(/ç/g, 'c')
      .replace(/ğ/g, 'g')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ü/g, 'u')
      .replace(/[^a-z0-9]/g, '');
    return 'bakimci_' + safe + '@asistakip.app';
  }
  return 'bakimci@asistakip.app';
}

export function useAuth() {
  const [rol, setRol] = useState(null);
  const [aktifBakimci, setAktifBakimci] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginYonetici = useCallback(async (sifre) => {
    if (sifre !== 'asis94') return { success: false, error: 'Şifre hatalı!' };
    const res = await firebaseLogin(makeEmail('yonetici'), 'asis94');
    if (res.success) {
      setRol('yonetici');
      await lsSet('at_rol', 'yonetici');
    }
    return res;
  }, []);

  const loginBakimci = useCallback(async (bakimci, sifre) => {
    if (bakimci.sifre && sifre !== bakimci.sifre) {
      return { success: false, error: 'Şifre hatalı!' };
    }
    const pw = bakimci.sifre || 'bakimci_' + (bakimci.id || 'nosifre');
    const res = await firebaseLogin(makeEmail('bakimci', bakimci), pw);
    if (res.success) {
      setRol('bakimci');
      setAktifBakimci(bakimci);
      await lsSet('at_rol', 'bakimci');
      await lsSet('at_aktif_bakimci', bakimci);
    }
    return res;
  }, []);

  const loginBakimciGenel = useCallback(async () => {
    const res = await firebaseLogin('bakimci@asistakip.app', 'bakimci_genel');
    if (res.success) {
      setRol('bakimci');
      await lsSet('at_rol', 'bakimci');
    }
    return res;
  }, []);

  const logout = useCallback(async () => {
    await firebaseLogout();
    setRol(null);
    setAktifBakimci(null);
    await lsSet('at_rol', null);
    await lsSet('at_aktif_bakimci', null);
  }, []);

  return {
    rol,
    aktifBakimci,
    loading,
    loginYonetici,
    loginBakimci,
    loginBakimciGenel,
    logout,
  };
}
