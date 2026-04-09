import React, { useState, useMemo } from 'react'

const KURUM_LISTESI = ["TSE","TÜRKAK","Belediye","Özel Akredite Kuruluş","Diğer"];
const AY_ADLARI = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function gunKaldi(tarihStr){
  if(!tarihStr) return null;
  const bugun = new Date(); bugun.setHours(0,0,0,0);
  const hedef = new Date(tarihStr); hedef.setHours(0,0,0,0);
  if(isNaN(hedef)) return null;
  return Math.round((hedef - bugun) / 86400000);
}

function durumRenk(gk){
  if(gk===null) return "#64748b";
  if(gk < 0)   return "#ef4444";
  if(gk <= 30)  return "#f59e0b";
  if(gk <= 90)  return "#3b82f6";
  return "#34c759";
}

function durumMetin(gk){
  if(gk===null) return "Tarih yok";
  if(gk < 0)   return `${Math.abs(gk)} gün gecikti`;
  if(gk === 0)  return "Bugün!";
  return `${gk} gün kaldı`;
}

// Muayene tarihinden +1 yıl hesapla
function sonrakiHesapla(tarihStr){
  if(!tarihStr) return "";
  const d = new Date(tarihStr);
  if(isNaN(d)) return "";
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

// "YYYY-MM" döndür, gruplama için
function ayAnahtar(tarihStr){
  if(!tarihStr) return "9999-99";
  const d = new Date(tarihStr);
  if(isNaN(d)) return "9999-99";
  return d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0");
}

function ayBaslik(anahtarStr){
  if(anahtarStr === "9999-99") return "Tarih Belirtilmemiş";
  const [yil, ay] = anahtarStr.split("-");
  return AY_ADLARI[parseInt(ay)-1] + " " + yil;
}

function MuayeneKart({m, elev, onEdit, onDel}){
  const sonraki = m.sonrakiTarih || sonrakiHesapla(m.tarih);
  const gk = gunKaldi(sonraki);
  const renk = durumRenk(gk);
  const ikon = gk===null?"⚪":gk<0?"🔴":gk<=30?"🟡":gk<=90?"🔵":"🟢";

  return (
    <div style={{background:"var(--bg-panel)",borderRadius:12,padding:"11px 14px",marginBottom:6,
      border:`1px solid ${renk}33`,borderLeft:`4px solid ${renk}`,
      display:"flex",alignItems:"center",gap:12}}>
      {/* Sol: bina bilgisi */}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontWeight:700,fontSize:13,color:"var(--text)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
          {elev?.ad||"?"}
        </div>
        <div style={{fontSize:11,color:"var(--text-muted)"}}>
          {elev?.ilce}{elev?.semt?" · "+elev.semt:""}
        </div>
        {m.tarih&&(
          <div style={{fontSize:10,color:"var(--text-dim)",marginTop:2}}>
            Son muayene: {m.tarih}
          </div>
        )}
        {(m.sertifikaNo||m.kurum)&&(
          <div style={{fontSize:10,color:"var(--text-dim)"}}>
            {m.kurum&&<span>{m.kurum}</span>}
            {m.kurum&&m.sertifikaNo&&<span> · </span>}
            {m.sertifikaNo&&<span>No: {m.sertifikaNo}</span>}
          </div>
        )}
      </div>

      {/* Orta: sonraki tarih + gün bilgisi */}
      <div style={{textAlign:"center",flexShrink:0}}>
        <div style={{fontSize:13,fontWeight:800,color:renk}}>{sonraki||"—"}</div>
        <div style={{fontSize:11,fontWeight:600,color:renk}}>{ikon} {durumMetin(gk)}</div>
      </div>

      {/* Sağ: butonlar */}
      <div style={{display:"flex",gap:4,flexShrink:0}}>
        <button onClick={()=>onEdit(m)}
          style={{background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"5px 8px",cursor:"pointer",fontSize:12,color:"var(--text-muted)"}}>✏️</button>
        <button onClick={()=>onDel(m.id)}
          style={{background:"rgba(255,59,48,0.12)",border:"none",borderRadius:8,padding:"5px 8px",cursor:"pointer",fontSize:12,color:"#ef4444"}}>🗑️</button>
      </div>
    </div>
  );
}

export default function MuayeneTakibi({elevs, muayeneler, setMuayeneler}){
  const today = new Date().toISOString().split("T")[0];
  const [ilce, setIlce] = useState("Tümü");
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const F = (k,v) => setForm(p=>({...p,[k]:v}));

  const ilceler = useMemo(()=>[...new Set(elevs.map(e=>e.ilce))].sort(),[elevs]);

  // Sonraki muayene tarihini her kayıt için normalize et
  const normalized = useMemo(()=>muayeneler.map(m=>({
    ...m,
    sonrakiTarih: m.sonrakiTarih || sonrakiHesapla(m.tarih)
  })),[muayeneler]);

  // Sayaçlar
  const gecikti = useMemo(()=>normalized.filter(m=>{ const g=gunKaldi(m.sonrakiTarih); return g!==null&&g<0; }).length,[normalized]);
  const buAy    = useMemo(()=>{ const anahtar=ayAnahtar(today); return normalized.filter(m=>ayAnahtar(m.sonrakiTarih)===anahtar&&gunKaldi(m.sonrakiTarih)>=0).length; },[normalized,today]);
  const sonraki30 = useMemo(()=>normalized.filter(m=>{ const g=gunKaldi(m.sonrakiTarih); return g!==null&&g>0&&g<=30; }).length,[normalized]);

  // Filtrele ve sırala
  const grouped = useMemo(()=>{
    let list = [...normalized];
    if(ilce!=="Tümü") list = list.filter(m=>(elevs.find(e=>e.id===m.asansorId)?.ilce||"")===ilce);

    // Sıralama: gecikmiş önce (en çok geciken önce), sonra yaklaşandan uzağa
    list.sort((a,b)=>{
      const ga = gunKaldi(a.sonrakiTarih);
      const gb = gunKaldi(b.sonrakiTarih);
      if(ga===null&&gb===null) return 0;
      if(ga===null) return 1;
      if(gb===null) return -1;
      // Her ikisi de gecikmiş → en çok geciken önce (en küçük negatif = en eski)
      if(ga<0&&gb<0) return ga-gb;
      // Gecikmiş, diğeri değil → gecikmiş önce
      if(ga<0) return -1;
      if(gb<0) return 1;
      // Her ikisi de gelecekte → en yakın önce
      return ga-gb;
    });

    // Aylara göre grupla
    const aylar = {};
    list.forEach(m=>{
      const gk = gunKaldi(m.sonrakiTarih);
      // Gecikmiş olanlar "Geçmiş" grubuna
      const anahtar = gk!==null&&gk<0 ? "0000-00" : ayAnahtar(m.sonrakiTarih);
      if(!aylar[anahtar]) aylar[anahtar]=[];
      aylar[anahtar].push(m);
    });

    // Sıralı gruplar
    return Object.keys(aylar).sort().map(k=>({
      anahtar: k,
      baslik: k==="0000-00"?"⚠️ Süresi Geçmiş":ayBaslik(k),
      renk: k==="0000-00"?"#ef4444":"#3b82f6",
      kayitlar: aylar[k]
    }));
  },[normalized,ilce,elevs]);

  const oEdit = (m) => {
    setEdit(m);
    setForm({...m});
    setModal(true);
  };
  const oAdd = () => {
    setEdit(null);
    setForm({tarih:today,asansorId:"",kurum:"TSE",sertifikaNo:"",notlar:""});
    setModal(true);
  };
  const close = () => { setModal(false); setEdit(null); setForm({}); };
  const save = () => {
    if(!form.asansorId){alert("Asansör seçiniz!");return;}
    // Sonraki tarihi otomatik hesapla
    const sonrakiTarih = sonrakiHesapla(form.tarih);
    const d = {...form, asansorId:+form.asansorId||form.asansorId, sonrakiTarih};
    if(edit) setMuayeneler(p=>p.map(x=>x.id===edit.id?{...x,...d}:x));
    else setMuayeneler(p=>[...p,{...d,id:Date.now()}]);
    close();
  };
  const onDel = (id) => { if(window.confirm("Bu muayene kaydı silinsin mi?")) setMuayeneler(p=>p.filter(x=>x.id!==id)); };

  const onizlemeSonraki = sonrakiHesapla(form.tarih);

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <h2 style={{fontSize:18,fontWeight:900,margin:0}}>📋 Yıllık Muayene Takibi</h2>
        <button onClick={oAdd} style={{background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ Muayene Ekle</button>
      </div>

      {/* Sayaçlar */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
        {[
          {label:"Süresi Geçmiş",count:gecikti,renk:"#ef4444",ikon:"🔴"},
          {label:"Bu Ay",count:buAy,renk:"#f59e0b",ikon:"🟡"},
          {label:"30 Gün İçinde",count:sonraki30,renk:"#3b82f6",ikon:"🔵"},
        ].map(x=>(
          <div key={x.label} style={{background:"var(--bg-panel)",border:`1px solid ${x.renk}44`,
            borderRadius:12,padding:"10px 8px",textAlign:"center"}}>
            <div style={{fontSize:22,fontWeight:900,color:x.renk}}>{x.count}</div>
            <div style={{fontSize:10,color:"var(--text-muted)",fontWeight:600,marginTop:2}}>{x.ikon} {x.label}</div>
          </div>
        ))}
      </div>

      {/* İlçe filtresi */}
      <div style={{marginBottom:12}}>
        <select value={ilce} onChange={e=>setIlce(e.target.value)}
          style={{background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"7px 10px",color:"var(--text)",fontSize:12,outline:"none",cursor:"pointer"}}>
          <option value="Tümü">Tüm İlçeler</option>
          {ilceler.map(i=><option key={i} value={i}>{i}</option>)}
        </select>
      </div>

      {/* Gruplu liste */}
      {grouped.length===0&&(
        <div style={{textAlign:"center",padding:32,color:"var(--text-dim)",fontSize:14}}>
          {muayeneler.length===0?"Henüz muayene kaydı yok. '+ Muayene Ekle' ile başlayın.":"Filtre sonucu boş."}
        </div>
      )}
      {grouped.map(grup=>(
        <div key={grup.anahtar} style={{marginBottom:16}}>
          {/* Ay başlığı */}
          <div style={{fontSize:12,fontWeight:800,color:grup.renk,marginBottom:8,
            padding:"5px 10px",background:`${grup.renk}11`,borderRadius:8,
            display:"inline-flex",alignItems:"center",gap:6}}>
            📅 {grup.baslik}
            <span style={{background:grup.renk,color:"#fff",borderRadius:20,
              fontSize:10,padding:"1px 7px",fontWeight:900}}>{grup.kayitlar.length}</span>
          </div>
          {grup.kayitlar.map(m=>(
            <MuayeneKart key={m.id} m={m} elev={elevs.find(e=>e.id===m.asansorId)} onEdit={oEdit} onDel={onDel}/>
          ))}
        </div>
      ))}

      {/* Modal */}
      {modal&&(
        <div className="ios-modal-overlay" style={{zIndex:3000}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
          <div className="ios-modal-sheet" style={{maxWidth:520,minHeight:"70vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div className="ios-modal-handle" style={{flexShrink:0}}/>
            <div className="ios-modal-header" style={{flexShrink:0}}>
              <div className="ios-modal-title">{edit?"Muayene Düzenle":"Yeni Muayene Kaydı"}</div>
              <button onClick={close} style={{background:"var(--bg-elevated)",border:"none",color:"var(--text-muted)",fontSize:15,cursor:"pointer",borderRadius:20,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600}}>✕</button>
            </div>
            <div className="ios-modal-body" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:12}}>

              {/* Asansör / Bina seçimi */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>Asansör / Bina *</label>
                <select value={form.asansorId||""} onChange={e=>F("asansorId",+e.target.value)}
                  style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",cursor:"pointer"}}>
                  <option value="">— Bina seçin —</option>
                  {ilceler.map(ilce=>(
                    <optgroup key={ilce} label={ilce}>
                      {elevs.filter(e=>e.ilce===ilce).map(e=><option key={e.id} value={e.id}>{e.ad}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Muayene tarihi + Sonraki önizleme yan yana */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>Muayene Tarihi *</label>
                  <input type="date" value={form.tarih||""} onChange={e=>F("tarih",e.target.value)}
                    style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",boxSizing:"border-box",cursor:"pointer"}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>Sonraki (otomatik)</label>
                  <div style={{background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.2)",borderRadius:8,padding:"10px 12px",fontSize:13,fontWeight:800,color:"#3b82f6",minHeight:40,display:"flex",alignItems:"center"}}>
                    {onizlemeSonraki||"—"}
                  </div>
                </div>
              </div>

              {/* Notlar */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>Notlar</label>
                <textarea value={form.notlar||""} onChange={e=>F("notlar",e.target.value)} rows={2}
                  placeholder="Opsiyonel"
                  style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",resize:"none",boxSizing:"border-box"}}/>
              </div>
            </div>
            <div style={{padding:"8px 18px 10px",display:"flex",gap:10,flexShrink:0}}>
              <button onClick={close} style={{flex:1,padding:"13px",background:"var(--bg-elevated)",border:"none",borderRadius:14,color:"var(--text-muted)",cursor:"pointer",fontWeight:600,fontSize:15,minHeight:50}}>İptal</button>
              <button onClick={save} style={{flex:1,padding:"13px",background:"var(--accent)",border:"none",borderRadius:14,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:15,minHeight:50}}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
