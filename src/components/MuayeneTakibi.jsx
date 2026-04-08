import React, { useState, useMemo } from 'react'

const KURUM_LISTESI = ["TSE","TÜRKAK","Belediye","Özel Akredite Kuruluş","Diğer"];
const SONUC_LISTESI = ["Geçti","Kaldı","Koşullu Geçti","Askıya Alındı"];

function gunKaldi(tarihStr){
  if(!tarihStr) return null;
  const bugun = new Date(); bugun.setHours(0,0,0,0);
  const hedef = new Date(tarihStr); hedef.setHours(0,0,0,0);
  if(isNaN(hedef)) return null;
  return Math.round((hedef - bugun) / 86400000);
}

function durumRenk(gk){
  if(gk===null) return "#64748b";
  if(gk < 0) return "#ef4444";
  if(gk <= 30) return "#f59e0b";
  if(gk <= 60) return "#3b82f6";
  return "#34c759";
}

function durumMetin(gk){
  if(gk===null) return "Tarih yok";
  if(gk < 0) return `${Math.abs(gk)} gün gecikti`;
  if(gk === 0) return "Bugün!";
  return `${gk} gün kaldı`;
}

function MuayeneKart({m, elev, onEdit, onDel}){
  const gk = gunKaldi(m.sonrakiTarih);
  const renk = durumRenk(gk);
  const durum = durumMetin(gk);
  const ikon = gk===null?"⚪":gk<0?"🔴":gk<=30?"🟡":gk<=60?"🔵":"🟢";
  return (
    <div style={{background:"var(--bg-panel)",borderRadius:14,padding:"12px 14px",marginBottom:8,
      border:`1px solid ${renk}44`,borderLeft:`4px solid ${renk}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
        <div>
          <div style={{fontWeight:700,fontSize:13,color:"var(--text)"}}>{elev?.ad || "?"}</div>
          <div style={{fontSize:11,color:"var(--text-muted)"}}>{elev?.ilce}{elev?.semt ? " · "+elev.semt : ""}</div>
        </div>
        <div style={{display:"flex",gap:4}}>
          <button onClick={()=>onEdit(m)} style={{background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:12,color:"var(--text-muted)"}}>✏️</button>
          <button onClick={()=>onDel(m.id)} style={{background:"rgba(255,59,48,0.12)",border:"none",borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:12,color:"#ef4444"}}>🗑️</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,fontSize:11}}>
        <div><span style={{color:"var(--text-muted)"}}>Muayene Tarihi: </span><span style={{fontWeight:600}}>{m.tarih||"—"}</span></div>
        <div><span style={{color:"var(--text-muted)"}}>Sonraki: </span><span style={{color:renk,fontWeight:700}}>{m.sonrakiTarih||"—"}</span></div>
        <div><span style={{color:"var(--text-muted)"}}>Kurum: </span><span style={{fontWeight:600}}>{m.kurum||"—"}</span></div>
        <div><span style={{color:"var(--text-muted)"}}>Sertifika: </span><span style={{fontWeight:600}}>{m.sertifikaNo||"—"}</span></div>
        <div><span style={{color:"var(--text-muted)"}}>Sonuç: </span>
          <span style={{fontWeight:700,color:m.sonuc==="Geçti"?"#34c759":m.sonuc==="Kaldı"?"#ef4444":"#f59e0b"}}>{m.sonuc||"—"}</span>
        </div>
        <div style={{color:renk,fontWeight:700}}>{ikon} {durum}</div>
      </div>
      {m.notlar&&<div style={{fontSize:11,color:"var(--text-muted)",marginTop:6,padding:"6px 8px",background:"var(--bg-elevated)",borderRadius:8}}>📝 {m.notlar}</div>}
    </div>
  );
}

export default function MuayeneTakibi({elevs, muayeneler, setMuayeneler}){
  const today = new Date().toISOString().split("T")[0];
  const [filtre, setFiltre] = useState("tumu");
  const [ilce, setIlce] = useState("Tümü");
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const [seciliIlce, setSeciliIlce] = useState("");
  const F = (k,v) => setForm(p=>({...p,[k]:v}));

  const ilceler = useMemo(()=>[...new Set(elevs.map(e=>e.ilce))].sort(),[elevs]);

  // Sayaçlar
  const gecikti  = useMemo(()=>muayeneler.filter(m=>{ const g=gunKaldi(m.sonrakiTarih); return g!==null&&g<0; }).length,[muayeneler]);
  const yakin30  = useMemo(()=>muayeneler.filter(m=>{ const g=gunKaldi(m.sonrakiTarih); return g!==null&&g>=0&&g<=30; }).length,[muayeneler]);
  const yakin60  = useMemo(()=>muayeneler.filter(m=>{ const g=gunKaldi(m.sonrakiTarih); return g!==null&&g>30&&g<=60; }).length,[muayeneler]);

  // Yaklaşan denetimler (sonraki 90 gün) — sıralı
  const yaklaşanlar = useMemo(()=>
    muayeneler
      .filter(m=>{ const g=gunKaldi(m.sonrakiTarih); return g!==null&&g>=0&&g<=90; })
      .sort((a,b)=>gunKaldi(a.sonrakiTarih)-gunKaldi(b.sonrakiTarih))
  ,[muayeneler]);

  const filtered = useMemo(()=>{
    let list = [...muayeneler];
    if(ilce!=="Tümü") list = list.filter(m=>(elevs.find(x=>x.id===m.asansorId)?.ilce||"")===ilce);
    if(filtre==="gecikti") list = list.filter(m=>{ const g=gunKaldi(m.sonrakiTarih); return g!==null&&g<0; });
    if(filtre==="yakin")   list = list.filter(m=>{ const g=gunKaldi(m.sonrakiTarih); return g!==null&&g>=0&&g<=60; });
    if(filtre==="tamam")   list = list.filter(m=>m.sonuc==="Geçti"&&gunKaldi(m.sonrakiTarih)>=0);
    // Yaklaşan tarih önce, gecikmiş en sona, tarihi olmayanlar en sona
    list.sort((a,b)=>{
      const ga = gunKaldi(a.sonrakiTarih);
      const gb = gunKaldi(b.sonrakiTarih);
      if(ga===null&&gb===null) return 0;
      if(ga===null) return 1;
      if(gb===null) return -1;
      if(ga>=0&&gb>=0) return ga-gb; // yaklaşan: en yakın önce
      if(ga<0&&gb<0) return gb-ga;   // gecikmiş: en çok geciken önce
      if(ga>=0) return -1;           // yaklaşan gecikenden önce
      return 1;
    });
    return list;
  },[muayeneler,filtre,ilce,elevs]);

  const oEdit = (m) => {
    setEdit(m);
    setForm({...m});
    setSeciliIlce(elevs.find(e=>e.id===m.asansorId)?.ilce||"");
    setModal(true);
  };
  const oAdd = () => {
    setEdit(null);
    setForm({tarih:today,sonrakiTarih:"",asansorId:"",kurum:"TSE",sonuc:"Geçti",sertifikaNo:"",notlar:""});
    setSeciliIlce("");
    setModal(true);
  };
  const close = () => { setModal(false); setEdit(null); setForm({}); setSeciliIlce(""); };
  const save = () => {
    if(!form.asansorId){alert("Asansör seçiniz!");return;}
    const d = {...form, asansorId:+form.asansorId||form.asansorId};
    if(edit) setMuayeneler(p=>p.map(x=>x.id===edit.id?{...x,...d}:x));
    else setMuayeneler(p=>[...p,{...d,id:Date.now()}]);
    close();
  };
  const onDel = (id) => { if(window.confirm("Bu muayene kaydı silinsin mi?")) setMuayeneler(p=>p.filter(x=>x.id!==id)); };

  const formIlce = seciliIlce || (edit ? elevs.find(e=>e.id===form.asansorId)?.ilce||"" : "");

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <h2 style={{fontSize:18,fontWeight:900,margin:0}}>🔍 Periyodik Muayene Takibi</h2>
        <button onClick={oAdd} style={{background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ Muayene Ekle</button>
      </div>

      {/* Uyarı sayaçları */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
        {[
          {label:"Gecikmiş",count:gecikti,renk:"#ef4444",icon:"🔴",k:"gecikti"},
          {label:"30 Gün İçinde",count:yakin30,renk:"#f59e0b",icon:"🟡",k:"yakin"},
          {label:"30–60 Gün",count:yakin60,renk:"#3b82f6",icon:"🔵",k:"tumu"},
        ].map(x=>(
          <button key={x.k} onClick={()=>setFiltre(filtre===x.k?"tumu":x.k)}
            style={{background:filtre===x.k?`${x.renk}22`:"var(--bg-panel)",border:`2px solid ${filtre===x.k?x.renk:x.renk+"44"}`,
              borderRadius:12,padding:"10px 8px",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:900,color:x.renk}}>{x.count}</div>
            <div style={{fontSize:10,color:filtre===x.k?x.renk:"var(--text-muted)",fontWeight:600,marginTop:2}}>{x.icon} {x.label}</div>
          </button>
        ))}
      </div>

      {/* Yaklaşan Denetimler — özet şerit */}
      {yaklaşanlar.length>0&&filtre==="tumu"&&ilce==="Tümü"&&(
        <div style={{background:"rgba(59,130,246,0.08)",border:"1px solid rgba(59,130,246,0.25)",borderRadius:12,padding:"10px 14px",marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,color:"#3b82f6",marginBottom:8}}>📅 Yaklaşan Denetimler ({yaklaşanlar.length})</div>
          {yaklaşanlar.slice(0,5).map(m=>{
            const elev = elevs.find(e=>e.id===m.asansorId);
            const gk = gunKaldi(m.sonrakiTarih);
            const renk = durumRenk(gk);
            return (
              <div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"5px 0",borderBottom:"0.5px solid rgba(59,130,246,0.15)"}}>
                <div>
                  <span style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{elev?.ad||"?"}</span>
                  <span style={{fontSize:11,color:"var(--text-muted)",marginLeft:6}}>{elev?.ilce}</span>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontWeight:700,color:renk}}>{m.sonrakiTarih}</div>
                  <div style={{fontSize:10,color:renk}}>{gk===0?"Bugün!":gk+" gün kaldı"}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtre çubuğu */}
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        <select value={ilce} onChange={e=>setIlce(e.target.value)}
          style={{background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"7px 10px",color:"var(--text)",fontSize:12,outline:"none",cursor:"pointer"}}>
          <option value="Tümü">Tüm İlçeler</option>
          {ilceler.map(i=><option key={i} value={i}>{i}</option>)}
        </select>
        {[
          {k:"tumu",label:"Tümü"},
          {k:"gecikti",label:"Gecikmiş"},
          {k:"yakin",label:"Yaklaşan"},
          {k:"tamam",label:"Güncel"},
        ].map(x=>(
          <button key={x.k} onClick={()=>setFiltre(x.k)}
            style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${filtre===x.k?"var(--accent)":"var(--border)"}`,
              background:filtre===x.k?"var(--accent)":"var(--bg-elevated)",color:filtre===x.k?"#fff":"var(--text-muted)",fontSize:11,cursor:"pointer",fontWeight:600}}>
            {x.label}
          </button>
        ))}
      </div>

      {filtered.length===0&&(
        <div style={{textAlign:"center",padding:32,color:"var(--text-dim)",fontSize:14}}>
          {muayeneler.length===0?"Henüz muayene kaydı yok. '+ Muayene Ekle' ile başlayın.":"Filtre sonucu boş."}
        </div>
      )}
      {filtered.map(m=>(
        <MuayeneKart key={m.id} m={m} elev={elevs.find(e=>e.id===m.asansorId)} onEdit={oEdit} onDel={onDel}/>
      ))}

      {/* Modal */}
      {modal&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:3000,display:"flex",alignItems:"flex-end",justifyContent:"center"}}
          onClick={e=>{if(e.target===e.currentTarget)close();}}>
          <div style={{background:"var(--bg-panel)",borderRadius:"20px 20px 0 0",width:"100%",maxWidth:560,maxHeight:"90vh",overflow:"auto"}}>
            <div style={{width:36,height:4,background:"var(--border)",borderRadius:10,margin:"10px auto 0"}}/>
            <div style={{padding:"14px 18px 8px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"0.5px solid var(--border)"}}>
              <div style={{fontWeight:800,fontSize:16}}>{edit?"Muayene Düzenle":"Yeni Muayene Kaydı"}</div>
              <button onClick={close} style={{background:"var(--bg-elevated)",border:"none",color:"var(--text-muted)",fontSize:15,cursor:"pointer",borderRadius:20,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            <div style={{padding:"14px 18px",display:"flex",flexDirection:"column",gap:10}}>

              {/* İlçe seçimi */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>İlçe</label>
                <select value={formIlce} onChange={e=>{setSeciliIlce(e.target.value);F("asansorId","");}}
                  style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",cursor:"pointer"}}>
                  <option value="">— İlçe seçin —</option>
                  {ilceler.map(i=><option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              {/* Asansör seçimi */}
              {formIlce&&(
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>Asansör / Bina *</label>
                  <select value={form.asansorId||""} onChange={e=>F("asansorId",+e.target.value)}
                    style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",cursor:"pointer"}}>
                    <option value="">— Bina seçin —</option>
                    {elevs.filter(e=>e.ilce===formIlce).map(e=><option key={e.id} value={e.id}>{e.ad}</option>)}
                  </select>
                </div>
              )}

              {/* Tarih alanları — metin girişi */}
              {[
                {label:"Muayene Tarihi *",key:"tarih",hint:"YYYY-AA-GG"},
                {label:"Sonraki Muayene Tarihi *",key:"sonrakiTarih",hint:"YYYY-AA-GG"},
              ].map(f=>(
                <div key={f.key}>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>{f.label}</label>
                  <input
                    type="text"
                    value={form[f.key]||""}
                    onChange={e=>F(f.key,e.target.value)}
                    placeholder={f.hint}
                    maxLength={10}
                    style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"monospace"}}/>
                  {form[f.key]&&gunKaldi(form[f.key])!==null&&(
                    <div style={{fontSize:11,marginTop:3,color:durumRenk(gunKaldi(form[f.key])),fontWeight:600}}>
                      {durumMetin(gunKaldi(form[f.key]))}
                    </div>
                  )}
                </div>
              ))}

              {/* Sertifika No */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>Sertifika / Belge No</label>
                <input type="text" value={form.sertifikaNo||""} onChange={e=>F("sertifikaNo",e.target.value)}
                  style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              </div>

              {/* Kurum */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>Muayene Kurumu</label>
                <select value={form.kurum||"TSE"} onChange={e=>F("kurum",e.target.value)}
                  style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",cursor:"pointer"}}>
                  {KURUM_LISTESI.map(k=><option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              {/* Sonuç */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>Sonuç</label>
                <select value={form.sonuc||"Geçti"} onChange={e=>F("sonuc",e.target.value)}
                  style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",cursor:"pointer"}}>
                  {SONUC_LISTESI.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Notlar */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>Notlar</label>
                <textarea value={form.notlar||""} onChange={e=>F("notlar",e.target.value)} rows={3}
                  style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",resize:"vertical",boxSizing:"border-box"}}/>
              </div>
            </div>
            <div style={{padding:"8px 18px 20px",display:"flex",gap:10}}>
              <button onClick={close} style={{flex:1,padding:"13px",background:"var(--bg-elevated)",border:"none",borderRadius:14,color:"var(--text-muted)",cursor:"pointer",fontWeight:600,fontSize:15,minHeight:50}}>İptal</button>
              <button onClick={save} style={{flex:1,padding:"13px",background:"var(--accent)",border:"none",borderRadius:14,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:15,minHeight:50}}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
