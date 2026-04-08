// Excel dışa aktarma yardımcıları (SheetJS CDN gerektirir)

// toXLSX: window.XLSX (CDN) üzerinden çalışır
export function toXLSX(satirlar, dosyaAdi, sayfaAdi) {
  if(typeof window.XLSX === 'undefined'){console.warn('SheetJS yuklenmedi');return;}
  var XLSX = window.XLSX;
  var wb = XLSX.utils.book_new();
  var ws = XLSX.utils.aoa_to_sheet(satirlar);
  // Sütun genişliklerini otomatik ayarla
  var maxCols = 0;
  satirlar.forEach(function(r){ if(r.length > maxCols) maxCols = r.length; });
  var colWidths = [];
  for(var ci = 0; ci < maxCols; ci++){
    var max = 8;
    satirlar.forEach(function(r){
      var val = r[ci];
      if(val !== undefined && val !== null){
        var len = String(val).length;
        if(len > max) max = len;
      }
    });
    colWidths.push({ wch: Math.min(max + 3, 45) });
  }
  ws['!cols'] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, sayfaAdi || "Rapor");
  XLSX.writeFile(wb, dosyaAdi + ".xlsx");
}

export function exportAsansorlerExcel(elevs, bal){
  if(!elevs||elevs.length===0){alert("D\u0131\u015fa aktar\u0131lacak asan\u00f6r verisi yok!");return;}
  var simdi=new Date();
  var gg=simdi.getDate().toString().padStart(2,"0");
  var aa=(simdi.getMonth()+1).toString().padStart(2,"0");
  var yyyy=simdi.getFullYear();
  var ss=simdi.getHours().toString().padStart(2,"0");
  var dd=simdi.getMinutes().toString().padStart(2,"0");
  var tarihStr=gg+"."+aa+"."+yyyy;
  var saatStr=ss+":"+dd;
  var tarihSaatStr=tarihStr+" "+saatStr;
  var satirlar=[];
  satirlar.push(["Rapor Tarihi:",tarihSaatStr,"","","","","","",""]);
  satirlar.push(["Toplam Asan\u00f6r:",elevs.length+" adet","","","","","","",""]);
  satirlar.push([]);
  satirlar.push(["Bina Ad\u0131","\u0130l\u00e7e","Adres","Y\u00f6netici Ad\u0131","Y\u00f6netici Dairesi","Y\u00f6netici Numaras\u0131","Bak\u0131m G\u00fcn\u00fc","Ayl\u0131k Bak\u0131m \u00dccreti (\u20ba)","Devir Bakiye (\u20ba)"]);
  elevs.forEach(function(e){
    satirlar.push([e.ad||"",e.ilce||"",e.adres||"",e.yonetici||"",e.yoneticiDaire||"",e.tel||"",e.bakimGunu?("Her ay\u0131n "+e.bakimGunu+". g\u00fcn\u00fc"):"",e.aylikUcret||0,bal(e.id)||0]);
  });
  var toplamUcret=elevs.reduce(function(s,e){return s+(e.aylikUcret||0);},0);
  var toplamDevir=elevs.reduce(function(s,e){return s+(bal(e.id)||0);},0);
  satirlar.push([]);
  satirlar.push(["TOPLAM","","","","","","",toplamUcret,toplamDevir]);
  toXLSX(satirlar, tarihStr+" "+saatStr+" ASİS AYLIK BAKIM", "Asansörler");
}

export function exportExcel(odemeler, dosyaAdi){
  if(!odemeler||odemeler.length===0){alert("Dışa aktarılacak veri yok!");return;}
  var baslik=["Tarih","Saat","Bina","İlçe","Yönetici","Alınan (₺)","Not"];
  var satirlar=[baslik].concat(odemeler.map(function(o){
    return [o.tarih||"",o.saat||"",o.binaAd||o.ad||"",o.ilce||"",o.yonetici||"",(o.alinanTutar||0),o.not||""];
  }));
  // Toplam satırı ekle
  var toplamTutar=odemeler.reduce(function(s,o){return s+(o.alinanTutar||0);},0);
  satirlar.push(["","","","","","",""]); // boş satır
  satirlar.push(["TOPLAM","","","","",toplamTutar,odemeler.length+" ödeme"]);
  
  toXLSX(satirlar, dosyaAdi||"odeme_raporu", "Ödemeler");
}
