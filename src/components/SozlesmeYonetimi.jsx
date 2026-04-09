import React, { useState, useMemo } from 'react'

function gunKaldi(tarihStr){
  if(!tarihStr) return null;
  const bugun = new Date(); bugun.setHours(0,0,0,0);
  const hedef = new Date(tarihStr); hedef.setHours(0,0,0,0);
  if(isNaN(hedef)) return null;
  return Math.round((hedef - bugun) / 86400000);
}

function durumRenk(gk){
  if(gk===null) return "#64748b";
  if(gk<0) return "#ef4444";
  if(gk<=30) return "#f59e0b";
  if(gk<=60) return "#3b82f6";
  return "#34c759";
}

function durumMetin(gk){
  if(gk===null) return "";
  if(gk<0) return `${Math.abs(gk)} gün önce bitti`;
  if(gk===0) return "Bugün bitiyor!";
  if(gk<=30) return `${gk} gün kaldı`;
  return `${gk} gün kaldı`;
}

function SozlesmeKart({s, elev, onEdit, onDel}){
  const gk = gunKaldi(s.bitis);
  const renk = durumRenk(gk);
  const durum = durumMetin(gk);
  const ikon = gk===null?"⚪":gk<0?"🔴":gk<=30?"🟡":gk<=60?"🔵":"🟢";

  return (
    <div style={{background:"var(--bg-panel)",borderRadius:14,padding:"12px 14px",marginBottom:8,
      border:`1px solid ${renk}44`,borderLeft:`4px solid ${renk}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
        <div>
          <div style={{fontWeight:700,fontSize:13,color:"var(--text)"}}>{elev?.ad||"?"}</div>
          <div style={{fontSize:11,color:"var(--text-muted)"}}>{elev?.ilce}{elev?.semt?" · "+elev.semt:""}</div>
        </div>
        <div style={{display:"flex",gap:4}}>
          <button onClick={()=>onEdit(s)} style={{background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:12,color:"var(--text-muted)"}}>✏️</button>
          <button onClick={()=>onDel(s.id)} style={{background:"rgba(255,59,48,0.12)",border:"none",borderRadius:8,padding:"4px 8px",cursor:"pointer",fontSize:12,color:"#ef4444"}}>🗑️</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,fontSize:11}}>
        <div><span style={{color:"var(--text-muted)"}}>Başlangıç: </span><span style={{fontWeight:600}}>{s.baslangic||"—"}</span></div>
        <div><span style={{color:"var(--text-muted)"}}>Bitiş: </span><span style={{color:renk,fontWeight:700}}>{s.bitis||"—"}</span></div>
        <div><span style={{color:"var(--text-muted)"}}>Ücret: </span><span style={{color:"var(--ios-green)",fontWeight:700}}>{(+s.ucret||0).toLocaleString("tr-TR")} ₺/ay</span></div>
        <div><span style={{color:"var(--text-muted)"}}>Tür: </span><span style={{fontWeight:600}}>{s.tur||"Bakım"}</span></div>
      </div>
      {durum&&(
        <div style={{marginTop:6,fontSize:11,color:renk,fontWeight:700,
          background:`${renk}11`,borderRadius:6,padding:"4px 8px",display:"inline-block"}}>
          {ikon} {durum}
        </div>
      )}
      {s.notlar&&<div style={{fontSize:11,color:"var(--text-muted)",marginTop:6,padding:"6px 8px",background:"var(--bg-elevated)",borderRadius:8}}>📝 {s.notlar}</div>}
  {s.fotograflar&&s.fotograflar.length>0&&(
    <div style={{display:"flex",gap:6,marginTop:8,flexWrap:"wrap"}}>
      {s.fotograflar.map((f,i)=>(
        <img key={i} src={f} alt={"Fotoğraf "+(i+1)}
          style={{width:64,height:64,objectFit:"cover",borderRadius:8,border:"1px solid var(--border)",cursor:"pointer"}}
          onClick={()=>window.open(f,"_blank")}/>
      ))}
    </div>
  )}
    </div>
  );
}

export default function SozlesmeYonetimi({elevs, sozlesmeler, setSozlesmeler}){
  const today = new Date().toISOString().split("T")[0];
  const [filtre, setFiltre] = useState("tumu");
  const [ilce, setIlce] = useState("Tümü");
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState({});
  const F = (k,v) => setForm(p=>({...p,[k]:v}));

  const ilceler = useMemo(()=>[...new Set(elevs.map(e=>e.ilce))].sort(),[elevs]);

  const gecikti = useMemo(()=>sozlesmeler.filter(s=>{ const g=gunKaldi(s.bitis); return g!==null&&g<0; }).length,[sozlesmeler]);
  const yakin30 = useMemo(()=>sozlesmeler.filter(s=>{ const g=gunKaldi(s.bitis); return g!==null&&g>=0&&g<=30; }).length,[sozlesmeler]);
  const aktif   = useMemo(()=>sozlesmeler.filter(s=>{ const g=gunKaldi(s.bitis); return g!==null&&g>30; }).length,[sozlesmeler]);

  // Bitiş tarihi yaklaşan sözleşmeler (60 gün içinde)
  const uyarilar = useMemo(()=>
    sozlesmeler
      .filter(s=>{ const g=gunKaldi(s.bitis); return g!==null&&g>=0&&g<=60; })
      .sort((a,b)=>gunKaldi(a.bitis)-gunKaldi(b.bitis))
  ,[sozlesmeler]);

  const filtered = useMemo(()=>{
    let list = [...sozlesmeler];
    if(ilce!=="Tümü") list = list.filter(s=>(elevs.find(e=>e.id===s.asansorId)?.ilce||"")===ilce);
    if(filtre==="biten") list = list.filter(s=>{ const g=gunKaldi(s.bitis); return g!==null&&g<0; });
    if(filtre==="yakin") list = list.filter(s=>{ const g=gunKaldi(s.bitis); return g!==null&&g>=0&&g<=60; });
    if(filtre==="aktif") list = list.filter(s=>{ const g=gunKaldi(s.bitis); return g!==null&&g>60; });
    // Sıralama: yaklaşan önce, gecikmiş sonra, tarihi yok en sona
    list.sort((a,b)=>{
      const ga=gunKaldi(a.bitis), gb=gunKaldi(b.bitis);
      if(ga===null&&gb===null) return 0;
      if(ga===null) return 1;
      if(gb===null) return -1;
      if(ga>=0&&gb>=0) return ga-gb;
      if(ga<0&&gb<0) return gb-ga;
      if(ga>=0) return -1;
      return 1;
    });
    return list;
  },[sozlesmeler,filtre,ilce,elevs]);

  const oEdit = (s) => {
    setEdit(s);
    setForm({...s});
    setModal(true);
  };
  const oAdd = () => {
    setEdit(null);
    setForm({baslangic:today,bitis:"",ucret:"",tur:"Bakım",notlar:""});
    setModal(true);
  };
  const close = () => { setModal(false); setEdit(null); setForm({}); };
  const save = () => {
    if(!form.asansorId){alert("Asansör seçiniz!");return;}
    const d = {...form, asansorId:+form.asansorId||form.asansorId, ucret:+form.ucret||0};
    if(edit) setSozlesmeler(p=>p.map(x=>x.id===edit.id?{...x,...d}:x));
    else setSozlesmeler(p=>[...p,{...d,id:Date.now()}]);
    close();
  };
  const onDel = (id) => { if(window.confirm("Bu sözleşme silinsin mi?")) setSozlesmeler(p=>p.filter(x=>x.id!==id)); };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:8}}>
        <h2 style={{fontSize:18,fontWeight:900,margin:0}}>📄 Sözleşme Yönetimi</h2>
        <button onClick={oAdd} style={{background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer"}}>+ Sözleşme Ekle</button>
      </div>

      {/* Özet sayaçlar */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
        {[
          {label:"Süresi Dolmuş",count:gecikti,renk:"#ef4444",icon:"🔴",k:"biten"},
          {label:"30 Gün İçinde",count:yakin30,renk:"#f59e0b",icon:"🟡",k:"yakin"},
          {label:"Aktif",count:aktif,renk:"#34c759",icon:"🟢",k:"aktif"},
        ].map(x=>(
          <button key={x.k} onClick={()=>setFiltre(filtre===x.k?"tumu":x.k)}
            style={{background:filtre===x.k?`${x.renk}22`:"var(--bg-panel)",border:`2px solid ${filtre===x.k?x.renk:x.renk+"44"}`,
              borderRadius:12,padding:"10px 8px",cursor:"pointer",textAlign:"center"}}>
            <div style={{fontSize:20,fontWeight:900,color:x.renk}}>{x.count}</div>
            <div style={{fontSize:10,color:filtre===x.k?x.renk:"var(--text-muted)",fontWeight:600,marginTop:2}}>{x.icon} {x.label}</div>
          </button>
        ))}
      </div>

      {/* Bitiş tarihi yaklaşan uyarı şeridi */}
      {uyarilar.length>0&&filtre==="tumu"&&ilce==="Tümü"&&(
        <div style={{background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.3)",borderRadius:12,padding:"10px 14px",marginBottom:12}}>
          <div style={{fontSize:12,fontWeight:700,color:"#f59e0b",marginBottom:8}}>⚠️ Bitiş Tarihi Yaklaşan Sözleşmeler ({uyarilar.length})</div>
          {uyarilar.slice(0,5).map(s=>{
            const elev = elevs.find(e=>e.id===s.asansorId);
            const gk = gunKaldi(s.bitis);
            const renk = durumRenk(gk);
            return (
              <div key={s.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
                padding:"5px 0",borderBottom:"0.5px solid rgba(245,158,11,0.15)"}}>
                <div>
                  <span style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{elev?.ad||"?"}</span>
                  <span style={{fontSize:11,color:"var(--text-muted)",marginLeft:6}}>{s.tur||"Bakım"}</span>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:12,fontWeight:700,color:renk}}>{s.bitis}</div>
                  <div style={{fontSize:10,color:renk}}>{gk===0?"Bugün bitiyor!":gk+" gün kaldı"}</div>
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
          {k:"biten",label:"Dolmuş"},
          {k:"yakin",label:"Yaklaşan"},
          {k:"aktif",label:"Aktif"},
        ].map(x=>(
          <button key={x.k} onClick={()=>setFiltre(x.k)}
            style={{padding:"6px 12px",borderRadius:8,border:`1px solid ${filtre===x.k?"var(--accent)":"var(--border)"}`,
              background:filtre===x.k?"var(--accent)":"var(--bg-elevated)",color:filtre===x.k?"#fff":"var(--text-muted)",fontSize:11,cursor:"pointer",fontWeight:600}}>
            {x.label}
          </button>
        ))}
      </div>

      {/* Toplam ciro */}
      {sozlesmeler.length>0&&(
        <div style={{background:"var(--bg-panel)",borderRadius:12,padding:"10px 14px",marginBottom:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:12,color:"var(--text-muted)"}}>Aktif Sözleşme Cirosu</span>
          <span style={{fontSize:15,fontWeight:800,color:"var(--ios-green)"}}>
            {sozlesmeler.filter(s=>{ const g=gunKaldi(s.bitis); return g!==null&&g>=0; }).reduce((sum,s)=>sum+(+s.ucret||0),0).toLocaleString("tr-TR")} ₺/ay
          </span>
        </div>
      )}

      {filtered.length===0&&(
        <div style={{textAlign:"center",padding:32,color:"var(--text-dim)",fontSize:14}}>
          {sozlesmeler.length===0?"Henüz sözleşme yok. '+ Sözleşme Ekle' ile başlayın.":"Filtre sonucu boş."}
        </div>
      )}
      {filtered.map(s=>(
        <SozlesmeKart key={s.id} s={s} elev={elevs.find(e=>e.id===s.asansorId)} onEdit={oEdit} onDel={onDel}/>
      ))}

      {/* Modal */}
      {modal&&(
        <div className="ios-modal-overlay" style={{zIndex:3000}} onClick={e=>{if(e.target===e.currentTarget)close();}}>
          <div className="ios-modal-sheet" style={{maxWidth:560,minHeight:"60vh"}}>
            <div className="ios-modal-handle"/>
            <div className="ios-modal-header">
              <div className="ios-modal-title">{edit?"Sözleşme Düzenle":"Yeni Sözleşme"}</div>
              <button onClick={close} style={{background:"var(--bg-elevated)",border:"none",color:"var(--text-muted)",fontSize:15,cursor:"pointer",borderRadius:20,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600}}>✕</button>
            </div>
            <div className="ios-modal-body" style={{display:"flex",flexDirection:"column",gap:12}}>

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

              {/* Başlangıç + Bitiş yan yana */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>Başlangıç *</label>
                  <input type="text" value={form.baslangic||""} onChange={e=>F("baslangic",e.target.value)}
                    placeholder="YYYY-AA-GG" maxLength={10}
                    style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"monospace"}}/>
                </div>
                <div>
                  <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>Bitiş *</label>
                  <input type="text" value={form.bitis||""} onChange={e=>F("bitis",e.target.value)}
                    placeholder="YYYY-AA-GG" maxLength={10}
                    style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"monospace"}}/>
                  {form.bitis&&gunKaldi(form.bitis)!==null&&(
                    <div style={{fontSize:11,marginTop:3,color:durumRenk(gunKaldi(form.bitis)),fontWeight:600}}>
                      {durumMetin(gunKaldi(form.bitis))||"Geçerli tarih"}
                    </div>
                  )}
                </div>
              </div>

              {/* Aylık Ücret */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>Aylık Ücret (₺)</label>
                <input type="number" value={form.ucret||""} onChange={e=>F("ucret",e.target.value)}
                  style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
              </div>

              {/* Notlar */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>Notlar</label>
                <textarea value={form.notlar||""} onChange={e=>F("notlar",e.target.value)} rows={2}
                  style={{width:"100%",background:"var(--bg-elevated)",border:"none",borderRadius:8,padding:"10px 12px",color:"var(--text)",fontSize:13,outline:"none",resize:"none",boxSizing:"border-box"}}/>
              </div>

              {/* Fotoğraflar */}
              <div>
                <label style={{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}>📷 Fotoğraflar</label>
                <input type="file" accept="image/*" multiple
                  onChange={e=>{
                    const files=Array.from(e.target.files);
                    files.forEach(file=>{
                      const reader=new FileReader();
                      reader.onload=ev=>{
                        F("fotograflar",[...(form.fotograflar||[]),ev.target.result]);
                      };
                      reader.readAsDataURL(file);
                    });
                    e.target.value="";
                  }}
                  style={{display:"none"}} id="sozlesme-foto-input"/>
                <label htmlFor="sozlesme-foto-input"
                  style={{display:"inline-flex",alignItems:"center",gap:6,padding:"8px 14px",background:"var(--bg-elevated)",border:"1px dashed var(--border)",borderRadius:8,cursor:"pointer",fontSize:12,color:"var(--text-muted)",fontWeight:600}}>
                  + Fotoğraf Ekle
                </label>
                {form.fotograflar&&form.fotograflar.length>0&&(
                  <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap"}}>
                    {form.fotograflar.map((f,i)=>(
                      <div key={i} style={{position:"relative"}}>
                        <img src={f} alt={"foto"+i}
                          style={{width:64,height:64,objectFit:"cover",borderRadius:8,border:"1px solid var(--border)"}}/>
                        <button onClick={()=>F("fotograflar",form.fotograflar.filter((_,j)=>j!==i))}
                          style={{position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",background:"#ef4444",border:"none",color:"#fff",fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,lineHeight:1}}>
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div style={{padding:"8px 18px 10px",display:"flex",gap:10}}>
              <button onClick={close} style={{flex:1,padding:"13px",background:"var(--bg-elevated)",border:"none",borderRadius:14,color:"var(--text-muted)",cursor:"pointer",fontWeight:600,fontSize:15,minHeight:50}}>İptal</button>
              <button onClick={save} style={{flex:1,padding:"13px",background:"var(--accent)",border:"none",borderRadius:14,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:15,minHeight:50}}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
