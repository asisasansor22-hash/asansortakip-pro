import React, { useState, useEffect, useRef, useMemo } from 'react'
import { makbuzBakimYazdir } from '../utils/makbuz.js'
import { toXLSX, exportAsansorlerExcel, exportExcel } from '../utils/excel.js'
import { S, Badge, IlceBadge, Stat, Card, Empty, IBtn, Tog, FF, FS, Modal, MONTHS, getIlceRenk, ILCE_RENK, KONTROL } from '../utils/constants.js'


function BakimciGorunum({elevs,maints,setMaints,faults,setFaults,bal,ilceler,today,fMonth,setFMonth,eName,sonOdemeler,setSonOdemeler,aktifBakimci}){
  const [subTab,setSubTab]=useState(0);
  const [bakimSubTab,setBakimSubTab]=useState(0); // 0=Bekleyen, 1=Tamamlanan
  const [odemeModal,setOdemeModal]=useState(null);
  const [odemeForm,setOdemeForm]=useState({alinan:"",not:""});
  const [seciliGun,setSeciliGun]=useState(0); // 0=bugün, 1=dün ... 5
  const [odemeSorModal,setOdemeSorModal]=useState(null); // {m, elev} - bakım sonrası ödeme sor
  const [odemeMiktar,setOdemeMiktar]=useState("");
  const [makbuzSonBakim,setMakbuzSonBakim]=useState(null); // {m, elev} - ödeme sonrası makbuz

  // Son 6 günü üret
  const sonGunler=useMemo(()=>{
    return [0,1,2,3,4,5].map(function(offset){
      var d=new Date(); d.setDate(d.getDate()-offset);
      var yyyy=d.getFullYear();
      var mm=(d.getMonth()+1).toString().padStart(2,"0");
      var dd=d.getDate().toString().padStart(2,"0");
      var tarihStr=yyyy+"-"+mm+"-"+dd;
      var label=offset===0?"Bugün":offset===1?"Dün":(offset+" gün önce");
      return {offset,label,tarihStr};
    });
  },[]);

  // yapildiSaat alanından tarih kısmını çıkar (ISO: "yyyy-mm-dd hh:mm" veya TR: "dd.mm.yyyy hh:mm:ss")
  const parseTarihStr=function(saat){
    if(!saat) return null;
    var s=String(saat).trim();
    // ISO format: 2025-01-15 14:30
    if(/^\d{4}-\d{2}-\d{2}/.test(s)) return s.substring(0,10);
    // TR format: 15.01.2025 14:30:00
    var p=s.split(" ")[0].split(".");
    if(p.length===3&&p[2].length===4) return p[2]+"-"+p[1].padStart(2,"0")+"-"+p[0].padStart(2,"0");
    return null;
  };

  const mMonth=useMemo(()=>maints.filter(m=>{const d=new Date(m.tarih);return d.getMonth()===fMonth&&d.getFullYear()===new Date().getFullYear();}),[maints,fMonth]);
  const atananBakimlar=useMemo(()=>mMonth.filter(m=>{
    if(!m.planlanmis) return false;
    if(!elevs.some(e=>e.id===m.asansorId)) return false;
    // Kayıtta bakimciId varsa ve aktifBakimci farklıysa filtrele
    // Kayıtta bakimciId yoksa (eski kayıt) herkese göster
    if(aktifBakimci&&m.bakimciId&&m.bakimciId!==aktifBakimci.id) return false;
    return true;
  }),[mMonth,elevs,aktifBakimci]);
  const bekleyenBakimlar=useMemo(()=>atananBakimlar.filter(m=>!m.yapildi),[atananBakimlar]);
  // Tüm tamamlananlar (saat sırasıyla)
  const tamamlananBakimlarTum=useMemo(()=>atananBakimlar.filter(m=>m.yapildi).slice().sort(function(a,b){
    return String(a.yapildiSaat||"").localeCompare(String(b.yapildiSaat||""));
  }),[atananBakimlar]);
  // Seçili güne göre filtreli
  const seciliTarihStr=sonGunler[seciliGun]?sonGunler[seciliGun].tarihStr:null;
  const tamamlananBakimlar=useMemo(()=>{
    if(!seciliTarihStr) return tamamlananBakimlarTum;
    return tamamlananBakimlarTum.filter(function(m){
      return parseTarihStr(m.yapildiSaat)===seciliTarihStr;
    });
  },[tamamlananBakimlarTum,seciliTarihStr]);

  const atananArizalar=useMemo(()=>faults.filter(f=>f.bakimciAtandi),[faults]);

  const kaydetOdeme=()=>{
    const {elev,maint}=odemeModal;
    const alinan=parseFloat(odemeForm.alinan)||0;
    const simdi=new Date().toLocaleString("tr-TR");
    if(maint){
      setMaints(p=>p.map(m=>m.id===maint.id?{...m,alinanTutar:alinan,notlar:odemeForm.not||m.notlar,yapildi:true,yapildiSaat:simdi,odendi:alinan>=m.tutar}:m));
    } else {
      setMaints(p=>[...p,{id:Date.now(),asansorId:elev.id,tarih:today,yapildiSaat:simdi,tutar:elev.aylikUcret,alinanTutar:alinan,kdv:elev.kdv,yapildi:true,odendi:alinan>=elev.aylikUcret,planlanmis:true,notlar:odemeForm.not||"",kl:{}}]);
    }
    setOdemeModal(null);setOdemeForm({alinan:"",not:""});
  };

  // Bakımı tamamla: ISO tarih/saat kaydet, sonra ödeme sor
  const tamamlaBakim=(m,elev)=>{
    var now=new Date();
    var yyyy=now.getFullYear();
    var mm=(now.getMonth()+1).toString().padStart(2,"0");
    var dd=now.getDate().toString().padStart(2,"0");
    var hh=now.getHours().toString().padStart(2,"0");
    var mi=now.getMinutes().toString().padStart(2,"0");
    var simdi=yyyy+"-"+mm+"-"+dd+" "+hh+":"+mi;
    setMaints(p=>p.map(x=>x.id===m.id?{...x,yapildi:true,yapildiSaat:simdi}:x));
    // Ödeme alındı mı diye sor
    setOdemeSorModal({m:m,elev:elev,yapildiSaat:simdi});
    setOdemeMiktar("");
  };

  // Ödeme kaydını onayla
  const odemeSorKaydet=()=>{
    if(!odemeSorModal) return;
    var tutar=parseFloat(odemeMiktar)||0;
    if(tutar<=0) return;
    var m=odemeSorModal.m;
    var elev=odemeSorModal.elev;
    var yapildiSaat=odemeSorModal.yapildiSaat;
    // Bakım kaydına ödeme bilgisi ekle
    setMaints(function(p){return p.map(function(x){return x.id===m.id?Object.assign({},x,{alinanTutar:tutar,odendi:true}):x;});});
    // Son ödemeler listesine ekle
    var parts=yapildiSaat.split(" ");
    var tarih=parts[0]||"";
    var saat=parts[1]||"";
    setSonOdemeler(function(p){return p.concat([{id:Date.now(),aid:elev.id,tarih:tarih,saat:saat,alinanTutar:tutar,not:"Bakım sonrası tahsilat",binaAd:elev.ad||"?",ilce:elev.ilce||"",yonetici:elev.yonetici||""}]);});
    // NOT: bakiyeDevir burada değiştirilmez — ay kapanışında yeniDevir → bakiyeDevir geçer
    setMakbuzSonBakim({m:odemeSorModal.m,elev:odemeSorModal.elev,tutar:tutar});
    setOdemeSorModal(null);
    setOdemeMiktar("");
  };

  const toplamYapilan=tamamlananBakimlarTum.length;
  const acikAriza=atananArizalar.filter(f=>f.durum!=="Çözüldü").length;

  const TABS2=[
    {l:"🔧 Bakımlar",c:"#f59e0b",count:bekleyenBakimlar.length},
    {l:"⚠️ Arızalar",c:"#ef4444",count:atananArizalar.filter(f=>f.durum!=="Çözüldü").length},
  ];

  return(
    React.createElement('div', null
      /* Özet */
      , React.createElement('div', { style: {display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14},}
        , React.createElement('div', { style: {background:"#1a1f2e",borderRadius:10,padding:"10px 12px",border:"1px solid #f59e0b33",textAlign:"center"},}
          , React.createElement('div', { style: {fontSize:18,fontWeight:900,color:"#f59e0b"},}, atananBakimlar.length)
          , React.createElement('div', { style: {fontSize:10,color:"#64748b"},}, "Atanan")
        )
        , React.createElement('div', { style: {background:"#1a1f2e",borderRadius:10,padding:"10px 12px",border:"1px solid #10b98133",textAlign:"center"},}
          , React.createElement('div', { style: {fontSize:18,fontWeight:900,color:"#10b981"},}, toplamYapilan)
          , React.createElement('div', { style: {fontSize:10,color:"#64748b"},}, "Tamamlanan")
        )
        , React.createElement('div', { style: {background:"#1a1f2e",borderRadius:10,padding:"10px 12px",border:"1px solid #ef444433",textAlign:"center"},}
          , React.createElement('div', { style: {fontSize:18,fontWeight:900,color:"#ef4444"},}, acikAriza)
          , React.createElement('div', { style: {fontSize:10,color:"#64748b"},}, "Açık Arıza" )
        )
      )

      /* Sekmeler */
      , React.createElement('div', { style: {display:"flex",gap:6,marginBottom:14},}
        , TABS2.map((t,i)=>(
          React.createElement('button', { key: i, onClick: ()=>setSubTab(i),
            style: {flex:1,padding:"10px 8px",borderRadius:10,background:subTab===i?t.c+"22":"#1a1f2e",border:"2px solid "+(subTab===i?t.c+"66":"#2a3050"),color:subTab===i?t.c:"#64748b",fontWeight:subTab===i?800:400,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6},}
            , t.l
            , t.count>0&&React.createElement('span', { style: {background:subTab===i?t.c:"#2a3050",color:subTab===i?"#000":"#64748b",borderRadius:20,fontSize:10,padding:"1px 6px",fontWeight:900},}, t.count)
          )
        ))
      )

      /* Ay filtresi (sadece bekleyen) */
      , subTab===0&&bakimSubTab===0&&(
        React.createElement('div', { style: {marginBottom:12},}
          , React.createElement('select', { value: fMonth, onChange: e=>setFMonth(+e.target.value), style: S.sel,}
            , MONTHS.map((m,i)=>React.createElement('option', { key: i, value: i,}, m))
          )
        )
      )

      /* Gün filtresi (tamamlanan) */
      , subTab===0&&bakimSubTab===1&&(
        React.createElement('div', { style: {marginBottom:12,display:"flex",gap:5,flexWrap:"wrap"},}
          , sonGunler.map(function(g){
            var count=tamamlananBakimlarTum.filter(function(m){return parseTarihStr(m.yapildiSaat)===g.tarihStr;}).length;
            return React.createElement('button', {
              key: g.offset,
              onClick: function(){setSeciliGun(g.offset);},
              style: {padding:"5px 10px",borderRadius:20,background:seciliGun===g.offset?"#10b98122":"#1a1f2e",border:"2px solid "+(seciliGun===g.offset?"#10b98166":"#2a3050"),color:seciliGun===g.offset?"#10b981":"#64748b",fontWeight:seciliGun===g.offset?800:400,fontSize:11,cursor:"pointer",display:"flex",alignItems:"center",gap:5}
            },
              g.label,
              count>0&&React.createElement('span',{style:{background:seciliGun===g.offset?"#10b981":"#2a3050",color:seciliGun===g.offset?"#000":"#94a3b8",borderRadius:20,fontSize:9,padding:"1px 5px",fontWeight:900}},count)
            );
          })
        )
      )

      /* BAKIM ALT SEKMELERİ */
      , subTab===0&&(
        React.createElement('div', { style: {display:"flex",gap:5,marginBottom:12},}
          , React.createElement('button', { onClick:()=>setBakimSubTab(0),
            style:{flex:1,padding:"8px",borderRadius:8,background:bakimSubTab===0?"#f59e0b22":"#1a1f2e",border:"2px solid "+(bakimSubTab===0?"#f59e0b66":"#2a3050"),color:bakimSubTab===0?"#f59e0b":"#64748b",fontWeight:bakimSubTab===0?800:400,fontSize:12,cursor:"pointer"}},
            "⏳ Bekleyen ("+bekleyenBakimlar.length+")")
          , React.createElement('button', { onClick:()=>setBakimSubTab(1),
            style:{flex:1,padding:"8px",borderRadius:8,background:bakimSubTab===1?"#10b98122":"#1a1f2e",border:"2px solid "+(bakimSubTab===1?"#10b98166":"#2a3050"),color:bakimSubTab===1?"#10b981":"#64748b",fontWeight:bakimSubTab===1?800:400,fontSize:12,cursor:"pointer"}},
            "✅ Tamamlanan ("+tamamlananBakimlarTum.length+")")
        )
      )

      /* BEKLEYEN BAKIMLAR */
      , subTab===0&&bakimSubTab===0&&(
        bekleyenBakimlar.length===0
          ?React.createElement('div', { style: {textAlign:"center",padding:"40px 20px",background:"#1a1f2e",borderRadius:14,border:"1px solid #2a3050"},}
            , React.createElement('div', { style: {fontSize:40,marginBottom:10},}, "✅")
            , React.createElement('div', { style: {fontWeight:700,fontSize:14,color:"#94a3b8",marginBottom:6},}, "Bekleyen bakım yok")
            , React.createElement('div', { style: {fontSize:12,color:"#475569"},}, "Tüm bakımlar tamamlandı!")
          )
          :React.createElement('div', { style: {display:"flex",flexDirection:"column",gap:6},}
            , bekleyenBakimlar.map(m=>{
              const elev=elevs.find(e=>e.id===m.asansorId);
              if(!elev) return null;
              const devir=elev.bakiyeDevir||0;
              const c=getIlceRenk(elev.ilce);
              return(
                React.createElement('div', { key: m.id, style: {background:"#141824",borderRadius:12,border:"1px solid #2a3050",overflow:"hidden"},}
                  , React.createElement('div', { style: {padding:"12px 14px"},}
                    , React.createElement('div', { style: {display:"flex",alignItems:"flex-start",gap:10,marginBottom:10},}
                      , React.createElement('div', { style: {width:3,height:44,borderRadius:2,background:c,flexShrink:0},})
                      , React.createElement('div', { style: {flex:1,minWidth:0},}
                        , React.createElement('div', { style: {fontWeight:800,fontSize:14,marginBottom:2},}, elev.ad)
                        , React.createElement('div', { style: {display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"},}
                          , React.createElement(IlceBadge, { ilce: elev.ilce,})
                          , React.createElement('span', { style: {fontSize:10,color:"#64748b"},}, elev.semt)
                          , elev.bakimGunu&&React.createElement('span', { style: {fontSize:10,color:"#64748b"},}, "· Her ", elev.bakimGunu, ". gün")
                        )
                        , React.createElement('div', {style:{marginTop:4,display:"flex",flexDirection:"column",gap:2}}
                          , (elev.adres||elev.semt)&&React.createElement('div',{style:{fontSize:11,color:"#64748b"}},"📍 "+(elev.semt?elev.semt+" Mah., ":"")+elev.adres)
                          , elev.yoneticiDaire&&React.createElement('div',{style:{fontSize:12,color:"#f59e0b",fontWeight:800}},"🚪 Daire: "+elev.yoneticiDaire)
                          , elev.yonetici&&React.createElement('div',{style:{fontSize:11,color:"#94a3b8",marginTop:1}},"👤 ",elev.yonetici,elev.tel?React.createElement('a',{href:"tel:"+elev.tel.replace(/\s/g,""),style:{color:"#3b82f6",textDecoration:"none",fontWeight:700,marginLeft:6,fontSize:12}},"📞 ",elev.tel):"")
                          , m.bakimciAd&&React.createElement('div',{style:{display:"inline-flex",alignItems:"center",gap:4,marginTop:3,fontSize:10,fontWeight:700,color:m.bakimciRenk||"#8b5cf6",background:(m.bakimciRenk||"#8b5cf6")+"22",borderRadius:20,padding:"2px 8px"}}
                            ,React.createElement('span',{style:{width:6,height:6,borderRadius:"50%",background:m.bakimciRenk||"#8b5cf6",display:"inline-block"}})
                            ,"🔧 "+m.bakimciAd
                          )
                        )
                      )
                    )
                    , React.createElement('div', { style: {background:"#0d1321",borderRadius:8,padding:"8px 12px",marginBottom:10,fontSize:11}},
                      React.createElement('div', {style:{display:"flex",justifyContent:"space-between",color:"#94a3b8",marginBottom:4}},
                        React.createElement('span',null,"Aylık Bakım Ücreti"),React.createElement('span',{style:{color:"#3b82f6",fontWeight:700}},(elev.aylikUcret||0).toLocaleString("tr-TR")+" ₺"))
                      ,React.createElement('div', {style:{display:"flex",justifyContent:"space-between",borderTop:"1px solid #2a3050",paddingTop:4,marginTop:2}},
                        React.createElement('span',{style:{fontWeight:700,color:"#e0e6f0"}},"Devir Bakiye"),React.createElement('span',{style:{fontWeight:900,fontSize:13,color:devir>0?"#ef4444":devir===0?"#10b981":"#f59e0b"}},devir.toLocaleString("tr-TR")+" ₺"))
                    )
                    , React.createElement('div', { style: {display:"flex",gap:6}},
                      React.createElement('button', { onClick:()=>tamamlaBakim(m,elev),
                        style:{flex:1,padding:"9px",borderRadius:8,background:"linear-gradient(135deg,#10b981,#059669)",border:"none",color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}},
                        "✅ Bakımı Tamamla")
                    )
                  )
                )
              );
            })
          )
      )

      /* TAMAMLANAN BAKIMLAR */
      , subTab===0&&bakimSubTab===1&&(
        tamamlananBakimlar.length===0
          ?React.createElement('div', { style: {textAlign:"center",padding:"40px 20px",background:"#1a1f2e",borderRadius:14,border:"1px solid #2a3050"},}
            , React.createElement('div', { style: {fontSize:40,marginBottom:10},}, "🔧")
            , React.createElement('div', { style: {fontWeight:700,fontSize:14,color:"#94a3b8",marginBottom:6},}, sonGunler[seciliGun]?sonGunler[seciliGun].label+" için bakım yok":"Henüz tamamlanan bakım yok")
          )
          :React.createElement('div', { style: {display:"flex",flexDirection:"column",gap:6},}
            , tamamlananBakimlar.map(m=>{
              const elev=elevs.find(e=>e.id===m.asansorId);
              if(!elev) return null;
              const devir=elev.bakiyeDevir||0;
              const c=getIlceRenk(elev.ilce);
              // Saat kısmını çıkar
              var saatStr="";
              if(m.yapildiSaat){
                var s=String(m.yapildiSaat);
                var parts=s.split(" ");
                if(parts.length>=2) saatStr=parts[1].substring(0,5);
              }
              return(
                React.createElement('div', { key: m.id, style: {background:"#141824",borderRadius:12,border:"1px solid #1e3a2e",overflow:"hidden"},}
                  , React.createElement('div', { style: {padding:"12px 14px"},}
                    , React.createElement('div', { style: {display:"flex",alignItems:"flex-start",gap:10,marginBottom:8},}
                      , React.createElement('div', { style: {width:3,height:36,borderRadius:2,background:"#10b981",flexShrink:0},})
                      , React.createElement('div', { style: {flex:1,minWidth:0},}
                        , React.createElement('div', { style: {fontWeight:800,fontSize:14,marginBottom:2},}, elev.ad)
                        , React.createElement('div', { style: {display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"},}
                          , React.createElement(IlceBadge, { ilce: elev.ilce,})
                          , React.createElement('span', { style: {fontSize:10,color:"#64748b"},}, elev.semt)
                          , elev.yoneticiDaire&&React.createElement('span',{style:{fontSize:10,color:"#f59e0b",fontWeight:700}},"🚪 "+elev.yoneticiDaire)
                        )
                        , m.yapildiSaat&&React.createElement('div',{style:{fontSize:11,color:"#10b981",marginTop:3,fontWeight:700}},"✅ "+m.yapildiSaat+(saatStr?" · 🕐 "+saatStr:""))
                        , m.bakimciAd&&React.createElement('div',{style:{display:"inline-flex",alignItems:"center",gap:4,marginTop:3,fontSize:10,fontWeight:700,color:m.bakimciRenk||"#8b5cf6",background:(m.bakimciRenk||"#8b5cf6")+"22",borderRadius:20,padding:"2px 8px"}}
                          ,React.createElement('span',{style:{width:6,height:6,borderRadius:"50%",background:m.bakimciRenk||"#8b5cf6",display:"inline-block"}})
                          ,"🔧 "+m.bakimciAd
                        )
                      )
                      , saatStr&&React.createElement('div',{style:{background:"#10b98122",border:"1px solid #10b98144",borderRadius:8,padding:"4px 8px",textAlign:"center",flexShrink:0}}
                        , React.createElement('div',{style:{fontSize:16,fontWeight:900,color:"#10b981"}},saatStr)
                        , React.createElement('div',{style:{fontSize:9,color:"#10b98199"}},""  )
                      )
                    )
                    , React.createElement('div', { style: {background:"#0d1321",borderRadius:8,padding:"8px 12px",fontSize:11}},
                      React.createElement('div', {style:{display:"flex",justifyContent:"space-between",color:"#94a3b8",marginBottom:4}},
                        React.createElement('span',null,"Aylık Bakım Ücreti"),React.createElement('span',{style:{color:"#3b82f6",fontWeight:700}},(elev.aylikUcret||0).toLocaleString("tr-TR")+" ₺"))
                      ,React.createElement('div', {style:{display:"flex",justifyContent:"space-between",borderTop:"1px solid #2a3050",paddingTop:4,marginTop:2}},
                        React.createElement('span',{style:{fontWeight:700,color:"#e0e6f0"}},"Devir Bakiye"),React.createElement('span',{style:{fontWeight:900,fontSize:13,color:devir>0?"#ef4444":devir===0?"#10b981":"#f59e0b"}},devir.toLocaleString("tr-TR")+" ₺"))
                    )
                    , React.createElement('div',{style:{display:"flex",gap:6,marginTop:8}}
                      , React.createElement('button',{
                          onClick:function(){makbuzBakimYazdir(m,elev);},
                          style:{flex:1,padding:"8px",background:"linear-gradient(135deg,#1e3a5f,#1d4ed8)",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}
                        },"\uD83D\uDDA8\uFE0F Bakım Makbuzu Yazdır")
                      , elev.tel&&React.createElement('button',{
                          onClick:function(){
                            var tel=(elev.tel||"").replace(/[\s\-\(\)]/g,"");
                            if(tel.startsWith("0")) tel="90"+tel.slice(1);
                            else if(!tel.startsWith("90")&&!tel.startsWith("+90")) tel="90"+tel;
                            tel=tel.replace(/^\+/,"");
                            var tarihStr=m.yapildiSaat?m.yapildiSaat.split(" ")[0]:"";
                            var alinan=m.alinanTutar||m.tutar||0;
                            var mesaj=
                              "Sayın "+elev.ad+" Yönetimi,\n\n"+
                              "Şirketimize duyduğunuz güven için teşekkür ederiz.\n\n"+
                              "Binanızda bulunan asansörünüzün aylık periyodik bakımı"+(tarihStr?" "+tarihStr+" tarihinde":"")+
                              " teknik ekibimiz tarafından eksiksiz olarak gerçekleştirilmiştir."+
                              (alinan>0?" Bakım bedeli olarak "+alinan.toLocaleString("tr-TR")+" ₺ tarafınızdan alınmıştır.":"")+"\n\n"+
                              "Asansörünüz bakımlı ve güvenli şekilde kullanıma hazırdır.\n\n"+
                              "Herhangi bir sorunuz veya talebiniz olması halinde bizimle iletişime geçmekten lütfen çekinmeyiniz.\n\n"+
                              "Saygılarımızla,\n"+
                              "Asis Asansör Bakım ve Servis Hizmetleri";
                            window.open("https://wa.me/"+tel+"?text="+encodeURIComponent(mesaj),"_blank");
                          },
                          style:{padding:"8px 12px",background:"#0d2518",border:"1px solid #25d36644",borderRadius:8,color:"#25d366",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}
                        },"WhatsApp Bildir")
                    )
                  )
                )
              );
            })
          )
      )

      /* ATANAN ARIZALAR */
      , subTab===1&&(
        atananArizalar.length===0
          ?React.createElement('div', { style: {textAlign:"center",padding:"40px 20px",background:"#1a1f2e",borderRadius:14,border:"1px solid #2a3050"},}
            , React.createElement('div', { style: {fontSize:40,marginBottom:10},}, "⚠️")
            , React.createElement('div', { style: {fontWeight:700,fontSize:14,color:"#94a3b8",marginBottom:6},}, "Atanan arıza yok"  )
            , React.createElement('div', { style: {fontSize:12,color:"#475569"},}, "Yönetici Arızalar sekmesinden size arıza atayacak"     )
          )
          :React.createElement('div', { style: {display:"flex",flexDirection:"column",gap:6},}
            , atananArizalar.map(f=>{
              const elev=elevs.find(e=>e.id===f.asansorId);
              const onRenk=f.oncelik==="Yüksek"?"#ef4444":f.oncelik==="Orta"?"#f59e0b":"#64748b";
              return(
                React.createElement('div', { key: f.id, style: {background:"#141824",borderRadius:12,border:"1px solid "+(f.durum==="Çözüldü"?"#1e3a2e":f.oncelik==="Yüksek"?"#3a1e1e":"#2a3050"),padding:"13px 14px"},}
                  , React.createElement('div', { style: {display:"flex",alignItems:"flex-start",gap:10,marginBottom:10},}
                    , React.createElement('div', { style: {width:9,height:9,borderRadius:"50%",background:onRenk,flexShrink:0,marginTop:4},})
                    , React.createElement('div', { style: {flex:1},}
                      , React.createElement('div', { style: {fontWeight:800,fontSize:14,marginBottom:3},}, f.aciklama)
                      , React.createElement('div', { style: {fontSize:11,color:"#64748b",marginBottom:2},}, eName(f.asansorId), elev?" · "+elev.semt+", "+elev.ilce:"")
                      , React.createElement('div', { style: {display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"},}
                        , React.createElement('span', { style: {fontSize:10,color:"#64748b"},}, "📅 " , f.tarih)
                        , React.createElement('span', { style: {fontSize:10,padding:"2px 7px",borderRadius:4,background:onRenk+"22",color:onRenk,fontWeight:700},}, f.oncelik)
                        , (elev&&elev.yonetici)&&React.createElement('span', { style: {fontSize:10,color:"#94a3b8"},}, "👤 " , elev.yonetici)
                        , (elev&&elev.tel)&&React.createElement('a', { href: "tel:"+elev.tel.replace(/\s/g,""), style: {fontSize:10,color:"#3b82f6",textDecoration:"none"},}, "📞 " , elev.tel)
                      )
                    )
                  )
                  , React.createElement('div', { style: {display:"flex",gap:5,flexWrap:"wrap"},}
                    , ["Beklemede","Devam Ediyor","Çözüldü"].map(d=>(
                      React.createElement('button', { key: d, onClick: ()=>setFaults(p=>p.map(x=>x.id===f.id?{...x,durum:d}:x)),
                        style: {padding:"6px 12px",borderRadius:7,background:f.durum===d?(d==="Çözüldü"?"#1e3a2e":d==="Devam Ediyor"?"#3a1e1e":"#1e2640"):"#0d1321",color:f.durum===d?(d==="Çözüldü"?"#10b981":d==="Devam Ediyor"?"#ef4444":"#3b82f6"):"#64748b",border:"1px solid "+(f.durum===d?"currentColor":"#2a3050"),fontSize:11,fontWeight:f.durum===d?700:400,cursor:"pointer"},}
                        , d==="Beklemede"?"⏳ Beklemede":d==="Devam Ediyor"?"🔧 Devam":"✅ Çözüldü"
                      )
                    ))
                    , f.durum==="Çözüldü"&&elev&&elev.tel&&React.createElement('button', {
                        onClick:function(){
                          var tel=(elev.tel||"").replace(/[\s\-\(\)]/g,"");
                          if(tel.startsWith("0")) tel="90"+tel.slice(1);
                          else if(!tel.startsWith("90")&&!tel.startsWith("+90")) tel="90"+tel;
                          tel=tel.replace(/^\+/,"");
                          var mesaj=
                            "Sayın "+elev.ad+" Yönetimi,\n\n"+
                            "Şirketimize duyduğunuz güven ve anlayışınız için teşekkür ederiz.\n\n"+
                            "Binanızda tespit edilen asansör arızası ("+f.aciklama+") teknik ekibimiz tarafından başarıyla giderilmiş olup asansörünüz güvenli bir şekilde kullanıma hazır hale getirilmiştir.\n\n"+
                            "Herhangi bir sorunuz veya farklı bir arıza durumunda bizimle iletişime geçmekten lütfen çekinmeyiniz.\n\n"+
                            "Saygılarımızla,\n"+
                            "Asis Asansör Bakım ve Servis Hizmetleri";
                          window.open("https://wa.me/"+tel+"?text="+encodeURIComponent(mesaj),"_blank");
                        },
                        style:{padding:"6px 10px",borderRadius:7,background:"#0d2518",border:"1px solid #25d36644",color:"#25d366",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}
                      }, "WhatsApp Bildir"
                    )
                  )
                )
              );
            })
          )
      )

      /* BAKIM SONRASI MAKBUZ MODALI */
      , makbuzSonBakim&&(
        React.createElement('div',{style:{position:"fixed",inset:0,background:"#000000cc",zIndex:2100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          ,React.createElement('div',{style:{background:"var(--bg-panel)",borderRadius:20,border:"1px solid var(--border)",width:"100%",maxWidth:380,overflow:"hidden"}}
            ,React.createElement('div',{style:{padding:"16px 18px",borderBottom:"0.5px solid var(--border-soft)",textAlign:"center"}}
              ,React.createElement('div',{style:{fontSize:32,marginBottom:4}},"🖨️")
              ,React.createElement('div',{style:{fontWeight:800,fontSize:16,color:"var(--text)"}}, "Makbuz Yazdır")
              ,React.createElement('div',{style:{fontSize:12,color:"var(--text-muted)",marginTop:4}},
                (makbuzSonBakim.elev?makbuzSonBakim.elev.ad:"")+" · "+(makbuzSonBakim.tutar||0).toLocaleString("tr-TR")+" ₺")
            )
            ,React.createElement('div',{style:{padding:"16px 18px",display:"flex",flexDirection:"column",gap:10}}
              ,React.createElement('button',{
                onClick:function(){makbuzBakimYazdir(makbuzSonBakim.m,makbuzSonBakim.elev);setMakbuzSonBakim(null);},
                style:{padding:"14px",background:"linear-gradient(135deg,#1e3a5f,#1d4ed8)",border:"none",borderRadius:14,color:"#fff",cursor:"pointer",fontWeight:800,fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",gap:8}
              },"🖨️ Bakım Makbuzunu Yazdır")
              ,React.createElement('button',{
                onClick:function(){setMakbuzSonBakim(null);},
                style:{padding:"12px",background:"var(--bg-elevated)",border:"none",borderRadius:14,color:"var(--text-muted)",cursor:"pointer",fontWeight:600,fontSize:14}
              },"Atla")
            )
          )
        )
      )

      /* BAKIM SONRASI ÖDEME SOR MODALI */
      , odemeSorModal&&(
        React.createElement('div', {style:{position:"fixed",inset:0,background:"#000000cc",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          , React.createElement('div', {style:{background:"var(--bg-panel)",borderRadius:20,border:"1px solid var(--border)",width:"100%",maxWidth:400,overflow:"hidden"}}

            /* Başlık */
            , React.createElement('div', {style:{padding:"14px 18px",borderBottom:"0.5px solid var(--border-soft)",display:"flex",justifyContent:"space-between",alignItems:"center"}}
              , React.createElement('div', {style:{fontWeight:800,fontSize:16,color:"var(--ios-green)"}}, "✅ Bakım Tamamlandı!")
              , React.createElement('button', {onClick:function(){setOdemeSorModal(null);setOdemeMiktar("");},style:{background:"none",border:"none",color:"var(--text-muted)",fontSize:22,cursor:"pointer",lineHeight:1}}, "×")
            )

            , React.createElement('div', {style:{padding:"16px 18px",display:"flex",flexDirection:"column",gap:12}}

              /* Bina adı */
              , React.createElement('div', {style:{fontWeight:800,fontSize:17,color:"var(--text)",textAlign:"center"}},
                  odemeSorModal.elev?odemeSorModal.elev.ad:"")

              /* Finansal özet kutusu */
              , React.createElement('div', {style:{background:"var(--bg-elevated)",borderRadius:14,padding:"12px 14px",display:"flex",flexDirection:"column",gap:8}}
                , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"center"}}
                  , React.createElement('span', {style:{fontSize:12,color:"var(--text-muted)",fontWeight:500}}, "📋 Aylık Bakım Ücreti")
                  , React.createElement('span', {style:{fontSize:14,fontWeight:800,color:"var(--accent)"}},
                      (odemeSorModal.elev?odemeSorModal.elev.aylikUcret:0).toLocaleString("tr-TR")+" ₺")
                )
                , React.createElement('div', {style:{height:"0.5px",background:"var(--border-soft)"}})
                , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"center"}}
                  , React.createElement('span', {style:{fontSize:12,color:"var(--text-muted)",fontWeight:500}}, "📊 Mevcut Devir")
                  , React.createElement('span', {style:{fontSize:14,fontWeight:800,color:(odemeSorModal.elev&&(odemeSorModal.elev.bakiyeDevir||0))>0?"var(--ios-red)":"var(--ios-green)"}},
                      ((odemeSorModal.elev&&(odemeSorModal.elev.bakiyeDevir||0))>0?"+":"")+
                      ((odemeSorModal.elev?odemeSorModal.elev.bakiyeDevir||0:0)).toLocaleString("tr-TR")+" ₺")
                )
              )

              /* Ödeme sorusu veya tutar girişi */
              , !odemeSorModal.odemeGir
                ? React.createElement('div', {style:{display:"flex",flexDirection:"column",gap:10}}
                    , React.createElement('div', {style:{fontSize:13,color:"var(--text-muted)",textAlign:"center",fontWeight:600}}, "Ödeme alındı mı?")
                    , React.createElement('div', {style:{display:"flex",gap:10}}
                      , React.createElement('button', {
                          onClick:function(){setOdemeSorModal(null);setOdemeMiktar("");},
                          style:{flex:1,padding:"13px",background:"var(--bg-elevated)",border:"none",borderRadius:14,color:"var(--text-muted)",cursor:"pointer",fontWeight:600,fontSize:15,minHeight:50}
                        }, "❌ Hayır")
                      , React.createElement('button', {
                          onClick:function(){
                            var varsayilan=odemeSorModal.elev?String(odemeSorModal.elev.aylikUcret):"";
                            setOdemeMiktar(varsayilan);
                            setOdemeSorModal(Object.assign({},odemeSorModal,{odemeGir:true}));
                          },
                          style:{flex:1,padding:"13px",background:"var(--ios-green)",border:"none",borderRadius:14,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:15,minHeight:50}
                        }, "✅ Evet")
                    )
                  )
                : React.createElement('div', {style:{display:"flex",flexDirection:"column",gap:10}}

                    /* Tutar etiketi */
                    , React.createElement('div', {style:{fontSize:12,fontWeight:700,color:"var(--text-muted)"}}, "💵 Alınan Tutar (₺)")

                    /* Tutar input */
                    , React.createElement('input', {
                        type:"number",
                        value:odemeMiktar,
                        onChange:function(e){setOdemeMiktar(e.target.value);},
                        onFocus:function(e){e.target.select();},
                        autoFocus:true,
                        style:{width:"100%",background:"var(--bg-elevated)",border:"2px solid var(--ios-green)",borderRadius:12,padding:"12px 14px",color:"var(--ios-green)",fontSize:24,fontWeight:900,outline:"none",boxSizing:"border-box",textAlign:"center"}
                      })

                    /* Canlı Yeni Devir hesabı */
                    , (function(){
                        var elev=odemeSorModal.elev;
                        if(!elev) return null;
                        var eskiDevir=elev.bakiyeDevir||0;
                        var aylikUcret=elev.aylikUcret||0;
                        var alinan=parseFloat(odemeMiktar)||0;
                        var yeniD=eskiDevir+aylikUcret-alinan;
                        var renk=yeniD>0?"#f97316":yeniD===0?"#94a3b8":"#34d399";
                        var bg=yeniD>0?"rgba(249,115,22,0.12)":yeniD===0?"rgba(148,163,184,0.10)":"rgba(52,211,153,0.12)";
                        return React.createElement('div', {style:{background:bg,borderRadius:12,padding:"10px 14px",border:"1px solid "+renk+"44"}}
                          , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}
                            , React.createElement('span', {style:{fontSize:11,color:"var(--text-muted)",fontWeight:600}}, "Hesap")
                            , React.createElement('span', {style:{fontSize:11,color:"var(--text-dim)"}},
                                eskiDevir.toLocaleString("tr-TR")+" + "+aylikUcret.toLocaleString("tr-TR")+" - "+alinan.toLocaleString("tr-TR"))
                          )
                          , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"center"}}
                            , React.createElement('span', {style:{fontSize:13,fontWeight:700,color:renk}}, "🔄 Yeni Devir")
                            , React.createElement('span', {style:{fontSize:18,fontWeight:900,color:renk}},
                                (yeniD>0?"+":"")+yeniD.toLocaleString("tr-TR")+" ₺")
                          )
                        );
                      })()

                    /* Kaydet butonu */
                    , React.createElement('button', {
                        onClick:function(){
                          if(!odemeSorModal) return;
                          var tutar=parseFloat(odemeMiktar)||0;
                          if(tutar<=0){alert("Lütfen geçerli bir tutar girin!");return;}
                          odemeSorKaydet();
                        },
                        style:{padding:"14px",background:"linear-gradient(135deg,var(--ios-green),#059669)",border:"none",borderRadius:14,color:"#fff",cursor:"pointer",fontWeight:800,fontSize:15,minHeight:52,letterSpacing:"0.3px"}
                      }, "💰 Ödemeyi Kaydet")
                  )
            )
          )
        )
      )

    )
  );
}


export default BakimciGorunum
