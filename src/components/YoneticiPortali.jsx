import React, { useState, useMemo } from 'react'
import { MONTHS } from '../utils/constants.js'
import { dbGet, dbSet, getTenantId } from '../firebase.js'

/* Bina self-servis linki: token üret / mevcut olanı bul, URL'yi kopyala */
function binaTokenUret() {
  var arr = new Uint8Array(18)
  ;(window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(arr) : arr.forEach(function (_, i) { arr[i] = Math.floor(Math.random() * 256) })
  var s = ''
  for (var i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i])
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function binaLinkiKopyala(elev) {
  try {
    var mevcut = (await dbGet('at_bina_links')) || {}
    if (Array.isArray(mevcut)) mevcut = {}
    var token = null
    for (var k in mevcut) {
      if (mevcut[k] && Number(mevcut[k].elevId) === Number(elev.id) && mevcut[k].aktif !== false) { token = k; break }
    }
    if (!token) {
      token = binaTokenUret()
      mevcut[token] = { elevId: elev.id, ad: elev.ad || '', olusturma: new Date().toISOString() }
      var ok = await dbSet('at_bina_links', mevcut)
      if (ok === false) { alert('Link kaydedilemedi (bağlantı/izin). Tekrar deneyin.'); return }
    }
    var url = window.location.origin + '/?f=' + encodeURIComponent(getTenantId() || 'asis') + '&bina=' + token
    var kopyalandi = false
    try { await navigator.clipboard.writeText(url); kopyalandi = true } catch (e) {}
    if (kopyalandi) {
      alert('🔗 Bina yöneticisi linki kopyalandı!\n\nBu linki bina yöneticisine WhatsApp ile gönderebilirsiniz. Link ile sadece bu binanın bakım geçmişi, ödemeleri ve bakiyesi görünür — giriş gerektirmez.\n\n' + url)
    } else {
      window.prompt('Linki kopyalayın:', url)
    }
  } catch (e) {
    alert('Link oluşturulamadı: ' + (e && e.message))
  }
}

function ekstraSiraKey(k){
  return String(k.tarih||"") + " " + String(k.saat||"");
}

export default function YoneticiPortali({elevs, maints, faults, muayeneler, sozlesmeler, ekstraIsler, sonOdemeler}){
  const [seciliId, setSeciliId] = useState(null);
  const [aramaText, setAramaText] = useState("");
  const [ilce, setIlce] = useState("Tümü");

  const ilceler = useMemo(()=>[...new Set(elevs.map(e=>e.ilce))].sort(),[elevs]);

  const filteredElevs = useMemo(()=>{
    let list = elevs;
    if(ilce!=="Tümü") list = list.filter(e=>e.ilce===ilce);
    if(aramaText.trim()) list = list.filter(e=>
      e.ad.toLowerCase().includes(aramaText.toLowerCase())||
      (e.yonetici||"").toLowerCase().includes(aramaText.toLowerCase())
    );
    return list;
  },[elevs,ilce,aramaText]);

  const secili = elevs.find(e=>e.id===seciliId);
  const eBakim = useMemo(()=>seciliId?[...maints.filter(m=>m.asansorId===seciliId)].sort((a,b)=>b.tarih.localeCompare(a.tarih)):[],[maints,seciliId]);
  const eAriza = useMemo(()=>seciliId?[...faults.filter(f=>f.asansorId===seciliId)].sort((a,b)=>(b.id||0)-(a.id||0)):[],[faults,seciliId]);
  const eMuayene = useMemo(()=>seciliId?muayeneler.filter(m=>m.asansorId===seciliId):[],[muayeneler,seciliId]);
  const eSozlesme = useMemo(()=>seciliId?sozlesmeler.filter(s=>s.asansorId===seciliId):[],[sozlesmeler,seciliId]);
  const eEkstra = useMemo(
    ()=>seciliId
      ? [...(ekstraIsler||[]).filter(k=>Number(k.binaId)===Number(seciliId))].sort((a,b)=>ekstraSiraKey(b).localeCompare(ekstraSiraKey(a)))
      : [],
    [ekstraIsler,seciliId]
  );
  // Alınan ödemeler: sonOdemeler kayıtları (iptal edilmemiş), yeniden eskiye
  const eOdemeler = useMemo(
    ()=>seciliId
      ? [...(sonOdemeler||[]).filter(o=>Number(o.aid)===Number(seciliId)&&!o.iptal)]
          .sort((a,b)=>(String(b.tarih||"")+" "+String(b.saat||"")).localeCompare(String(a.tarih||"")+" "+String(a.saat||"")))
      : [],
    [sonOdemeler,seciliId]
  );
  const eOdemeToplam = useMemo(()=>eOdemeler.reduce((s,o)=>s+(Number(o.alinanTutar)||0),0),[eOdemeler]);

  if(secili){
    return (
      <div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
          <button onClick={()=>setSeciliId(null)}
            style={{display:"flex",alignItems:"center",gap:6,background:"var(--bg-elevated)",border:"none",borderRadius:10,padding:"8px 14px",color:"var(--text-muted)",cursor:"pointer",fontWeight:600,fontSize:13}}>
            ← Geri
          </button>
          <button onClick={()=>binaLinkiKopyala(secili)}
            style={{display:"flex",alignItems:"center",gap:6,background:"linear-gradient(135deg,#2563eb,#1d4ed8)",border:"none",borderRadius:10,padding:"8px 14px",color:"#fff",cursor:"pointer",fontWeight:800,fontSize:12}}>
            🔗 Bina Yöneticisi Linki
          </button>
        </div>

        {/* Asansör Başlığı */}
        <div style={{background:"var(--bg-panel)",borderRadius:16,padding:"16px",marginBottom:12,borderLeft:"4px solid var(--accent)"}}>
          <div style={{fontWeight:800,fontSize:17,color:"var(--text)",marginBottom:4}}>{secili.ad}</div>
          <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:2}}>📍 {secili.semt?secili.semt+" Mah., ":""}{secili.adres}, {secili.ilce}</div>
          <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:2}}>👤 {secili.yonetici} · 📞 {secili.tel}</div>
          {secili.yoneticiDaire&&<div style={{fontSize:12,color:"var(--ios-orange)"}}>🚪 Daire: {secili.yoneticiDaire}</div>}
          {/* Teknik Kart */}
          {(secili.marka||secili.model||secili.seriNo||secili.tip)&&(
            <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,padding:"10px 12px",background:"var(--bg-elevated)",borderRadius:10}}>
              <div style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",gridColumn:"1/-1",marginBottom:4}}>🔩 Teknik Bilgiler</div>
              {secili.marka&&<div style={{fontSize:11}}><span style={{color:"var(--text-muted)"}}>Marka: </span><b>{secili.marka}</b></div>}
              {secili.model&&<div style={{fontSize:11}}><span style={{color:"var(--text-muted)"}}>Model: </span><b>{secili.model}</b></div>}
              {secili.seriNo&&<div style={{fontSize:11}}><span style={{color:"var(--text-muted)"}}>Seri No: </span><b>{secili.seriNo}</b></div>}
              {secili.imalatYili&&<div style={{fontSize:11}}><span style={{color:"var(--text-muted)"}}>İmalat Yılı: </span><b>{secili.imalatYili}</b></div>}
              {secili.kapasite&&<div style={{fontSize:11}}><span style={{color:"var(--text-muted)"}}>Kapasite: </span><b>{secili.kapasite} kg</b></div>}
              {secili.hiz&&<div style={{fontSize:11}}><span style={{color:"var(--text-muted)"}}>Hız: </span><b>{secili.hiz} m/s</b></div>}
              {secili.tip&&<div style={{fontSize:11}}><span style={{color:"var(--text-muted)"}}>Tip: </span><b>{secili.tip}</b></div>}
            </div>
          )}
          {/* Finansal Özet */}
          <div style={{marginTop:10,display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,padding:"10px 12px",background:"var(--bg-elevated)",borderRadius:10}}>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:800,color:(Number(secili.bakiyeDevir)||0)>0?"var(--ios-red)":"var(--ios-green)"}}>{(Number(secili.bakiyeDevir)||0).toLocaleString("tr-TR")} ₺</div>
              <div style={{fontSize:10,color:"var(--text-muted)",marginTop:1}}>Devir Bakiye</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:800,color:"var(--accent)"}}>{(Number(secili.aylikUcret)||0).toLocaleString("tr-TR")} ₺</div>
              <div style={{fontSize:10,color:"var(--text-muted)",marginTop:1}}>Aylık Ücret</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:14,fontWeight:800,color:"var(--ios-green)"}}>{eOdemeToplam.toLocaleString("tr-TR")} ₺</div>
              <div style={{fontSize:10,color:"var(--text-muted)",marginTop:1}}>Toplam Tahsilat</div>
            </div>
          </div>
        </div>

        {/* Alınan Ödemeler */}
        <div style={{background:"var(--bg-panel)",borderRadius:14,overflow:"hidden",marginBottom:10}}>
          <div style={{padding:"12px 14px 8px",fontWeight:700,fontSize:14,borderBottom:"0.5px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span>💰 Alınan Ödemeler</span>
            {eOdemeler.length>0&&<span style={{fontSize:11,fontWeight:700,color:"var(--ios-green)"}}>{eOdemeler.length} ödeme</span>}
          </div>
          {eOdemeler.length===0
            ?<div style={{padding:12,color:"var(--text-dim)",fontSize:13}}>Ödeme kaydı yok.</div>
            :eOdemeler.slice(0,15).map(o=>(
              <div key={o.id} style={{padding:"10px 14px",borderTop:"0.5px solid var(--border-soft)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>📅 {o.tarih}{o.saat?" · 🕐 "+o.saat:""}</div>
                  {(o.not||o.tahsilatYapan)&&<div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>
                    {o.not?"📝 "+o.not:""}{o.not&&o.tahsilatYapan?" · ":""}{o.tahsilatYapan?"🔧 "+o.tahsilatYapan:""}
                  </div>}
                </div>
                <div style={{fontSize:13,fontWeight:800,color:"var(--ios-green)",whiteSpace:"nowrap"}}>+{(Number(o.alinanTutar)||0).toLocaleString("tr-TR")} ₺</div>
              </div>
            ))
          }
          {eOdemeler.length>15&&<div style={{padding:"8px 14px",fontSize:11,color:"var(--text-muted)",textAlign:"center",borderTop:"0.5px solid var(--border-soft)"}}>+{eOdemeler.length-15} ödeme daha (Finans sekmesinde)</div>}
        </div>

        {/* Son Bakım Geçmişi */}
        <div style={{background:"var(--bg-panel)",borderRadius:14,overflow:"hidden",marginBottom:10}}>
          <div style={{padding:"12px 14px 8px",fontWeight:700,fontSize:14,borderBottom:"0.5px solid var(--border)"}}>🔧 Bakım Geçmişi</div>
          {eBakim.length===0
            ?<div style={{padding:12,color:"var(--text-dim)",fontSize:13}}>Bakım kaydı yok.</div>
            :eBakim.slice(0,10).map(m=>(
              <div key={m.id} style={{padding:"10px 14px",borderTop:"0.5px solid var(--border-soft)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:m.yapildi?"var(--ios-green)":"var(--text-muted)"}}>
                    {m.yapildi?"✅ Yapıldı":"⏳ Bekliyor"} · {m.tarih}
                  </div>
                  {m.yapildiSaat&&<div style={{fontSize:11,color:"var(--text-dim)"}}>{m.yapildiSaat}</div>}
                  {m.notlar&&<div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>📝 {m.notlar}</div>}
                </div>
                {m.yapildi&&(function(){
                  var alinan=(m.alinanTutar!==undefined&&m.alinanTutar!==null&&m.alinanTutar!=="")?(Number(m.alinanTutar)||0):(m.odendi?(Number(m.tutar)||0):0);
                  return alinan>0
                    ?<div style={{fontSize:12,fontWeight:700,color:"var(--ios-green)",whiteSpace:"nowrap"}}>+{alinan.toLocaleString("tr-TR")} ₺</div>
                    :<div style={{fontSize:11,fontWeight:700,color:"var(--ios-red)",whiteSpace:"nowrap"}}>ödeme alınmadı</div>;
                })()}
              </div>
            ))
          }
        </div>

        {/* Ekstra İş Geçmişi (Bakımın altında) */}
        <div style={{background:"var(--bg-panel)",borderRadius:14,overflow:"hidden",marginBottom:10}}>
          <div style={{padding:"12px 14px 8px",fontWeight:700,fontSize:14,borderBottom:"0.5px solid var(--border)"}}>🔩 Takılan Parçalar & Ekstra İşler</div>
          {eEkstra.length===0
            ?<div style={{padding:12,color:"var(--text-dim)",fontSize:13}}>Parça / ekstra iş kaydı yok.</div>
            :eEkstra.slice(0,10).map(k=>(
              <div key={k.id} style={{padding:"10px 14px",borderTop:"0.5px solid var(--border-soft)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{k.isAdi||"Ekstra İş"}</div>
                  <div style={{fontSize:11,color:"var(--text-muted)"}}>📅 {k.tarih||"—"}{k.saat?" · "+k.saat:""}</div>
                  {k.not&&<div style={{fontSize:11,color:"var(--text-dim)",marginTop:2}}>📝 {k.not}</div>}
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontWeight:800,color:k.odendi?"var(--ios-green)":"var(--ios-orange)"}}>
                    {(+k.tutar||0).toLocaleString("tr-TR")} ₺
                  </div>
                  <div style={{fontSize:10,color:k.odendi?"var(--ios-green)":"var(--ios-orange)",fontWeight:600}}>
                    {k.odendi?"Ödendi":"Devire eklendi"}
                  </div>
                </div>
              </div>
            ))
          }
        </div>

        {/* Arıza Geçmişi */}
        <div style={{background:"var(--bg-panel)",borderRadius:14,overflow:"hidden",marginBottom:10}}>
          <div style={{padding:"12px 14px 8px",fontWeight:700,fontSize:14,borderBottom:"0.5px solid var(--border)"}}>⚠️ Arıza Geçmişi</div>
          {eAriza.length===0
            ?<div style={{padding:12,color:"var(--text-dim)",fontSize:13}}>Arıza kaydı yok. ✅</div>
            :eAriza.slice(0,8).map(f=>(
              <div key={f.id} style={{padding:"10px 14px",borderTop:"0.5px solid var(--border-soft)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{f.aciklama}</div>
                  <span style={{fontSize:11,padding:"2px 8px",borderRadius:20,background:f.durum==="Çözüldü"?"rgba(52,199,89,0.15)":"rgba(255,59,48,0.15)",
                    color:f.durum==="Çözüldü"?"var(--ios-green)":"var(--ios-red)",fontWeight:600}}>{f.durum}</span>
                </div>
                <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2}}>{f.tarih} · Öncelik: {f.oncelik||"Normal"}</div>
              </div>
            ))
          }
        </div>

        {/* Muayene Geçmişi */}
        {eMuayene.length>0&&(
          <div style={{background:"var(--bg-panel)",borderRadius:14,overflow:"hidden",marginBottom:10}}>
            <div style={{padding:"12px 14px 8px",fontWeight:700,fontSize:14,borderBottom:"0.5px solid var(--border)"}}>🔍 Muayene Kayıtları</div>
            {eMuayene.map(m=>(
              <div key={m.id} style={{padding:"10px 14px",borderTop:"0.5px solid var(--border-soft)"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:13,fontWeight:600}}>{m.tarih} · {m.kurum}</span>
                  <span style={{fontSize:12,fontWeight:700,color:m.sonuc==="Geçti"?"var(--ios-green)":"var(--ios-red)"}}>{m.sonuc}</span>
                </div>
                <div style={{fontSize:11,color:"var(--text-muted)"}}>Sonraki: {m.sonrakiTarih||"—"} · Sertifika: {m.sertifikaNo||"—"}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sözleşmeler */}
        {eSozlesme.length>0&&(
          <div style={{background:"var(--bg-panel)",borderRadius:14,overflow:"hidden",marginBottom:10}}>
            <div style={{padding:"12px 14px 8px",fontWeight:700,fontSize:14,borderBottom:"0.5px solid var(--border)"}}>📄 Sözleşmeler</div>
            {eSozlesme.map(s=>(
              <div key={s.id} style={{padding:"10px 14px",borderTop:"0.5px solid var(--border-soft)"}}>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:13,fontWeight:600}}>{s.tur||"Bakım"}</span>
                  <span style={{fontSize:12,fontWeight:700,color:"var(--ios-green)"}}>{(+s.ucret||0).toLocaleString("tr-TR")} ₺/ay</span>
                </div>
                <div style={{fontSize:11,color:"var(--text-muted)"}}>{s.baslangic} → {s.bitis}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{fontSize:18,fontWeight:900,marginBottom:14,marginTop:4}}>🏢 Bina Yöneticisi Portali</h2>
      <div style={{fontSize:12,color:"var(--text-muted)",background:"var(--bg-panel)",borderRadius:10,padding:"10px 12px",marginBottom:14}}>
        💡 Bina yöneticilerine gösterilecek salt-okunur bakım ve arıza özeti. Bir bina seçin.
      </div>

      {/* Arama + İlçe Filtresi */}
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <input value={aramaText} onChange={e=>setAramaText(e.target.value)} placeholder="🔍 Bina veya yönetici ara..."
          style={{flex:1,minWidth:160,background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"9px 12px",color:"var(--text)",fontSize:13,outline:"none"}}/>
        <select value={ilce} onChange={e=>setIlce(e.target.value)}
          style={{background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"9px 12px",color:"var(--text)",fontSize:12,outline:"none",cursor:"pointer"}}>
          <option value="Tümü">Tüm İlçeler</option>
          {ilceler.map(i=><option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {filteredElevs.length===0&&(
        <div style={{textAlign:"center",padding:32,color:"var(--text-dim)",fontSize:14}}>Sonuç bulunamadı.</div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:8}}>
        {filteredElevs.map(e=>{
          const eSonBakim = maints.filter(m=>m.asansorId===e.id&&m.yapildi).sort((a,b)=>b.tarih.localeCompare(a.tarih))[0];
          const eAcikAriza = faults.filter(f=>f.asansorId===e.id&&f.durum!=="Çözüldü").length;
          const eSonMuayene = muayeneler.filter(m=>m.asansorId===e.id).sort((a,b)=>b.tarih.localeCompare(a.tarih))[0];
          return (
            <button key={e.id} onClick={()=>setSeciliId(e.id)}
              style={{background:"var(--bg-panel)",borderRadius:12,padding:"12px",border:"1px solid var(--border-soft)",
                cursor:"pointer",textAlign:"left",transition:"border-color 0.15s",display:"flex",flexDirection:"column",gap:4}}>
              <div style={{fontWeight:700,fontSize:13,color:"var(--text)"}}>{e.ad}</div>
              <div style={{fontSize:11,color:"var(--text-muted)"}}>📍 {e.ilce} · {e.semt||""}</div>
              <div style={{fontSize:11,color:"var(--text-muted)"}}>👤 {e.yonetici}</div>
              <div style={{display:"flex",gap:6,marginTop:4,flexWrap:"wrap"}}>
                <span style={{fontSize:10,padding:"2px 7px",borderRadius:6,background:"rgba(52,199,89,0.12)",color:"var(--ios-green)",fontWeight:600}}>
                  🔧 {eSonBakim?eSonBakim.tarih:"Bakım yok"}
                </span>
                {eAcikAriza>0&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:6,background:"rgba(255,59,48,0.12)",color:"var(--ios-red)",fontWeight:600}}>
                  ⚠️ {eAcikAriza} arıza
                </span>}
                {eSonMuayene&&<span style={{fontSize:10,padding:"2px 7px",borderRadius:6,background:"rgba(59,130,246,0.12)",color:"var(--accent)",fontWeight:600}}>
                  🔍 {eSonMuayene.sonrakiTarih||eSonMuayene.tarih}
                </span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
