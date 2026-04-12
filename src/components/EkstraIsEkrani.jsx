import React, { useState, useEffect, useRef, useMemo } from 'react'
import { makbuzEkstraYazdir } from '../utils/makbuz.js'
import { S, Badge, IlceBadge, Stat, Card, Empty, IBtn, Tog, FF, AdresFF, FS, Modal, MONTHS, getIlceRenk } from '../utils/constants.js'

function EkstraIsEkrani(props) {
  var elevs = props.elevs;
  var ekstraIsler = props.ekstraIsler;
  var setEkstraIsler = props.setEkstraIsler;
  var setElevs = props.setElevs;
  var rol = props.rol;
  var ilceler = props.ilceler;
  var today = props.today;
  var _fs=useState({ilce:"",binaId:"",isAdi:"",tutar:"",tarih:today||"",not:"",odendi:false});
  var form=_fs[0]; var setForm=_fs[1];
  var _ss=useState(null);
  var silOnay=_ss[0]; var setSilOnay=_ss[1];
  function setF(k,v){setForm(function(p){var u=Object.assign({},p);u[k]=v;return u;});}
  var ilceBinalari=useMemo(function(){
    if(!form.ilce) return [];
    return elevs.filter(function(e){return (e.ilce||"Diger")===form.ilce;});
  },[form.ilce,elevs]);
  var seciliBina=useMemo(function(){
    if(!form.binaId) return null;
    return elevs.find(function(e){return e.id===Number(form.binaId);});
  },[form.binaId,elevs]);
  var sonKayitlar=useMemo(function(){
    return ekstraIsler.slice().sort(function(a,b){return (b.tarih+(b.saat||"")).localeCompare(a.tarih+(a.saat||""));});
  },[ekstraIsler]);
  var toplamIs=ekstraIsler.length;
  var devirdekiTutar=ekstraIsler.filter(function(k){return !k.odendi;}).reduce(function(s,k){return s+(k.tutar||0);},0);
  var odenenTutar=ekstraIsler.filter(function(k){return !!k.odendi;}).reduce(function(s,k){return s+(k.tutar||0);},0);
  function kaydet(){
    var binaId=Number(form.binaId);
    var tutar=parseFloat(form.tutar)||0;
    if(!binaId){alert("Bina seçiniz!");return;}
    if(!form.isAdi.trim()){alert("Yapılan işi yazınız!");return;}
    if(tutar<=0){alert("Tutar giriniz!");return;}
    var simdi=new Date();
    var saat=simdi.getHours().toString().padStart(2,"0")+":"+simdi.getMinutes().toString().padStart(2,"0");
    var bina=elevs.find(function(e){return e.id===binaId;});
    var yeniKayit={id:Date.now(),binaId:binaId,binaAd:bina?bina.ad:"?",ilce:bina?bina.ilce:"",isAdi:form.isAdi.trim(),tutar:tutar,tarih:form.tarih||today,saat:saat,not:form.not||"",rol:rol,odendi:!!form.odendi};
    setEkstraIsler(function(p){return p.concat([yeniKayit]);});
    if(!form.odendi){
      setElevs(function(p){return p.map(function(e){if(e.id===binaId){return Object.assign({},e,{bakiyeDevir:(e.bakiyeDevir||0)+tutar});}return e;});});
      alert("Ekstra iş kaydedildi ve devir bakiyeye eklendi.");
    } else {
      alert("Ekstra iş kaydedildi. (Ödendi — devir etkilenmedi.)");
    }
    setForm(function(p){return Object.assign({},p,{isAdi:"",tutar:"",not:"",odendi:false});});
  }
  function silKayit(id){
    var kayit=ekstraIsler.find(function(k){return k.id===id;});
    if(!kayit) return;
    if(!kayit.odendi){
      setElevs(function(p){return p.map(function(e){if(e.id===kayit.binaId){return Object.assign({},e,{bakiyeDevir:(e.bakiyeDevir||0)-kayit.tutar});}return e;});});
    }
    setEkstraIsler(function(p){return p.filter(function(k){return k.id!==id;});});
    setSilOnay(null);
  }
  var inp={width:"100%",background:"var(--bg-elevated)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 12px",color:"var(--text)",fontSize:13,outline:"none",boxSizing:"border-box"};
  var lbl={display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4};
  var mb={marginBottom:10};
  return React.createElement("div",{className:"ios-animate"},
    React.createElement("div",{style:{fontSize:20,fontWeight:800,marginBottom:16,letterSpacing:-0.5}},"\uD83D\uDD29 Ekstra \u0130\u015f Kayd\u0131"),
    /* İstatistik kartları */
    React.createElement("div",{style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}},
      React.createElement("div",{style:{background:"var(--bg-card)",borderRadius:10,padding:"10px 12px",border:"1px solid #f59e0b33",textAlign:"center"}},
        React.createElement("div",{style:{fontSize:20,fontWeight:900,color:"#f59e0b"}},toplamIs),
        React.createElement("div",{style:{fontSize:10,color:"var(--text-muted)"}},"Toplam \u0130\u015f")
      ),
      React.createElement("div",{style:{background:"var(--bg-card)",borderRadius:10,padding:"10px 12px",border:"1px solid #ef444433",textAlign:"center"}},
        React.createElement("div",{style:{fontSize:12,fontWeight:900,color:"#ef4444"}},devirdekiTutar.toLocaleString("tr-TR")+" \u20ba"),
        React.createElement("div",{style:{fontSize:10,color:"var(--text-muted)"}},"Devirdeki")
      ),
      React.createElement("div",{style:{background:"var(--bg-card)",borderRadius:10,padding:"10px 12px",border:"1px solid #10b98133",textAlign:"center"}},
        React.createElement("div",{style:{fontSize:12,fontWeight:900,color:"#10b981"}},odenenTutar.toLocaleString("tr-TR")+" \u20ba"),
        React.createElement("div",{style:{fontSize:10,color:"var(--text-muted)"}},"\u00d6dendi")
      )
    ),
    /* Form */
    React.createElement("div",{style:{background:"var(--bg-card)",borderRadius:14,border:"1px solid var(--border)",padding:16,marginBottom:16}},
      React.createElement("div",{style:{fontSize:13,fontWeight:700,color:"#f59e0b",marginBottom:14}},"\u2795 Yeni Ekstra \u0130\u015f Ekle"),
      React.createElement("div",{style:mb},
        React.createElement("label",{style:lbl},"\u0130l\u00e7e"),
        React.createElement("select",{value:form.ilce,onChange:function(e){setF("ilce",e.target.value);setF("binaId","");},style:Object.assign({},inp,{cursor:"pointer"})},
          React.createElement("option",{value:""},"\u2014 \u0130l\u00e7e se\u00e7in \u2014"),
          ilceler.map(function(il){return React.createElement("option",{key:il,value:il},il);})
        )
      ),
      form.ilce&&React.createElement("div",{style:mb},
        React.createElement("label",{style:lbl},"Bina"),
        React.createElement("select",{value:form.binaId,onChange:function(e){setF("binaId",e.target.value);},style:Object.assign({},inp,{cursor:"pointer"})},
          React.createElement("option",{value:""},"\u2014 Bina se\u00e7in \u2014"),
          ilceBinalari.map(function(e){return React.createElement("option",{key:e.id,value:String(e.id)},e.ad+" (Devir: "+(e.bakiyeDevir||0).toLocaleString("tr-TR")+" \u20ba)");})
        )
      ),
      React.createElement("div",{style:mb},
        React.createElement("label",{style:lbl},"Yap\u0131lan \u0130\u015f"),
        React.createElement("input",{type:"text",value:form.isAdi,onChange:function(e){setF("isAdi",e.target.value);},placeholder:"Örn: Ya\u011f de\u011fi\u015fimi, Halat tamiri...",style:inp})
      ),
      React.createElement("div",{style:mb},
        React.createElement("label",{style:lbl},"Tutar (\u20ba)"),
        React.createElement("input",{type:"number",value:form.tutar,onChange:function(e){setF("tutar",e.target.value);},placeholder:"0",style:Object.assign({},inp,{color:"#f59e0b",fontWeight:700,fontSize:15})})
      ),
      React.createElement("div",{style:{display:"flex",gap:10,marginBottom:14}},
        React.createElement("div",{style:{flex:1}},
          React.createElement("label",{style:lbl},"Tarih"),
          React.createElement("input",{type:"date",value:form.tarih,onChange:function(e){setF("tarih",e.target.value);},style:inp})
        ),
        React.createElement("div",{style:{flex:2}},
          React.createElement("label",{style:lbl},"Not (iste\u011fe ba\u011fl\u0131)"),
          React.createElement("input",{type:"text",value:form.not,onChange:function(e){setF("not",e.target.value);},placeholder:"A\u00e7\u0131klama...",style:inp})
        )
      ),
      /* Ödeme durumu toggle */
      React.createElement("div",{style:{marginBottom:14}},
        React.createElement("label",{style:{display:"flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 12px",background:form.odendi?"rgba(16,185,129,0.12)":"rgba(245,158,11,0.16)",border:"1px solid "+(form.odendi?"#10b98144":"#f59e0b55"),borderRadius:10}},
          React.createElement("input",{type:"checkbox",checked:!!form.odendi,onChange:function(e){setF("odendi",e.target.checked);},style:{width:18,height:18,cursor:"pointer",accentColor:form.odendi?"#10b981":"#f59e0b"}}),
          React.createElement("div",null,
            React.createElement("div",{style:{fontSize:13,fontWeight:800,color:form.odendi?"#0f9f67":"#9a5a00"}},form.odendi?"\u2705 Hemen \u00d6dendi":"\u23f3 \u00d6denmedi \u2014 Devire Eklenecek"),
            React.createElement("div",{style:{fontSize:10,color:"var(--text)",opacity:0.72,marginTop:2}},form.odendi?"Kaydedilecek, devir etkilenmeyecek":"Tutar devir bakiyesine eklenecek")
          )
        )
      ),
      seciliBina&&form.tutar&&React.createElement("div",{style:{background:form.odendi?"rgba(16,185,129,0.12)":"rgba(245,158,11,0.12)",border:"1px solid "+(form.odendi?"#10b98144":"#f59e0b44"),borderRadius:8,padding:"8px 12px",marginBottom:12,fontSize:11,color:form.odendi?"#0f9f67":"#9a5a00"}},
        form.odendi
          ?React.createElement("span",null,"\u2705 ",React.createElement("strong",null,seciliBina.ad)," \u2014 ",(parseFloat(form.tutar)||0).toLocaleString("tr-TR")," \u20ba \u00f6dendi olarak kaydedilecek.")
          :React.createElement("span",null,"\u26a0\ufe0f ",React.createElement("strong",null,seciliBina.ad)," devir bakiyesine ",React.createElement("strong",null,(parseFloat(form.tutar)||0).toLocaleString("tr-TR")+" \u20ba")," eklenecek.")
      ),
      React.createElement("button",{onClick:kaydet,style:{width:"100%",padding:"12px",background:form.odendi?"linear-gradient(135deg,#10b981,#059669)":"linear-gradient(135deg,#f59e0b,#d97706)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer"}},
        form.odendi?"\uD83D\uDCBE Kaydet (\u00d6dendi)":"\uD83D\uDCBE Kaydet & Devire Ekle")
    ),
    /* Liste */
    sonKayitlar.length===0
      ?React.createElement("div",{style:{textAlign:"center",padding:"40px 20px",background:"var(--bg-card)",borderRadius:14,border:"1px solid var(--border)",color:"var(--text-muted)"}},
          React.createElement("div",{style:{fontSize:36,marginBottom:10}},"\uD83D\uDD29"),"Hen\u00fcz ekstra i\u015f kayd\u0131 yok.")
      :React.createElement("div",{style:{display:"flex",flexDirection:"column",gap:8}},
          React.createElement("div",{style:{fontSize:12,fontWeight:700,color:"var(--text-muted)",marginBottom:4}},"Son Kay\u0131tlar"),
          sonKayitlar.map(function(k){
            return React.createElement("div",{key:k.id,style:{background:"var(--bg-elevated)",borderRadius:12,border:"1px solid var(--border)",padding:"12px 14px"}},
              React.createElement("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}},
                React.createElement("div",{style:{flex:1,minWidth:0}},
                  React.createElement("div",{style:{fontWeight:800,fontSize:13,marginBottom:2}},k.isAdi),
                  React.createElement("div",{style:{fontSize:11,color:"var(--text-muted)"}},k.binaAd+" \u00b7 "+k.ilce),
                  React.createElement("div",{style:{fontSize:10,color:"var(--text-dim)",marginTop:2}},"\uD83D\uDCC5 "+k.tarih+" "+(k.saat||"")+(k.not?" \u00b7 "+k.not:""))
                ),
                React.createElement("div",{style:{textAlign:"right",flexShrink:0,marginLeft:8}},
                  React.createElement("div",{style:{fontSize:16,fontWeight:900,color:k.odendi?"#10b981":"#f59e0b",marginBottom:4}},"+"+(k.tutar||0).toLocaleString("tr-TR")+" \u20ba"),
                  React.createElement("div",{style:{fontSize:9,fontWeight:700,color:k.odendi?"#10b981":"#f59e0b",background:k.odendi?"rgba(16,185,129,0.12)":"rgba(245,158,11,0.12)",padding:"2px 6px",borderRadius:4,marginBottom:4}},k.odendi?"\u2705 \u00d6dendi":"\u23f3 Devire eklendi"),
                  React.createElement("button",{
                    onClick:function(){var bina=elevs.find(function(e){return e.id===k.binaId;});makbuzEkstraYazdir(k,bina||null);},
                    style:{display:"block",width:"100%",padding:"3px 8px",background:"rgba(59,130,246,0.15)",border:"1px solid #3b82f666",borderRadius:5,color:"#3b82f6",fontSize:10,fontWeight:700,cursor:"pointer",marginBottom:4}
                  },"\uD83D\uDDA8\uFE0F Makbuz"),
                  React.createElement("button",{
                    onClick:function(){setSilOnay(k.id);},
                    style:{display:"block",width:"100%",padding:"3px 8px",background:"rgba(239,68,68,0.12)",border:"1px solid #ef444444",borderRadius:5,color:"#ef4444",fontSize:10,fontWeight:700,cursor:"pointer"}
                  },"\uD83D\uDDD1\uFE0F Sil")
                )
              )
            );
          })
        ),
    /* Silme onay modal */
    silOnay&&React.createElement("div",{style:{position:"fixed",inset:0,background:"#000000cc",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}},
      React.createElement("div",{style:{background:"var(--bg-card)",borderRadius:16,border:"1px solid #ef444444",padding:24,maxWidth:320,width:"100%"}},
        React.createElement("div",{style:{fontSize:15,fontWeight:800,color:"#ef4444",marginBottom:8}},"\u26a0\ufe0f Kay\u0131t Silinecek"),
        React.createElement("div",{style:{fontSize:12,color:"var(--text-muted)",marginBottom:16}},"Bu i\u015flem geri al\u0131namaz."+(ekstraIsler.find(function(k){return k.id===silOnay;})&&!ekstraIsler.find(function(k){return k.id===silOnay;}).odendi?" Devir bakiyeden de d\u00fc\u015f\u00fclecek.":"")),
        React.createElement("div",{style:{display:"flex",gap:8}},
          React.createElement("button",{onClick:function(){setSilOnay(null);},style:{flex:1,padding:"10px",background:"var(--bg-elevated)",border:"none",borderRadius:8,color:"var(--text-muted)",cursor:"pointer",fontWeight:600}},"\u0130ptal"),
          React.createElement("button",{onClick:function(){silKayit(silOnay);},style:{flex:1,padding:"10px",background:"#ef4444",border:"none",borderRadius:8,color:"#fff",cursor:"pointer",fontWeight:800}},"Evet, Sil")
        )
      )
    )
  );
}

export default EkstraIsEkrani
