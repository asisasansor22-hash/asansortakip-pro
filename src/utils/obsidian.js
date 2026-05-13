import JSZip from 'jszip';

function tarihStr(t) {
  if (!t) return '';
  var d = new Date(t);
  if (isNaN(d.getTime())) return String(t);
  return d.toLocaleDateString('tr-TR');
}

function temizDosyaAdi(str) {
  return String(str || 'Isimsiz')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 80);
}

function asansorMd(e, maints, faults, sozlesmeler, muayeneler, ekstraIsler) {
  var satirlar = [];

  satirlar.push('# ' + (e.ad || 'İsimsiz Asansör'));
  satirlar.push('');
  satirlar.push('## Genel Bilgiler');
  satirlar.push('');
  satirlar.push('| Alan | Değer |');
  satirlar.push('|------|-------|');
  satirlar.push('| İlçe | ' + (e.ilce || '-') + ' |');
  satirlar.push('| Adres | ' + (e.adres || '-') + ' |');
  satirlar.push('| Semt | ' + (e.semt || '-') + ' |');
  satirlar.push('| Yönetici | ' + (e.yonetici || '-') + ' |');
  satirlar.push('| Yönetici Daire | ' + (e.yoneticiDaire || '-') + ' |');
  satirlar.push('| Telefon | ' + (e.tel || '-') + ' |');
  satirlar.push('| Bakım Günü | ' + (e.bakimGunu ? 'Her ayın ' + e.bakimGunu + '. günü' : '-') + ' |');
  satirlar.push('| Aylık Ücret | ' + (e.aylikUcret ? e.aylikUcret + ' ₺' : '-') + ' |');
  satirlar.push('| Asansör Kodu | ' + (e.kod || e.id || '-') + ' |');
  if (e.not) {
    satirlar.push('| Not | ' + e.not + ' |');
  }
  satirlar.push('');

  // Bakım geçmişi
  var eBakim = (maints || []).filter(function(m) { return String(m.asansorId) === String(e.id); })
    .sort(function(a, b) { return new Date(b.tarih) - new Date(a.tarih); });
  satirlar.push('## Bakım Geçmişi');
  satirlar.push('');
  if (eBakim.length === 0) {
    satirlar.push('_Bakım kaydı bulunamadı._');
  } else {
    satirlar.push('| Tarih | Yapıldı | Ödendi | Alınan (₺) | Bakımcı | Not |');
    satirlar.push('|-------|---------|--------|------------|---------|-----|');
    eBakim.forEach(function(m) {
      satirlar.push(
        '| ' + tarihStr(m.tarih) +
        ' | ' + (m.yapildi ? '✅' : '❌') +
        ' | ' + (m.odendi ? '✅' : '❌') +
        ' | ' + (m.alinanTutar || '') +
        ' | ' + (m.bakimciAdi || m.bakimci || '') +
        ' | ' + (m.not || '') +
        ' |'
      );
    });
  }
  satirlar.push('');

  // Arızalar
  var eAriza = (faults || []).filter(function(f) { return String(f.asansorId) === String(e.id); })
    .sort(function(a, b) { return new Date(b.tarih) - new Date(a.tarih); });
  satirlar.push('## Arızalar');
  satirlar.push('');
  if (eAriza.length === 0) {
    satirlar.push('_Arıza kaydı bulunamadı._');
  } else {
    satirlar.push('| Tarih | Açıklama | Durum | Çözüm |');
    satirlar.push('|-------|----------|-------|-------|');
    eAriza.forEach(function(f) {
      satirlar.push(
        '| ' + tarihStr(f.tarih) +
        ' | ' + (f.aciklama || f.ariza || '') +
        ' | ' + (f.durum || (f.kapatildi ? 'Kapalı' : 'Açık')) +
        ' | ' + (f.cozum || '') +
        ' |'
      );
    });
  }
  satirlar.push('');

  // Sözleşmeler
  var eSoz = (sozlesmeler || []).filter(function(s) { return String(s.asansorId) === String(e.id); });
  if (eSoz.length > 0) {
    satirlar.push('## Sözleşmeler');
    satirlar.push('');
    satirlar.push('| Başlangıç | Bitiş | Tutar | Durum |');
    satirlar.push('|-----------|-------|-------|-------|');
    eSoz.forEach(function(s) {
      satirlar.push(
        '| ' + tarihStr(s.baslangic) +
        ' | ' + tarihStr(s.bitis) +
        ' | ' + (s.tutar ? s.tutar + ' ₺' : '') +
        ' | ' + (s.durum || '') +
        ' |'
      );
    });
    satirlar.push('');
  }

  // Muayeneler
  var eMuayene = (muayeneler || []).filter(function(m) { return String(m.asansorId) === String(e.id); });
  if (eMuayene.length > 0) {
    satirlar.push('## Muayeneler');
    satirlar.push('');
    satirlar.push('| Tarih | Sonuç | Not |');
    satirlar.push('|-------|-------|-----|');
    eMuayene.forEach(function(m) {
      satirlar.push(
        '| ' + tarihStr(m.tarih) +
        ' | ' + (m.sonuc || m.durum || '') +
        ' | ' + (m.not || '') +
        ' |'
      );
    });
    satirlar.push('');
  }

  // Ekstra işler
  var eEkstra = (ekstraIsler || []).filter(function(i) { return String(i.asansorId) === String(e.id); });
  if (eEkstra.length > 0) {
    satirlar.push('## Ekstra İşler');
    satirlar.push('');
    satirlar.push('| Tarih | Açıklama | Tutar |');
    satirlar.push('|-------|----------|-------|');
    eEkstra.forEach(function(i) {
      satirlar.push(
        '| ' + tarihStr(i.tarih) +
        ' | ' + (i.aciklama || i.is || '') +
        ' | ' + (i.tutar ? i.tutar + ' ₺' : '') +
        ' |'
      );
    });
    satirlar.push('');
  }

  return satirlar.join('\n');
}

function notMd(n) {
  var satirlar = [];
  satirlar.push('# ' + (n.baslik || n.title || 'Not'));
  satirlar.push('');
  if (n.tarih) satirlar.push('**Tarih:** ' + tarihStr(n.tarih));
  if (n.kategori) satirlar.push('**Kategori:** ' + n.kategori);
  satirlar.push('');
  satirlar.push(n.icerik || n.content || n.not || '');
  return satirlar.join('\n');
}

function ozetMd(elevs, maints, faults, notlar, ekstraIsler, giderler) {
  var simdi = new Date();
  var satirlar = [];
  satirlar.push('# Asansör Takip — Özet');
  satirlar.push('');
  satirlar.push('**Export Tarihi:** ' + simdi.toLocaleString('tr-TR'));
  satirlar.push('');
  satirlar.push('## İstatistikler');
  satirlar.push('');
  satirlar.push('| | Adet |');
  satirlar.push('|-|------|');
  satirlar.push('| Toplam Asansör | ' + (elevs || []).length + ' |');
  satirlar.push('| Toplam Bakım | ' + (maints || []).length + ' |');
  satirlar.push('| Toplam Arıza | ' + (faults || []).length + ' |');
  satirlar.push('| Toplam Not | ' + (notlar || []).length + ' |');
  satirlar.push('| Toplam Ekstra İş | ' + (ekstraIsler || []).length + ' |');
  satirlar.push('| Toplam Gider Kaydı | ' + (giderler || []).length + ' |');
  satirlar.push('');

  var ilceler = {};
  (elevs || []).forEach(function(e) {
    var il = e.ilce || 'Bilinmiyor';
    ilceler[il] = (ilceler[il] || 0) + 1;
  });
  var ilceSirali = Object.entries(ilceler).sort(function(a, b) { return b[1] - a[1]; });
  if (ilceSirali.length > 0) {
    satirlar.push('## İlçelere Göre Asansör');
    satirlar.push('');
    satirlar.push('| İlçe | Adet |');
    satirlar.push('|------|------|');
    ilceSirali.forEach(function(e) {
      satirlar.push('| ' + e[0] + ' | ' + e[1] + ' |');
    });
    satirlar.push('');
  }

  satirlar.push('## Asansörler');
  satirlar.push('');
  (elevs || []).forEach(function(e) {
    var dosyaAdi = temizDosyaAdi((e.id ? e.id + ' - ' : '') + (e.ad || 'Isimsiz'));
    satirlar.push('- [[Asansörler/' + dosyaAdi + ']]');
  });

  return satirlar.join('\n');
}

export async function exportObsidian({ elevs, maints, faults, sozlesmeler, muayeneler, ekstraIsler, notlar, giderler }) {
  var zip = new JSZip();
  var asansorlerKlasor = zip.folder('Asansörler');
  var notlarKlasor = zip.folder('Notlar');

  (elevs || []).forEach(function(e) {
    var icerik = asansorMd(e, maints, faults, sozlesmeler, muayeneler, ekstraIsler);
    var ad = temizDosyaAdi((e.id ? e.id + ' - ' : '') + (e.ad || 'Isimsiz'));
    asansorlerKlasor.file(ad + '.md', icerik);
  });

  (notlar || []).forEach(function(n, i) {
    var icerik = notMd(n);
    var ad = temizDosyaAdi((n.baslik || n.title || ('Not_' + (i + 1))));
    notlarKlasor.file(ad + '.md', icerik);
  });

  var ozet = ozetMd(elevs, maints, faults, notlar, ekstraIsler, giderler);
  zip.file('Ozet.md', ozet);

  var blob = await zip.generateAsync({ type: 'blob' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  var simdi = new Date();
  var tarih = simdi.toLocaleDateString('tr-TR').replace(/\./g, '-');
  a.href = url;
  a.download = tarih + '_AsansorTakip_Obsidian.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
