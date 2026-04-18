import { useState, useEffect, useRef, useCallback } from 'react';
import { dbGet, dbSet } from '../config/firebase';
import { lsGet, lsSet } from '../utils/storage';
import { EXCEL_ELEVS } from '../data/elevators';

export function useFirebaseData(rol, firmaId) {
  const [elevs, setElevs] = useState([]);
  const [maints, setMaints] = useState([]);
  const [faults, setFaults] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [sozlesmeler, setSozlesmeler] = useState([]);
  const [hesapKayitlari, setHesapKayitlari] = useState([]);
  const [notlar, setNotlar] = useState([]);
  const [ekstraIsler, setEkstraIsler] = useState([]);
  const [muayeneler, setMuayeneler] = useState([]);
  const [bakimcilar, setBakimcilar] = useState([]);
  const [sonOdemeler, setSonOdemeler] = useState([]);
  const [haftalikKapamalar, setHaftalikKapamalar] = useState([]);
  const [aylikKapamalar, setAylikKapamalar] = useState([]);
  const [giderler, setGiderler] = useState([]);
  const [giderHaftaArsiv, setGiderHaftaArsiv] = useState([]);
  const [loading, setLoading] = useState(true);
  const ilkYukleme = useRef(true);
  const fid = useRef(firmaId);

  useEffect(() => {
    fid.current = firmaId;
  }, [firmaId]);

  function fb(v) {
    return Array.isArray(v) ? v : v && typeof v === 'string' ? JSON.parse(v) : null;
  }

  const yukle = useCallback(async () => {
    setLoading(true);
    ilkYukleme.current = true;
    const id = fid.current;
    try {
      const results = await Promise.all([
        dbGet('at_elevs', id),
        dbGet('at_maints', id),
        dbGet('at_faults', id),
        dbGet('at_tasks', id),
        dbGet('at_sozlesme', id),
        dbGet('at_hesapkayit', id),
        dbGet('at_notlar', id),
        dbGet('at_ekstraisler', id),
        dbGet('at_muayeneler', id),
        dbGet('at_bakimcilar', id),
        dbGet('at_sonodemeler', id),
        dbGet('at_haftalik', id),
        dbGet('at_aylik', id),
        dbGet('at_giderler', id),
        dbGet('at_giderhafta', id),
      ]);

      const [
        rElevs, rMaints, rFaults, rTasks, rSoz, rHesap,
        rNotlar, rEkstra, rMuayene, rBakimci, rOdeme,
        rHaftalik, rAylik, rGider, rGiderHafta,
      ] = results;

      const elevsData = fb(rElevs);
      if (elevsData && elevsData.length > 0) {
        setElevs(elevsData);
        await lsSet('ls_elevs', elevsData);
      } else {
        const backup = await lsGet('ls_elevs');
        setElevs(backup && backup.length > 0 ? backup : EXCEL_ELEVS);
      }

      setMaints(fb(rMaints) || []);
      setFaults(fb(rFaults) || []);
      setTasks(fb(rTasks) || []);
      setSozlesmeler(fb(rSoz) || []);
      setHesapKayitlari(fb(rHesap) || []);
      setNotlar(fb(rNotlar) || []);
      setEkstraIsler(fb(rEkstra) || []);
      setMuayeneler(fb(rMuayene) || []);
      setSonOdemeler(fb(rOdeme) || []);
      setHaftalikKapamalar(fb(rHaftalik) || []);
      setAylikKapamalar(fb(rAylik) || []);
      setGiderler(fb(rGider) || []);
      setGiderHaftaArsiv(fb(rGiderHafta) || []);

      const bakimciData = fb(rBakimci);
      if (bakimciData && bakimciData.length > 0) {
        setBakimcilar(bakimciData);
        await lsSet('ls_bakimcilar', bakimciData);
      }
    } catch {
      const backup = await lsGet('ls_elevs');
      if (backup && backup.length > 0) setElevs(backup);
      else setElevs(EXCEL_ELEVS);
    } finally {
      setLoading(false);
      setTimeout(() => {
        ilkYukleme.current = false;
      }, 500);
    }
  }, []);

  useEffect(() => {
    if (rol) yukle();
  }, [rol, yukle]);

  useEffect(() => {
    if (!ilkYukleme.current && elevs.length > 0) dbSet('at_elevs', elevs, fid.current);
  }, [elevs]);
  useEffect(() => {
    if (!ilkYukleme.current) dbSet('at_maints', maints, fid.current);
  }, [maints]);
  useEffect(() => {
    if (!ilkYukleme.current) dbSet('at_faults', faults, fid.current);
  }, [faults]);
  useEffect(() => {
    if (!ilkYukleme.current) dbSet('at_tasks', tasks, fid.current);
  }, [tasks]);
  useEffect(() => {
    if (!ilkYukleme.current) dbSet('at_sozlesme', sozlesmeler, fid.current);
  }, [sozlesmeler]);
  useEffect(() => {
    if (!ilkYukleme.current) dbSet('at_hesapkayit', hesapKayitlari, fid.current);
  }, [hesapKayitlari]);
  useEffect(() => {
    if (!ilkYukleme.current) dbSet('at_notlar', notlar, fid.current);
  }, [notlar]);
  useEffect(() => {
    if (!ilkYukleme.current) dbSet('at_ekstraisler', ekstraIsler, fid.current);
  }, [ekstraIsler]);
  useEffect(() => {
    if (!ilkYukleme.current) dbSet('at_muayeneler', muayeneler, fid.current);
  }, [muayeneler]);
  useEffect(() => {
    if (!ilkYukleme.current) dbSet('at_sonodemeler', sonOdemeler, fid.current);
  }, [sonOdemeler]);
  useEffect(() => {
    if (!ilkYukleme.current) dbSet('at_haftalik', haftalikKapamalar, fid.current);
  }, [haftalikKapamalar]);
  useEffect(() => {
    if (!ilkYukleme.current) dbSet('at_aylik', aylikKapamalar, fid.current);
  }, [aylikKapamalar]);
  useEffect(() => {
    if (!ilkYukleme.current) dbSet('at_giderler', giderler, fid.current);
  }, [giderler]);
  useEffect(() => {
    if (!ilkYukleme.current) dbSet('at_giderhafta', giderHaftaArsiv, fid.current);
  }, [giderHaftaArsiv]);

  return {
    elevs, setElevs,
    maints, setMaints,
    faults, setFaults,
    tasks, setTasks,
    sozlesmeler, setSozlesmeler,
    hesapKayitlari, setHesapKayitlari,
    notlar, setNotlar,
    ekstraIsler, setEkstraIsler,
    muayeneler, setMuayeneler,
    bakimcilar, setBakimcilar,
    sonOdemeler, setSonOdemeler,
    haftalikKapamalar, setHaftalikKapamalar,
    aylikKapamalar, setAylikKapamalar,
    giderler, setGiderler,
    giderHaftaArsiv, setGiderHaftaArsiv,
    loading,
    reload: yukle,
  };
}
