import React, { useState } from 'react'
import { S, Badge, IlceBadge, Stat, Card, Empty, IBtn, MONTHS } from '../utils/constants.js'
import { IconNote, IconEdit, IconSave, IconFolder, IconInbox, IconTie, IconWrench, IconTrash } from './Icons.jsx'

function NotlarEkrani({elevs,notlar,setNotlar,rol,ilceler}){
  var [yeniIlce,setYeniIlce]=useState("");
  var [yeniBina,setYeniBina]=useState("");
  var [yeniNot,setYeniNot]=useState("");
  var [filtreBina,setFiltreBina]=useState("tumu"); // "tumu" | asansorId string
  var [duzenlemeId,setDuzenlemeId]=useState(null);
  var [duzenlemeMetin,setDuzenlemeMetin]=useState("");

  var yeniBinaListesi=elevs.filter(function(e){return (e.ilce||"Diğer")===yeniIlce;});
  var seciliBinaObj=elevs.find(function(e){return String(e.id)===String(yeniBina);});

  var tumNotlar=notlar.slice().sort(function(a,b){return String(b.tarihSaat).localeCompare(String(a.tarihSaat));});
  var gorunenNotlar=filtreBina==="tumu"?tumNotlar:tumNotlar.filter(function(n){return String(n.asansorId)===String(filtreBina);});

  // Binalar: not olan binalar (filtre için)
  var notluBinaIds=[...new Set(notlar.map(function(n){return n.asansorId;}))];
  var notluBinalar=elevs.filter(function(e){return notluBinaIds.includes(e.id);});

  function simdiStr(){
    var now=new Date();
    return now.getFullYear()+"-"+(now.getMonth()+1).toString().padStart(2,"0")+"-"+now.getDate().toString().padStart(2,"0")
      +" "+now.getHours().toString().padStart(2,"0")+":"+now.getMinutes().toString().padStart(2,"0");
  }

  function notEkle(){
    if(!yeniNot.trim()||!yeniBina) return;
    var yeni={id:Date.now(),asansorId:Number(yeniBina),metin:yeniNot.trim(),tarihSaat:simdiStr(),rol:rol};
    setNotlar(function(p){return p.concat([yeni]);});
    setYeniNot("");
    setYeniIlce("");
    setYeniBina("");
  }

  function notSil(id){
    if(!window.confirm("Bu not silinsin mi?")) return;
    setNotlar(function(p){return p.filter(function(n){return n.id!==id;});});
  }

  function duzenlemeBaslat(n){setDuzenlemeId(n.id);setDuzenlemeMetin(n.metin);}

  function duzenlemeSaydet(){
    if(!duzenlemeMetin.trim()) return;
    setNotlar(function(p){return p.map(function(n){
      return n.id===duzenlemeId?Object.assign({},n,{metin:duzenlemeMetin.trim(),duzenlendi:simdiStr(),duzenlemeRol:rol}):n;
    });});
    setDuzenlemeId(null);setDuzenlemeMetin("");
  }

  function binaAdi(id){var b=elevs.find(function(e){return e.id===id;});return b?b.ad:"Bilinmiyor";}
  function binaIlce(id){var b=elevs.find(function(e){return e.id===id;});return b?(b.ilce||""):"";  }

  return React.createElement('div', null,

    /* ─── Başlık ─── */
    React.createElement('div', {style:{fontSize:20,fontWeight:800,marginBottom:16,letterSpacing:-0.5}}, React.createElement(IconNote, {size:14}), " Notlar"),

    /* ══════════════════════════════════
       YENİ NOT EKLE ALANI
    ══════════════════════════════════ */
    React.createElement('div', {style:{background:"var(--bg-panel)",borderRadius:16,overflow:"hidden",marginBottom:20,boxShadow:"var(--shadow-sm)"}},

      /* Başlık şeridi */
      React.createElement('div', {style:{padding:"12px 16px",borderBottom:"0.5px solid var(--border-soft)",display:"flex",alignItems:"center",gap:8}},
        React.createElement('div', {style:{width:28,height:28,borderRadius:8,background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14}}, React.createElement(IconEdit, {size:14})),
        React.createElement('div', {style:{fontWeight:700,fontSize:15,color:"var(--text)"}}, "Yeni Not Ekle")
      ),

      React.createElement('div', {style:{padding:"14px 16px",display:"flex",flexDirection:"column",gap:10}},

        /* İlçe seç */
        React.createElement('div', null,
          React.createElement('label', {style:{display:"block",fontSize:12,fontWeight:600,color:"var(--text-muted)",marginBottom:5}}, "1. İlçe Seçin"),
          React.createElement('select', {
            value:yeniIlce,
            onChange:function(e){setYeniIlce(e.target.value);setYeniBina("");},
            style:S.sel
          },
            React.createElement('option',{value:""},"— İlçe seçin —"),
            ilceler.map(function(il){return React.createElement('option',{key:il,value:il},il);})
          )
        ),

        /* Bina seç (ilçe seçilince açılır) */
        yeniIlce&&React.createElement('div', null,
          React.createElement('label', {style:{display:"block",fontSize:12,fontWeight:600,color:"var(--text-muted)",marginBottom:5}}, "2. Bina Seçin"),
          yeniBinaListesi.length===0
            ? React.createElement('div',{style:{fontSize:13,color:"var(--text-dim)",padding:"10px 0"}}, "Bu ilçede kayıtlı bina yok.")
            : React.createElement('select', {
                value:yeniBina,
                onChange:function(e){setYeniBina(e.target.value);},
                style:S.sel
              },
                React.createElement('option',{value:""},"— Bina seçin —"),
                yeniBinaListesi.map(function(e){return React.createElement('option',{key:e.id,value:String(e.id)},e.ad);})
              )
        ),

        /* Not metin alanı (bina seçilince açılır) */
        yeniBina&&React.createElement('div', null,
          React.createElement('label', {style:{display:"block",fontSize:12,fontWeight:600,color:"var(--text-muted)",marginBottom:5}},
            "3. Not — ",
            React.createElement('span',{style:{color:"var(--accent)",fontWeight:700}}, seciliBinaObj?seciliBinaObj.ad:"")
          ),
          React.createElement('textarea', {
            value:yeniNot,
            onChange:function(e){setYeniNot(e.target.value);},
            placeholder:"Notunuzu buraya yazın...",
            rows:4,
            autoFocus:true,
            style:Object.assign({},S.inp,{resize:"vertical",lineHeight:1.6,fontFamily:"inherit"})
          })
        ),

        /* Kaydet butonu */
        React.createElement('button', {
          onClick:notEkle,
          disabled:!yeniNot.trim()||!yeniBina,
          style:{
            padding:"13px",
            background:(yeniNot.trim()&&yeniBina)?"var(--accent)":"var(--bg-elevated)",
            border:"none",borderRadius:12,
            color:(yeniNot.trim()&&yeniBina)?"#fff":"var(--text-dim)",
            fontWeight:700,fontSize:15,
            cursor:(yeniNot.trim()&&yeniBina)?"pointer":"default",
            minHeight:50,transition:"all 0.2s"
          }
        }, React.createElement(IconSave, {size:14}), " Notu Kaydet")
      )
    ),

    /* ══════════════════════════════════
       KAYITLI NOTLAR
    ══════════════════════════════════ */
    React.createElement('div', null,

      /* Başlık + bina filtresi */
      React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}},
        React.createElement('div', {style:{fontWeight:700,fontSize:15,color:"var(--text)"}},
          React.createElement(IconFolder, {size:14}), " Kayıtlı Notlar",
          React.createElement('span',{style:{marginLeft:8,fontSize:12,fontWeight:500,color:"var(--text-muted)"}}, "("+gorunenNotlar.length+")")
        ),
        notluBinalar.length>0&&React.createElement('select', {
          value:filtreBina,
          onChange:function(e){setFiltreBina(e.target.value);},
          style:Object.assign({},S.sel,{width:"auto",fontSize:12,padding:"7px 30px 7px 10px"})
        },
          React.createElement('option',{value:"tumu"},"Tüm binalar"),
          notluBinalar.map(function(e){
            var c=notlar.filter(function(n){return n.asansorId===e.id;}).length;
            return React.createElement('option',{key:e.id,value:String(e.id)},e.ad+" ("+c+")");
          })
        )
      ),

      /* Not listesi */
      gorunenNotlar.length===0
        ? React.createElement('div', {style:{
            textAlign:"center",color:"var(--text-dim)",fontSize:14,
            padding:"40px 20px",background:"var(--bg-panel)",
            borderRadius:16,boxShadow:"var(--shadow-sm)"
          }},
            React.createElement('div',{style:{fontSize:36,marginBottom:10}},React.createElement(IconInbox, {size:36})),
            "Henüz kayıtlı not yok.",
            React.createElement('br',null),
            React.createElement('span',{style:{fontSize:13}}, "Yukarıdaki alandan ilk notu ekleyebilirsiniz.")
          )
        : React.createElement('div', {style:{display:"flex",flexDirection:"column",gap:10}},
            gorunenNotlar.map(function(n){
              var isYon=n.rol==="yonetici";
              var renkAcc=isYon?"var(--accent)":"var(--ios-green)";
              var rolLabel=isYon?[React.createElement(IconTie, {size:14, key:"i"}), " Yönetici"]:[React.createElement(IconWrench, {size:14, key:"i"}), " Bakımcı"];
              var bAdi=binaAdi(n.asansorId);
              var bIlce=binaIlce(n.asansorId);
              return React.createElement('div', {key:n.id,
                style:{background:"var(--bg-panel)",borderRadius:14,padding:"14px 16px",
                  boxShadow:"var(--shadow-sm)",borderLeft:"3px solid "+renkAcc}
              },
                /* Üst: kim, bina, zaman */
                React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,gap:8,flexWrap:"wrap"}},
                  React.createElement('div', {style:{display:"flex",flexDirection:"column",gap:5}},
                    React.createElement('div',{style:{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}},
                      React.createElement('span',{style:{fontSize:12,fontWeight:700,color:renkAcc,background:renkAcc+"18",padding:"3px 10px",borderRadius:20}}, rolLabel),
                      React.createElement('span',{style:{fontSize:12,fontWeight:700,color:"var(--text)"}}, bAdi),
                      bIlce&&React.createElement('span',{style:{fontSize:11,color:"var(--text-muted)",background:"var(--bg-elevated)",padding:"2px 8px",borderRadius:20}}, bIlce)
                    )
                  ),
                  React.createElement('div',{style:{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3,flexShrink:0}},
                    /* Oluşturulma */
                    React.createElement('div',{style:{display:"flex",alignItems:"center",gap:4}},
                      React.createElement('span',{style:{fontSize:10,color:"var(--text-dim)"}}, "Yazan:"),
                      React.createElement('span',{style:{fontSize:10,fontWeight:700,color:renkAcc}}, isYon?[React.createElement(IconTie, {size:12, key:"i"}), " Yönetici"]:[React.createElement(IconWrench, {size:12, key:"i"}), " Bakımcı"]),
                      React.createElement('span',{style:{fontSize:10,color:"var(--text-muted)"}}, n.tarihSaat)
                    ),
                    /* Son düzenleme — varsa */
                    n.duzenlendi&&(function(){
                      var dRol=n.duzenlemeRol;
                      var dIsYon=dRol==="yonetici";
                      var dRenk=dIsYon?"var(--accent)":"var(--ios-green)";
                      return React.createElement('div',{style:{display:"flex",alignItems:"center",gap:4}},
                        React.createElement('span',{style:{fontSize:10,color:"var(--text-dim)"}}, "Düzenleyen:"),
                        React.createElement('span',{style:{fontSize:10,fontWeight:700,color:dRenk}}, dIsYon?[React.createElement(IconTie, {size:12, key:"i"}), " Yönetici"]:[React.createElement(IconWrench, {size:12, key:"i"}), " Bakımcı"]),
                        React.createElement('span',{style:{fontSize:10,color:"var(--text-muted)"}}, n.duzenlendi)
                      );
                    })()
                  )
                ),
                /* Not metni ya da düzenleme */
                duzenlemeId===n.id
                  ? React.createElement('div',null,
                      React.createElement('textarea',{
                        value:duzenlemeMetin,
                        onChange:function(e){setDuzenlemeMetin(e.target.value);},
                        rows:3,autoFocus:true,
                        style:Object.assign({},S.inp,{resize:"vertical",lineHeight:1.5,marginBottom:8,fontFamily:"inherit"})
                      }),
                      React.createElement('div',{style:{display:"flex",gap:8,justifyContent:"flex-end"}},
                        React.createElement('button',{onClick:function(){setDuzenlemeId(null);},
                          style:{padding:"8px 16px",background:"var(--bg-elevated)",border:"none",borderRadius:10,color:"var(--text-muted)",cursor:"pointer",fontWeight:600,fontSize:13}
                        },"İptal"),
                        React.createElement('button',{onClick:duzenlemeSaydet,
                          style:{padding:"8px 16px",background:"var(--accent)",border:"none",borderRadius:10,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:13}
                        },React.createElement(IconSave, {size:14}), " Kaydet")
                      )
                    )
                  : React.createElement('div',null,
                      React.createElement('div',{style:{fontSize:14,color:"var(--text)",lineHeight:1.6,whiteSpace:"pre-wrap",marginBottom:10}}, n.metin),
                      React.createElement('div',{style:{display:"flex",gap:8,justifyContent:"flex-end"}},
                        React.createElement('button',{onClick:function(){duzenlemeBaslat(n);},
                          style:{padding:"7px 14px",background:"var(--bg-elevated)",border:"none",borderRadius:10,color:"var(--accent)",cursor:"pointer",fontWeight:600,fontSize:12,minHeight:36}
                        },React.createElement(IconEdit, {size:14}), " Düzenle"),
                        React.createElement('button',{onClick:function(){notSil(n.id);},
                          style:{padding:"7px 14px",background:"rgba(255,59,48,0.1)",border:"none",borderRadius:10,color:"var(--ios-red)",cursor:"pointer",fontWeight:600,fontSize:12,minHeight:36}
                        },React.createElement(IconTrash, {size:14}), " Sil")
                      )
                    )
              );
            })
          )
    )
  );
}

export default NotlarEkrani
