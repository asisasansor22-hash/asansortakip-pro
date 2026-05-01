import React, { useState } from 'react'
import { S, Badge, IlceBadge, Stat, Card, Empty, IBtn, FF, AdresFF, FS, Modal } from '../utils/constants.js'

function ArizaYonetimiAdmin({faults,setFaults,elevs,eName,oAdd,oEdit,del,bakimcilar,firmaAdi}){
  var _firmaAdi=firmaAdi||"Şirketimiz";
  const [atamaModal,setAtamaModal]=useState(null);
  const kayitliBakimcilar=Array.isArray(bakimcilar)?bakimcilar:[];
  const bakimciAdi=function(f){
    if(!f) return "";
    if(f.bakimciAd) return f.bakimciAd;
    var b=kayitliBakimcilar.find(function(x){return x.id===f.bakimciId;});
    return b&&b.ad?b.ad:"";
  };
  const bakimciRenk=function(f){
    if(!f) return "#10b981";
    if(f.bakimciRenk) return f.bakimciRenk;
    var b=kayitliBakimcilar.find(function(x){return x.id===f.bakimciId;});
    return b&&b.renk?b.renk:"#10b981";
  };
  const atamaAc=function(f){
    if(kayitliBakimcilar.length===0){alert("Kayıtlı bakımcı bulunamadı. Önce Bakımcılar sekmesinden bakımcı ekleyin.");return;}
    setAtamaModal(f);
  };
  const bakimciyaAta=function(b){
    if(!atamaModal||!b) return;
    setFaults(function(p){return p.map(function(x){return x.id===atamaModal.id?Object.assign({},x,{bakimciAtandi:true,bakimciId:b.id,bakimciAd:b.ad,bakimciRenk:b.renk,durum:x.durum==="Beklemede"?"Devam Ediyor":x.durum}):x;});});
    setAtamaModal(null);
  };
  const atamayiKaldir=function(f){
    if(!window.confirm("Bu arıza bakımcı atamasından kaldırılsın mı?")) return;
    setFaults(function(p){return p.map(function(x){return x.id===f.id?Object.assign({},x,{bakimciAtandi:false,bakimciId:null,bakimciAd:null,bakimciRenk:null}):x;});});
  };
  return(
    React.createElement('div', null
      , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},}
        , React.createElement('h2', { style: {fontSize:18,fontWeight:900,margin:0},}, "⚠️ Arıza Takibi"  )
        , React.createElement('button', { onClick: ()=>oAdd("f"), style: {background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"#fff",border:"none",borderRadius:10,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer"},}, "+ Arıza Ekle"  )
      )
      /* Özet */
      , React.createElement('div', { style: {display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(100px,1fr))",gap:8,marginBottom:14},}
        , [
          {l:"Toplam",v:faults.length,c:"#64748b"},
          {l:"Yüksek",v:faults.filter(f=>f.oncelik==="Yüksek"&&f.durum!=="Çözüldü").length,c:"#ef4444"},
          {l:"Bakımcıda",v:faults.filter(f=>f.bakimciAtandi&&f.durum!=="Çözüldü").length,c:"#10b981"},
          {l:"Çözüldü",v:faults.filter(f=>f.durum==="Çözüldü").length,c:"#3b82f6"},
        ].map(x=>(
          React.createElement('div', { key: x.l, style: {background:"#1a1f2e",borderRadius:10,padding:"10px 12px",border:"1px solid "+x.c+"33",textAlign:"center"},}
            , React.createElement('div', { style: {fontSize:18,fontWeight:900,color:x.c},}, x.v)
            , React.createElement('div', { style: {fontSize:10,color:"#64748b"},}, x.l)
          )
        ))
      )
      , React.createElement('div', { style: {display:"flex",flexDirection:"column",gap:6},}
        , faults.length===0&&React.createElement(Empty, { t: "Kayıtlı arıza yok"  ,})
        , faults.map(f=>{
          const elev=elevs.find(e=>e.id===f.asansorId);
          const onRenk=f.oncelik==="Yüksek"?"#ef4444":f.oncelik==="Orta"?"#f59e0b":"#64748b";
          return(
            React.createElement('div', { key: f.id, style: {background:"var(--bg-panel)",borderRadius:16,border:"0.5px solid "+(f.durum==="Çözüldü"?"rgba(52,199,89,0.3)":f.oncelik==="Yüksek"?"rgba(255,59,48,0.3)":"var(--border)"),padding:"14px 16px",boxShadow:"var(--shadow-sm)"},}
              , React.createElement('div', { style: {display:"flex",alignItems:"flex-start",gap:12},}
                , React.createElement('div', { style: {width:10,height:10,borderRadius:"50%",background:onRenk,flexShrink:0,marginTop:4},})
                , React.createElement('div', { style: {flex:1,minWidth:0},}
                  , React.createElement('div', { style: {fontWeight:700,fontSize:15,marginBottom:4,color:"var(--text)"},}, f.aciklama||"—")
                  , React.createElement('div', { style: {display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:8},}
                    , elev&&React.createElement(IlceBadge, { ilce: elev.ilce,})
                    , React.createElement('span', { style: {fontSize:12,color:"var(--text-muted)"},}, eName(f.asansorId), " · "  , f.tarih||"")
                    , React.createElement('span', { style: {fontSize:12,padding:"3px 9px",borderRadius:20,background:onRenk+"20",color:onRenk,fontWeight:600},}, f.oncelik)
                    , f.bakimciAtandi&&React.createElement('span', { style: {fontSize:12,padding:"3px 9px",borderRadius:20,background:bakimciRenk(f)+"22",color:bakimciRenk(f),fontWeight:700},}, "🔧 " , bakimciAdi(f)||"Bakımcı")
                    , f.durum==="Çözüldü"&&f.cozumTarih&&React.createElement('span', { style: {fontSize:12,color:"var(--ios-green)"},}, "✅ " , f.cozumTarih)
                  )
                  , f.fotolar&&f.fotolar.length>0&&React.createElement('div', {className:"foto-grid",style:{marginBottom:8}},
                    f.fotolar.slice(0,4).map(function(src,i){
                      return React.createElement('img', {key:i, src:src, className:"foto-thumb", alt:"foto",
                        onClick:function(){window.open(src,"_blank");}
                      });
                    }),
                    f.fotolar.length>4&&React.createElement('div', {style:{width:72,height:72,borderRadius:8,background:"var(--bg-elevated)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"var(--text-muted)"}}, "+"+(f.fotolar.length-4))
                  )
                  , React.createElement('div', { style: {display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"},}
                    , React.createElement('select', { value: f.durum, onChange: e=>setFaults(p=>p.map(x=>x.id===f.id?{...x,durum:e.target.value}:x)), style: {...S.sel,fontSize:13,padding:"8px 12px"},}
                      , React.createElement('option', null, "Beklemede"), React.createElement('option', null, "Devam Ediyor" ), React.createElement('option', null, "Çözüldü")
                    )
                    , React.createElement('button', {
                        onClick:function(){atamaAc(f);},
                        style:{fontSize:12,padding:"6px 12px",borderRadius:20,background:f.bakimciAtandi?bakimciRenk(f)+"20":"var(--bg-elevated)",color:f.bakimciAtandi?bakimciRenk(f):"var(--text-muted)",border:"none",fontWeight:f.bakimciAtandi?800:600,cursor:"pointer",whiteSpace:"nowrap",minHeight:36}
                      }, f.bakimciAtandi?("🔧 "+(bakimciAdi(f)||"Bakımcıda")):"📤 Bakımcıya At")
                    , f.bakimciAtandi&&React.createElement('button', {
                        onClick:function(){atamayiKaldir(f);},
                        style:{fontSize:12,padding:"6px 10px",borderRadius:20,background:"rgba(239,68,68,0.12)",color:"#ef4444",border:"none",fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",minHeight:36}
                      }, "Atamayı Kaldır")
                    , f.durum==="Çözüldü"&&elev&&elev.tel&&React.createElement('button', {
                        onClick:function(){
                          var tel=(elev.tel||"").replace(/[\s\-\(\)]/g,"");
                          if(tel.startsWith("0")) tel="90"+tel.slice(1);
                          else if(!tel.startsWith("90")&&!tel.startsWith("+90")) tel="90"+tel;
                          tel=tel.replace(/^\+/,"");
                          var mesaj=
                            "Sayın "+elev.ad+" Yönetimi,\n\n"+
                            _firmaAdi+" olarak duyduğunuz güven ve anlayışınız için teşekkür ederiz.\n\n"+
                            "Binanızda tespit edilen asansör arızası ("+f.aciklama+") teknik ekibimiz tarafından başarıyla giderilmiş olup asansörünüz güvenli bir şekilde kullanıma hazır hale getirilmiştir.\n\n"+
                            "Herhangi bir sorunuz veya farklı bir arıza durumunda bizimle iletişime geçmekten lütfen çekinmeyiniz.\n\n"+
                            "Saygılarımızla,\n"+
                            _firmaAdi;
                          window.open("https://wa.me/"+tel+"?text="+encodeURIComponent(mesaj),"_blank");
                        },
                        style:{padding:"6px 10px",borderRadius:8,background:"#0d2518",border:"1px solid #25d36644",color:"#25d366",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}
                      }, "WhatsApp Bildir"
                    )
                    , React.createElement(IBtn, { onClick: ()=>oEdit("f",f), icon: "✏️",})
                    , React.createElement(IBtn, { onClick: ()=>del("f",f.id), icon: "🗑️", danger: true,})
                  )
                )
              )
            )
          );
        })
      )
      , atamaModal&&React.createElement('div', {style:{position:"fixed",inset:0,background:"#000000cc",zIndex:2100,display:"flex",alignItems:"center",justifyContent:"center",padding:16},onClick:function(e){if(e.target===e.currentTarget)setAtamaModal(null);}},
        React.createElement('div', {style:{width:"100%",maxWidth:420,background:"var(--bg-panel)",border:"1px solid var(--border)",borderRadius:18,overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.45)"}},
          React.createElement('div', {style:{padding:"14px 16px",borderBottom:"1px solid var(--border-soft)",display:"flex",justifyContent:"space-between",alignItems:"center"}},
            React.createElement('div', null,
              React.createElement('div', {style:{fontWeight:900,fontSize:15,color:"var(--text)"}}, "Arıza bakımcısı seç"),
              React.createElement('div', {style:{fontSize:12,color:"var(--text-muted)",marginTop:3}}, atamaModal.aciklama||"Arıza kaydı")
            ),
            React.createElement('button', {onClick:function(){setAtamaModal(null);},style:{background:"var(--bg-elevated)",border:"none",color:"var(--text-muted)",fontSize:18,cursor:"pointer",borderRadius:20,width:32,height:32}}, "×")
          ),
          React.createElement('div', {style:{padding:14,display:"flex",flexDirection:"column",gap:8}},
            kayitliBakimcilar.map(function(b){
              var active=atamaModal.bakimciId===b.id;
              var renk=b.renk||"#3b82f6";
              return React.createElement('button', {
                key:b.id,
                onClick:function(){bakimciyaAta(b);},
                style:{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"12px 13px",borderRadius:12,border:"1px solid "+(active?renk:"var(--border)"),background:active?renk+"22":"var(--bg-elevated)",color:active?renk:"var(--text)",cursor:"pointer",fontWeight:800,textAlign:"left"}
              },
                React.createElement('span', {style:{width:10,height:10,borderRadius:"50%",background:renk,flexShrink:0}}),
                React.createElement('span', {style:{flex:1}}, b.ad||"Bakımcı"),
                active&&React.createElement('span', {style:{fontSize:11,color:renk}}, "Seçili")
              );
            })
          )
        )
      )
    )
  );
}

export default ArizaYonetimiAdmin
