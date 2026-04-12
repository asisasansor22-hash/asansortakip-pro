import React, { useState, useEffect, useRef, useMemo } from 'react'
import KontrolListesi from './KontrolListesi.jsx'
import { makbuzBakimYazdir } from '../utils/makbuz.js'
import { S, Badge, IlceBadge, Stat, Card, Empty, IBtn, Tog, FF, FS, Modal, MONTHS, getIlceRenk, ILCE_RENK } from '../utils/constants.js'

function BakimAtamaPaneli({elevs,maints,setMaints,faults,setFaults,fMonth,setFMonth,ilceler,elevByIlce,today,eName,bakimcilar}){
  const [seciliIlce,setSeciliIlce]=useState(null);   // hangi ilçe açık
  const [secili,setSecili]=useState({});              // {elevId: true}
  const [gorunum,setGorunum]=useState("bekleyen");   // "bekleyen"|"atandi"|"tamam"
  const [expandKl,setExpandKl]=useState(null);
  const [seciliBakimci,setSeciliBakimci]=useState(null); // atama sırasında seçili bakımcı

  const mMonth=useMemo(()=>maints.filter(m=>{
    const d=new Date(m.tarih);
    return d.getMonth()===fMonth&&d.getFullYear()===new Date().getFullYear();
  }),[maints,fMonth]);

  const durumEl=(elev)=>{
    // Aynı asansöre ait tüm kayıtları al
    const kayitlar=mMonth.filter(m=>m.asansorId===elev.id);
    if(kayitlar.length===0) return "bekleyen";
    // Öncelik: tamamlanan > atanmış > bekleyen
    if(kayitlar.some(m=>m.yapildi)) return "tamam";
    if(kayitlar.some(m=>m.planlanmis)) return "atandi";
    return "bekleyen";
  };

  const bekleyenler=useMemo(()=>elevs.filter(e=>durumEl(e)==="bekleyen"),[elevs,mMonth]);
  const atananlar=useMemo(()=>elevs.filter(e=>durumEl(e)==="atandi"),[elevs,mMonth]);
  const tamamlananlar=useMemo(()=>elevs.filter(e=>durumEl(e)==="tamam"),[elevs,mMonth]);

  // Seçili ilçedeki asansörleri tarih→semt sıralı grupla
  const grupluIlce=useMemo(()=>{
    if(!seciliIlce) return {};
    const listSrc=gorunum==="bekleyen"?bekleyenler:gorunum==="atandi"?atananlar:tamamlananlar;
    const eles=listSrc.filter(e=>e.ilce===seciliIlce);
    // gun → semt → [elev]
    const byGun={};
    eles.forEach(e=>{
      const g=parseInt(e.bakimGunu)||0;
      if(!byGun[g]) byGun[g]={};
      const s=e.semt||"Diğer";
      if(!byGun[g][s]) byGun[g][s]=[];
      byGun[g][s].push(e);
    });
    return byGun;
  },[seciliIlce,gorunum,bekleyenler,atananlar,tamamlananlar]);

  const ilceBekleyen=(ilce)=>(elevByIlce[ilce]||[]).filter(e=>durumEl(e)==="bekleyen").length;
  const ilceAtanan=(ilce)=>(elevByIlce[ilce]||[]).filter(e=>durumEl(e)==="atandi").length;
  const ilceTamam=(ilce)=>(elevByIlce[ilce]||[]).filter(e=>durumEl(e)==="tamam").length;

  const ataEl=(elevId)=>{
    const elev=elevs.find(e=>e.id===elevId);
    // Seçili bakımcı bilgilerini ekle
    const bkId=seciliBakimci?seciliBakimci.id:null;
    const bkAd=seciliBakimci?seciliBakimci.ad:null;
    const bkRenk=seciliBakimci?seciliBakimci.renk:null;
    // Bu aya ait TÜM kayıtları bul (duplikat olabilir)
    const ayKayitlari=mMonth.filter(m=>m.asansorId===elevId);
    if(ayKayitlari.length>0){
      // Mevcut kayıtların hepsini planlanmis:true yap (duplikat güvenliği)
      const ilkId=ayKayitlari[0].id;
      setMaints(p=>p.map(x=>{
        if(ayKayitlari.some(k=>k.id===x.id)){
          // İlk kayıt dışındakileri (duplikatları) sil: planlanmis:false, yapildi:false ile "pasif" yap
          // İlk kaydı aktif tut
          return x.id===ilkId?{...x,planlanmis:true,bakimciId:bkId,bakimciAd:bkAd,bakimciRenk:bkRenk}:{...x,planlanmis:false,yapildi:false};
        }
        return x;
      }));
    } else {
      setMaints(p=>[...p,{
        id:Date.now()+Math.random(),
        asansorId:elevId,
        tarih:today,
        tutar:elev.aylikUcret,
        kdv:elev.kdv,
        yapildi:false,odendi:false,
        planlanmis:true,notlar:"",
        alinanTutar:0,kl:{},
        bakimciId:bkId,bakimciAd:bkAd,bakimciRenk:bkRenk
      }]);
    }
  };

  const geriAl=(elevId)=>{
    // Bu aya ait TÜM kayıtları iptal et (duplikat güvenliği)
    const ayKayitlari=mMonth.filter(m=>m.asansorId===elevId);
    if(ayKayitlari.length>0){
      setMaints(p=>p.map(x=>ayKayitlari.some(k=>k.id===x.id)?{...x,planlanmis:false}:x));
    }
  };

  const bakimYapilmadi=(elevId)=>{
    const m=mMonth.find(m=>m.asansorId===elevId);
    if(m) setMaints(p=>p.map(x=>x.id===m.id?{...x,yapildi:false,yapildiSaat:null,planlanmis:true}:x));
  };

  const ataSecililer=()=>{
    Object.keys(secili).filter(id=>secili[id]).forEach(id=>ataEl(parseInt(id)));
    setSecili({});
  };

  const togSec=(id)=>setSecili(p=>({...p,[id]:!p[id]}));
  const seciliSayi=Object.values(secili).filter(Boolean).length;

  // ilçedeki tüm görünen asansörleri seç/kaldır
  const togIlceTum=()=>{
    const tum=[];
    Object.values(grupluIlce).forEach(semtler=>
      Object.values(semtler).forEach(eles=>eles.forEach(e=>tum.push(e.id)))
    );
    const hepsiSecili=tum.every(id=>secili[id]);
    const yeni={...secili};
    tum.forEach(id=>yeni[id]=!hepsiSecili);
    setSecili(yeni);
  };

  const togSemtTum=(eles)=>{
    const hepsi=eles.every(e=>secili[e.id]);
    const yeni={...secili};
    eles.forEach(e=>{yeni[e.id]=!hepsi;});
    setSecili(yeni);
  };

  const GORUNUM_TABS=[
    {k:"bekleyen",l:"⏳ Bekleyen",c:"#f59e0b",count:bekleyenler.length},
    {k:"atandi",l:"🔧 Bakımcıda",c:"#8b5cf6",count:atananlar.length},
    {k:"tamam",l:"✅ Tamamlandı",c:"#10b981",count:tamamlananlar.length},
  ];

  const listSrcIlce=gorunum==="bekleyen"?bekleyenler:gorunum==="atandi"?atananlar:tamamlananlar;

  return(
    React.createElement('div', null
      /* Başlık */
      , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10},}
        , React.createElement('h2', { style: {fontSize:18,fontWeight:900,margin:0},}, "🔧 Bakım Atama Paneli"   )
        , React.createElement('select', { value: fMonth, onChange: e=>setFMonth(+e.target.value), style: S.sel,}
          , MONTHS.map((m,i)=>React.createElement('option', { key: i, value: i,}, m))
        )
      )

      /* Bakımcı Seçici */
      , bakimcilar&&bakimcilar.length>0&&(
        React.createElement('div',{style:{background:"var(--bg-panel)",borderRadius:12,padding:"10px 14px",marginBottom:12,border:"1px solid var(--border-soft)"}}
          ,React.createElement('div',{style:{fontSize:11,fontWeight:700,color:"var(--text-muted)",marginBottom:8,textTransform:"uppercase",letterSpacing:"0.5px"}},"Bakımcı Seç")
          ,React.createElement('div',{style:{display:"flex",gap:6,flexWrap:"wrap"}}
            ,React.createElement('button',{
              onClick:()=>setSeciliBakimci(null),
              style:{padding:"5px 12px",borderRadius:20,border:"2px solid "+(seciliBakimci===null?"var(--accent)":"var(--border)"),background:seciliBakimci===null?"var(--accent)22":"transparent",color:seciliBakimci===null?"var(--accent)":"var(--text-muted)",fontSize:12,fontWeight:700,cursor:"pointer"}
            },"Tüm Bakımcılar")
            ,bakimcilar.map(b=>React.createElement('button',{
              key:b.id,
              onClick:()=>setSeciliBakimci(b),
              style:{padding:"5px 12px",borderRadius:20,border:"2px solid "+(seciliBakimci&&seciliBakimci.id===b.id?b.renk||"#3b82f6":"var(--border)"),background:seciliBakimci&&seciliBakimci.id===b.id?(b.renk||"#3b82f6")+"22":"transparent",color:seciliBakimci&&seciliBakimci.id===b.id?(b.renk||"#3b82f6"):"var(--text-muted)",fontSize:12,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",gap:6}
            }
              ,React.createElement('span',{style:{width:10,height:10,borderRadius:"50%",background:b.renk||"#3b82f6",display:"inline-block",flexShrink:0}})
              ,b.ad
            ))
          )
          ,seciliBakimci&&React.createElement('div',{style:{marginTop:8,fontSize:12,color:"var(--ios-orange)",fontWeight:600}}
            ,"⚠️ Atama yapılacak: "+seciliBakimci.ad
          )
        )
      )

      /* Özet sekmeler */
      , React.createElement('div', { style: {display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14},}
        , GORUNUM_TABS.map(t=>(
          React.createElement('button', { key: t.k, onClick: ()=>{setGorunum(t.k);setSeciliIlce(null);setSecili({});},
            style: {padding:"11px 8px",borderRadius:12,background:gorunum===t.k?t.c+"18":"var(--bg-elevated)",border:"2px solid "+(gorunum===t.k?t.c+"55":"var(--border)"),cursor:"pointer",textAlign:"center",color:"var(--text)"},}
            , React.createElement('div', { style: {fontSize:22,fontWeight:900,color:t.c},}, t.count)
            , React.createElement('div', { style: {fontSize:11,color:gorunum===t.k?t.c:"var(--text-muted)",fontWeight:gorunum===t.k?700:500},}, t.l)
          )
        ))
      )

      /* İlçe grid */
      , React.createElement('div', { style: {marginBottom:seciliIlce?0:0},}
        , React.createElement('div', { style: {fontSize:11,fontWeight:700,color:"var(--text-muted)",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"},}
          , React.createElement('span', null, "İlçe Seçin" )
          , seciliIlce&&React.createElement('button', { onClick: ()=>{setSeciliIlce(null);setSecili({});}, style: {background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:11,fontWeight:700},}, "✕ Kapat" )
        )
        , React.createElement('div', { style: {display:"flex",flexWrap:"wrap",gap:6,marginBottom:14},}
          , ilceler.map(ilce=>{
            const c=getIlceRenk(ilce);
            const bek=ilceBekleyen(ilce);
            const ata=ilceAtanan(ilce);
            const tam=ilceTamam(ilce);
            const aktifSayi=gorunum==="bekleyen"?bek:gorunum==="atandi"?ata:tam;
            if(aktifSayi===0) return null;
            const acik=seciliIlce===ilce;
            return(
              React.createElement('button', { key: ilce, onClick: ()=>{setSeciliIlce(acik?null:ilce);setSecili({});},
                style: {
                  display:"flex",alignItems:"center",gap:6,
                  padding:"7px 12px",borderRadius:20,
                  background:acik?c+"22":"var(--bg-elevated)",
                  border:"2px solid "+(acik?c:c+"44"),
                  color:acik?c:"var(--text)",
                  fontSize:12,fontWeight:700,cursor:"pointer",
                  transition:"all .15s",
                  boxShadow:acik?"0 0 0 3px "+c+"22":"none"
                },}
                , React.createElement('span', null, ilce)
                , React.createElement('span', { style: {
                  background:acik?c:c+"33",
                  color:acik?"#102a1a":c,
                  borderRadius:20,fontSize:10,
                  padding:"1px 7px",fontWeight:900
                },}, aktifSayi)
              )
            );
          })
        )
      )

      /* Seçili ilçe panel */
      , seciliIlce&&(
        React.createElement('div', { style: {background:"var(--bg-panel)",borderRadius:14,border:"2px solid "+getIlceRenk(seciliIlce)+"44",overflow:"hidden",marginBottom:14},}
          /* Panel başlık */
          , React.createElement('div', { style: {
            padding:"12px 16px",
            background:"linear-gradient(135deg,"+getIlceRenk(seciliIlce)+"18,var(--bg-panel))",
            borderBottom:"1px solid "+getIlceRenk(seciliIlce)+"33",
            display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"
          },}
            , React.createElement('div', { style: {width:4,height:24,borderRadius:2,background:getIlceRenk(seciliIlce),flexShrink:0},})
            , React.createElement('div', { style: {flex:1},}
              , React.createElement('div', { style: {fontWeight:900,fontSize:15,color:getIlceRenk(seciliIlce)},}, seciliIlce)
              , React.createElement('div', { style: {fontSize:11,color:"var(--text-muted)"},}, MONTHS[fMonth], " · "  , listSrcIlce.filter(e=>e.ilce===seciliIlce).length, " bina" )
            )

            /* Toplu seçim butonları */
            , React.createElement('div', { style: {display:"flex",gap:6,flexWrap:"wrap"},}
              , React.createElement('button', { onClick: togIlceTum,
                style: {padding:"5px 12px",borderRadius:8,background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.28)",color:"#2563eb",fontSize:11,fontWeight:700,cursor:"pointer"},}
                , Object.keys(grupluIlce).length>0&&Object.values(grupluIlce).every(s=>Object.values(s).every(eles=>eles.every(e=>secili[e.id])))
                  ?"☑ Tümünü Kaldır":"☐ Tümünü Seç"
              )
              , seciliSayi>0&&gorunum==="bekleyen"&&(
                React.createElement('button', { onClick: ataSecililer,
                  style: {padding:"5px 14px",borderRadius:8,background:"linear-gradient(135deg,#f59e0b,#d97706)",border:"none",color:"#fff",fontWeight:800,fontSize:11,cursor:"pointer"},}, "📤 "
                   , seciliSayi, " Binayı Bakımcıya At"
                )
              )
              , seciliSayi>0&&gorunum==="atandi"&&(
                React.createElement('button', { onClick: ()=>{Object.keys(secili).filter(id=>secili[id]).forEach(id=>geriAl(parseInt(id)));setSecili({});},
                  style: {padding:"5px 14px",borderRadius:8,background:"rgba(239,68,68,0.10)",border:"1px solid rgba(239,68,68,0.28)",color:"#dc2626",fontWeight:700,fontSize:11,cursor:"pointer"},}, "↩ "
                   , seciliSayi, " Binayı Geri Al"
                )
              )
            )
          )

          /* Tarih grupları */
          , React.createElement('div', { style: {padding:"10px 14px"},}
            , Object.keys(grupluIlce).length===0&&(
              React.createElement('div', { style: {textAlign:"center",padding:"24px",color:"var(--text-dim)",fontSize:13},}, "— Bu kategoride bina yok —"     )
            )
            , Object.entries(grupluIlce).sort((a,b)=>+a[0]-+b[0]).map(([gun,semtler])=>(
              React.createElement('div', { key: gun, style: {marginBottom:14},}
                /* Tarih başlığı */
                , React.createElement('div', { style: {
                  display:"flex",alignItems:"center",gap:8,
                  marginBottom:8,padding:"6px 10px",
                  background:"var(--bg-elevated)",borderRadius:8,
                  borderLeft:"3px solid "+getIlceRenk(seciliIlce)
                },}
                  , React.createElement('span', { style: {fontSize:14,fontWeight:900,color:getIlceRenk(seciliIlce)},}
                    , gun==="0"?"Gün Belirtilmemiş":"Ayın "+gun+"'i"
                  )
                  , React.createElement('span', { style: {fontSize:10,color:"var(--text-muted)"},}, "· "
                     , Object.values(semtler).reduce((s,a)=>s+a.length,0), " bina · "
                     , Object.keys(semtler).length, " semt"
                  )
                )

                /* Semt grupları */
                , Object.entries(semtler).map(([semt,eles])=>{
                  const hepsiSec=eles.every(e=>secili[e.id]);
                  return(
                    React.createElement('div', { key: semt, style: {marginBottom:8},}
                      /* Semt başlığı */
                      , React.createElement('div', { style: {display:"flex",alignItems:"center",gap:7,marginBottom:4,padding:"4px 8px"},}
                        , React.createElement('div', { onClick: ()=>togSemtTum(eles),
                          style: {
                            width:16,height:16,borderRadius:4,
                            background:hepsiSec?"#3b82f6":"transparent",
                            border:"2px solid "+(hepsiSec?"#3b82f6":"var(--border-strong)"),
                            display:"flex",alignItems:"center",justifyContent:"center",
                            cursor:"pointer",flexShrink:0,fontSize:9,color:"#fff",fontWeight:900
                          },}, hepsiSec?"✓":"")
                        , React.createElement('span', { style: {fontSize:11,fontWeight:700,color:"var(--text-muted)"},}, "📍 " , semt)
                        , React.createElement('span', { style: {fontSize:10,color:"var(--text-dim)"},}, "(", eles.length, " bina)" )
                        , gorunum==="bekleyen"&&(
                          React.createElement('button', { onClick: ()=>togSemtTum(eles),
                            style: {marginLeft:"auto",fontSize:10,padding:"2px 8px",borderRadius:5,background:"rgba(59,130,246,0.12)",border:"1px solid rgba(59,130,246,0.28)",color:"#2563eb",cursor:"pointer",fontWeight:600},}
                            , hepsiSec?"Kaldır":"Hepsini Seç"
                          )
                        )
                      )

                      /* Binalar */
                      , React.createElement('div', { style: {display:"flex",flexDirection:"column",gap:3,paddingLeft:8},}
                        , eles.map(e=>{
                          const m=mMonth.find(m=>m.asansorId===e.id);
                          const isSec=!!secili[e.id];
                          return(
                            React.createElement('div', { key: e.id, style: {
                              display:"flex",alignItems:"center",gap:8,
                              padding:"9px 11px",borderRadius:9,
                              background:isSec?"rgba(59,130,246,0.10)":"var(--bg-elevated)",
                              border:"1px solid "+(isSec?"#3b82f6":(m&&m.yapildi)?"rgba(16,185,129,0.28)":(m&&m.planlanmis)?"rgba(139,92,246,0.28)":"var(--border)"),
                              cursor:gorunum!=="tamam"?"pointer":"default",
                              transition:"all .1s"
                            },
                            onClick: gorunum!=="tamam"?()=>togSec(e.id):undefined,}

                              /* Checkbox */
                              , gorunum!=="tamam"&&(
                                React.createElement('div', { style: {
                                  width:16,height:16,borderRadius:4,
                                  background:isSec?"#3b82f6":"transparent",
                                  border:"2px solid "+(isSec?"#3b82f6":"var(--border-strong)"),
                                  display:"flex",alignItems:"center",justifyContent:"center",
                                  flexShrink:0,fontSize:9,color:"#fff",fontWeight:900
                                },}, isSec?"✓":"")
                              )

                              /* Bina bilgisi */
                              , React.createElement('div', { style: {flex:1,minWidth:0},}
                                , React.createElement('div', { style: {
                                  fontWeight:700,fontSize:12,
                                  overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"
                                },}, e.ad)
                                , e.yonetici&&(
                                  React.createElement('div', { style: {fontSize:10,color:"var(--text-muted)"},}, "👤 "
                                     , e.yonetici
                                    , e.tel&&React.createElement('span', null, " · "  , React.createElement('a', { href: "tel:"+e.tel.replace(/\s/g,""), onClick: ev=>ev.stopPropagation(), style: {color:"#3b82f6",textDecoration:"none"},}, "📞 " , e.tel))
                                  )
                                )
                                , gorunum==="atandi"&&(function(){
                                  var bk=mMonth.find(function(m){return m.asansorId===e.id&&m.planlanmis;});
                                  if(!bk||!bk.bakimciAd) return null;
                                  return React.createElement('div',{style:{display:"inline-flex",alignItems:"center",gap:4,marginTop:2,fontSize:10,fontWeight:700,color:bk.bakimciRenk||"#8b5cf6",background:(bk.bakimciRenk||"#8b5cf6")+"22",borderRadius:20,padding:"2px 7px"}}
                                    ,React.createElement('span',{style:{width:6,height:6,borderRadius:"50%",background:bk.bakimciRenk||"#8b5cf6",display:"inline-block",flexShrink:0}})
                                    ,"🔧 "+bk.bakimciAd
                                  );
                                })()
                              )

                              /* Sağ bilgi */
                              , React.createElement('div', { style: {display:"flex",gap:5,alignItems:"center",flexShrink:0}, onClick: ev=>ev.stopPropagation(),}
                                , React.createElement('span', { style: {fontSize:11,fontWeight:700,color:"#10b981"},}, e.aylikUcret.toLocaleString("tr-TR"), " ₺")
                                , gorunum==="atandi"&&(
                                  React.createElement('button', { onClick: ()=>geriAl(e.id),
                                    style: {padding:"3px 8px",borderRadius:6,background:"rgba(239,68,68,0.10)",border:"1px solid rgba(239,68,68,0.24)",color:"#dc2626",fontSize:10,cursor:"pointer",fontWeight:600},}, "↩ Geri Al"

                                  )
                                )
                                , gorunum==="tamam"&&(
                                  React.createElement('div', { style: {display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"},}
                                    , React.createElement('span', { style: {fontSize:10,background:(e.bakiyeDevir||0)>0?"rgba(239,68,68,0.10)":"rgba(16,185,129,0.10)",color:(e.bakiyeDevir||0)>0?"#dc2626":"#059669",padding:"3px 8px",borderRadius:6,fontWeight:700}}, "Devir: "+((e.bakiyeDevir||0)).toLocaleString("tr-TR")+" ₺")
                                    , (function(){
                                        /* Yeni devir hesabı */
                                        var bk=mMonth.find(function(bx){return bx.asansorId===e.id&&bx.yapildi;});
                                        if(!bk) return null;
                                        var eskiD=e.bakiyeDevir||0;
                                        var ayUcret=e.aylikUcret||0;
                                        var alinan=bk.odendi?(bk.alinanTutar||bk.tutar||0):0;
                                        var nd=eskiD+ayUcret-alinan;
                                        var ndColor=nd>0?"#f97316":nd===0?"#94a3b8":"#34d399";
                                        var ndBg=nd>0?"rgba(249,115,22,0.12)":nd===0?"var(--bg-elevated)":"rgba(52,211,153,0.12)";
                                        return React.createElement('span', {style:{fontSize:9,background:ndBg,color:ndColor,padding:"3px 8px",borderRadius:6,fontWeight:800,border:"1px solid "+ndColor+"44"}},
                                          "Yeni: "+(nd>0?"+":"")+nd.toLocaleString("tr-TR")+" ₺"
                                        );
                                      })()
                                    , React.createElement('button', { onClick: (ev)=>{ev.stopPropagation();bakimYapilmadi(e.id);},
                                        style: {padding:"3px 7px",borderRadius:5,background:"rgba(239,68,68,0.10)",border:"1px solid rgba(239,68,68,0.28)",color:"#dc2626",fontSize:10,cursor:"pointer",fontWeight:700,whiteSpace:"nowrap",lineHeight:"1.4"}
                                      }, "✗ Yapılmadı")
                                  )
                                )
                                , gorunum==="bekleyen"&&(
                                  React.createElement('button', { onClick: (ev)=>{ev.stopPropagation();ataEl(e.id);},
                                    style: {padding:"3px 10px",borderRadius:6,background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.30)",color:"#b45309",fontSize:10,cursor:"pointer",fontWeight:700},}, "📤 Ata"

                                  )
                                )
                              )
                            )
                          );
                        })
                      )
                    )
                  );
                })
              )
            ))
          )
        )
      )

      /* İlçe seçilmemişse genel özet - kaldırıldı */
    )
  );
}


export default BakimAtamaPaneli
