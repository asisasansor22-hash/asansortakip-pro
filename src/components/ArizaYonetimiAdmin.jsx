import React, { useState } from 'react'
import { S, Badge, IlceBadge, Stat, Card, Empty, IBtn, Tog, FF, AdresFF, FS, Modal } from '../utils/constants.js'

function ArizaYonetimiAdmin({faults,setFaults,elevs,eName,oAdd,oEdit,del}){
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
                  , React.createElement('div', { style: {fontWeight:700,fontSize:15,marginBottom:4,color:"var(--text)"},}, f.aciklama)
                  , React.createElement('div', { style: {display:"flex",gap:6,alignItems:"center",flexWrap:"wrap",marginBottom:8},}
                    , elev&&React.createElement(IlceBadge, { ilce: elev.ilce,})
                    , React.createElement('span', { style: {fontSize:12,color:"var(--text-muted)"},}, eName(f.asansorId), " · "  , f.tarih)
                    , React.createElement('span', { style: {fontSize:12,padding:"3px 9px",borderRadius:20,background:onRenk+"20",color:onRenk,fontWeight:600},}, f.oncelik)
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
                    , React.createElement(Tog, { active: !!f.bakimciAtandi, on: "🔧 Bakımcıda" , off: "📤 Bakımcıya At"  , color: "var(--ios-green)",
                      onClick: ()=>setFaults(p=>p.map(x=>x.id===f.id?{...x,bakimciAtandi:!x.bakimciAtandi}:x)),})
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
    )
  );
}

export default ArizaYonetimiAdmin
