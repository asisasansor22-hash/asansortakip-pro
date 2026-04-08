import React from 'react'
import { KONTROL } from '../utils/constants.js'

function KontrolListesi({value,onChange}){
  const total=KONTROL.reduce((s,k)=>s+k.m.length,0);
  const done=Object.values(value||{}).filter(Boolean).length;
  const pct=total>0?done/total*100:0;
  return(
    React.createElement('div', null
      , React.createElement('div', { style: {display:"flex",alignItems:"center",gap:10,marginBottom:12,padding:"10px 12px",background:"var(--bg-elevated)",borderRadius:12},}
        , React.createElement('div', { style: {flex:1,height:6,background:"var(--border)",borderRadius:10},}
          , React.createElement('div', { style: {height:"100%",background:pct===100?"var(--ios-green)":"var(--accent)",borderRadius:10,width:pct+"%",transition:"width .3s cubic-bezier(.34,1.32,.64,1)"},})
        )
        , React.createElement('span', { style: {fontSize:13,fontWeight:700,color:pct===100?"var(--ios-green)":"var(--accent)",whiteSpace:"nowrap"},}, done, "/", total)
      )
      , KONTROL.map(kat=>(
        React.createElement('div', { key: kat.id, style: {marginBottom:12},}
          , React.createElement('div', { style: {fontSize:11,fontWeight:700,color:"var(--text-dim)",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.7px"},}, kat.kat)
          , kat.m.map((m,i)=>{
            const key=kat.id+":"+i;
            const chk=!!(value||{})[key];
            return(
              React.createElement('div', { key: i, onClick: ()=>onChange({...value,[key]:!chk}),
                style: {display:"flex",alignItems:"center",gap:10,padding:"10px 12px",borderRadius:10,background:chk?"rgba(52,199,89,0.12)":"var(--bg-elevated)",cursor:"pointer",marginBottom:4,transition:"background 0.15s"},}
                , React.createElement('div', { style: {width:20,height:20,borderRadius:6,background:chk?"var(--ios-green)":"transparent",border:"2px solid "+(chk?"var(--ios-green)":"var(--border)"),display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:11,color:"#fff",fontWeight:900,transition:"all 0.15s"},}, chk?"✓":"")
                , React.createElement('span', { style: {fontSize:13,color:chk?"var(--ios-green)":"var(--text-muted)",textDecoration:chk?"line-through":"none"},}, m)
              )
            );
          })
        )
      ))
    )
  );
}

export default KontrolListesi
