import React, { useState, useEffect, useRef, useMemo } from 'react'
import { dbGet, dbSet, firebaseLogout, firebaseLogin } from './firebase.js'
import { lsGet, lsSet } from './utils/storage.js'
import { EXCEL_ELEVS } from './data/elevators.js'
import {
  MONTHS, ISTANBUL_ILCELER, ILCE_RENK, ILCE_MAHALLELER,
  getIlceRenk, MahallePicker, KONTROL,
  S, Badge, IlceBadge, Stat, Card, Empty, IBtn, Tog, FF, AdresFF, FS, Modal
} from './utils/constants.js'
import LoginScreen from './components/LoginScreen.jsx'
import InstallBanner from './components/InstallBanner.jsx'
import KontrolListesi from './components/KontrolListesi.jsx'
import BakimAtamaPaneli from './components/BakimAtamaPaneli.jsx'
import EkstraIsEkrani from './components/EkstraIsEkrani.jsx'
import ArizaYonetimiAdmin from './components/ArizaYonetimiAdmin.jsx'
import BakimciGorunum from './components/BakimciGorunum.jsx'
import NotlarEkrani from './components/NotlarEkrani.jsx'
import MuayeneTakibi from './components/MuayeneTakibi.jsx'
import SozlesmeYonetimi from './components/SozlesmeYonetimi.jsx'
import YoneticiPortali from './components/YoneticiPortali.jsx'
import BakimciYonetimPaneli from './components/BakimciYonetimPaneli.jsx'
import { toXLSX, exportAsansorlerExcel, exportExcel } from './utils/excel.js'

// _optionalChain helper (Babel/Sucrase tarafından üretilen uyumluluk yardımcısı)
function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

function routeAddressKey(e){
  return routeUniqueParts([normalizeRouteAddress(e&&e.adres), normalizeRouteText(e&&e.semt), normalizeRouteText(e&&e.ilce)]).join(" | ");
}

function routeAddressLabelOriginal(e){
  return (e.semt?e.semt+" Mahallesi, ":"") + (e.adres||"") + (e.ilce?", "+e.ilce+", İstanbul":"");
}

var ROUTE_GEO_CACHE_VERSION = 2;
var MAPS_MAX = 13;

function normalizeRouteText(value){
  return String(value||"")
    .normalize("NFKC")
    .replace(/\u0307/g,"")
    .replace(/\s+/g," ")
    .replace(/\s+,/g,",")
    .replace(/,\s+/g,", ")
    .trim();
}

function routeFold(value){
  return normalizeRouteText(value)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/\u0131/g,"i");
}

function routeUniqueParts(parts){
  return (parts||[]).reduce(function(acc,part){
    var clean=normalizeRouteText(part);
    var folded=routeFold(clean);
    if(!folded) return acc;
    var exists=acc.some(function(existing){
      var existingFold=routeFold(existing);
      return existingFold===folded||existingFold.includes(folded)||folded.includes(existingFold);
    });
    if(!exists) acc.push(clean);
    return acc;
  },[]);
}

function normalizeRouteAddress(value){
  return normalizeRouteText(value)
    .replace(/\bMAH\b\.?/gi,"Mahallesi")
    .replace(/\bSOK\b\.?/gi,"Sokak")
    .replace(/\bCAD\b\.?/gi,"Caddesi")
    .replace(/\bBLV\b\.?/gi,"Bulvar\u0131")
    .replace(/\bNO\s*:\s*$/i,"")
    .replace(/\bD(?:A(?:I|\u0130)RE)?\s*:\s*$/i,"")
    .replace(/\s+/g," ")
    .trim();
}

function normalizeRouteBuildingName(value){
  return normalizeRouteText(value)
    .replace(/[()]/g," ")
    .replace(/\s+/g," ")
    .trim();
}

function stripRouteHouseNumber(value){
  return normalizeRouteAddress(value)
    .replace(/\bNO\s*:\s*[A-Z0-9/-]+/gi,"")
    .replace(/\bD(?:A(?:I|\u0130)RE)?\s*:\s*[A-Z0-9/-]+/gi,"")
    .replace(/\s+/g," ")
    .replace(/[,:-]+\s*$/,"")
    .trim();
}

function stripRouteBlockInfo(value){
  return normalizeRouteAddress(value)
    .replace(/\b(?:BLOK|BLK|APT\.?|APARTMANI|S\u0130TES\u0130|S\u0130TE|DA\u0130RE|D:)\b.*$/i,"")
    .replace(/\s+/g," ")
    .replace(/[,:-]+\s*$/,"")
    .trim();
}

function pushRouteQuery(list,parts){
  var query=routeUniqueParts((parts||[]).concat(["\u0130stanbul"])).join(", ");
  if(!query) return;
  if(list.some(function(existing){return routeFold(existing)===routeFold(query);})){return;}
  list.push(query);
}

function routeAddressKeyLegacy(e){
  return routeUniqueParts([normalizeRouteAddress(e&&e.adres), normalizeRouteText(e&&e.semt), normalizeRouteText(e&&e.ilce)]).join(" | ");
}

function routeAddressLabel(e){
  return routeUniqueParts([normalizeRouteAddress(e&&e.adres), normalizeRouteText(e&&e.semt), normalizeRouteText(e&&e.ilce), "\u0130stanbul"]).join(", ");
}

function buildRouteGeocodeQueries(e){
  var address=normalizeRouteAddress(e&&e.adres);
  var streetOnly=stripRouteHouseNumber(address);
  var blockFree=stripRouteBlockInfo(address);
  var semt=normalizeRouteText(e&&e.semt);
  var ilce=normalizeRouteText(e&&e.ilce);
  var binaAd=normalizeRouteBuildingName(e&&e.ad);
  var queries=[];
  if(address){
    pushRouteQuery(queries,[address,semt,ilce]);
    pushRouteQuery(queries,[address,ilce]);
  }
  if(streetOnly&&routeFold(streetOnly)!==routeFold(address)){
    pushRouteQuery(queries,[streetOnly,semt,ilce]);
    pushRouteQuery(queries,[streetOnly,ilce]);
  }
  if(blockFree&&routeFold(blockFree)!==routeFold(address)&&routeFold(blockFree)!==routeFold(streetOnly)){
    pushRouteQuery(queries,[blockFree,semt,ilce]);
    pushRouteQuery(queries,[blockFree,ilce]);
  }
  if(binaAd){
    pushRouteQuery(queries,[binaAd,address,semt,ilce]);
    pushRouteQuery(queries,[binaAd,address,ilce]);
    pushRouteQuery(queries,[binaAd,semt,ilce]);
    pushRouteQuery(queries,[binaAd,ilce]);
  }
  if(semt){
    pushRouteQuery(queries,[semt,ilce]);
  }else if(ilce){
    pushRouteQuery(queries,[ilce]);
  }
  return queries;
}

function buildStartGeocodeQueries(text){
  var address=normalizeRouteAddress(text);
  var streetOnly=stripRouteHouseNumber(address);
  var blockFree=stripRouteBlockInfo(address);
  var queries=[];
  if(address) pushRouteQuery(queries,[address]);
  if(streetOnly&&routeFold(streetOnly)!==routeFold(address)){
    pushRouteQuery(queries,[streetOnly]);
  }
  if(blockFree&&routeFold(blockFree)!==routeFold(address)&&routeFold(blockFree)!==routeFold(streetOnly)){
    pushRouteQuery(queries,[blockFree]);
  }
  return queries;
}

function scoreRouteCandidateLabel(label,context,baseScore){
  var score=Number(baseScore)||0;
  var haystack=routeFold(label);
  var istKey=routeFold("\u0130stanbul");
  if(haystack.includes(istKey)) score+=10;
  else score-=20;
  var ilceKey=routeFold(context&&context.ilce);
  if(ilceKey){
    if(haystack.includes(ilceKey)) score+=12;
    else score-=6;
  }
  var semtKey=routeFold(context&&context.semt);
  if(semtKey&&haystack.includes(semtKey)) score+=5;
  return score;
}

async function geocodeWithArcGIS(query,context){
  var res=await fetch("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&maxLocations=5&outFields=Match_addr,Addr_type,City,Region,Country&singleLine="+encodeURIComponent(query),{
    headers:{Accept:"application/json","Accept-Language":"tr"}
  });
  if(!res.ok) throw new Error("ArcGIS geocode baÅŸarÄ±sÄ±z");
  var data=await res.json();
  var items=Array.isArray(data&&data.candidates)?data.candidates:[];
  return items.map(function(item){
    var location=item&&item.location;
    var lat=location?Number(location.y):NaN;
    var lng=location?Number(location.x):NaN;
    var attrs=item&&item.attributes?item.attributes:{};
    var addrType=attrs.Addr_type||"";
    var label=item.address||attrs.Match_addr||query;
    var rank=scoreRouteCandidateLabel(label,context,item&&item.score);
    var precision=(addrType==="PointAddress"||addrType==="StreetAddress")?"exact":"approximate";
    if(addrType==="PointAddress"||addrType==="StreetAddress") rank+=8;
    else if(addrType==="StreetName") rank+=4;
    return {lat:lat,lng:lng,label:label,precision:precision,source:"arcgis",rank:rank};
  }).filter(function(item){
    return Number.isFinite(item.lat)&&Number.isFinite(item.lng);
  }).sort(function(a,b){return b.rank-a.rank;})[0]||null;
}

async function geocodeWithNominatim(query,context){
  var res=await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=tr&limit=5&q="+encodeURIComponent(query),{
    headers:{Accept:"application/json","Accept-Language":"tr"}
  });
  if(!res.ok) throw new Error("Nominatim geocode baÅŸarÄ±sÄ±z");
  var data=await res.json();
  return (Array.isArray(data)?data:[]).map(function(item){
    var lat=Number(item&&item.lat);
    var lng=Number(item&&item.lon);
    var type=item&&item.type||"";
    var label=item&&item.display_name||query;
    var rank=scoreRouteCandidateLabel(label,context,70+((Number(item&&item.importance)||0)*20));
    var precision=(type==="house"||type==="building")?"exact":"approximate";
    if(type==="house"||type==="building") rank+=8;
    else if(type==="road"||type==="residential") rank+=4;
    return {lat:lat,lng:lng,label:label,precision:precision,source:"nominatim",rank:rank};
  }).filter(function(item){
    return Number.isFinite(item.lat)&&Number.isFinite(item.lng);
  }).sort(function(a,b){return b.rank-a.rank;})[0]||null;
}

async function geocodeRouteQueries(queries,context){
  var best=null;
  // ArcGIS
  for(var i=0;i<queries.length;i++){
    try{
      var arcgis=await geocodeWithArcGIS(queries[i],context);
      if(arcgis&&(!best||arcgis.rank>best.rank)) best=arcgis;
      if(arcgis&&(arcgis.precision==="exact"||arcgis.rank>=88)) return arcgis;
    }catch(e){}
  }
  // Nominatim
  for(var j=0;j<queries.length;j++){
    try{
      var nominatim=await geocodeWithNominatim(queries[j],context);
      if(nominatim&&(!best||nominatim.rank>best.rank)) best=nominatim;
      if(nominatim&&(nominatim.precision==="exact"||nominatim.rank>=88)) return nominatim;
    }catch(e){}
  }
  return best&&best.rank>=70?best:null;
}

function routeCoordsValue(coords){
  if(!coords) return "";
  var lat=Number(coords.lat);
  var lng=Number(coords.lng);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)) return "";
  return lat+","+lng;
}

async function fetchRoadDistanceMatrix(points,startPoint){
  var coords=(startPoint?[startPoint]:[]).concat(points.map(function(p){return p.coords;})).filter(Boolean);
  if(coords.length<2||coords.length>26) return null;
  try{
    var coordStr=coords.map(function(c){return Number(c.lng)+","+Number(c.lat);}).join(";");
    var res=await fetch("https://router.project-osrm.org/table/v1/driving/"+coordStr+"?annotations=distance",{
      headers:{Accept:"application/json"}
    });
    if(!res.ok) return null;
    var data=await res.json();
    return Array.isArray(data&&data.distances)?data.distances:null;
  }catch(e){ return null; }
}

function matrixDistanceValue(matrix,fromIdx,toIdx,startPoint){
  if(toIdx==null) return Infinity;
  var offset=startPoint?1:0;
  var fromMatrixIdx=fromIdx==null?0:(fromIdx+offset);
  var toMatrixIdx=toIdx+offset;
  var row=matrix&&matrix[fromMatrixIdx];
  if(!row) return Infinity;
  var value=row[toMatrixIdx];
  return Number.isFinite(value)?value:Infinity;
}

function buildExactMatrixOrder(points,matrix,startPoint){
  var n=points.length;
  if(!Array.isArray(matrix)||n<=1||n>12) return null;
  var totalMasks=1<<n;
  var dp=Array.from({length:totalMasks},function(){
    return Array(n).fill(Infinity);
  });
  var parent=Array.from({length:totalMasks},function(){
    return Array(n).fill(-1);
  });

  for(var i=0;i<n;i++){
    dp[1<<i][i]=matrixDistanceValue(matrix,null,i,startPoint);
  }

  for(var mask=1;mask<totalMasks;mask++){
    for(var end=0;end<n;end++){
      if(!(mask&(1<<end))) continue;
      var currentCost=dp[mask][end];
      if(!Number.isFinite(currentCost)) continue;
      for(var next=0;next<n;next++){
        if(mask&(1<<next)) continue;
        var stepCost=matrixDistanceValue(matrix,end,next,startPoint);
        if(!Number.isFinite(stepCost)) continue;
        var nextMask=mask|(1<<next);
        var totalCost=currentCost+stepCost;
        if(totalCost<dp[nextMask][next]){
          dp[nextMask][next]=totalCost;
          parent[nextMask][next]=end;
        }
      }
    }
  }

  var fullMask=totalMasks-1;
  var bestEnd=0;
  var bestCost=Infinity;
  for(var j=0;j<n;j++){
    if(dp[fullMask][j]<bestCost){
      bestCost=dp[fullMask][j];
      bestEnd=j;
    }
  }
  if(!Number.isFinite(bestCost)) return null;

  var orderedIdxs=[];
  var walkMask=fullMask;
  var walkEnd=bestEnd;
  while(walkEnd!==-1){
    orderedIdxs.push(walkEnd);
    var prev=parent[walkMask][walkEnd];
    walkMask=walkMask^(1<<walkEnd);
    walkEnd=prev;
  }
  orderedIdxs.reverse();
  return orderedIdxs;
}

function improveMatrixOrder(points,matrix,startPoint,ordered){
  if(!Array.isArray(matrix)||ordered.length<4) return ordered.slice();
  var current=ordered.slice();
  function routeCost(order){
    var total=0;
    var prev=null;
    for(var i=0;i<order.length;i++){
      var step=matrixDistanceValue(matrix,prev,order[i],startPoint);
      if(!Number.isFinite(step)) return Infinity;
      total+=step;
      prev=order[i];
    }
    return total;
  }
  var improved=true;
  var bestCost=routeCost(current);
  while(improved){
    improved=false;
    for(var i=0;i<current.length-2;i++){
      for(var j=i+1;j<current.length-1;j++){
        var candidate=current.slice(0,i).concat(current.slice(i,j+1).reverse(),current.slice(j+1));
        var candidateCost=routeCost(candidate);
        if(candidateCost+5<bestCost){
          current=candidate;
          bestCost=candidateCost;
          improved=true;
        }
      }
    }
  }
  return current;
}

function matrixRouteDistanceKm(matrix,ordered,startPoint){
  if(!Array.isArray(matrix)||!ordered.length) return null;
  var totalMeters=0;
  var prev=null;
  for(var i=0;i<ordered.length;i++){
    var step=matrixDistanceValue(matrix,prev,ordered[i],startPoint);
    if(!Number.isFinite(step)) return null;
    totalMeters+=step;
    prev=ordered[i];
  }
  return totalMeters>0?(totalMeters/1000):null;
}

function optimizeRouteWithMatrix(points,matrix,startPoint){
  if(!Array.isArray(matrix)||points.length<=1) return points.slice();
  var offset=startPoint?1:0;
  var remaining=points.map(function(_,idx){return idx;});
  var orderedIdxs=buildExactMatrixOrder(points,matrix,startPoint);
  if(orderedIdxs){
    return orderedIdxs.map(function(idx){return points[idx];});
  }
  var ordered=[];
  var currentIdx=null;

  function matrixIdx(pointIdx){ return pointIdx+offset; }
  function edgeDistance(fromIdx,toIdx){
    if(toIdx==null) return Infinity;
    var fromMatrixIdx=fromIdx==null?0:matrixIdx(fromIdx);
    var toMatrixIdx=matrixIdx(toIdx);
    var row=matrix[fromMatrixIdx];
    if(!row) return Infinity;
    var value=row[toMatrixIdx];
    return Number.isFinite(value)?value:Infinity;
  }

  if(!startPoint){
    var baslangic=remaining[0];
    var enIyiToplam=Infinity;
    remaining.forEach(function(idx){
      var toplam=0;
      remaining.forEach(function(otherIdx){
        if(otherIdx!==idx){
          toplam+=edgeDistance(idx,otherIdx);
        }
      });
      if(toplam<enIyiToplam){
        enIyiToplam=toplam;
        baslangic=idx;
      }
    });
    ordered.push(baslangic);
    remaining=remaining.filter(function(idx){return idx!==baslangic;});
    currentIdx=baslangic;
  }

  while(remaining.length){
    var bestIdx=remaining[0];
    var bestScore=Infinity;
    remaining.forEach(function(idx){
      var score=edgeDistance(currentIdx,idx);
      if(score<bestScore){
        bestScore=score;
        bestIdx=idx;
      }
    });
    ordered.push(bestIdx);
    remaining=remaining.filter(function(idx){return idx!==bestIdx;});
    currentIdx=bestIdx;
  }

  ordered=improveMatrixOrder(points,matrix,startPoint,ordered);
  return ordered.map(function(idx){return points[idx];});
}

function deg2rad(v){ return v*(Math.PI/180); }
function haversineKm(a,b){
  if(!a||!b) return Infinity;
  var R=6371;
  var dLat=deg2rad((b.lat||0)-(a.lat||0));
  var dLon=deg2rad((b.lng||0)-(a.lng||0));
  var lat1=deg2rad(a.lat||0);
  var lat2=deg2rad(b.lat||0);
  var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)*Math.sin(dLon/2);
  var c=2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
  return R*c;
}

function optimizeRoute(points,startPoint){
  if(points.length<=1) return points.slice();
  var remaining=points.slice();
  var ordered=[];
  var current=startPoint||remaining[0].coords;
  while(remaining.length){
    var bestIdx=0;
    var bestScore=Infinity;
    remaining.forEach(function(p,i){
      var score=current?haversineKm(current,p.coords):i;
      if(score<bestScore){bestScore=score;bestIdx=i;}
    });
    var next=remaining.splice(bestIdx,1)[0];
    ordered.push(next);
    current=next.coords;
  }
  if(ordered.length<4) return ordered;
  var improved=true;
  while(improved){
    improved=false;
    for(var i=0;i<ordered.length-2;i++){
      for(var j=i+1;j<ordered.length-1;j++){
        var a=(i===0?startPoint:ordered[i-1].coords)||ordered[i].coords;
        var b=ordered[i].coords;
        var c=ordered[j].coords;
        var d=ordered[j+1].coords;
        var mevcut=haversineKm(a,b)+haversineKm(c,d);
        var alternatif=haversineKm(a,c)+haversineKm(b,d);
        if(alternatif+0.05<mevcut){
          ordered=ordered.slice(0,i).concat(ordered.slice(i,j+1).reverse(),ordered.slice(j+1));
          improved=true;
        }
      }
    }
  }
  return ordered;
}

function getElevAddedDate(e){
  if(e&&e.eklenmeTarihi){
    var d1=new Date(e.eklenmeTarihi);
    if(!isNaN(d1)) return d1;
  }
  var ts=Number(e&&e.id);
  if(Number.isFinite(ts)&&ts>1000000000000){
    var d2=new Date(ts);
    if(!isNaN(d2)) return d2;
  }
  return null;
}

function ProgressRing(_ref){
  var value=_ref.value, color=_ref.color, label=_ref.label, sublabel=_ref.sublabel;
  var safe=Math.max(0,Math.min(100,Number(value)||0));
  return React.createElement('div',{style:{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"linear-gradient(180deg,var(--bg-panel),var(--bg-card))",borderRadius:18,boxShadow:"var(--shadow-sm)",border:"1px solid var(--border-soft)"}},
    React.createElement('div',{style:{position:"relative",width:78,height:78,flexShrink:0}},
      React.createElement('div',{style:{position:"absolute",inset:0,borderRadius:"50%",background:"conic-gradient("+color+" "+safe+"%, var(--bg-elevated) 0)"}}),
      React.createElement('div',{style:{position:"absolute",inset:8,borderRadius:"50%",background:"var(--bg-panel)"}}),
      React.createElement('div',{style:{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,fontWeight:800,color:color}}, safe+"%")
    ),
    React.createElement('div',{style:{minWidth:0,flex:1}},
      React.createElement('div',{style:{fontSize:13,fontWeight:700,color:"var(--text)"}},label),
      React.createElement('div',{style:{fontSize:11,color:"var(--text-muted)",marginTop:4,lineHeight:1.45}},sublabel)
    )
  );
}


function MiniTrendChart(_ref2){
  var title=_ref2.title, subtitle=_ref2.subtitle, color=_ref2.color, items=_ref2.items, activeIndex=_ref2.activeIndex;
  var safeItems=items||[];
  var values=safeItems.map(function(item){return Number(item.value)||0;});
  var max=Math.max.apply(Math,[1].concat(values));
  return React.createElement('div',{style:{background:"linear-gradient(180deg,var(--bg-panel),var(--bg-card))",borderRadius:20,padding:"14px 16px",marginBottom:10,boxShadow:"var(--shadow-sm)",border:"1px solid var(--border-soft)"}},
    React.createElement('div',{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}},
      React.createElement('div',null,
        React.createElement('div',{style:{fontSize:14,fontWeight:700,color:"var(--text)"}},title),
        subtitle&&React.createElement('div',{style:{fontSize:11,color:"var(--text-muted)",marginTop:2}},subtitle)
      ),
      React.createElement('div',{style:{fontSize:11,fontWeight:700,color:"var(--text-muted)"}},Math.max.apply(Math,values)+" kayıt")
    ),
    React.createElement('div',{style:{display:"grid",gridTemplateColumns:"repeat("+Math.max(safeItems.length,1)+", minmax(0,1fr))",alignItems:"end",gap:8,height:148}},
      safeItems.map(function(item,index){
        var value=Number(item.value)||0;
        var height=Math.max(16,Math.round((value/max)*88)+16);
        var active=index===activeIndex;
        return React.createElement('div',{key:item.label||index,style:{display:"flex",flexDirection:"column",justifyContent:"flex-end",alignItems:"stretch",gap:6,minWidth:0}},
          React.createElement('div',{style:{fontSize:10,fontWeight:800,color:active?color:"var(--text-muted)",textAlign:"center"}},value),
          React.createElement('div',{style:{height:height,borderRadius:14,background:active?"linear-gradient(180deg,"+color+", color-mix(in srgb, "+color+" 58%, white))":"var(--bg-elevated)",border:active?"1px solid "+color+"55":"1px solid var(--border)",boxShadow:active?"0 10px 24px color-mix(in srgb, "+color+" 20%, transparent)":"none",transition:"all .25s ease"}}),
          React.createElement('div',{style:{fontSize:10,fontWeight:700,color:active?"var(--text)":"var(--text-muted)",textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},item.label)
        );
      })
    )
  );
}

const AYLIK_YENI_MUSTERI_HEDEFI = 10;

function App(){
  const [rol,setRol]=useState(null);
  const [tab,setTab]=useState(0);
  const [tema,setTema]=useState(function(){return localStorage.getItem('at_tema')||'gece';});
  const [elevs,setElevs]=useState(EXCEL_ELEVS);
  const [maints,setMaints]=useState([]);
  const [faults,setFaults]=useState([]);
  const [tasks,setTasks]=useState([]);
  const [sozlesmeler,setSozlesmeler]=useState([]);
  const [hesapKayitlari,setHesapKayitlari]=useState([]);
  const [notlar,setNotlar]=useState([]);
  const [ekstraIsler,setEkstraIsler]=useState([]);
  const [aktifHesap,setAktifHesap]=useState(null);
  const [modal,setModal]=useState(null);
  const [edit,setEdit]=useState(null);
  const [form,setForm]=useState({});
  const [fMonth,setFMonth]=useState(new Date().getMonth());
  const [fIlce,setFIlce]=useState("Tümü");
  const [expandKl,setExpandKl]=useState(null);
  const [arama,setArama]=useState("");
  const [rotaSec,setRotaSec]=useState([]);
  const [rotaIlce,setRotaIlce]=useState("Tümü");
  const [rotaStart,setRotaStart]=useState("");
  const [rotaKonum,setRotaKonum]=useState(null);
  const [konumYukleniyor,setKonumYukleniyor]=useState(false);
  const [konumHata,setKonumHata]=useState("");
  const [sifreModal,setSifreModal]=useState(false);
  const [sifreInput,setSifreInput]=useState("");
  const [sifreHata,setSifreHata]=useState("");
  const [sonOdemeler,setSonOdemeler]=useState([]);
  const [manuelOdemeAcik,setManuelOdemeAcik]=useState(false);
  const [odemeArsiv,setOdemeArsiv]=useState([]);
  const [arsivAcik,setArsivAcik]=useState(false);
  const [haftalikKapamalar,setHaftalikKapamalar]=useState([]);
  const [aylikKapamalar,setAylikKapamalar]=useState([]);
  const [aktifHaftalik,setAktifHaftalik]=useState(null);
  const [aktifAylik,setAktifAylik]=useState(null);
  const [finansTab,setFinansTab]=useState(0);
  const [giderler,setGiderler]=useState([]);
  const [giderForm,setGiderForm]=useState({tarih:"",aciklama:"",tutar:""});
  const [giderFormAcik,setGiderFormAcik]=useState(false);
  const [giderHaftaArsiv,setGiderHaftaArsiv]=useState([]);
  const [muayeneler,setMuayeneler]=useState([]);
  const [asansorDetay,setAsansorDetay]=useState(null); // bakım geçmişi için
  const [bakimcilar,setBakimcilar]=useState(function(){var c=lsGet("ls_bakimcilar");return Array.isArray(c)?c:[];}); // login ekranı için localStorage'dan
  const [aktifBakimci,setAktifBakimci]=useState(null); // giriş yapan bakımcı objesi
  const [rotaOtomatikIds,setRotaOtomatikIds]=useState([]);
  const [rotaAdresModal,setRotaAdresModal]=useState(null);
  const [rotaAdresOverrides,setRotaAdresOverrides]=useState(function(){return lsGet("at_adres_overrides")||{};});
  const giderKapamaTetiklendi=React.useRef(false);
  const ilkYukleme=React.useRef(true);
  // Tema uygula
  useEffect(function(){
    localStorage.setItem('at_tema',tema);
    document.documentElement.setAttribute('data-tema',tema);
  },[tema]);
  const kapamaTetiklendi=React.useRef({haftalik:false,aylik:false});
  const aylikKapamaRef=React.useRef([]); // aylikKapamalar'ın her zaman güncel kopyası
  useEffect(function(){aylikKapamaRef.current=aylikKapamalar;},[aylikKapamalar]);

  // Bakımcıları hemen yükle (public read — login ekranı için)
  useEffect(function(){
    async function yukBakimci(){
      try{
        var r=await dbGet("at_bakimcilar");
        if(r){var d=Array.isArray(r)?r:(typeof r==='string'?JSON.parse(r):null);if(Array.isArray(d)&&d.length>0){setBakimcilar(d);lsSet("ls_bakimcilar",d);}}
      }catch(e){}
    }
    yukBakimci();
  },[]);

  // Login sonrası veri yükle (auth token gerekli)
  useEffect(function(){
    if(rol===null) return; // henüz giriş yapılmadı
    async function yukle(){
      try{
        // Tüm Firebase okumalarını paralel yap — ilkYukleme bayrağı kapanana kadar
        // kullanıcı değişiklik yaparsa kayıt atlanıyordu (race condition). Paralel
        // sorgu ile yükleme süresi tek istek kadar kısalır.
        function fb(v){return Array.isArray(v)?v:(v&&typeof v==='string'?JSON.parse(v):null);}
        var sonuclar=await Promise.all([
          dbGet("at_elevs"),    // r0
          dbGet("at_maints"),   // r1
          dbGet("at_faults"),   // r2
          dbGet("at_tasks"),    // r3
          dbGet("at_sozlesme"), // r4
          dbGet("at_hesapkayit"),// r5
          dbGet("at_haftalik"), // r6
          dbGet("at_aylik"),    // r7
          dbGet("at_sonodemeler"),// r8
          dbGet("at_giderler"), // r9
          dbGet("at_giderhafta"),// r10
          dbGet("at_notlar"),      // r11
          dbGet("at_ekstraisler"), // r12
          dbGet("at_muayeneler"),  // r13
          dbGet("at_bakimcilar"),  // r14
        ]);
        var r1=sonuclar[0],r2=sonuclar[1],r3=sonuclar[2],r4=sonuclar[3];
        var r5=sonuclar[4],r6=sonuclar[5],r7=sonuclar[6],r8=sonuclar[7];
        var r9=sonuclar[8],r10=sonuclar[9],r11=sonuclar[10],r12=sonuclar[11],r13=sonuclar[12],r14=sonuclar[13],r15=sonuclar[14];
        // ── Asansör listesi ──────────────────────────────────────
        // Firebase erişilemezse veya boş dönerse localStorage yedeğine bak,
        // o da yoksa ilk kez açılıyordur → EXCEL_ELEVS kullan.
        // HİÇBİR DURUMDA Firebase null dönünce EXCEL_ELEVS yazılmaz.
        (function(){
          var lsBak=lsGet("ls_elevs");
          if(r1){
            try{
              var d=fb(r1);
              if(Array.isArray(d)&&d.length>0){
                setElevs(d);
                lsSet("ls_elevs",d); // yedeği güncelle
              } else {
                // Firebase boş/geçersiz döndü — yedekten yükle
                if(lsBak&&lsBak.length>0){ setElevs(lsBak); }
                else{ setElevs(EXCEL_ELEVS); dbSet("at_elevs",EXCEL_ELEVS); }
              }
            }catch(e){
              if(lsBak&&lsBak.length>0){ setElevs(lsBak); }
              else{ setElevs(EXCEL_ELEVS); }
            }
          } else {
            // Firebase erişilemedi (null) — asla EXCEL_ELEVS yazma, yedekten yükle
            if(lsBak&&lsBak.length>0){
              setElevs(lsBak);
            } else {
              // İlk açılış: Firebase da yok, yedek de yok → Excel ile başlat
              setElevs(EXCEL_ELEVS);
              dbSet("at_elevs",EXCEL_ELEVS);
            }
          }
        })();
        // ── Diğer veriler ─────────────────────────────────────
        if(r2){try{var d=fb(r2);if(Array.isArray(d)){setMaints(d);lsSet("ls_maints",d);}}catch(e){}}
        else{var b=lsGet("ls_maints");if(b)setMaints(b);}
        if(r3){try{var d=fb(r3);if(Array.isArray(d))setFaults(d);}catch(e){}}
        if(r4){try{var d=fb(r4);if(Array.isArray(d))setTasks(d);}catch(e){}}
        if(r5){try{var d=fb(r5);if(Array.isArray(d))setSozlesmeler(d);}catch(e){}}
        if(r6){try{var d=fb(r6);if(Array.isArray(d))setHesapKayitlari(d);}catch(e){}}
        if(r7){try{var d=fb(r7);if(Array.isArray(d))setHaftalikKapamalar(d);}catch(e){}}
        if(r8){try{var d=fb(r8);if(Array.isArray(d)){setAylikKapamalar(d);lsSet("ls_aylik",d);}}catch(e){}}
        else{var b=lsGet("ls_aylik");if(b)setAylikKapamalar(b);}
        if(r9){try{var d=fb(r9);if(Array.isArray(d)){setSonOdemeler(d);lsSet("ls_sonodemeler",d);}}catch(e){}}
        else{var b=lsGet("ls_sonodemeler");if(b)setSonOdemeler(b);}
        if(r10){try{var d=fb(r10);if(Array.isArray(d))setGiderler(d);}catch(e){}}
        if(r11){try{var d=fb(r11);if(Array.isArray(d))setGiderHaftaArsiv(d);}catch(e){}}
        if(r12){try{var d=fb(r12);if(Array.isArray(d))setNotlar(d);}catch(e){}}
        if(r13){try{var d=fb(r13);if(Array.isArray(d))setEkstraIsler(d);}catch(e){}}
        if(r14){try{var d=fb(r14);if(Array.isArray(d))setMuayeneler(d);}catch(e){}}
        if(r15){try{var d=fb(r15);if(Array.isArray(d))setBakimcilar(d);}catch(e){}}
      }catch(e){}
      ilkYukleme.current=false;
    }
    yukle();
  },[rol]);

  // Veri değişince Firebase'e kaydet (ilk yüklemede tetiklenmez)
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_elevs",elevs);if(elevs.length>0)lsSet("ls_elevs",elevs);}},[elevs]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_maints",maints);if(maints.length>0)lsSet("ls_maints",maints);}},[maints]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_faults",faults);}},[faults]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_tasks",tasks);}},[tasks]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_sozlesme",sozlesmeler);}},[sozlesmeler]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_hesapkayit",hesapKayitlari);}},[hesapKayitlari]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_haftalik",haftalikKapamalar);}},[haftalikKapamalar]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_aylik",aylikKapamalar);}},[aylikKapamalar]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_sonodemeler",sonOdemeler);}},[sonOdemeler]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_giderler",giderler);}},[giderler]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_giderhafta",giderHaftaArsiv);}},[giderHaftaArsiv]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_notlar",notlar);}},[notlar]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_ekstraisler",ekstraIsler);}},[ekstraIsler]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_muayeneler",muayeneler);}},[muayeneler]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_bakimcilar",bakimcilar);lsSet("ls_bakimcilar",bakimcilar);}},[bakimcilar]);

  // Yükleme ekranı

  // ═══════════════════════════════════════════════════════════
  // OTOMATİK HAFTALIK & AYLIK KAPAMA
  // ═══════════════════════════════════════════════════════════
  useEffect(function(){
    if(ilkYukleme.current) return; // veriler yüklenmeden tetiklenme

    function yapHaftalikKapama(){
      if(kapamaTetiklendi.current.haftalik) return;
      kapamaTetiklendi.current.haftalik=true;
      var simdi=new Date();
      var hafta=getISOWeek(simdi);
      var yil=simdi.getFullYear();
      var kapamaKey="H"+yil+"-W"+hafta;
      setHaftalikKapamalar(function(prev){
        var zatenVar=prev.find(function(k){return k.kapamaKey===kapamaKey;});
        if(zatenVar) return prev;
        var baslangic=new Date(simdi);
        baslangic.setDate(simdi.getDate()-6);
        var basStr=baslangic.toLocaleDateString("tr-TR");
        var bitStr=simdi.toLocaleDateString("tr-TR");
        var snap={
          id:Date.now(),
          kapamaKey:kapamaKey,
          tip:"haftalik",
          baslarken:basStr,
          biterken:bitStr,
          kapamaZamani:simdi.toLocaleString("tr-TR"),
          odemeler:sonOdemeler.slice(),
          toplam:sonOdemeler.reduce(function(s,o){return s+(o.alinanTutar||0);},0),
          odemeAdedi:sonOdemeler.length
        };
        var yeni=[snap,...prev];
        if(yeni.length>5) yeni=yeni.slice(0,5);
        return yeni;
      });
    }

    function yapAylikKapama(){
      if(kapamaTetiklendi.current.aylik) return;
      kapamaTetiklendi.current.aylik=true;
      var simdi=new Date();
      // Önceki ayı kapat (1. günde çalışıyor, önceki ay kapanmalı)
      var ay=simdi.getMonth()===0?11:simdi.getMonth()-1;
      var yil=simdi.getMonth()===0?simdi.getFullYear()-1:simdi.getFullYear();
      var kapamaKey="A"+yil+"-M"+(ay+1);
      // Çift çalışma koruması: localStorage (Firebase gecikmesine karşı) + ref (stale closure'a karşı)
      var lsKey="kapama_"+kapamaKey;
      var zatenKapandi=localStorage.getItem(lsKey)||aylikKapamaRef.current.find(function(k){return k.kapamaKey===kapamaKey;});
      setAylikKapamalar(function(prev){
        var zatenVar=prev.find(function(k){return k.kapamaKey===kapamaKey;});
        if(zatenVar) return prev;
        var snap={
          id:Date.now(),
          kapamaKey:kapamaKey,
          tip:"aylik",
          ay:MONTHS[ay],
          yil:yil,
          kapamaZamani:simdi.toLocaleString("tr-TR"),
          odemeler:sonOdemeler.slice(),
          toplam:sonOdemeler.reduce(function(s,o){return s+(o.alinanTutar||0);},0),
          odemeAdedi:sonOdemeler.length
        };
        var yeni=[snap,...prev];
        if(yeni.length>2) yeni=yeni.slice(0,2);
        return yeni;
      });
      // Devir hesabı zaten yapıldıysa tekrar yapma
      if(zatenKapandi) return;
      // localStorage'a hemen kaydet — Firebase yazılmadan sayfa yenilenirse tekrar çalışmasın
      try{localStorage.setItem(lsKey,"1");}catch(e){}
      /* Ay kapanışında: her asansör için yeniDevir → bakiyeDevir olarak geçir */
      var ayBaslangic=new Date(yil,ay,1);ayBaslangic.setHours(0,0,0,0);
      var aySon=new Date(yil,ay+1,0);aySon.setHours(23,59,59,999);
      setElevs(function(prevElevs){
        return prevElevs.map(function(ev){
          var eskiDevir=ev.bakiyeDevir||0;
          var aylikUcret=ev.aylikUcret||0;
          // Bu ay bakım yapıldı mı?
          var bakimYapildi=maints.find(function(m){
            var d=new Date(m.tarih);
            return Number(m.asansorId)===Number(ev.id)&&m.yapildi&&d>=ayBaslangic&&d<=aySon;
          });
          if(!bakimYapildi) return ev; // bakım yapılmadıysa devir değişmez
          var yeniDevirHesap;
          if(ev.yeniDevirManuel!==undefined&&ev.yeniDevirManuel!==null&&ev.yeniDevirManuel!==""){
            yeniDevirHesap=Number(ev.yeniDevirManuel);
          } else {
            var toplamAlinan=sonOdemeler.filter(function(o){
              var od=new Date(o.tarih);
              return Number(o.aid)===Number(ev.id)&&!o.iptal&&od>=ayBaslangic&&od<=aySon;
            }).reduce(function(s,o){return s+(o.alinanTutar||0);},0);
            yeniDevirHesap=eskiDevir+aylikUcret-toplamAlinan;
          }
          // yeniDevirManuel sıfırla — bir sonraki ay otomatik hesaba döner
          return Object.assign({},ev,{bakiyeDevir:yeniDevirHesap,yeniDevirManuel:null});
        });
      });
    }

    function getISOWeek(d){
      var date=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
      var dayNum=date.getUTCDay()||7;
      date.setUTCDate(date.getUTCDate()+4-dayNum);
      var yearStart=new Date(Date.UTC(date.getUTCFullYear(),0,1));
      return Math.ceil((((date-yearStart)/86400000)+1)/7);
    }

    function kontrolEt(){
      var simdi=new Date();
      var gun=simdi.getDay(); // 0=Pazar, 6=Cumartesi
      var saat=simdi.getHours();
      var dakika=simdi.getMinutes();
      var ayinSonGunu=new Date(simdi.getFullYear(),simdi.getMonth()+1,0).getDate();

      // Haftalık: Cumartesi (6) saat 16:00+
      if(gun===6&&saat>=16){
        yapHaftalikKapama();
      } else {
        kapamaTetiklendi.current.haftalik=false;
      }

      // Aylık: Yeni aya geçildiğinde (1. gün 00:00 UTC+3) önceki ayı kapat
      // Önceki ayın kapanıp kapanmadığını kontrol et
      var oncekiAy=simdi.getMonth()===0?11:simdi.getMonth()-1;
      var oncekiYil=simdi.getMonth()===0?simdi.getFullYear()-1:simdi.getFullYear();
      var oncekiKey="A"+oncekiYil+"-M"+(oncekiAy+1);
      var oncekiKapandi=localStorage.getItem("kapama_"+oncekiKey)||aylikKapamaRef.current.find(function(k){return k.kapamaKey===oncekiKey;});
      if(!oncekiKapandi){
        // Önceki ay henüz kapanmadı → kapat (yeni ay başladıysa veya app geç açıldıysa)
        yapAylikKapama();
      } else {
        kapamaTetiklendi.current.aylik=false;
      }
      // fMonth'u otomatik güncelle — manuel seçim gerekmez
      setFMonth(function(prev){return prev!==simdi.getMonth()?simdi.getMonth():prev;});
    }

    kontrolEt();
    var timer=setInterval(kontrolEt,60000); // Her dakika kontrol et
    return function(){clearInterval(timer);};
  },[sonOdemeler,maints,elevs]);

  // ═══════════════════════════════════════════════════════════
  // GİDER OTOMATİK HAFTALIK SIFIRLAMA & GÜNLÜK KAYIT
  // ═══════════════════════════════════════════════════════════
  useEffect(function(){
    if(ilkYukleme.current) return;

    function getISOWeekG(d){
      var date=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));
      var dayNum=date.getUTCDay()||7;
      date.setUTCDate(date.getUTCDate()+4-dayNum);
      var yearStart=new Date(Date.UTC(date.getUTCFullYear(),0,1));
      return Math.ceil((((date-yearStart)/86400000)+1)/7);
    }

    // Günlük otomatik kayıt: her gün gece 23:50'de o günkü giderleri arşivle
    function gunlukKayitVeEmail(){
      var simdi=new Date();
      var saat=simdi.getHours();
      var dakika=simdi.getMinutes();
      if(saat===23&&dakika>=50){
        var bugun=simdi.toLocaleDateString("tr-TR");
        var bugunGiderler=giderler.filter(function(g){return g.tarih===bugun;});
        if(bugunGiderler.length===0) return;
        var toplamTutar=bugunGiderler.reduce(function(s,g){return s+(g.tutar||0);},0);
        // Email gönderme: mailto linki ile yönlendir (Gmail açılır)
        var konu="Asansör Takip - Günlük Gider Raporu "+bugun;
        var satirlar=bugunGiderler.map(function(g){return g.tarih+"  |  "+g.aciklama+"  |  "+(g.tutar||0).toLocaleString("tr-TR")+" ₺";});
        var govde="Tarih: "+bugun+"\nToplam Gider: "+toplamTutar.toLocaleString("tr-TR")+" ₺\nKayıt Sayısı: "+bugunGiderler.length+"\n\nDetay:\n"+satirlar.join("\n")+"\n\n-- AsansörTakip Pro --";
        var mailtoUrl="mailto:iletisimasis@gmail.com?subject="+encodeURIComponent(konu)+"&body="+encodeURIComponent(govde);
        // Sadece bir kere aç (daha önce açılmadıysa)
        var gunKey="email_"+bugun.replace(/\./g,"-");
        if(!sessionStorage.getItem(gunKey)){
          sessionStorage.setItem(gunKey,"1");
          window.open(mailtoUrl,"_blank");
        }
      }
    }

    // Haftalık sıfırlama: Cumartesi 16:00'da giderleri arşivle ve sıfırla
    function haftalikGiderSifirla(){
      var simdi=new Date();
      var gun=simdi.getDay(); // 6=Cumartesi
      var saat=simdi.getHours();
      if(gun===6&&saat>=16){
        if(giderKapamaTetiklendi.current) return;
        var hafta=getISOWeekG(simdi);
        var yil=simdi.getFullYear();
        var kapamaKey="GH"+yil+"-W"+hafta;
        setGiderHaftaArsiv(function(prev){
          if(prev.find(function(k){return k.kapamaKey===kapamaKey;})) return prev;
          if(giderler.length===0) return prev;
          var buHaftaStart=new Date(simdi);
          buHaftaStart.setDate(simdi.getDate()-6);
          var snap={
            id:Date.now(),
            kapamaKey:kapamaKey,
            baslarken:buHaftaStart.toLocaleDateString("tr-TR"),
            biterken:simdi.toLocaleDateString("tr-TR"),
            kapamaZamani:simdi.toLocaleString("tr-TR"),
            giderler:giderler.slice(),
            toplam:giderler.reduce(function(s,g){return s+(g.tutar||0);},0),
            kayitAdedi:giderler.length
          };
          var yeni=[snap,...prev];
          if(yeni.length>5) yeni=yeni.slice(0,5);
          return yeni;
        });
        giderKapamaTetiklendi.current=true;
        // Giderleri sıfırla
        setGiderler([]);
        // Haftalık gider email gönder
        var toplamTutar=giderler.reduce(function(s,g){return s+(g.tutar||0);},0);
        var simdiStr=simdi.toLocaleDateString("tr-TR");
        var buHaftaStart2=new Date(simdi);buHaftaStart2.setDate(simdi.getDate()-6);
        var konu="Asansör Takip - Haftalık Gider Özeti "+buHaftaStart2.toLocaleDateString("tr-TR")+" - "+simdiStr;
        var satirlar2=(giderler||[]).map(function(g){return g.tarih+"  |  "+g.aciklama+"  |  "+(g.tutar||0).toLocaleString("tr-TR")+" ₺";});
        var govde2="Hafta: "+buHaftaStart2.toLocaleDateString("tr-TR")+" – "+simdiStr+"\nToplam Gider: "+toplamTutar.toLocaleString("tr-TR")+" ₺\nKayıt Sayısı: "+(giderler||[]).length+"\n\nTüm Giderler:\n"+satirlar2.join("\n")+"\n\n-- AsansörTakip Pro (Otomatik Haftalık Rapor) --";
        var mailtoUrl2="mailto:iletisimasis@gmail.com?subject="+encodeURIComponent(konu)+"&body="+encodeURIComponent(govde2);
        var haftaKey="gemail_GH"+yil+"-W"+hafta;
        if(!sessionStorage.getItem(haftaKey)){
          sessionStorage.setItem(haftaKey,"1");
          window.open(mailtoUrl2,"_blank");
        }
      } else {
        giderKapamaTetiklendi.current=false;
      }
    }

    gunlukKayitVeEmail();
    haftalikGiderSifirla();
    var giderTimer=setInterval(function(){
      gunlukKayitVeEmail();
      haftalikGiderSifirla();
    },60000);
    return function(){clearInterval(giderTimer);};
  },[giderler]);

  const konumAl=async(sessiz)=>{
    setKonumYukleniyor(true);setKonumHata("");
    // Önce tarayıcı GPS'i dene
    if(navigator.geolocation){
      try{
        const pos=await new Promise((res,rej)=>navigator.geolocation.getCurrentPosition(res,rej,{timeout:6000,maximumAge:60000}));
        setRotaKonum({lat:pos.coords.latitude,lng:pos.coords.longitude,label:"📍 GPS Konumunuz"});
        setRotaStart("");
        setKonumYukleniyor(false);
        return;
      }catch(gpsErr){}
    }
    // GPS yoksa IP ile dene
    try{
      const res=await fetch("https://ipapi.co/json/");
      if(!res.ok) throw new Error();
      const d=await res.json();
      if(!d.latitude) throw new Error();
      setRotaKonum({lat:d.latitude,lng:d.longitude,label:`${d.district||d.city||""}, ${d.city||""}, ${d.region||""}`.replace(/^,\s*/,"").replace(/,\s*,/,",")});
      setRotaStart("");
    }catch(e){if(!sessiz)setKonumHata("Konum alınamadı. Adres girin.");}
    setKonumYukleniyor(false);
  };
  // Rota sekmesi veya bakımcı tab açılınca otomatik konum al
  useEffect(()=>{
    var rotaAktif=(tab===5)||(rol==="bakimci"&&tab===2);
    if(rotaAktif&&!rotaKonum&&!konumYukleniyor){
      konumAl(true);
    }
  },[tab,rol]);

  useEffect(function(){
    lsSet("at_adres_overrides",rotaAdresOverrides);
  },[rotaAdresOverrides]);

  // Bakımcı tab 2'deyken bekleyen bakımları otomatik rotaya yükle
  useEffect(function(){
    if(rol!=="bakimci"||tab!==2) return;
    var simdi=new Date();
    var _mMonth=maints.filter(function(m){var d=new Date(m.tarih);return d.getMonth()===fMonth&&d.getFullYear()===simdi.getFullYear();});
    var ids=[].concat(new Set(_mMonth.filter(function(m){
      if(!m.planlanmis||m.yapildi) return false;
      var elev=elevs.find(function(e){return e.id===m.asansorId;});
      if(!elev) return false;
      if(aktifBakimci&&m.bakimciId&&m.bakimciId!==aktifBakimci.id) return false;
      if(aktifBakimci&&aktifBakimci.ilceler&&aktifBakimci.ilceler.length>0){
        if(!aktifBakimci.ilceler.includes(elev.ilce)) return false;
      }
      return true;
    }).map(function(m){return m.asansorId;})));
    // Sadece değiştiyse güncelle (sonsuz döngü önleme)
    var yeniStr=JSON.stringify(ids.slice().sort());
    var eskiStr=JSON.stringify(rotaSec.slice().sort());
    if(yeniStr!==eskiStr) setRotaSec(ids);
  },[rol,tab,maints,fMonth,elevs,aktifBakimci]);

  // İlçe → Semt → Sokak öbeklemesi (tıklama sırası korunarak)
  useEffect(function(){
    var secili=rotaSec.map(function(id){return elevs.find(function(e){return e.id===id;});}).filter(Boolean);
    if(secili.length===0){setRotaOtomatikIds([]);return;}
    // Adres alanından sokak adını çıkar (mahalle kısmını atla)
    function sokakAdi(adres){
      if(!adres) return "";
      var s=adres.toUpperCase().replace(/\s+/g," ").trim();
      // "XXX MAHALLESİ YYY SOKAK NO:ZZ" → "YYY SOKAK" kısmını bul
      var m=s.match(/MAHALLESİ\s+(.+?)(?:\s+NO\s*[:.]|$)/i);
      if(m) return m[1].replace(/\s+/g," ").trim();
      // "XXX MAH. YYY SOK." formatı
      var m2=s.match(/MAH\.?\s+(.+?)(?:\s+NO\s*[:.]|$)/i);
      if(m2) return m2[1].replace(/\s+/g," ").trim();
      return s;
    }
    // Öbekleme anahtarı: ilçe|semt|sokak
    function grupKey(e){
      return (e.ilce||"").toLocaleLowerCase("tr")+"|"+(e.semt||"").toLocaleLowerCase("tr")+"|"+sokakAdi(e.adres).toLocaleLowerCase("tr");
    }
    // Tıklama sırasını koruyarak grupla
    var gruplar=[]; // [{key, items:[elev]}]
    var grupMap={};
    secili.forEach(function(e){
      var k=grupKey(e);
      if(grupMap[k]!==undefined){
        gruplar[grupMap[k]].items.push(e);
      } else {
        grupMap[k]=gruplar.length;
        gruplar.push({key:k,items:[e]});
      }
    });
    // Grup sırası: ilk tıklanan elemanın sırasına göre (tıklama sırası korunuyor)
    // Grup içindeki elemanlar da tıklama sırasında (forEach zaten o sırada)
    var sonuc=[];
    gruplar.forEach(function(g){
      g.items.forEach(function(e){sonuc.push(e.id);});
    });
    setRotaOtomatikIds(sonuc);
  },[rotaSec, elevs]);

  const today=(function(){var d=new Date();var y=d.getFullYear();var m=(d.getMonth()+1).toString().padStart(2,"0");var g=d.getDate().toString().padStart(2,"0");return y+"-"+m+"-"+g;})();
  const ilceler=useMemo(()=>[...new Set(elevs.map(e=>e.ilce))].sort(),[elevs]);
  const elevByIlce=useMemo(()=>elevs.reduce((a,e)=>{if(!a[e.ilce])a[e.ilce]=[];a[e.ilce].push(e);return a;},{}),[elevs]);
  const todayTasks=tasks.filter(t=>t.tarih===today);
  const openFaults=faults.filter(f=>f.durum!=="Çözüldü");
  const mMonth=useMemo(()=>maints.filter(m=>{const d=new Date(m.tarih);return d.getMonth()===fMonth&&d.getFullYear()===new Date().getFullYear();}),[maints,fMonth]);
  const unpaid=maints.filter(m=>m.yapildi&&!m.odendi).length;

  const bal=(id)=>{
    const e=elevs.find(x=>x.id===id);if(!e) return 0;
    return e.bakiyeDevir||0;
  };

  /* Aktif ay için yeni devir hesabı:
     - Bakım yapıldıysa & ödeme alındıysa:  eskiDevir + aylikUcret - alinanTutar
     - Bakım yapıldıysa & ödeme alınmadıysa: eskiDevir + aylikUcret
     - Bakım henüz yapılmadıysa: null (boş göster)
  */
  const yeniDevir=(id)=>{
    const e=elevs.find(x=>x.id===id);if(!e) return null;
    const bakimKaydi=mMonth.find(m=>m.asansorId===id&&m.yapildi);
    if(!bakimKaydi) return null;
    // Manuel override varsa direkt döndür
    if(e.yeniDevirManuel!==undefined&&e.yeniDevirManuel!==null&&e.yeniDevirManuel!==""){
      return Number(e.yeniDevirManuel);
    }
    const eskiDevir=e.bakiyeDevir||0;
    const aylikUcret=e.aylikUcret||0;
    const simdi=new Date();
    const ayBaslangic=new Date(simdi.getFullYear(),simdi.getMonth(),1);
    const aySon=new Date(simdi.getFullYear(),simdi.getMonth()+1,0);
    aySon.setHours(23,59,59,999);
    const toplamAlinan=sonOdemeler.filter(function(o){
      var od=new Date(o.tarih);
      var ayniAsansor=Number(o.aid)===Number(id);
      return ayniAsansor&&!o.iptal&&od>=ayBaslangic&&od<=aySon;
    }).reduce(function(s,o){return s+(o.alinanTutar||0);},0);
    return eskiDevir+aylikUcret-toplamAlinan;
  };
  const eName=(id)=>{const nid=typeof id==="string"?+id:id;return _optionalChain([elevs, 'access', _7 => _7.find, 'call', _8 => _8(e=>e.id===nid||e.id===id), 'optionalAccess', _9 => _9.ad])||"?"};
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));
  const oAdd=(t)=>{setEdit(null);setForm({tarih:today});setModal(t);};
  const oEdit=(t,item)=>{setEdit(item);setForm({...item});setModal(t);};
  const close=()=>setModal(null);

  const saveE=()=>{
    var ilceDeger=form.ilce==="__yeni__"?(form.ilceYeni||"").trim():form.ilce;
    if(!ilceDeger){alert("İlçe seçiniz!");return;}
    // _yeniDevirOverride girilmişse yeniDevirManuel olarak kaydet, boşsa null (otomatik)
    var yeniDevirManuelDeger=null;
    if(form._yeniDevirOverride!==undefined&&form._yeniDevirOverride!==""){
      yeniDevirManuelDeger=parseFloat(form._yeniDevirOverride);
    }
    const d={...form,ilce:ilceDeger,aylikUcret:+form.aylikUcret||0,bakiyeDevir:+form.bakiyeDevir||0,kat:+form.kat||0,kapasite:+form.kapasite||0,yeniDevirManuel:yeniDevirManuelDeger};
    delete d._yeniDevirOverride;
    delete d._devirKilidAcik;
    edit
      ? setElevs(p=>p.map(e=>e.id===edit.id?{...e,...d}:e))
      : setElevs(p=>[...p,{...d,id:Date.now(),eklenmeTarihi:today}]);
    close();
  };
  const saveM=()=>{const d={...form,asansorId:+form.asansorId,tutar:+form.tutar||0,yapildi:form.yapildi===true||form.yapildi==="true",odendi:form.odendi===true||form.odendi==="true",kl:form.kl||{}};edit?setMaints(p=>p.map(m=>m.id===edit.id?{...m,...d}:m)):setMaints(p=>[...p,{...d,id:Date.now()}]);close();};
  const saveF=()=>{
    if(!edit&&form._yeniAdres===true){
      if(!(form._yeniIlce&&form._yeniBinaAd&&form._yeniAdresStr)){alert("İlçe, Bina Adı ve Adres zorunlu!");return;}
      var newId=Date.now();
      var newElevF={id:newId,ad:(form._yeniBinaAd||"").trim(),ilce:form._yeniIlce,semt:(form._yeniSemt||"").trim(),adres:(form._yeniAdresStr||"").trim(),yonetici:(form._yeniYon||"").trim(),tel:(form._yeniTel||"").trim(),bakimGunu:"0",aylikUcret:0,bakiyeDevir:0,tip:"Elektrikli",kat:0,kapasite:0,eklenmeTarihi:today};
      setElevs(function(p){return p.concat([newElevF]);});
      const d={...form,asansorId:newId};
      setFaults(function(p){return p.concat([{...d,id:Date.now()+1}]);});
      close();return;
    }
    if(!edit&&form._yeniAdres===false&&!form.asansorId){alert("Bina seçiniz!");return;}
    const d={...form,asansorId:+form.asansorId};
    edit?setFaults(p=>p.map(f=>f.id===edit.id?{...f,...d}:f)):setFaults(p=>[...p,{...d,id:Date.now()}]);
    close();
  };
  const saveT=()=>{
    if(!edit&&form._yeniAdres===true){
      if(!(form._yeniIlce&&form._yeniBinaAd)){alert("İlçe ve Bina Adı zorunlu!");return;}
      // Yeni asansör asansör listesine EKLENMEZ, sadece göreve manuel bina adı yazılır
      const d={...form,asansorId:0,_manuelBinaAd:(form._yeniBinaAd||"").trim(),_manuelIlce:form._yeniIlce,tamamlandi:form.tamamlandi===true||form.tamamlandi==="true",gorev:form.gorev||""};
      setTasks(function(p){return p.concat([{...d,id:Date.now()+1}]);});
      close();return;
    }
    if(!edit&&form._yeniAdres===false&&!form.asansorId){alert("Bina seçiniz!");return;}
    const d={...form,asansorId:form.asansorId?(+form.asansorId||form.asansorId):0,tamamlandi:form.tamamlandi===true||form.tamamlandi==="true",gorev:form.gorev||""};
    edit?setTasks(p=>p.map(t=>t.id===edit.id?{...t,...d}:t)):setTasks(p=>[...p,{...d,id:Date.now()}]);
    close();
  };
  const del=(type,id)=>{if(type==="e")setElevs(p=>p.filter(x=>x.id!==id));if(type==="m")setMaints(p=>p.filter(x=>x.id!==id));if(type==="f")setFaults(p=>p.filter(x=>x.id!==id));if(type==="t")setTasks(p=>p.filter(x=>x.id!==id));};

  const filteredElevs=useMemo(()=>{
    let list=fIlce==="Tümü"?elevs:elevs.filter(e=>e.ilce===fIlce);
    if(arama.trim()) list=list.filter(e=>e.ad.toUpperCase().includes(arama.toUpperCase())||e.adres.toUpperCase().includes(arama.toUpperCase())||e.yonetici.toUpperCase().includes(arama.toUpperCase()));
    return list;
  },[elevs,fIlce,arama]);
  const filteredByIlce=useMemo(()=>filteredElevs.reduce((a,e)=>{if(!a[e.ilce])a[e.ilce]=[];a[e.ilce].push(e);return a;},[]),[filteredElevs]);

  const rotaPool=rotaIlce==="Tümü"?elevs:elevs.filter(e=>e.ilce===rotaIlce);
  const rotaOrder=rotaOtomatikIds.length===rotaSec.length?rotaOtomatikIds:rotaSec;
  const rotaElevs=rotaOrder.map(function(id){return elevs.find(function(e){return e.id===id;});}).filter(Boolean);
  const rotaStartStr=rotaKonum?(rotaKonum.lat+","+rotaKonum.lng):(rotaStart||"");
  const rotaMapStops=rotaElevs.map(function(e){
    var override=rotaAdresOverrides[e.id];
    var target=override||routeAddressLabel(e);
    return {
      elev:e,
      target:target,
      hasOverride:!!override
    };
  });
  // Google Maps Directions URL — waypoints %7C ile ayrılıyor (pipe encoding)
  // MAPS_MAX=13 → 13'ten fazla durakta 2 ayrı URL oluştur
  const {mapsUrl,mapsUrl2}=(function(){
    if(rotaMapStops.length===0) return {mapsUrl:"",mapsUrl2:""};
    var addrs=rotaMapStops.map(function(stop){return stop.target;});
    function buildMapsLink(origin,destinations){
      if(destinations.length===0) return "";
      var base="https://www.google.com/maps/dir/?api=1";
      if(origin) base+="&origin="+encodeURIComponent(origin);
      base+="&destination="+encodeURIComponent(destinations[destinations.length-1]);
      if(destinations.length>1){
        base+="&waypoints="+destinations.slice(0,-1).map(function(a){return encodeURIComponent(a);}).join("%7C");
      }
      base+="&travelmode=driving&dir_action=navigate";
      return base;
    }
    if(addrs.length<=MAPS_MAX){
      return {mapsUrl:buildMapsLink(rotaStartStr,addrs),mapsUrl2:""};
    }
    // İlk bölüm: ilk MAPS_MAX durak
    var firstPart=addrs.slice(0,MAPS_MAX);
    // İkinci bölüm: MAPS_MAX-1'den devam (1 durak overlap → bağlantı noktası)
    var secondPart=addrs.slice(MAPS_MAX-1);
    return {
      mapsUrl:buildMapsLink(rotaStartStr,firstPart),
      mapsUrl2:buildMapsLink(firstPart[firstPart.length-1],secondPart)
    };
  })();
  // Bakımcı için: atanmış ama henüz tamamlanmamış asansörler
  const bekleyenRotaIds=[...new Set(mMonth.filter(function(m){return m.planlanmis&&!m.yapildi&&elevs.some(function(e){return e.id===m.asansorId;});}).map(function(m){return m.asansorId;}))];

  // Tab yapısı
  const TABS_YON=["📊 Dashboard","🛗 Asansörler","🔧 Bakım Atama","⚠️ Arızalar","📋 Günlük İşler","🗺️ Rota","💰 Finans","💸 Giderler","📝 Notlar","🔩 Ekstra İş","🔍 Muayene","📄 Sözleşmeler","🏢 Bina Portalı","👥 Bakımcılar"];
  const TABS_BAK=["🔧 Bakım & Arızalar","🗺️ Rota","📝 Notlar","🔩 Ekstra İş"];
  const visibleTabs=rol==="bakimci"?TABS_BAK:TABS_YON;
  const tabIdx=rol==="bakimci"?[2,5,8,9]:[0,1,2,3,4,5,6,7,8,9,10,11,12,13];

  if(rol===null) return React.createElement(LoginScreen, { onLogin: (r,bk)=>{setRol(r);setAktifBakimci(bk||null);setTab(r==="bakimci"?2:0);}, bakimcilar:bakimcilar,});

  const atanmayanCount=elevs.filter(e=>{const kayitlar=mMonth.filter(m=>m.asansorId===e.id);return kayitlar.length===0||!kayitlar.some(m=>m.planlanmis);}).length;
  const atananArizaCount=faults.filter(f=>f.bakimciAtandi&&f.durum!=="Çözüldü").length;

  return(
    React.createElement('div', { style: {fontFamily:"-apple-system,'SF Pro Display',sans-serif",background:"var(--bg-root)",minHeight:"100vh",color:"var(--text)"},}
      /* HEADER */
      , React.createElement('div', { id:"app-header", className:"safe-top"},
        React.createElement('div', { className:"header-title-row"},
          /* Sol: logo + başlık */
          React.createElement('div', { style:{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}},
            React.createElement('div', { style:{
              background: rol==="bakimci"
                ? "linear-gradient(145deg,rgba(48,209,88,0.25),rgba(48,209,88,0.10))"
                : "linear-gradient(145deg,rgba(79,142,247,0.28),rgba(79,142,247,0.10))",
              borderRadius:10, width:32, height:32,
              display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0,
              border: rol==="bakimci" ? "1px solid rgba(48,209,88,0.25)" : "1px solid rgba(79,142,247,0.25)",
              boxShadow: rol==="bakimci" ? "0 2px 10px rgba(48,209,88,0.20)" : "0 2px 10px rgba(79,142,247,0.25)"
            }}, rol==="bakimci"?"🔧":"🛗"),
            React.createElement('div', {style:{minWidth:0,flex:1}},
              React.createElement('div', { style:{fontWeight:800,fontSize:14,color:"var(--text)",letterSpacing:-0.5,lineHeight:1.2}}, "AsansörTakip Pro"),
              React.createElement('div', { style:{display:"flex",alignItems:"center",gap:6,marginTop:2,flexWrap:"wrap"}},
                React.createElement('span', { style:{fontSize:10,color:rol==="bakimci"?"var(--ios-green)":"rgba(255,255,255,0.40)",fontWeight:600,letterSpacing:0.2}},
                  rol==="bakimci" ? ("● " + (aktifBakimci ? aktifBakimci.ad : "Bakımcı")) : "● Yönetici · "+elevs.length+" asansör"
                ),
                rol==="yonetici"&&atanmayanCount>0&&React.createElement('span', {style:{
                  fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:20,
                  background:"rgba(255,159,10,0.15)",color:"var(--ios-orange)",
                  border:"1px solid rgba(255,159,10,0.25)"
                }}, atanmayanCount+" Atanmayan"),
                rol==="yonetici"&&openFaults.length>0&&React.createElement('span', {style:{
                  fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:20,
                  background:"rgba(255,69,58,0.15)",color:"var(--ios-red)",
                  border:"1px solid rgba(255,69,58,0.25)"
                }}, openFaults.length+" Arıza"),
                rol==="bakimci"&&atananArizaCount>0&&React.createElement('span', {style:{
                  fontSize:9,fontWeight:800,padding:"1px 6px",borderRadius:20,
                  background:"rgba(255,69,58,0.15)",color:"var(--ios-red)",
                  border:"1px solid rgba(255,69,58,0.25)"
                }}, atananArizaCount+" Arıza")
              )
            )
          ),
          /* Sağ: tema + çıkış */
          React.createElement('div', { style:{display:"flex",gap:4,alignItems:"center",flexShrink:0}},
            rol==="bakimci"&&React.createElement('button', {
              onClick:()=>{setSifreModal(true);setSifreInput("");setSifreHata("");},
              style:{width:30,height:30,borderRadius:8,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.10)",color:"var(--accent)",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}
            }, "🔒"),
            React.createElement('button',{onClick:function(){setTema(tema==="acik"?"gece":"acik");},style:{
              width:30,height:30,borderRadius:8,
              background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.09)",
              fontSize:14,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"background 0.18s"
            }},tema==="acik"?"🌙":"☀️"),
            React.createElement('button', {
              onClick:()=>{firebaseLogout();setRol(null);setTab(0);},
              style:{width:30,height:30,borderRadius:8,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.10)",color:"rgba(255,255,255,0.50)",cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center"}
            }, "←")
          )
        ),
        React.createElement('div', { className:"header-tabs"},
          visibleTabs.map((t,i)=>{
            const realIdx=tabIdx[i];
            return React.createElement('button', { key: i, onClick: ()=>setTab(realIdx), className:"header-tab "+(tab===realIdx?"aktif":""),}, t);
          })
        )
      )

      , React.createElement('div', { className:"content-with-tabs scroll-y", style: {maxWidth:1200,margin:"0 auto",padding:16},}

/* DASHBOARD */
, tab===0&&(
  React.createElement('div', { className:"ios-animate"}
    , React.createElement('div', { style: {fontSize:28,fontWeight:800,letterSpacing:-1,marginBottom:16,marginTop:4}}, "Genel Bakış" )
    , (function(){
        var yapilanSayisi=mMonth.filter(function(m){return m.yapildi;}).length;
        var toplamBakim=elevs.length||1;
        var bakimPct=Math.round((yapilanSayisi/toplamBakim)*100);
        var gecikenMuayene=muayeneler.filter(function(m){var g=new Date(m.sonrakiTarih||"");var b=new Date();b.setHours(0,0,0,0);return m.sonrakiTarih&&g<b;}).length;
        var simdiHedef=new Date();
        var yeniMusteriBuAy=elevs.filter(function(e){
          var d=getElevAddedDate(e);
          if(!d || isNaN(d.getTime())) return false;
          return d.getFullYear()===simdiHedef.getFullYear() && d.getMonth()===simdiHedef.getMonth();
        }).length;
        var yeniMusteriKalan=Math.max(0,AYLIK_YENI_MUSTERI_HEDEFI-yeniMusteriBuAy);
        var yeniMusteriPct=Math.min(100,Math.round((yeniMusteriBuAy/AYLIK_YENI_MUSTERI_HEDEFI)*100));
        return React.createElement('div',{style:{background:"linear-gradient(135deg,rgba(0,122,255,0.22),rgba(90,200,250,0.10) 48%,rgba(52,199,89,0.12))",border:"1px solid rgba(90,200,250,0.18)",borderRadius:24,padding:"18px",marginBottom:12,boxShadow:"var(--shadow-sm)"}},
          React.createElement('div',{style:{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",flexWrap:"wrap"}},
            React.createElement('div',{style:{minWidth:220,flex:"1 1 260px"}},
              React.createElement('div',{style:{fontSize:11,fontWeight:600,color:"var(--ios-teal)",letterSpacing:0.55,textTransform:"uppercase",marginBottom:10,opacity:0.92}},"Canlı Operasyon Özeti"),
              React.createElement('div',{style:{fontSize:22,fontWeight:700,color:"var(--text)",letterSpacing:-0.45,lineHeight:1.22,marginBottom:8,maxWidth:520,textWrap:"balance"}}, yapilanSayisi+" bakım tamamlandı, "+(toplamBakim-yapilanSayisi)+" durak sırada"),
              React.createElement('div',{style:{fontSize:13,color:"var(--text-muted)",lineHeight:1.62,maxWidth:540,fontWeight:500}},"Bakım, arıza ve muayene yükü tek bakışta görünür. Rota ekranı seçili durakları artık otomatik sıraya koyar.")
            ),
            React.createElement('div',{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10,flex:"1 1 420px",width:"100%"}},
              React.createElement(ProgressRing,{value:bakimPct,color:"var(--ios-green)",label:"Aylık bakım tamamlama",sublabel:yapilanSayisi+" / "+toplamBakim+" asansör bakımı tamamlandı"}),
              React.createElement('div',{style:{display:"flex",alignItems:"center",gap:14,padding:"14px 16px",background:"linear-gradient(180deg,var(--bg-panel),var(--bg-card))",borderRadius:18,boxShadow:"var(--shadow-sm)",border:"1px solid var(--border-soft)"}} ,
                React.createElement('div',{style:{width:78,height:78,borderRadius:24,background:"linear-gradient(135deg,rgba(59,130,246,0.14),rgba(16,185,129,0.12))",border:"1px solid rgba(59,130,246,0.18)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}},
                  React.createElement('div',{style:{textAlign:"center"}},
                    React.createElement('div',{style:{fontSize:28,fontWeight:800,color:"var(--accent)",lineHeight:1}},yeniMusteriKalan),
                    React.createElement('div',{style:{fontSize:10,fontWeight:600,color:"var(--text-muted)",marginTop:4}},"kaldı")
                  )
                ),
                React.createElement('div',{style:{minWidth:0,flex:1}},
                  React.createElement('div',{style:{fontSize:13,fontWeight:650,color:"var(--text)",letterSpacing:-0.15,lineHeight:1.3}},"Hedeflenen yeni müşteri sayısına ulaşmak"),
                  React.createElement('div',{style:{fontSize:11,color:"var(--text-muted)",marginTop:5,lineHeight:1.5,fontWeight:500}}, "Bu ay "+yeniMusteriBuAy+" yeni bina eklendi. Hedef: "+AYLIK_YENI_MUSTERI_HEDEFI+" • Kalan: "+yeniMusteriKalan),
                  React.createElement('div',{style:{height:8,background:"var(--bg-elevated)",borderRadius:999,overflow:"hidden",marginTop:10}},
                    React.createElement('div',{style:{height:"100%",width:yeniMusteriPct+"%",background:"linear-gradient(90deg,var(--accent),var(--ios-green))",borderRadius:999,transition:"width 0.8s cubic-bezier(.34,1.32,.64,1)"}})
                  ),
                  React.createElement('div',{style:{fontSize:11,color:gecikenMuayene>0?"var(--ios-orange)":"var(--text-muted)",marginTop:8,fontWeight:500}},
                    gecikenMuayene>0 ? (gecikenMuayene+" geciken muayene kaydı var") : "Bu ayki büyüme hedefi takip ediliyor"
                  )
                )
              )
            )
          )
        );
      })()
    /* BENTO GRID - Ana istatistikler */
    , React.createElement('div', { style: {display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:10},}
      , React.createElement(Stat, { icon: "🛗", label: "Toplam Asansör", value: elevs.length, color: "var(--accent)",})
      , React.createElement(Stat, { icon: "⚠️", label: "Açık Arıza", value: openFaults.length, color: "var(--ios-red)",})
      , React.createElement(Stat, { icon: "✅", label: "Bu Ay Yapılan", value: mMonth.filter(m=>m.yapildi).length, color: "var(--ios-green)",})
      , React.createElement(Stat, { icon: "⏳", label: "Bu Ay Kalan", value: elevs.length - mMonth.filter(m=>m.yapildi).length, color: "var(--ios-orange)",})
    )
    /* FİNANSAL BENTO */
    , (function(){
        var simdi2=new Date();
        var ayBas2=new Date(simdi2.getFullYear(),simdi2.getMonth(),1);ayBas2.setHours(0,0,0,0);
        var aySon2=new Date(simdi2.getFullYear(),simdi2.getMonth()+1,0);aySon2.setHours(23,59,59,999);
        /* iptal edilmemiş sonOdemeler toplamı */
        var buAyAlinan=sonOdemeler.filter(function(o){var od=new Date(o.tarih);return !o.iptal&&od>=ayBas2&&od<=aySon2;}).reduce(function(s,o){return s+(o.alinanTutar||0);},0);
        /* bakım kaydı üzerinden ödenen ama sonOdemeler'de olmayan tutarları da ekle */
        var bakimAlinan=mMonth.filter(function(m){return m.odendi&&m.yapildi;}).reduce(function(s,m){
          var zatenVar=sonOdemeler.some(function(o){return !o.iptal&&o.aid===m.asansorId&&(o.alinanTutar||0)===(m.alinanTutar||m.tutar||0);});
          return s+(zatenVar?0:(m.alinanTutar||m.tutar||0));
        },0);
        buAyAlinan=buAyAlinan+bakimAlinan;
        var buAyToplam=elevs.reduce(function(s,e){return s+e.aylikUcret;},0);
        var bekleyen=buAyToplam-buAyAlinan;
        var pct=buAyToplam>0?Math.round(buAyAlinan/buAyToplam*100):0;
        return React.createElement('div', { style: {display:"grid",gridTemplateColumns:"minmax(260px,320px) 1fr",gap:10,marginBottom:10}},
          React.createElement(ProgressRing, {
            value: pct,
            color: "var(--ios-green)",
            label: "Bu Ay Tahsilat Oranı",
            sublabel: buAyAlinan.toLocaleString("tr-TR")+" ₺ tahsil edildi. Hedef: "+buAyToplam.toLocaleString("tr-TR")+" ₺"
          }),
          React.createElement('div', { style: {background:"linear-gradient(180deg,var(--bg-panel),var(--bg-card))",borderRadius:20,padding:"18px",boxShadow:"var(--shadow-sm)",border:"1px solid var(--border-soft)"},}
            , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}},
              React.createElement('div', { style: {fontSize:13,fontWeight:700,color:"var(--text)"}}, "💰 Bu Ay Finansal Özet"),
              React.createElement('div', { style: {fontSize:11,color:"var(--text-muted)"}}, "Canlı tahsilat görünümü")
            )
            , React.createElement('div', { style: {display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}},
              React.createElement('div', {style:{padding:"12px 10px",borderRadius:16,background:"rgba(52,199,89,0.10)",border:"1px solid rgba(52,199,89,0.16)"},},
                React.createElement('div', {style:{fontSize:11,color:"var(--text-muted)",marginBottom:4}}, "Tahsil"),
                React.createElement('div', {style:{fontSize:20,fontWeight:800,color:"var(--ios-green)"}}, buAyAlinan.toLocaleString("tr-TR")+"₺")
              ),
              React.createElement('div', {style:{padding:"12px 10px",borderRadius:16,background:"rgba(0,122,255,0.10)",border:"1px solid rgba(0,122,255,0.16)"},},
                React.createElement('div', {style:{fontSize:11,color:"var(--text-muted)",marginBottom:4}}, "Hedef"),
                React.createElement('div', {style:{fontSize:20,fontWeight:800,color:"var(--accent)"}}, buAyToplam.toLocaleString("tr-TR")+"₺")
              ),
              React.createElement('div', {style:{padding:"12px 10px",borderRadius:16,background:"rgba(255,149,0,0.10)",border:"1px solid rgba(255,149,0,0.16)"},},
                React.createElement('div', {style:{fontSize:11,color:"var(--text-muted)",marginBottom:4}}, "Bekleyen"),
                React.createElement('div', {style:{fontSize:20,fontWeight:800,color:bekleyen>0?"var(--ios-orange)":"var(--ios-green)"}}, bekleyen.toLocaleString("tr-TR")+"₺")
              )
            )
            , React.createElement('div', { style: {height:10,background:"var(--bg-elevated)",borderRadius:999,overflow:"hidden",marginBottom:8}},
              React.createElement('div', { style: {height:"100%",width:pct+"%",background:"linear-gradient(90deg,var(--ios-green),var(--accent))",borderRadius:999,transition:"width 0.8s cubic-bezier(.34,1.32,.64,1)"}})
            )
            , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,flexWrap:"wrap"}},
              React.createElement('span', {style:{fontSize:12,color:"var(--text-muted)"}}, "Tahsilat oranı ve hedefe kalan fark tek bakışta görünür."),
              React.createElement('span', {style:{fontSize:13,fontWeight:800,color:"var(--accent)"}}, pct+"%")
            )
          )
        );
      })()
    /* Toplam Devir Kartı */
    , (function(){
        var toplamDevir=elevs.reduce(function(s,e){return s+(e.bakiyeDevir||0);},0);
        return React.createElement('div', {style:{background:"var(--bg-panel)",borderRadius:20,padding:"16px 18px",marginBottom:10,boxShadow:"var(--shadow-sm)",borderLeft:"4px solid "+(toplamDevir>0?"var(--ios-red)":toplamDevir===0?"var(--ios-green)":"var(--ios-orange)")}}
          , React.createElement('div', {style:{display:"flex",alignItems:"center",justifyContent:"space-between"}}
            , React.createElement('div', null
              , React.createElement('div', {style:{fontSize:13,fontWeight:600,color:"var(--text-muted)",marginBottom:4}}, "📊 Toplam Devir Bakiye")
              , React.createElement('div', {style:{fontSize:24,fontWeight:800,color:toplamDevir>0?"var(--ios-red)":toplamDevir===0?"var(--ios-green)":"var(--ios-orange)",letterSpacing:"-0.5px"}}, toplamDevir.toLocaleString("tr-TR")+" ₺")
            )
            , React.createElement('div', {style:{fontSize:36}}, toplamDevir>0?"🔴":toplamDevir===0?"🟢":"🟡")
          )
          , React.createElement('div', {style:{fontSize:11,color:"var(--text-muted)",marginTop:8}}, elevs.length+" asansörün devir bakiye toplamı")
        );
      })()
    /* Açık arızalar */
    , React.createElement('div', { style: {background:"var(--bg-panel)",borderRadius:20,overflow:"hidden",marginBottom:10,boxShadow:"var(--shadow-sm)"}},
      React.createElement('div', { style: {padding:"14px 16px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}},
        React.createElement('div', {style:{fontSize:14,fontWeight:700}}, "⚠️ Açık Arızalar"),
        openFaults.length>0&&React.createElement('span', {style:{background:"rgba(255,59,48,0.15)",color:"var(--ios-red)",fontSize:12,fontWeight:700,padding:"2px 10px",borderRadius:20}}, openFaults.length)
      ),
      openFaults.length===0
        ?React.createElement('div', {style:{padding:"14px 16px",color:"var(--text-dim)",fontSize:14}}, "Açık arıza yok ✅")
        :openFaults.slice(0,5).map(f=>(
          React.createElement('div', { key: f.id, style: {display:"flex",gap:10,padding:"10px 16px",borderTop:"0.5px solid var(--border-soft)",alignItems:"center"},}
            , React.createElement('div', { style: {width:8,height:8,borderRadius:"50%",background:f.oncelik==="Yüksek"?"var(--ios-red)":f.oncelik==="Orta"?"var(--ios-orange)":"var(--text-dim)",flexShrink:0},})
            , React.createElement('div', { style: {flex:1}},
              React.createElement('div', { style: {fontSize:14,fontWeight:600,color:"var(--text)"}}, f.aciklama),
              React.createElement('div', { style: {fontSize:12,color:"var(--text-muted)",marginTop:1}}, eName(f.asansorId))
            )
            , React.createElement('span', { style: {fontSize:11,padding:"3px 9px",borderRadius:20,background:"var(--bg-elevated)",color:"var(--text-muted)",fontWeight:500}}, f.durum)
          )
        ))
    )
    /* İlçe durumu */
    , React.createElement('div', { style: {background:"linear-gradient(180deg,var(--bg-panel),var(--bg-card))",borderRadius:20,padding:"14px 16px",marginBottom:10,boxShadow:"var(--shadow-sm)",border:"1px solid var(--border-soft)"}},
      React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}},
        React.createElement('div', { style: {fontSize:14,fontWeight:700}}, "🗺️ İlçe Operasyon Yoğunluğu"),
        React.createElement('div', { style: {fontSize:11,color:"var(--text-muted)"}}, "En yoğun 6 bölge")
      ),
      React.createElement('div', { style: {display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}},
        Object.entries(elevByIlce).sort((a,b)=>b[1].length-a[1].length).slice(0,6).map(([ilce,es])=>{
          const c=getIlceRenk(ilce);
          const tamam=mMonth.filter(m=>es.some(e=>e.id===m.asansorId)&&m.yapildi).length;
          const pct=es.length>0?Math.round(tamam/es.length*100):0;
          return(
            React.createElement('div', { key: ilce, style: {background:"var(--bg-elevated)",borderRadius:16,padding:"12px",border:"1px solid "+c+"22",boxShadow:"inset 0 1px 0 rgba(255,255,255,0.03)"},}
              , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,gap:8}},
                React.createElement('div', { style: {fontWeight:800,fontSize:13,color:c}}, ilce),
                React.createElement('span', { style: {fontSize:11,fontWeight:700,color:"var(--text-muted)"}}, es.length+" asansör")
              )
              , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--text-muted)",marginBottom:6}},
                React.createElement('span', null, tamam+" tamam"),
                React.createElement('span', null, pct+"%")
              )
              , React.createElement('div', { style: {height:6,background:"var(--border)",borderRadius:10,overflow:"hidden"}},
                React.createElement('div', { style: {height:"100%",width:pct+"%",background:"linear-gradient(90deg,"+c+", color-mix(in srgb, "+c+" 42%, white))",borderRadius:10}})
              )
            )
          );
        })
      )
    )
    /* Arıza Trendi Grafiği - son 6 ay */
    , (function(){
        var simdi=new Date();
        var aylar=[];
        for(var i=5;i>=0;i--){
          var d=new Date(simdi.getFullYear(),simdi.getMonth()-i,1);
          aylar.push({yil:d.getFullYear(),ay:d.getMonth(),etiket:MONTHS[d.getMonth()].slice(0,3)});
        }
        return React.createElement(MiniTrendChart, {
          title: "📈 Arıza Trendi",
          subtitle: "Son 6 ay içindeki kayıt yoğunluğu",
          color: "var(--ios-red)",
          activeIndex: aylar.length-1,
          items: aylar.map(function(a){
            return {
              label: a.etiket,
              value: faults.filter(function(f){var fd=new Date(f.tarih||"");return fd.getFullYear()===a.yil&&fd.getMonth()===a.ay;}).length
            };
          })
        });
      })()
    /* Teknisyen Performans Özeti */
    , (function(){
        var yapilan=maints.filter(function(m){return m.yapildi;});
        var buAy=mMonth.filter(function(m){return m.yapildi;});
        var odenmemis=maints.filter(function(m){return m.yapildi&&!m.odendi;}).length;
        var ortSure=buAy.length;
        return React.createElement('div', {style:{background:"var(--bg-panel)",borderRadius:20,padding:"14px 16px",marginBottom:10,boxShadow:"var(--shadow-sm)"}}
          , React.createElement('div', {style:{fontSize:14,fontWeight:700,marginBottom:10}}, "👨‍🔧 Bakım Performansı")
          , React.createElement('div', {style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}
            , React.createElement('div', {style:{textAlign:"center",padding:"8px 4px",background:"var(--bg-elevated)",borderRadius:12}}
              , React.createElement('div', {style:{fontSize:20,fontWeight:800,color:"var(--ios-green)"}},(buAy.length))
              , React.createElement('div', {style:{fontSize:10,color:"var(--text-muted)",marginTop:2}},"Bu Ay Yapılan")
            )
            , React.createElement('div', {style:{textAlign:"center",padding:"8px 4px",background:"var(--bg-elevated)",borderRadius:12}}
              , React.createElement('div', {style:{fontSize:20,fontWeight:800,color:"var(--accent)"}},(yapilan.length))
              , React.createElement('div', {style:{fontSize:10,color:"var(--text-muted)",marginTop:2}},"Toplam Yapılan")
            )
            , React.createElement('div', {style:{textAlign:"center",padding:"8px 4px",background:"var(--bg-elevated)",borderRadius:12}}
              , React.createElement('div', {style:{fontSize:20,fontWeight:800,color:odenmemis>0?"var(--ios-orange)":"var(--ios-green)"}},(odenmemis))
              , React.createElement('div', {style:{fontSize:10,color:"var(--text-muted)",marginTop:2}},"Ödenmemiş")
            )
          )
        );
      })()
    /* Muayene Uyarıları */
    , (function(){
        var gecikti=muayeneler.filter(function(m){var g=new Date(m.sonrakiTarih||"");var b=new Date();b.setHours(0,0,0,0);return m.sonrakiTarih&&g<b;});
        var yakin=muayeneler.filter(function(m){var g=new Date(m.sonrakiTarih||"");var b=new Date();b.setHours(0,0,0,0);var diff=Math.round((g-b)/86400000);return m.sonrakiTarih&&diff>=0&&diff<=30;});
        if(gecikti.length===0&&yakin.length===0) return null;
        return React.createElement('div', {style:{background:"rgba(255,59,48,0.08)",border:"1px solid rgba(255,59,48,0.25)",borderRadius:16,padding:"12px 14px",marginBottom:10}}
          , React.createElement('div', {style:{fontSize:13,fontWeight:700,color:"var(--ios-red)",marginBottom:8}}, "🔴 Muayene Uyarıları")
          , gecikti.length>0&&React.createElement('div', {style:{fontSize:12,color:"var(--text-muted)",marginBottom:4}},
              "⚠️ "+gecikti.length+" asansörün muayene süresi geçmiş → "
              , React.createElement('button', {onClick:function(){setTab(10);},style:{background:"none",border:"none",color:"var(--ios-red)",cursor:"pointer",fontSize:12,fontWeight:700,padding:0}}, "Muayene Sekmesine Git →")
            )
          , yakin.length>0&&React.createElement('div', {style:{fontSize:12,color:"var(--text-muted)"}},
              "🟡 "+yakin.length+" asansörün muayenesi 30 gün içinde dolacak"
            )
        );
      })()
    /* Sözleşme Uyarıları */
    , (function(){
        var b=new Date();b.setHours(0,0,0,0);
        var biten=sozlesmeler.filter(function(s){return s.bitis&&new Date(s.bitis)<b;}).length;
        var yakin=sozlesmeler.filter(function(s){if(!s.bitis) return false;var diff=Math.round((new Date(s.bitis)-b)/86400000);return diff>=0&&diff<=30;}).length;
        if(biten===0&&yakin===0) return null;
        return React.createElement('div', {style:{background:"rgba(255,149,0,0.08)",border:"1px solid rgba(255,149,0,0.25)",borderRadius:16,padding:"12px 14px",marginBottom:10}}
          , React.createElement('div', {style:{fontSize:13,fontWeight:700,color:"var(--ios-orange)",marginBottom:6}}, "📄 Sözleşme Uyarıları")
          , biten>0&&React.createElement('div', {style:{fontSize:12,color:"var(--text-muted)",marginBottom:2}}, "🔴 "+biten+" sözleşmenin süresi dolmuş")
          , yakin>0&&React.createElement('div', {style:{fontSize:12,color:"var(--text-muted)"}}, "🟡 "+yakin+" sözleşme 30 gün içinde bitiyor")
        );
      })()
    /* Sıfırla */
    , React.createElement('div', {style:{marginTop:20,textAlign:"center"}},
      React.createElement('div', {style:{fontSize:12,color:"var(--text-dim)",marginBottom:8}}, "⚠️ Tehlikeli Alan")
      , React.createElement('button', {
          onClick:function(){
            var pw=window.prompt("Sıfırlama şifresini girin:");
            if(pw===null) return;
            if(pw!=="199494"){alert("Hatalı şifre! İşlem iptal edildi.");return;}
            if(!window.confirm("Tüm bakım, arıza ve görev verileri silinecek. Asansör listesi korunur. Emin misiniz?")){return;}
            setMaints([]);setFaults([]);setTasks([]);setElevs(EXCEL_ELEVS);
            dbSet("at_maints",[]);dbSet("at_faults",[]);dbSet("at_tasks",[]);dbSet("at_elevs",EXCEL_ELEVS);
            alert("Veriler sıfırlandı.");
          },
          style:{fontSize:13,padding:"10px 22px",borderRadius:14,background:"rgba(255,59,48,0.12)",border:"none",color:"var(--ios-red)",cursor:"pointer",fontWeight:700,minHeight:44}
        }, "🗑 Sistemi Sıfırla")
    )
  )
)

/* ASANSÖRLER */
, tab===1&&(
  React.createElement('div', null
    , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14,flexWrap:"wrap",gap:10},}
      , React.createElement('h2', { style: {fontSize:18,fontWeight:900,margin:0},}, "Asansörler " , React.createElement('span', { style: {fontSize:13,color:"#64748b",fontWeight:400},}, "(", filteredElevs.length, "/", elevs.length, ")"))
      , React.createElement('div', { style: {display:"flex",gap:8,flexWrap:"wrap"},}
        , React.createElement('input', { value: arama, onChange: e=>setArama(e.target.value), placeholder: "🔍 Ara..." , style: {...S.inp,width:160},})
        , React.createElement('select', { value: fIlce, onChange: e=>setFIlce(e.target.value), style: S.sel,}
          , React.createElement('option', { value: "Tümü",}, "Tüm İlçeler" )
          , ilceler.map(il=>React.createElement('option', { key: il, value: il,}, il, " (" , _optionalChain([elevByIlce, 'access', _10 => _10[il], 'optionalAccess', _11 => _11.length])||0, ")"))
        )
        , React.createElement('button', { onClick: ()=>oAdd("e"), style: {background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer"},}, "+ Ekle" )
        , React.createElement('button', { onClick: function(){exportAsansorlerExcel(filteredElevs,bal);}, style: {background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer"},}, "\ud83d\udce5 Excel \u0130ndir" )
      )
    )
    , Object.entries(filteredByIlce||{}).sort((a,b)=>b[1].length-a[1].length).map(([ilce,es])=>{
      const c=getIlceRenk(ilce);
      return(
        React.createElement('div', { key: ilce, style: {marginBottom:20},}
          , React.createElement('div', { style: {display:"flex",alignItems:"center",gap:8,marginBottom:8},}
            , React.createElement('div', { style: {width:4,height:18,borderRadius:2,background:c},})
            , React.createElement('span', { style: {fontWeight:800,fontSize:13,color:c},}, ilce)
            , React.createElement('span', { style: {fontSize:10,color:"#64748b",background:"#1a1f2e",padding:"1px 7px",borderRadius:20},}, es.length, " asansör" )
          )
          , React.createElement('div', { style: {display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(270px,1fr))",gap:8},}
            , es.map(e=>{
              var eBakimYapildi=mMonth.some(function(m){return m.asansorId===e.id&&m.yapildi;});
              return React.createElement('div', { key: e.id, style: {background:eBakimYapildi?"#0d1f12":"#141824",borderRadius:12,border:"1px solid "+(eBakimYapildi?"#10b981":"#2a3050"),borderTop:"3px solid "+(eBakimYapildi?"#10b981":c),padding:13},}
                , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8},}
                  , React.createElement('div', { style: {fontWeight:700,fontSize:13},}, e.ad)
                  , React.createElement('div', { style: {display:"flex",gap:4},}
                    , React.createElement(IBtn, { onClick: ()=>oEdit("e",e), icon: "✏️",})
                    , React.createElement(IBtn, { onClick: ()=>del("e",e.id), icon: "🗑️", danger: true,})
                  )
                )
                , React.createElement('div', { style: {fontSize:10,color:"#64748b",marginBottom:2},}, "📍 " , (e.semt?e.semt+" Mah., ":"")+e.adres)
                , React.createElement('div', { style: {fontSize:10,color:"#94a3b8",marginBottom:2},}, "👤 " , e.yonetici, " · 📞 "   , e.tel)
                , e.yoneticiDaire&&React.createElement('div', { style: {fontSize:10,color:"#f59e0b",marginBottom:2,fontWeight:700},}, "🚪 Daire: " , e.yoneticiDaire)
                /* Teknik Kart mini özeti */
                , (e.marka||e.tip)&&React.createElement('div', {style:{fontSize:10,color:"#64748b",marginBottom:2}},
                    "🔩 "+(e.marka||"")+(e.model?" "+e.model:"")+(e.tip?" · "+e.tip:"")+(e.imalatYili?" · "+e.imalatYili:"")
                  )
                , React.createElement('div', { style: {display:"flex",gap:6,marginTop:8,flexWrap:"wrap"},}
                  , React.createElement('span', { style: {fontSize:10,background:"#1e3a5f",color:"#3b82f6",padding:"2px 8px",borderRadius:6,fontWeight:700},}, e.aylikUcret.toLocaleString("tr-TR"), " ₺/ay")
                  , React.createElement('span', { style: {fontSize:10,background:bal(e.id)>0?"#3a1e1e":bal(e.id)<0?"#0a2a1a":"#1a1f2e",color:bal(e.id)>0?"#ef4444":bal(e.id)<0?"#34d399":"#64748b",padding:"2px 8px",borderRadius:6,fontWeight:700},}, "Eski Devir: " , (bal(e.id)>0?"+":"")+bal(e.id).toLocaleString("tr-TR"), " ₺" )
                )
                , (function(){
                    var nd=yeniDevir(e.id);
                    if(nd===null) return null;
                    var ndColor=nd>0?"#f97316":nd===0?"#64748b":"#34d399";
                    var ndBg=nd>0?"rgba(249,115,22,0.12)":nd===0?"rgba(100,116,139,0.10)":"rgba(52,211,153,0.12)";
                    var ndBorder=nd>0?"#f9731633":nd===0?"#64748b33":"#34d39933";
                    return React.createElement('div', {style:{marginTop:6,padding:"6px 10px",borderRadius:8,background:ndBg,border:"1px solid "+ndBorder,display:"flex",justifyContent:"space-between",alignItems:"center"}}
                      , React.createElement('span', {style:{fontSize:10,color:ndColor,fontWeight:600}}, "🔄 Yeni Devir")
                      , React.createElement('span', {style:{fontSize:13,color:ndColor,fontWeight:900}},
                          (nd>0?"+":nd===0?"":"")+ nd.toLocaleString("tr-TR")+" ₺")
                    );
                  })()
                /* Bakım Geçmişi + E-posta bildirim butonları */
                , React.createElement('div', {style:{display:"flex",gap:4,marginTop:8}}
                  , React.createElement('button', {
                      onClick:function(ev){ev.stopPropagation();setAsansorDetay(asansorDetay===e.id?null:e.id);},
                      style:{flex:1,padding:"5px 8px",borderRadius:8,background:asansorDetay===e.id?"#1e3a5f":"#1a1f2e",border:"1px solid "+(asansorDetay===e.id?"#3b82f6":"#2a3050"),color:asansorDetay===e.id?"#3b82f6":"#64748b",fontSize:10,fontWeight:700,cursor:"pointer"}
                    }, asansorDetay===e.id?"▲ Geçmişi Gizle":"📋 Bakım Geçmişi"
                  )
                , e.tel&&React.createElement('button', {
                      onClick:function(ev){
                        ev.stopPropagation();
                        var nd=yeniDevir(e.id);
                        var borc=nd!==null?nd:(e.bakiyeDevir||0)+(e.aylikUcret||0);
                        var tutar=borc.toLocaleString("tr-TR")+" ₺";
                        var tel=(e.tel||"").replace(/[\s\-\(\)]/g,"");
                        if(tel.startsWith("0")) tel="90"+tel.slice(1);
                        else if(!tel.startsWith("90")&&!tel.startsWith("+90")) tel="90"+tel;
                        tel=tel.replace(/^\+/,"");
                        var mesaj=
                          "Sayın "+e.ad+" Yönetimi,\n\n"+
                          "Şirketimize duyduğunuz güven için teşekkür ederiz.\n\n"+
                          "Bilginize sunmak istediğimiz husus; binanızın asansörüne ait aylık periyodik bakımlar tarafımızca düzenli ve eksiksiz olarak gerçekleştirilmektedir.\n\n"+
                          "Güncel hesap durumunuza göre toplam bakım borcunuz *"+tutar+"* olup, ödemenizin en kısa sürede tarafımıza iletilmesini saygılarımızla arz ederiz.\n\n"+
                          "Herhangi bir sorunuz veya talebiniz olması halinde bizimle iletişime geçmekten çekinmeyiniz.\n\n"+
                          "Saygılarımızla,\n"+
                          "Asis Asansör Bakım ve Servis Hizmetleri";
                        window.open("https://wa.me/"+tel+"?text="+encodeURIComponent(mesaj),"_blank");
                      },
                      style:{padding:"5px 8px",borderRadius:8,background:"rgba(37,211,102,0.12)",border:"1px solid rgba(37,211,102,0.30)",color:"#128c7e",fontSize:14,cursor:"pointer",lineHeight:1,fontWeight:700}
                    }, "WhatsApp"
                  )
                )
                /* Bakım geçmişi satır inline panel */
                , asansorDetay===e.id&&(function(){
                    var sonBakimlar=maints.filter(function(m){return m.asansorId===e.id;}).sort(function(a,b){return b.tarih.localeCompare(a.tarih);}).slice(0,5);
                    return React.createElement('div', {style:{marginTop:8,background:"#0d1321",borderRadius:10,overflow:"hidden",border:"1px solid #1e2a40"}}
                      , React.createElement('div', {style:{padding:"7px 10px",fontSize:10,fontWeight:700,color:"#3b82f6",borderBottom:"1px solid #1e2a40"}}, "Son 5 Bakım")
                      , sonBakimlar.length===0
                          ? React.createElement('div', {style:{padding:"8px 10px",fontSize:11,color:"#475569"}}, "Henüz bakım kaydı yok.")
                          : sonBakimlar.map(function(m){
                              return React.createElement('div', {key:m.id,style:{padding:"7px 10px",borderTop:"1px solid #1e2a40",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                                , React.createElement('div', null
                                  , React.createElement('div', {style:{fontSize:11,fontWeight:600,color:m.yapildi?"#34c759":"#94a3b8"}}, m.yapildi?"✅":"⏳"," ",m.tarih)
                                  , m.notlar&&React.createElement('div', {style:{fontSize:10,color:"#475569"}}, m.notlar)
                                )
                                , m.yapildi&&React.createElement('span', {style:{fontSize:11,fontWeight:700,color:"#34c759"}}, (m.alinanTutar||m.tutar||0).toLocaleString("tr-TR"),"₺")
                              );
                            })
                    );
                  })()
              )
            })
          )
        )
      );
    })
  )
)

/* BAKIM ATAMA */
, tab===2&&rol==="yonetici"&&(
  React.createElement(BakimAtamaPaneli, { elevs: elevs, maints: maints, setMaints: setMaints, faults: faults, setFaults: setFaults, fMonth: fMonth, setFMonth: setFMonth, ilceler: ilceler, elevByIlce: elevByIlce, today: today, eName: eName, bakimcilar: bakimcilar, onRotaOlustur: function(ids){setRotaSec(ids);setTab(5);},})
)

/* BAKIMCI GÖRÜNÜMÜ */
, tab===2&&rol==="bakimci"&&(
  React.createElement(BakimciGorunum, { elevs: elevs, maints: maints, setMaints: setMaints, faults: faults, setFaults: setFaults, bal: bal, ilceler: ilceler, today: today, fMonth: fMonth, setFMonth: setFMonth, eName: eName, sonOdemeler: sonOdemeler, setSonOdemeler: setSonOdemeler, aktifBakimci: aktifBakimci, rotaData: {elevs:rotaElevs,stops:rotaMapStops,mapsUrl:mapsUrl,mapsUrl2:mapsUrl2,konum:rotaKonum},})
)

/* ARIZALAR - YÖNETİCİ */
, tab===3&&(
  React.createElement(ArizaYonetimiAdmin, { faults: faults, setFaults: setFaults, elevs: elevs, eName: eName, oAdd: oAdd, oEdit: oEdit, del: del,})
)

/* GÜNLÜK İŞLER */
, tab===4&&(
  React.createElement('div', null
    , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14},}
      , React.createElement('h2', { style: {fontSize:18,fontWeight:900,margin:0},}, "Günlük İş Takibi"  )
      , React.createElement('button', { onClick: ()=>oAdd("t"), style: {background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",color:"#fff",border:"none",borderRadius:10,padding:"8px 14px",fontWeight:700,fontSize:12,cursor:"pointer"},}, "+ Görev" )
    )
    , tasks.length===0&&React.createElement(Empty, { t: "Kayıtlı görev yok"  ,})
    , [...new Set(tasks.map(t=>t.tarih))].sort().reverse().map(date=>{
      const dt=tasks.filter(t=>t.tarih===date);
      const done=dt.filter(t=>t.tamamlandi).length;
      return(
        React.createElement('div', { key: date, style: {marginBottom:14},}
          , React.createElement('div', { style: {display:"flex",alignItems:"center",gap:8,marginBottom:6},}
            , React.createElement('div', { style: {fontWeight:700,fontSize:12,color:date===today?"#3b82f6":"#94a3b8"},}, date===today?"🔵 Bugün — "+date:"📅 "+date)
            , React.createElement('span', { style: {fontSize:10,background:"#1a1f2e",padding:"1px 7px",borderRadius:20,color:"#64748b"},}, done, "/", dt.length)
            , React.createElement('div', { style: {flex:1,height:3,background:"#1a1f2e",borderRadius:10},}, React.createElement('div', { style: {height:"100%",background:"#3b82f6",borderRadius:10,width:(dt.length>0?done/dt.length*100:0)+"%"},}))
          )
          , dt.map(t=>(
            React.createElement('div', { key: t.id, style: {background:"#1a1f2e",borderRadius:9,padding:"9px 12px",border:"1px solid "+(t.tamamlandi?"#1e3a2e":"#2a3050"),display:"flex",alignItems:"center",gap:8,marginBottom:4},}
              , React.createElement('input', { type: "checkbox", checked: t.tamamlandi, onChange: ()=>setTasks(p=>p.map(x=>x.id===t.id?{...x,tamamlandi:!x.tamamlandi}:x)), style: {accentColor:"#3b82f6",width:16,height:16},})
              , React.createElement('div', { style: {flex:1,minWidth:0}}
  ,(function(){
    var binaAd=(t.asansorId&&+t.asansorId>0)?eName(+t.asansorId||t.asansorId):(t._manuelBinaAd||"");
    var ilceAd=(t.asansorId&&+t.asansorId>0)?((elevs.find(function(e){return e.id===(+t.asansorId||t.asansorId);})||{}).ilce||""):(t._manuelIlce||"");
    var binaStr=ilceAd?(ilceAd+" · "+binaAd):binaAd;
    return React.createElement('div', null
      , binaStr&&React.createElement('div', {style:{fontSize:11,fontWeight:700,color:"#3b82f6",marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:t.tamamlandi?"line-through":"none"}}, "📍 "+binaStr)
      , React.createElement('div', {style:{fontSize:12,fontWeight:600,textDecoration:t.tamamlandi?"line-through":"none",color:t.tamamlandi?"#475569":"#e0e6f0",marginBottom:2}}, t.gorev||"—")
      , React.createElement('div', {style:{fontSize:10,color:"#94a3b8"}}, "📅 "+t.tarih)
      , t.notlar&&React.createElement('div', {style:{fontSize:10,color:"#64748b",marginTop:2}}, "📝 "+t.notlar)
    );
  })()
)
              , React.createElement(IBtn, { onClick: ()=>oEdit("t",t), icon: "✏️",})
              , React.createElement(IBtn, { onClick: ()=>del("t",t.id), icon: "🗑️", danger: true,})
            )
          ))
        )
      );
    })
  )
)

/* ROTA */
, tab===5&&(
  React.createElement('div', null

    /* Başlık + konum butonu */
    , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}},
      React.createElement('h2', {style:{fontSize:18,fontWeight:900,margin:0}}, "🗺️ Rota Planlama"),
      rotaKonum
        ? React.createElement('div', {style:{display:"flex",alignItems:"center",gap:6,background:"rgba(16,185,129,0.1)",border:"1px solid #10b98144",borderRadius:8,padding:"5px 10px"}},
            React.createElement('span',{style:{fontSize:10,color:"#10b981",fontWeight:700}},"📡 Konumunuz alındı"),
            React.createElement('button',{onClick:()=>setRotaKonum(null),style:{background:"none",border:"none",color:"var(--text-muted)",cursor:"pointer",fontSize:14,lineHeight:1,padding:"0 2px"}},"×")
          )
        : React.createElement('button',{onClick:()=>konumAl(false),disabled:konumYukleniyor,
            style:{padding:"7px 13px",background:"rgba(59,130,246,0.15)",border:"1px solid #3b82f644",borderRadius:8,color:"#3b82f6",cursor:"pointer",fontSize:12,fontWeight:700}},
            konumYukleniyor?"⏳ Alınıyor...":"📡 Konumu Al"
          )
    )

    /* Konum hatası */
    , konumHata&&React.createElement('div',{style:{fontSize:11,color:"#ef4444",background:"rgba(239,68,68,0.1)",border:"1px solid #ef444433",borderRadius:7,padding:"8px 12px",marginBottom:10}},"⚠️ "+konumHata)

    /* Konum bilgisi veya manuel adres */
    , rotaKonum
      ? React.createElement('div',{style:{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"var(--bg-card)",border:"1px solid #10b98133",borderRadius:10,marginBottom:12}},
          React.createElement('div',{style:{width:28,height:28,borderRadius:"50%",background:"#10b981",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}},"📍"),
          React.createElement('div',{style:{flex:1}},
            React.createElement('div',{style:{fontSize:11,fontWeight:700,color:"#10b981"}},"Başlangıç: Mevcut Konumunuz"),
            React.createElement('div',{style:{fontSize:10,color:"var(--text-muted)",marginTop:1}},rotaKonum.label)
          )
        )
      : React.createElement('div',{style:{marginBottom:12}},
          React.createElement('div',{style:{fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:5}},"📍 Başlangıç noktası"),
          React.createElement('input',{value:rotaStart,onChange:e=>setRotaStart(e.target.value),
            placeholder:"Adres yazın veya yukarıdan konumu alın...",
            style:{...S.inp,width:"100%",boxSizing:"border-box",border:"1px solid "+(rotaStart?"#3b82f666":"var(--border)")}
          }),
          !rotaStart&&React.createElement('div',{style:{fontSize:10,color:"#ef4444",marginTop:4,fontWeight:600}},
            "⚠️ Konum alınmadan rota Google Maps'te mevcut konumdan başlamayabilir."
          )
        )

    /* BAKIMCI: Bekleyen Bakımlar akıllı filtresi */
    , rol==="bakimci"&&bekleyenRotaIds.length>0&&React.createElement('div',{style:{background:"var(--bg-card)",border:"1px solid #10b98155",borderRadius:12,padding:"12px 14px",marginBottom:12}},
        React.createElement('div',{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}},
          React.createElement('div',null,
            React.createElement('div',{style:{fontSize:13,fontWeight:800,color:"#10b981"}},"🔧 Bekleyen Bakımlar"),
            React.createElement('div',{style:{fontSize:10,color:"var(--text-muted)",marginTop:2}},bekleyenRotaIds.length+" asansör bu ay henüz tamamlanmadı")
          ),
          React.createElement('button',{
            onClick:function(){setRotaSec(bekleyenRotaIds);setRotaIlce("Tümü");},
            style:{padding:"8px 14px",background:"#10b981",border:"none",borderRadius:8,color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer",whiteSpace:"nowrap"}
          },"⚡ Hepsini Seç")
        ),
        React.createElement('div',{style:{display:"flex",flexWrap:"wrap",gap:5}},
          bekleyenRotaIds.map(function(aid){
            var e=elevs.find(function(x){return x.id===aid;});
            if(!e) return null;
            var sec=rotaSec.includes(e.id);
            return React.createElement('button',{key:aid,
              onClick:function(){setRotaSec(function(p){return sec?p.filter(function(x){return x!==e.id;}):[...p,e.id];});},
              style:{fontSize:11,padding:"5px 10px",borderRadius:7,
                background:sec?"#10b981":"var(--bg-elevated)",
                color:sec?"#fff":"var(--text)",
                border:"1px solid "+(sec?"#10b981":"#10b98144"),
                cursor:"pointer",fontWeight:600,
                transition:"all 0.15s"
              }
            }, (sec?"✓ ":"")+e.ad);
          })
        )
      )

    /* Hızlı bölge + Tümü seçimi */
    , React.createElement('div',{style:{marginBottom:10}},
      React.createElement('div',{style:{fontSize:11,fontWeight:700,color:"var(--text-muted)",marginBottom:6}},"⚡ Hızlı Bölge Seçimi"),
      React.createElement('div',{style:{display:"flex",flexWrap:"wrap",gap:5}},
        React.createElement('button',{
          onClick:()=>{setRotaIlce("Tümü");setRotaSec([]);},
          style:{fontSize:10,padding:"4px 10px",borderRadius:6,background:rotaIlce==="Tümü"?"rgba(59,130,246,0.15)":"var(--bg-card)",color:rotaIlce==="Tümü"?"#3b82f6":"var(--text-muted)",border:"1px solid "+(rotaIlce==="Tümü"?"#3b82f6":"var(--border)"),cursor:"pointer",fontWeight:700}
        },"Tüm İlçeler"),
        Object.entries(elevByIlce).map(function([ilce,es]){
          var c=getIlceRenk(ilce);
          var secili=rotaIlce===ilce;
          // Bakımcı modunda ilçedeki bekleyen sayısını göster
          var bekleyen=bekleyenRotaIds.filter(function(id){return es.some(function(e){return e.id===id;});}).length;
          return React.createElement('button',{key:ilce,
            onClick:()=>{setRotaIlce(ilce);setRotaSec(es.map(e=>e.id));},
            style:{fontSize:10,padding:"4px 10px",borderRadius:6,background:secili?c+"33":"var(--bg-card)",color:secili?c:"var(--text-muted)",border:"1px solid "+(secili?c+"66":"var(--border)"),cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",gap:4}
          },
            ilce+" ("+es.length+")",
            bekleyen>0&&React.createElement('span',{style:{background:"#10b98133",color:"#10b981",borderRadius:10,padding:"0px 5px",fontSize:9,fontWeight:800}},bekleyen+" ⏳")
          );
        })
      )
    )

    /* Asansör listesi */
    , React.createElement('div',{style:{background:"var(--bg-card)",borderRadius:12,border:"1px solid var(--border)",marginBottom:10}},
      React.createElement('div',{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderBottom:"1px solid var(--border)",flexWrap:"wrap",gap:6}},
        React.createElement('span',{style:{fontSize:12,fontWeight:700,color:"var(--text-muted)"}},
          "Asansörler — ",
          React.createElement('span',{style:{color:"#3b82f6"}},rotaSec.length," seçili")
        ),
        React.createElement('div',{style:{display:"flex",gap:6}},
          React.createElement('button',{onClick:()=>setRotaSec(rotaPool.map(e=>e.id)),style:{fontSize:10,padding:"4px 10px",borderRadius:6,background:"rgba(59,130,246,0.15)",color:"#3b82f6",border:"none",cursor:"pointer",fontWeight:700}},"Tümünü Seç"),
          React.createElement('button',{onClick:()=>setRotaSec([]),style:{fontSize:10,padding:"4px 10px",borderRadius:6,background:"var(--bg-elevated)",color:"var(--text-muted)",border:"none",cursor:"pointer",fontWeight:700}},"Temizle")
        )
      ),
      React.createElement('div',{style:{maxHeight:260,overflowY:"auto",padding:"6px 8px",display:"flex",flexDirection:"column",gap:3}},
        rotaPool.length===0
          ? React.createElement('div',{style:{padding:"20px",textAlign:"center",color:"var(--text-muted)",fontSize:12}},"Asansör bulunamadı")
          : rotaPool.map(function(e){
            var sec=rotaSec.includes(e.id);
            var sira=rotaOrder.indexOf(e.id)+1;
            var c=getIlceRenk(e.ilce);
            var bekliyor=bekleyenRotaIds.includes(e.id);
            var maint=mMonth.find(function(m){return m.asansorId===e.id;});
            var tamam=maint&&maint.yapildi;
            return React.createElement('div',{
              key:e.id,
              onClick:()=>setRotaSec(p=>sec?p.filter(x=>x!==e.id):[...p,e.id]),
              style:{display:"flex",alignItems:"center",gap:8,padding:"9px 10px",borderRadius:8,
                background:sec?"rgba(59,130,246,0.15)":bekliyor?"rgba(16,185,129,0.08)":"var(--bg-elevated)",
                border:"1px solid "+(sec?"#3b82f6":bekliyor?"#10b98144":"var(--border)"),
                cursor:"pointer",transition:"all 0.1s"}
            },
              /* Checkbox / sıra numarası */
              React.createElement('div',{style:{width:22,height:22,borderRadius:5,background:sec?"#3b82f6":"var(--bg-deep)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:sec?"#fff":"var(--text-muted)",flexShrink:0}},sec?sira:"☐"),
              /* Bina bilgisi */
              React.createElement('div',{style:{flex:1,minWidth:0}},
                React.createElement('div',{style:{fontSize:12,fontWeight:600,color:sec?"var(--text)":bekliyor?"#6ee7b7":"var(--text-muted)",display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}},e.ad),
                React.createElement('div',{style:{fontSize:10,color:"var(--text-dim)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},e.ilce+(e.semt?", "+e.semt:""))
              ),
              /* Durum badge */
              tamam
                ? React.createElement('span',{style:{fontSize:9,padding:"2px 7px",borderRadius:10,background:"rgba(16,185,129,0.1)",color:"#10b981",fontWeight:700,flexShrink:0}},"✅ Tamam")
                : bekliyor
                  ? React.createElement('span',{style:{fontSize:9,padding:"2px 7px",borderRadius:10,background:"#10b98120",color:"#10b981",fontWeight:700,flexShrink:0,border:"1px solid #10b98144"}},"⏳ Bekliyor")
                  : React.createElement('div',{style:{width:6,height:6,borderRadius:"50%",background:c,flexShrink:0}})
            );
          })
      )
    )

    /* Rota özeti + butonlar */
    , rotaElevs.length>0
      ? React.createElement('div',{style:{display:"flex",flexDirection:"column",gap:8}},
          React.createElement('div',{style:{
            background:"linear-gradient(180deg,var(--bg-panel),var(--bg-card))",
            border:"1px solid var(--border-soft)",
            borderRadius:14,
            padding:"12px 14px",
              boxShadow:"var(--shadow-sm)"
            }},
            React.createElement('div',{style:{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:8}},
              React.createElement('div',null,
                React.createElement('div',{style:{fontSize:13,fontWeight:800,color:"var(--text)"}}, "Rota Özeti"),
                React.createElement('div',{style:{fontSize:11,color:"var(--text-muted)",marginTop:2}},
                  "İlçe → Semt → Sokak sırasıyla gruplanıp Google Maps'e gönderilecek."
                )
              ),
              React.createElement('span',{style:{fontSize:11,fontWeight:700,padding:"5px 9px",borderRadius:999,background:"rgba(59,130,246,0.14)",color:"#60a5fa"}}, rotaElevs.length+" durak")
            ),
            React.createElement('div',{style:{padding:"10px 12px",borderRadius:12,background:"var(--bg-elevated)",border:"1px solid var(--border)"}},
              React.createElement('div',{style:{fontSize:10,color:"var(--text-muted)",marginBottom:4}},"Başlangıç"),
              React.createElement('div',{style:{fontSize:12,fontWeight:700,color:"var(--text)"}}, rotaKonum?"Mevcut konum":(rotaStart.trim()||"Google Maps soracak"))
            )
          ),
          /* Başlangıç noktası özeti */
          rotaStartStr
            ? React.createElement('div',{style:{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"rgba(16,185,129,0.1)",borderRadius:9,border:"1px solid #10b98133"}},
                React.createElement('div',{style:{width:22,height:22,borderRadius:"50%",background:"#10b981",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff",flexShrink:0}},"S"),
                React.createElement('div',null,
                  React.createElement('div',{style:{fontSize:10,fontWeight:700,color:"#10b981"}},"Başlangıç Noktası"),
                  React.createElement('div',{style:{fontSize:10,color:"var(--text-muted)"}},rotaKonum?rotaKonum.label:rotaStart)
                )
              )
            : React.createElement('div',{style:{padding:"8px 12px",background:"rgba(239,68,68,0.1)",border:"1px solid #ef444433",borderRadius:9}},
                React.createElement('div',{style:{fontSize:11,color:"#ef4444",fontWeight:700}},"⚠️ Başlangıç konumu yok"),
                React.createElement('div',{style:{fontSize:10,color:"#f87171",marginTop:2}},"Google Maps size başlangıç soracak. Daha iyi deneyim için yukarıdan konumu alın.")
              ),

          /* Durak listesi */
          React.createElement('div',{style:{background:"var(--bg-card)",borderRadius:10,border:"1px solid var(--border)",padding:"8px 10px",display:"flex",flexDirection:"column",gap:3}},
            rotaElevs.map(function(e,i){
              var c=getIlceRenk(e.ilce);
              var bekliyor=bekleyenRotaIds.includes(e.id);
              var override=rotaAdresOverrides[e.id];
              var adresText=override||routeAddressLabel(e);
              return React.createElement('div',{key:e.id,style:{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:bekliyor?"rgba(16,185,129,0.08)":"var(--bg-elevated)",borderRadius:7,border:"1px solid "+(bekliyor?"#10b98133":"var(--border)")}},
                React.createElement('div',{style:{width:22,height:22,borderRadius:"50%",background:c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff",flexShrink:0}},i+1),
                React.createElement('div',{style:{flex:1,minWidth:0}},
                  React.createElement('div',{style:{fontSize:12,fontWeight:700,color:"var(--text)",display:"flex",alignItems:"center",gap:6}},
                    e.ad,
                    bekliyor&&React.createElement('span',{style:{fontSize:9,color:"#10b981",background:"#10b98120",padding:"1px 6px",borderRadius:8,fontWeight:700}},"⏳ Bekliyor"),
                    override&&React.createElement('span',{style:{fontSize:9,color:"#3b82f6",background:"rgba(59,130,246,0.12)",padding:"1px 6px",borderRadius:8,fontWeight:700}},"düzenlendi")
                  ),
                  React.createElement('div',{style:{fontSize:9,color:"var(--text-muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},adresText)
                ),
                /* Adres düzelt butonu */
                React.createElement('button',{
                  onClick:function(ev){ev.stopPropagation();setRotaAdresModal({elev:e,adres:override||routeAddressLabel(e)});},
                  style:{fontSize:10,padding:"5px 9px",borderRadius:6,background:override?"rgba(59,130,246,0.15)":"rgba(245,158,11,0.15)",color:override?"#3b82f6":"#f59e0b",border:"none",cursor:"pointer",fontWeight:700,flexShrink:0}
                },"✏️"),
                React.createElement('a',{
                  href:"https://maps.google.com/?q="+encodeURIComponent(adresText),
                  target:"_blank",rel:"noreferrer",
                  onClick:function(ev){ev.stopPropagation();},
                  style:{fontSize:10,padding:"5px 9px",borderRadius:6,background:"rgba(59,130,246,0.15)",color:"#3b82f6",textDecoration:"none",fontWeight:700,flexShrink:0}
                },"📍")
              );
            })
          ),

          /* Ana butonlar */
          mapsUrl2
            ? React.createElement(React.Fragment,null,
                React.createElement('a',{href:mapsUrl,target:"_blank",rel:"noreferrer",
                  style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"15px 0",
                    background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:12,color:"#fff",
                    textDecoration:"none",fontWeight:800,fontSize:14,letterSpacing:"0.3px",boxShadow:"0 4px 14px #10b98144"}
                }, "🗺️ Google Maps — 1. Bölüm (1-"+MAPS_MAX+")"),
                React.createElement('a',{href:mapsUrl2,target:"_blank",rel:"noreferrer",
                  style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"15px 0",
                    background:"linear-gradient(135deg,#3b82f6,#2563eb)",borderRadius:12,color:"#fff",
                    textDecoration:"none",fontWeight:800,fontSize:14,letterSpacing:"0.3px",boxShadow:"0 4px 14px #3b82f644"}
                }, "🗺️ Google Maps — 2. Bölüm ("+(MAPS_MAX)+"-"+rotaElevs.length+")")
              )
            : React.createElement('a',{href:mapsUrl,target:"_blank",rel:"noreferrer",
                style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"15px 0",
                  background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:12,color:"#fff",
                  textDecoration:"none",fontWeight:800,fontSize:14,letterSpacing:"0.3px",boxShadow:"0 4px 14px #10b98144"}
              }, "🗺️ Google Maps'te Rotayı Başlat"),

          React.createElement('button',{
            onClick:()=>_optionalChain([navigator,'access',_12=>_12.clipboard,'optionalAccess',_13=>_13.writeText,'call',_14=>_14(mapsUrl),'access',_15=>_15.then,'call',_16=>_16(()=>alert("Kopyalandı!")),'access',_17=>_17.catch,'call',_18=>_18(()=>{})]),
            style:{padding:"10px 0",background:"var(--bg-card)",border:"1px solid var(--border)",borderRadius:10,color:"var(--text-muted)",fontWeight:600,fontSize:12,cursor:"pointer"}
          },"📋 Rota Linkini Kopyala")
        )
      : React.createElement('div',{style:{textAlign:"center",padding:"30px 20px",background:"var(--bg-card)",borderRadius:12,border:"1px solid var(--border)"}},
          React.createElement('div',{style:{fontSize:36,marginBottom:8}},"🗺️"),
          React.createElement('div',{style:{color:"var(--text-muted)",fontSize:13,fontWeight:600,marginBottom:4}},"Yukarıdan asansör seçin"),
          React.createElement('div',{style:{color:"var(--text-dim)",fontSize:11}},
            rol==="bakimci"&&bekleyenRotaIds.length>0
              ?"🔧 "+bekleyenRotaIds.length+" bekleyen bakımınız var — yeşil karttan hepsini seçin"
              :"Seçilen asansörler mevcut konumunuzdan sıralanır"
          )
        )

    /* Adres Düzenleme Modalı */
    , rotaAdresModal&&React.createElement(Modal,{onClose:function(){setRotaAdresModal(null);}},
        React.createElement('div',{style:{padding:20,maxWidth:420}},
          React.createElement('div',{style:{fontSize:16,fontWeight:900,marginBottom:12,color:"var(--text)"}},"✏️ Adres Düzenle"),
          React.createElement('div',{style:{fontSize:12,fontWeight:700,color:"var(--text-muted)",marginBottom:4}},rotaAdresModal.elev.ad),
          React.createElement('div',{style:{fontSize:10,color:"var(--text-dim)",marginBottom:8}},"Orijinal: "+routeAddressLabel(rotaAdresModal.elev)),
          React.createElement('a',{
            href:"https://maps.google.com/?q="+encodeURIComponent(routeAddressLabel(rotaAdresModal.elev)),
            target:"_blank",rel:"noreferrer",
            style:{display:"inline-block",fontSize:11,color:"#3b82f6",marginBottom:12,textDecoration:"underline"}
          },"Google Maps'te adresi bul →"),
          React.createElement('div',{style:{marginBottom:12}},
            React.createElement('div',{style:{fontSize:10,fontWeight:700,color:"var(--text-muted)",marginBottom:4}},"Google Maps'e gönderilecek adres"),
            React.createElement('textarea',{
              value:rotaAdresModal.adres,
              onChange:function(ev){setRotaAdresModal(function(p){return Object.assign({},p,{adres:ev.target.value});});},
              placeholder:"Adres yazın...",
              rows:3,
              style:{width:"100%",padding:"8px 10px",borderRadius:8,border:"1px solid var(--border)",background:"var(--bg-elevated)",color:"var(--text)",fontSize:12,boxSizing:"border-box",resize:"vertical",fontFamily:"inherit"}
            })
          ),
          React.createElement('div',{style:{display:"flex",gap:8}},
            React.createElement('button',{
              onClick:function(){
                var adres=rotaAdresModal.adres.trim();
                if(!adres){alert("Adres boş olamaz.");return;}
                var yeni=Object.assign({},rotaAdresOverrides);
                yeni[rotaAdresModal.elev.id]=adres;
                setRotaAdresOverrides(yeni);
                setRotaAdresModal(null);
              },
              style:{flex:1,padding:"10px",background:"#10b981",border:"none",borderRadius:8,color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer"}
            },"Kaydet"),
            rotaAdresOverrides[rotaAdresModal.elev.id]&&React.createElement('button',{
              onClick:function(){
                var yeni=Object.assign({},rotaAdresOverrides);
                delete yeni[rotaAdresModal.elev.id];
                setRotaAdresOverrides(yeni);
                setRotaAdresModal(null);
              },
              style:{padding:"10px 16px",background:"rgba(239,68,68,0.15)",border:"1px solid #ef444444",borderRadius:8,color:"#ef4444",fontWeight:700,fontSize:12,cursor:"pointer"}
            },"Sıfırla"),
            React.createElement('button',{
              onClick:function(){setRotaAdresModal(null);},
              style:{padding:"10px 16px",background:"var(--bg-elevated)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text-muted)",fontWeight:600,fontSize:12,cursor:"pointer"}
            },"İptal")
          )
        )
      )
  )
)

/* FİNANS */
, tab===6&&(
  React.createElement('div', null
    , React.createElement('h2', {style:{fontSize:18,fontWeight:900,marginBottom:14,marginTop:0}}, "💰 Finansal Durum")

    /* Özet İstatistikler */
    , (function(){
        var simdi=new Date();
        /* Bu ayki tahsilat: ayın 1'i 00:00 - ayın son günü 23:59 */
        var ayBaslangic=new Date(simdi.getFullYear(),simdi.getMonth(),1);ayBaslangic.setHours(0,0,0,0);
        var aySon=new Date(simdi.getFullYear(),simdi.getMonth()+1,0);aySon.setHours(23,59,59,999);
        var buAyTahsilat=sonOdemeler.filter(function(o){var od=new Date(o.tarih);return !o.iptal&&od>=ayBaslangic&&od<=aySon;}).reduce(function(s,o){return s+(o.alinanTutar||0);},0);
        /* Bu haftaki tahsilat: Pazartesi 00:00 - Pazar 23:59 */
        var gun=simdi.getDay(); // 0=Pazar
        var pazartesiFark=gun===0?-6:1-gun;
        var haftaBaslangic=new Date(simdi);haftaBaslangic.setDate(simdi.getDate()+pazartesiFark);haftaBaslangic.setHours(0,0,0,0);
        var haftaSon=new Date(haftaBaslangic);haftaSon.setDate(haftaBaslangic.getDate()+6);haftaSon.setHours(23,59,59,999);
        var buHaftaTahsilat=sonOdemeler.filter(function(o){var od=new Date(o.tarih);return !o.iptal&&od>=haftaBaslangic&&od<=haftaSon;}).reduce(function(s,o){return s+(o.alinanTutar||0);},0);
        /* Bugünün tahsilatı: 00:00 - 23:59 */
        var bugunBaslangic=new Date(simdi.getFullYear(),simdi.getMonth(),simdi.getDate(),0,0,0,0);
        var bugunSon=new Date(simdi.getFullYear(),simdi.getMonth(),simdi.getDate(),23,59,59,999);
        var bugunTahsilat=sonOdemeler.filter(function(o){var od=new Date(o.tarih);return !o.iptal&&od>=bugunBaslangic&&od<=bugunSon;}).reduce(function(s,o){return s+(o.alinanTutar||0);},0);
        /* Tarih aralığı yazıları */
        var ayAd=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"][simdi.getMonth()];
        var gunler=["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
        var haftaBasStr=haftaBaslangic.getDate()+"."+(haftaBaslangic.getMonth()+1).toString().padStart(2,"0");
        var haftaSonStr=haftaSon.getDate()+"."+(haftaSon.getMonth()+1).toString().padStart(2,"0");
        return React.createElement('div', {style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}
          , React.createElement(Stat, {icon:"💰", label:"Bu Ayki Tahsilat ("+ayAd+")", value:buAyTahsilat.toLocaleString("tr-TR")+" ₺", color:"#10b981"})
          , React.createElement(Stat, {icon:"📅", label:"Bu Hafta ("+haftaBasStr+" - "+haftaSonStr+")", value:buHaftaTahsilat.toLocaleString("tr-TR")+" ₺", color:"#3b82f6"})
          , React.createElement(Stat, {icon:"☀️", label:"Bugün ("+gunler[simdi.getDay()]+")", value:bugunTahsilat.toLocaleString("tr-TR")+" ₺", color:"#f59e0b"})
          , React.createElement(Stat, {icon:"🗓️", label:"Haftalık Kapama", value:haftalikKapamalar.length+" / 5", color:"#8b5cf6"})
        );
      })()

    /* Sekme Navigasyonu */
    , React.createElement('div', {style:{display:"flex",gap:4,marginBottom:16,background:"#141824",borderRadius:12,padding:4,flexWrap:"wrap"}}
      , [
          {i:0,l:"☀️ Bugün",c:"#f59e0b"},
          {i:1,l:"📅 Bu Hafta",c:"#3b82f6"},
          {i:2,l:"📆 Bu Ay",c:"#10b981"},
          {i:3,l:"🗄️ Kapamalar",c:"#8b5cf6"},
          {i:4,l:"📦 Arşiv",c:"#64748b"}
        ].map(function(t){
          return React.createElement('button', {key:t.i,onClick:function(){setFinansTab(t.i);},
            style:{flex:1,padding:"9px 6px",borderRadius:9,background:finansTab===t.i?t.c+"22":"transparent",
              border:"2px solid "+(finansTab===t.i?t.c+"66":"transparent"),
              color:finansTab===t.i?t.c:"#64748b",fontWeight:finansTab===t.i?800:500,
              fontSize:10,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap",minWidth:60}
          }, t.l);
        })
    )

    /* ── TAB 0: BUGÜN ── */
    , finansTab===0&&(function(){
        var simdi=new Date();
        var bugunBas=new Date(simdi.getFullYear(),simdi.getMonth(),simdi.getDate(),0,0,0,0);
        var bugunSon=new Date(simdi.getFullYear(),simdi.getMonth(),simdi.getDate(),23,59,59,999);
        var gunler=["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
        var bugunOdemeler=sonOdemeler.filter(function(o){var od=new Date(o.tarih);return od>=bugunBas&&od<=bugunSon;}).slice().reverse();
        var bugunToplam=bugunOdemeler.filter(function(o){return !o.iptal;}).reduce(function(s,o){return s+(o.alinanTutar||0);},0);
        var bugunAdet=bugunOdemeler.filter(function(o){return !o.iptal;}).length;
        return React.createElement('div', null
          /* Bugün özet */
          , React.createElement('div', {style:{background:"linear-gradient(135deg,#0a2a1a,#141824)",borderRadius:16,padding:"16px 18px",marginBottom:14,border:"1px solid #f59e0b44"}}
            , React.createElement('div', {style:{fontSize:12,color:"#f59e0b",fontWeight:700,marginBottom:6}}, "☀️ "+gunler[simdi.getDay()]+", "+simdi.getDate()+"."+(simdi.getMonth()+1)+"."+simdi.getFullYear())
            , React.createElement('div', {style:{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}
              , React.createElement('div', null
                , React.createElement('div', {style:{fontSize:28,fontWeight:900,color:"#f59e0b",letterSpacing:-1}}, bugunToplam.toLocaleString("tr-TR")+" ₺")
                , React.createElement('div', {style:{fontSize:11,color:"#64748b",marginTop:2}}, bugunAdet+" ödeme tahsil edildi")
              )
              , React.createElement('button', {
                  onClick:function(){setManuelOdemeAcik(true);setForm(function(p){return Object.assign({},p,{odIlce:"",odBinaId:"",odTutar:"",odNot:""});});},
                  style:{marginLeft:"auto",padding:"10px 16px",background:"linear-gradient(135deg,#10b981,#059669)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer"}
                }, "➕ Ödeme Gir")
            )
          )
          /* Bugün listesi */
          , bugunOdemeler.length===0
            ? React.createElement('div', {style:{background:"#1a1f2e",borderRadius:12,border:"1px solid #2a3050",padding:"32px",textAlign:"center",color:"#475569",fontSize:13}}, "☀️ Bugün henüz ödeme yok")
            : React.createElement('div', {style:{display:"flex",flexDirection:"column",gap:6}}
                , bugunOdemeler.map(function(o){
                    var iptal=!!o.iptal;
                    var isBakimci=o.not==="Bakım sonrası tahsilat";
                    var c=getIlceRenk(o.ilce||"");
                    return React.createElement('div', {key:o.id, style:{
                      background:iptal?"#1a0a0a":"#141824",borderRadius:12,
                      border:"1px solid "+(iptal?"#ef444433":"#2a3050"),
                      padding:"11px 14px",opacity:iptal?0.6:1
                    }}
                      , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}
                        , React.createElement('div', null
                          , React.createElement('div', {style:{display:"flex",alignItems:"center",gap:6,marginBottom:3}}
                            , React.createElement('span', {style:{fontSize:10,padding:"2px 7px",borderRadius:5,background:isBakimci?"#1e3a5f":"#1e3a2e",color:isBakimci?"#3b82f6":"#10b981",fontWeight:700}}, isBakimci?"🔧 Bakımcı":"✏️ Manuel")
                            , React.createElement('span', {style:{fontSize:10,padding:"2px 6px",borderRadius:5,background:c+"22",color:c,fontWeight:700}}, o.ilce||"-")
                            , iptal&&React.createElement('span', {style:{fontSize:10,padding:"2px 7px",borderRadius:5,background:"#3a1e1e",color:"#ef4444",fontWeight:700}}, "❌ İPTAL")
                          )
                          , React.createElement('div', {style:{fontWeight:700,fontSize:13,color:iptal?"#64748b":"#e0e6f0",textDecoration:iptal?"line-through":"none"}}, o.binaAd)
                          , React.createElement('div', {style:{fontSize:10,color:"#64748b",marginTop:2}}, "🕐 "+o.saat+(o.yonetici?" · 👤 "+o.yonetici:"")+(o.not&&!isBakimci?" · "+o.not:""))
                        )
                        , React.createElement('div', {style:{textAlign:"right",flexShrink:0}}
                          , React.createElement('div', {style:{fontSize:17,fontWeight:900,color:iptal?"#64748b":"#10b981",textDecoration:iptal?"line-through":"none"}}, (o.alinanTutar||0).toLocaleString("tr-TR")+" ₺")
                          , !iptal&&React.createElement('button', {
                              onClick:function(){
                                if(!window.confirm("Bu ödeme geri alınsın mı?\n"+o.binaAd+" · "+(o.alinanTutar||0).toLocaleString("tr-TR")+" ₺")) return;
                                setSonOdemeler(function(p){return p.map(function(x){return x.id===o.id?Object.assign({},x,{iptal:true,iptalZamani:new Date().toLocaleString("tr-TR")}):x;});});
                                setMaints(function(p){return p.map(function(m){if(m.asansorId===o.aid&&m.odendi&&(m.alinanTutar||m.tutar||0)===(o.alinanTutar||0)){return Object.assign({},m,{odendi:false,alinanTutar:0});}return m;});});
                              },
                              style:{marginTop:4,padding:"3px 8px",background:"rgba(239,68,68,0.12)",border:"1px solid #ef444444",borderRadius:5,color:"#ef4444",fontSize:10,fontWeight:700,cursor:"pointer"}
                            }, "↩ Geri Al")
                        )
                      )
                    );
                  })
              )
        );
      })()

    /* ── TAB 1: BU HAFTA ── */
    , finansTab===1&&(function(){
        var simdi=new Date();
        var gun=simdi.getDay();
        var pazartesiFark=gun===0?-6:1-gun;
        var haftaBas=new Date(simdi);haftaBas.setDate(simdi.getDate()+pazartesiFark);haftaBas.setHours(0,0,0,0);
        var haftaSon=new Date(haftaBas);haftaSon.setDate(haftaBas.getDate()+6);haftaSon.setHours(23,59,59,999);
        var haftaOdemeler=sonOdemeler.filter(function(o){var od=new Date(o.tarih);return od>=haftaBas&&od<=haftaSon;});
        var haftaToplam=haftaOdemeler.filter(function(o){return !o.iptal;}).reduce(function(s,o){return s+(o.alinanTutar||0);},0);
        var haftaAdet=haftaOdemeler.filter(function(o){return !o.iptal;}).length;
        var gunAdlari=["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
        // Günlere göre grupla
        var gunlerMap={};
        haftaOdemeler.forEach(function(o){
          var key=o.tarih;
          if(!gunlerMap[key]) gunlerMap[key]=[];
          gunlerMap[key].push(o);
        });
        var gunSiralari=Object.keys(gunlerMap).sort().reverse();
        return React.createElement('div', null
          /* Bu hafta özet */
          , React.createElement('div', {style:{background:"linear-gradient(135deg,#0a1a3a,#141824)",borderRadius:16,padding:"16px 18px",marginBottom:14,border:"1px solid #3b82f644"}}
            , React.createElement('div', {style:{fontSize:12,color:"#3b82f6",fontWeight:700,marginBottom:6}}, "📅 "+haftaBas.getDate()+"."+(haftaBas.getMonth()+1)+" — "+haftaSon.getDate()+"."+(haftaSon.getMonth()+1)+" arası")
            , React.createElement('div', {style:{display:"flex",gap:16,alignItems:"center",flexWrap:"wrap"}}
              , React.createElement('div', null
                , React.createElement('div', {style:{fontSize:28,fontWeight:900,color:"#3b82f6",letterSpacing:-1}}, haftaToplam.toLocaleString("tr-TR")+" ₺")
                , React.createElement('div', {style:{fontSize:11,color:"#64748b",marginTop:2}}, haftaAdet+" ödeme · "+Object.keys(gunlerMap).length+" gün")
              )
              , React.createElement('button', {
                  onClick:function(){setManuelOdemeAcik(true);setForm(function(p){return Object.assign({},p,{odIlce:"",odBinaId:"",odTutar:"",odNot:""});});},
                  style:{marginLeft:"auto",padding:"10px 16px",background:"linear-gradient(135deg,#10b981,#059669)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer"}
                }, "➕ Ödeme Gir")
            )
          )
          /* Gün gün döküm */
          , gunSiralari.length===0
            ? React.createElement('div', {style:{background:"#1a1f2e",borderRadius:12,border:"1px solid #2a3050",padding:"32px",textAlign:"center",color:"#475569",fontSize:13}}, "📅 Bu hafta henüz ödeme yok")
            : React.createElement('div', {style:{display:"flex",flexDirection:"column",gap:10}}
                , gunSiralari.map(function(tarih){
                    var gunOdemeler=gunlerMap[tarih].slice().reverse();
                    var gunToplam=gunOdemeler.filter(function(o){return !o.iptal;}).reduce(function(s,o){return s+(o.alinanTutar||0);},0);
                    var tarihObj=new Date(tarih);
                    var gunAdi=gunAdlari[tarihObj.getDay()];
                    var bugun=tarih===simdi.toISOString().split("T")[0];
                    return React.createElement('div', {key:tarih}
                      /* Gün başlığı */
                      , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:bugun?"#1e2a10":"#0d1321",borderRadius:8,marginBottom:5,border:"1px solid "+(bugun?"#f59e0b44":"#1e2640")}}
                        , React.createElement('span', {style:{fontSize:12,fontWeight:700,color:bugun?"#f59e0b":"#94a3b8"}}, (bugun?"☀️ Bugün — ":"")+gunAdi+", "+tarih.split("-").reverse().join("."))
                        , React.createElement('span', {style:{fontSize:12,fontWeight:900,color:bugun?"#f59e0b":"#3b82f6"}}, gunToplam.toLocaleString("tr-TR")+" ₺")
                      )
                      /* O günün ödemeleri */
                      , React.createElement('div', {style:{display:"flex",flexDirection:"column",gap:4,paddingLeft:8}}
                          , gunOdemeler.map(function(o){
                              var iptal=!!o.iptal;
                              var isBakimci=o.not==="Bakım sonrası tahsilat";
                              var c=getIlceRenk(o.ilce||"");
                              return React.createElement('div', {key:o.id, style:{background:iptal?"#1a0a0a":"#141824",borderRadius:9,border:"1px solid "+(iptal?"#ef444433":"#2a3050"),padding:"8px 12px",opacity:iptal?0.6:1,display:"flex",justifyContent:"space-between",alignItems:"center"}}
                                , React.createElement('div', null
                                  , React.createElement('div', {style:{display:"flex",alignItems:"center",gap:5,marginBottom:2}}
                                    , React.createElement('span', {style:{fontSize:9,padding:"1px 6px",borderRadius:4,background:isBakimci?"#1e3a5f":"#1e3a2e",color:isBakimci?"#3b82f6":"#10b981",fontWeight:700}}, isBakimci?"🔧":"✏️")
                                    , React.createElement('span', {style:{fontSize:11,fontWeight:700,color:iptal?"#64748b":"#e0e6f0",textDecoration:iptal?"line-through":"none"}}, o.binaAd)
                                    , React.createElement('span', {style:{fontSize:9,padding:"1px 5px",borderRadius:4,background:c+"22",color:c,fontWeight:600}}, o.ilce||"")
                                    , iptal&&React.createElement('span', {style:{fontSize:9,padding:"1px 6px",borderRadius:4,background:"#3a1e1e",color:"#ef4444",fontWeight:700}}, "İPTAL")
                                  )
                                  , React.createElement('div', {style:{fontSize:10,color:"#64748b"}}, "🕐 "+o.saat+(o.yonetici?" · "+o.yonetici:""))
                                )
                                , React.createElement('div', {style:{textAlign:"right"}}
                                  , React.createElement('div', {style:{fontSize:14,fontWeight:900,color:iptal?"#475569":"#10b981",textDecoration:iptal?"line-through":"none"}}, (o.alinanTutar||0).toLocaleString("tr-TR")+" ₺")
                                  , !iptal&&React.createElement('button', {
                                      onClick:function(){
                                        if(!window.confirm("Geri al: "+o.binaAd+" · "+(o.alinanTutar||0).toLocaleString("tr-TR")+" ₺?")) return;
                                        setSonOdemeler(function(p){return p.map(function(x){return x.id===o.id?Object.assign({},x,{iptal:true,iptalZamani:new Date().toLocaleString("tr-TR")}):x;});});
                                        setMaints(function(p){return p.map(function(m){if(m.asansorId===o.aid&&m.odendi&&(m.alinanTutar||m.tutar||0)===(o.alinanTutar||0)){return Object.assign({},m,{odendi:false,alinanTutar:0});}return m;});});
                                      },
                                      style:{fontSize:9,padding:"2px 6px",background:"#3a1e1e",border:"1px solid #ef444433",borderRadius:4,color:"#ef4444",fontWeight:700,cursor:"pointer",marginTop:2}
                                    }, "↩")
                                )
                              );
                            })
                        )
                    );
                  })
              )
        );
      })()

    /* ── TAB 2: BU AY DEFTERİ ── */
    , finansTab===2&&(function(){
        var simdi=new Date();
        var ayBas=new Date(simdi.getFullYear(),simdi.getMonth(),1);ayBas.setHours(0,0,0,0);
        var aySon=new Date(simdi.getFullYear(),simdi.getMonth()+1,0);aySon.setHours(23,59,59,999);
        var ayAd=MONTHS[simdi.getMonth()];
        var ayOdemeler=sonOdemeler.filter(function(o){var od=new Date(o.tarih);return od>=ayBas&&od<=aySon;}).slice().reverse();
        var ayToplam=ayOdemeler.filter(function(o){return !o.iptal;}).reduce(function(s,o){return s+(o.alinanTutar||0);},0);
        var ayHedef=elevs.reduce(function(s,e){return s+(e.aylikUcret||0);},0);
        var ayIptalToplam=ayOdemeler.filter(function(o){return o.iptal;}).reduce(function(s,o){return s+(o.alinanTutar||0);},0);
        var pct=ayHedef>0?Math.min(Math.round(ayToplam/ayHedef*100),100):0;
        return React.createElement('div', null
          /* Bu ay özet */
          , React.createElement('div', {style:{background:"linear-gradient(135deg,#0a2a1a,#141824)",borderRadius:16,padding:"16px 18px",marginBottom:14,border:"1px solid #10b98144"}}
            , React.createElement('div', {style:{fontSize:12,color:"#10b981",fontWeight:700,marginBottom:10}}, "📆 "+ayAd+" "+simdi.getFullYear()+" — Aylık Defter")
            , React.createElement('div', {style:{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:12}}
              , React.createElement('div', {style:{textAlign:"center"}}
                , React.createElement('div', {style:{fontSize:18,fontWeight:900,color:"#10b981"}}, ayToplam.toLocaleString("tr-TR")+"₺")
                , React.createElement('div', {style:{fontSize:10,color:"#64748b",marginTop:2}}, "Tahsil")
              )
              , React.createElement('div', {style:{textAlign:"center"}}
                , React.createElement('div', {style:{fontSize:18,fontWeight:900,color:"#3b82f6"}}, ayHedef.toLocaleString("tr-TR")+"₺")
                , React.createElement('div', {style:{fontSize:10,color:"#64748b",marginTop:2}}, "Hedef")
              )
              , React.createElement('div', {style:{textAlign:"center"}}
                , React.createElement('div', {style:{fontSize:18,fontWeight:900,color:(ayHedef-ayToplam)>0?"#f97316":"#10b981"}}, (ayHedef-ayToplam).toLocaleString("tr-TR")+"₺")
                , React.createElement('div', {style:{fontSize:10,color:"#64748b",marginTop:2}}, "Kalan")
              )
            )
            , React.createElement('div', {style:{height:8,background:"#0d1321",borderRadius:10,overflow:"hidden",marginBottom:6}}
              , React.createElement('div', {style:{height:"100%",width:pct+"%",background:"linear-gradient(90deg,#10b981,#3b82f6)",borderRadius:10,transition:"width 0.8s"}})
            )
            , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",fontSize:10,color:"#64748b"}}
              , React.createElement('span', null, "Tahsilat oranı: %"+pct)
              , ayIptalToplam>0&&React.createElement('span', {style:{color:"#ef4444"}}, "❌ İptal: "+ayIptalToplam.toLocaleString("tr-TR")+"₺")
            )
          )
          /* Ay ödeme listesi */
          , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}
            , React.createElement('div', {style:{fontWeight:700,fontSize:13,color:"#e0e6f0"}}, ayOdemeler.length+" kayıt")
            , React.createElement('div', {style:{display:"flex",gap:6}}
              , React.createElement('button', {
                  onClick:function(){setManuelOdemeAcik(true);setForm(function(p){return Object.assign({},p,{odIlce:"",odBinaId:"",odTutar:"",odNot:""});});},
                  style:{padding:"7px 12px",background:"linear-gradient(135deg,#10b981,#059669)",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer"}
                }, "➕ Ödeme Gir")
              , ayOdemeler.length>0&&React.createElement('button', {
                  onClick:function(){
                    if(!window.confirm("Bu ay kayıtları arşive alınsın mı?")) return;
                    var snap={id:Date.now(),tarih:new Date().toLocaleString("tr-TR"),odemeler:sonOdemeler.slice()};
                    setHesapKayitlari(function(p){var y=[snap,...p];if(y.length>10)y=y.slice(0,10);return y;});
                    setSonOdemeler([]);
                    alert("Arşive alındı!");
                  },
                  style:{padding:"7px 12px",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer"}
                }, "💾 Arşive Al")
            )
          )
          , ayOdemeler.length===0
            ? React.createElement('div', {style:{background:"#1a1f2e",borderRadius:12,border:"1px solid #2a3050",padding:"32px",textAlign:"center",color:"#475569",fontSize:13}}, "📆 Bu ay henüz ödeme yok")
            : React.createElement('div', {style:{background:"#1a1f2e",borderRadius:12,border:"1px solid #10b98133",overflow:"hidden"}}
                , React.createElement('div', {style:{overflowX:"auto"}}
                  , React.createElement('table', {style:{width:"100%",borderCollapse:"collapse",fontSize:12}}
                    , React.createElement('thead', null
                      , React.createElement('tr', null
                        , ["","Tarih","Saat","Bina","İlçe","Tutar","Not",""].map(function(h,i){
                            return React.createElement('th', {key:i, style:{padding:"9px 10px",textAlign:"left",color:"#64748b",fontWeight:700,borderBottom:"1px solid #2a3050",whiteSpace:"nowrap"}}, h);
                          })
                      )
                    )
                    , React.createElement('tbody', null
                      , ayOdemeler.map(function(o){
                          var iptal=!!o.iptal;
                          var isBakimci=o.not==="Bakım sonrası tahsilat";
                          var c=getIlceRenk(o.ilce||"");
                          var ts=iptal?{textDecoration:"line-through",opacity:0.5}:{};
                          return React.createElement('tr', {key:o.id, style:{borderBottom:"1px solid #1e2640",background:iptal?"#1a0808":"transparent"}}
                            , React.createElement('td', {style:{padding:"8px 10px"}}
                              , React.createElement('span', {style:{fontSize:9,padding:"2px 6px",borderRadius:4,background:isBakimci?"#1e3a5f":"#1e3a2e",color:isBakimci?"#3b82f6":"#10b981",fontWeight:700}}, isBakimci?"🔧":"✏️")
                            )
                            , React.createElement('td', {style:{padding:"8px 10px",color:"#94a3b8",fontSize:11,...ts}}, o.tarih)
                            , React.createElement('td', {style:{padding:"8px 10px",color:iptal?"#64748b":"#f59e0b",fontWeight:700,...ts}}, o.saat)
                            , React.createElement('td', {style:{padding:"8px 10px",fontWeight:700,maxWidth:140,...ts}}, React.createElement('div',{style:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},o.binaAd))
                            , React.createElement('td', {style:{padding:"8px 10px",...ts}}, React.createElement('span',{style:{fontSize:10,padding:"2px 5px",borderRadius:4,background:c+"22",color:c,fontWeight:700}},o.ilce||"-"))
                            , React.createElement('td', {style:{padding:"8px 10px",fontWeight:900,color:iptal?"#475569":"#10b981",whiteSpace:"nowrap",...ts}}, (o.alinanTutar||0).toLocaleString("tr-TR")+" ₺")
                            , React.createElement('td', {style:{padding:"8px 10px",color:"#64748b",fontSize:11,...ts}}, iptal?"❌ İPTAL":(isBakimci?"Bakım":"Manuel")+(o.not&&!isBakimci?" · "+o.not:""))
                            , React.createElement('td', {style:{padding:"6px 8px"}}
                              , iptal
                                ? null
                                : React.createElement('button',{
                                    onClick:function(){
                                      if(!window.confirm("Geri al: "+o.binaAd+" · "+(o.alinanTutar||0).toLocaleString("tr-TR")+" ₺?")) return;
                                      setSonOdemeler(function(p){return p.map(function(x){return x.id===o.id?Object.assign({},x,{iptal:true,iptalZamani:new Date().toLocaleString("tr-TR")}):x;});});
                                      setMaints(function(p){return p.map(function(m){if(m.asansorId===o.aid&&m.odendi&&(m.alinanTutar||m.tutar||0)===(o.alinanTutar||0)){return Object.assign({},m,{odendi:false,alinanTutar:0});}return m;});});
                                    },
                                    style:{padding:"3px 8px",background:"#3a1e1e",border:"1px solid #ef444433",borderRadius:5,color:"#ef4444",fontSize:10,fontWeight:700,cursor:"pointer"}
                                  },"↩")
                            )
                          );
                        })
                    )
                  )
                )
              )
        );
      })()

    /* ── TAB 3: KAPAMALAR ── */
    , finansTab===3&&React.createElement('div', null
      , React.createElement('div', {style:{fontWeight:800,fontSize:14,marginBottom:14,color:"#8b5cf6"}}, "🗄️ Kapamalar")
      /* Haftalık */
      , React.createElement('div', {style:{marginBottom:20}}
        , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}
          , React.createElement('div', null
            , React.createElement('div', {style:{fontWeight:700,fontSize:13}}, "📅 Haftalık Kapamalar")
            , React.createElement('div', {style:{fontSize:10,color:"#64748b",marginTop:2}}, "Her Cumartesi 16:00 · Son 5 hafta")
          )
          , (function(){var s=new Date();var g=s.getDay();var sc=g===6?0:(6-g);return React.createElement('div',{style:{fontSize:10,color:"#64748b",background:"#141824",padding:"4px 9px",borderRadius:6,border:"1px solid #2a3050"}},g===6&&s.getHours()>=16?"🟢 Bugün kapandı":sc===0?"⏰ Bugün kapama günü":"⏳ "+sc+" gün sonra Cmt");})()
        )
        , haftalikKapamalar.length===0
          ? React.createElement('div',{style:{background:"#1a1f2e",borderRadius:10,border:"1px solid #2a3050",padding:"20px",textAlign:"center",color:"#475569",fontSize:12}},"Henüz haftalık kapama yok")
          : React.createElement('div',{style:{display:"flex",flexDirection:"column",gap:6}}
              , haftalikKapamalar.map(function(k){
                  var acik=aktifHaftalik===k.id;
                  return React.createElement('div',{key:k.id,style:{background:"#141824",borderRadius:10,border:"1px solid "+(acik?"#f59e0b66":"#2a3050"),overflow:"hidden"}}
                    , React.createElement('div',{onClick:function(){setAktifHaftalik(acik?null:k.id);},style:{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}
                      , React.createElement('div',null
                        , React.createElement('div',{style:{fontWeight:700,fontSize:12,color:acik?"#f59e0b":"#e0e6f0"}},k.baslarken+" — "+k.biterken)
                        , React.createElement('div',{style:{fontSize:10,color:"#64748b",marginTop:1}},k.odemeAdedi+" ödeme · "+(k.toplam||0).toLocaleString("tr-TR")+" ₺")
                      )
                      , React.createElement('div',{style:{display:"flex",gap:6,alignItems:"center"}}
                        , acik&&React.createElement('button',{onClick:function(e){e.stopPropagation();exportExcel(k.odemeler,"haftalik_"+k.baslarken.replace(/\./g,"-"));},style:{fontSize:10,padding:"3px 8px",borderRadius:5,background:"#1e3a5f",color:"#3b82f6",border:"none",cursor:"pointer",fontWeight:600}},"📥 Excel")
                        , React.createElement('span',{style:{fontSize:12,color:acik?"#f59e0b":"#64748b"}},acik?"▲":"▼")
                      )
                    )
                    , acik&&React.createElement('div',{style:{borderTop:"1px solid #2a3050",overflowX:"auto"}}
                        , React.createElement('table',{style:{width:"100%",borderCollapse:"collapse",fontSize:11}}
                          , React.createElement('thead',null,React.createElement('tr',null,["Tarih","Saat","Bina","İlçe","Tutar","Not"].map(function(h){return React.createElement('th',{key:h,style:{padding:"7px 10px",textAlign:"left",color:"#64748b",fontWeight:700,borderBottom:"1px solid #2a3050",whiteSpace:"nowrap"}},h);})))
                          , React.createElement('tbody',null,(k.odemeler||[]).slice().reverse().map(function(o){var c=getIlceRenk(o.ilce||"");return React.createElement('tr',{key:o.id,style:{borderBottom:"1px solid #1e2640"}}
                            ,React.createElement('td',{style:{padding:"6px 10px",color:"#94a3b8"}},o.tarih)
                            ,React.createElement('td',{style:{padding:"6px 10px",color:"#f59e0b",fontWeight:700}},o.saat)
                            ,React.createElement('td',{style:{padding:"6px 10px",fontWeight:600,maxWidth:130}},React.createElement('div',{style:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},o.binaAd))
                            ,React.createElement('td',{style:{padding:"6px 10px"}},React.createElement('span',{style:{fontSize:9,padding:"1px 5px",borderRadius:3,background:c+"22",color:c,fontWeight:700}},o.ilce||"-"))
                            ,React.createElement('td',{style:{padding:"6px 10px",fontWeight:800,color:"#f59e0b",whiteSpace:"nowrap"}},(o.alinanTutar||0).toLocaleString("tr-TR")+" ₺")
                            ,React.createElement('td',{style:{padding:"6px 10px",color:"#64748b"}},o.not||"-")
                          );}))
                        )
                      )
                  );
                })
            )
      )
      /* Aylık */
      , React.createElement('div', null
        , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}
          , React.createElement('div', null
            , React.createElement('div', {style:{fontWeight:700,fontSize:13}}, "📆 Aylık Kapamalar")
            , React.createElement('div', {style:{fontSize:10,color:"#64748b",marginTop:2}}, "Ayın son günü 18:00 · Son 2 ay")
          )
          , (function(){var s=new Date();var son=new Date(s.getFullYear(),s.getMonth()+1,0).getDate();var kalan=son-s.getDate();return React.createElement('div',{style:{fontSize:10,color:"#64748b",background:"#141824",padding:"4px 9px",borderRadius:6,border:"1px solid #2a3050"}},s.getDate()===son&&s.getHours()>=18?"🟢 Bugün kapandı":kalan===0?"⏰ Bugün kapama günü":"⏳ "+kalan+" gün sonra");})()
        )
        , aylikKapamalar.length===0
          ? React.createElement('div',{style:{background:"#1a1f2e",borderRadius:10,border:"1px solid #2a3050",padding:"20px",textAlign:"center",color:"#475569",fontSize:12}},"Henüz aylık kapama yok")
          : React.createElement('div',{style:{display:"flex",flexDirection:"column",gap:6}}
              , aylikKapamalar.map(function(k){
                  var acik=aktifAylik===k.id;
                  var odemeler=k.odemeler||[];
                  return React.createElement('div',{key:k.id,style:{background:"#141824",borderRadius:10,border:"1px solid "+(acik?"#8b5cf666":"#2a3050"),overflow:"hidden"}}
                    , React.createElement('div',{onClick:function(){setAktifAylik(acik?null:k.id);},style:{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}
                      , React.createElement('div',null
                        , React.createElement('div',{style:{fontWeight:700,fontSize:12,color:acik?"#8b5cf6":"#e0e6f0"}},k.ay+" "+k.yil)
                        , React.createElement('div',{style:{fontSize:10,color:"#64748b",marginTop:1}},k.odemeAdedi+" ödeme · "+(k.toplam||0).toLocaleString("tr-TR")+" ₺")
                      )
                      , React.createElement('div',{style:{display:"flex",gap:6,alignItems:"center"}}
                        , acik&&React.createElement('button',{onClick:function(e){e.stopPropagation();exportExcel(odemeler,"aylik_"+k.ay+"_"+k.yil);},style:{fontSize:10,padding:"3px 8px",borderRadius:5,background:"#2a1a4a",color:"#8b5cf6",border:"none",cursor:"pointer",fontWeight:600}},"📥 Excel")
                        , React.createElement('span',{style:{fontSize:12,color:acik?"#8b5cf6":"#64748b"}},acik?"▲":"▼")
                      )
                    )
                    , acik&&React.createElement('div',{style:{borderTop:"1px solid #2a3050",overflowX:"auto"}}
                        , React.createElement('table',{style:{width:"100%",borderCollapse:"collapse",fontSize:11}}
                          , React.createElement('thead',null,React.createElement('tr',null,["Tarih","Saat","Bina","İlçe","Tutar","Not"].map(function(h){return React.createElement('th',{key:h,style:{padding:"7px 10px",textAlign:"left",color:"#64748b",fontWeight:700,borderBottom:"1px solid #2a3050",whiteSpace:"nowrap"}},h);})))
                          , React.createElement('tbody',null,odemeler.slice().reverse().map(function(o){var c=getIlceRenk(o.ilce||"");return React.createElement('tr',{key:o.id,style:{borderBottom:"1px solid #1e2640"}}
                            ,React.createElement('td',{style:{padding:"6px 10px",color:"#94a3b8"}},o.tarih)
                            ,React.createElement('td',{style:{padding:"6px 10px",color:"#8b5cf6",fontWeight:700}},o.saat)
                            ,React.createElement('td',{style:{padding:"6px 10px",fontWeight:600,maxWidth:130}},React.createElement('div',{style:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},o.binaAd))
                            ,React.createElement('td',{style:{padding:"6px 10px"}},React.createElement('span',{style:{fontSize:9,padding:"1px 5px",borderRadius:3,background:c+"22",color:c,fontWeight:700}},o.ilce||"-"))
                            ,React.createElement('td',{style:{padding:"6px 10px",fontWeight:800,color:"#8b5cf6",whiteSpace:"nowrap"}},(o.alinanTutar||0).toLocaleString("tr-TR")+" ₺")
                            ,React.createElement('td',{style:{padding:"6px 10px",color:"#64748b"}},o.not||"-")
                          );}))
                        )
                      )
                  );
                })
            )
      )
    )

    /* ── TAB 4: ARŞİV ── */
    , finansTab===4&&React.createElement('div', null
      , React.createElement('div', {style:{fontWeight:800,fontSize:14,marginBottom:14,color:"#64748b"}}, "📦 Arşivlenmiş Kayıtlar")
      , hesapKayitlari.length===0
        ? React.createElement('div',{style:{background:"#1a1f2e",borderRadius:12,border:"1px solid #2a3050",padding:"40px",textAlign:"center",color:"#475569",fontSize:13}}
            , React.createElement('div',{style:{fontSize:32,marginBottom:8}},"📦")
            , React.createElement('div',null,"Henüz arşiv kaydı yok")
            , React.createElement('div',{style:{fontSize:11,marginTop:4}},"Bu Ay sekmesinden 'Arşive Al' butonuyla kaydedebilirsiniz")
          )
        : React.createElement('div',{style:{display:"flex",flexDirection:"column",gap:6}}
            , hesapKayitlari.map(function(k,i){
                var acik=aktifHesap===k.id;
                var kayitOdemeler=(k.odemeler||k.satirlar||[]);
                var toplam=kayitOdemeler.reduce(function(s,o){return s+(o.alinanTutar||0);},0);
                return React.createElement('div',{key:k.id,style:{background:"#141824",borderRadius:10,border:"1px solid "+(acik?"#64748b66":"#2a3050"),overflow:"hidden"}}
                  , React.createElement('div',{onClick:function(){setAktifHesap(acik?null:k.id);},style:{padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}
                    , React.createElement('div',null
                      , React.createElement('div',{style:{fontWeight:700,fontSize:12,color:acik?"#94a3b8":"#e0e6f0"}},(i+1)+". Kayıt — "+k.tarih.split(" ")[0])
                      , React.createElement('div',{style:{fontSize:10,color:"#64748b",marginTop:1}},kayitOdemeler.length+" ödeme · "+toplam.toLocaleString("tr-TR")+" ₺")
                    )
                    , React.createElement('div',{style:{display:"flex",gap:6,alignItems:"center"}}
                      , acik&&React.createElement('button',{onClick:function(e){e.stopPropagation();exportExcel(kayitOdemeler,"arsiv_"+k.tarih.replace(/[/:, ]/g,"-"));},style:{fontSize:10,padding:"3px 8px",borderRadius:5,background:"#1a2030",color:"#94a3b8",border:"1px solid #2a3050",cursor:"pointer",fontWeight:600}},"📥 Excel")
                      , acik&&React.createElement('button',{onClick:function(e){e.stopPropagation();var s=window.prompt("Silmek için şifre:");if(!s)return;if(s!=="asis94"){alert("Hatalı şifre!");return;}if(!window.confirm("Bu kayıt silinsin mi?"))return;setHesapKayitlari(function(p){return p.filter(function(x){return x.id!==k.id;});});setAktifHesap(null);},style:{fontSize:10,padding:"3px 8px",borderRadius:5,background:"#3a1e1e",color:"#ef4444",border:"none",cursor:"pointer",fontWeight:600}},"🗑")
                      , React.createElement('span',{style:{fontSize:12,color:acik?"#94a3b8":"#64748b"}},acik?"▲":"▼")
                    )
                  )
                  , acik&&kayitOdemeler.length>0&&React.createElement('div',{style:{borderTop:"1px solid #2a3050",overflowX:"auto"}}
                      , React.createElement('table',{style:{width:"100%",borderCollapse:"collapse",fontSize:11}}
                        , React.createElement('thead',null,React.createElement('tr',null,["","Tarih","Saat","Bina","İlçe","Tutar","Not"].map(function(h,i){return React.createElement('th',{key:i,style:{padding:"7px 10px",textAlign:"left",color:"#64748b",fontWeight:700,borderBottom:"1px solid #2a3050",whiteSpace:"nowrap"}},h);})))
                        , React.createElement('tbody',null,kayitOdemeler.slice().reverse().map(function(o){var c=getIlceRenk(o.ilce||"");var isBakimci=o.not==="Bakım sonrası tahsilat";return React.createElement('tr',{key:o.id,style:{borderBottom:"1px solid #1e2640"}}
                          ,React.createElement('td',{style:{padding:"6px 10px"}},React.createElement('span',{style:{fontSize:9,padding:"1px 5px",borderRadius:3,background:isBakimci?"#1e3a5f":"#1e3a2e",color:isBakimci?"#3b82f6":"#10b981",fontWeight:700}},isBakimci?"🔧":"✏️"))
                          ,React.createElement('td',{style:{padding:"6px 10px",color:"#94a3b8"}},o.tarih)
                          ,React.createElement('td',{style:{padding:"6px 10px",color:"#64748b",fontWeight:600}},o.saat)
                          ,React.createElement('td',{style:{padding:"6px 10px",fontWeight:600,maxWidth:130}},React.createElement('div',{style:{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}},o.binaAd))
                          ,React.createElement('td',{style:{padding:"6px 10px"}},React.createElement('span',{style:{fontSize:9,padding:"1px 5px",borderRadius:3,background:c+"22",color:c,fontWeight:700}},o.ilce||"-"))
                          ,React.createElement('td',{style:{padding:"6px 10px",fontWeight:800,color:"#94a3b8",whiteSpace:"nowrap"}},(o.alinanTutar||0).toLocaleString("tr-TR")+" ₺")
                          ,React.createElement('td',{style:{padding:"6px 10px",color:"#64748b"}},o.not||"-")
                        );}))
                      )
                    )
                );
              })
          )
    )
  )
)
/* GİDERLER */
, tab===7&&(
  React.createElement('div', null
    , React.createElement('h2', {style:{fontSize:18,fontWeight:900,marginBottom:14,marginTop:0}}, "💸 Gider Takibi")

    /* Özet kartlar */
    , (function(){
        var bugun=new Date().toLocaleDateString("tr-TR");
        var bugunToplam=giderler.filter(function(g){return g.tarih===bugun;}).reduce(function(s,g){return s+(g.tutar||0);},0);
        var haftaToplam=giderler.reduce(function(s,g){return s+(g.tutar||0);},0);
        var buHaftaStart=new Date();buHaftaStart.setDate(buHaftaStart.getDate()-buHaftaStart.getDay());
        return React.createElement('div', {style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}
          , React.createElement(Stat, {icon:"📅",label:"Bugünkü Gider",value:bugunToplam.toLocaleString("tr-TR")+" ₺",color:"#ef4444"})
          , React.createElement(Stat, {icon:"📆",label:"Bu Hafta Gider",value:haftaToplam.toLocaleString("tr-TR")+" ₺",color:"#f59e0b"})
          , React.createElement(Stat, {icon:"📝",label:"Kayıt Sayısı",value:giderler.length,color:"#3b82f6"})
          , React.createElement(Stat, {icon:"📦",label:"Hafta Arşivi",value:giderHaftaArsiv.length+" / 5",color:"#8b5cf6"})
        );
      })()

    /* Bilgi ve haftalık sıfırlama bildirimi */
    , (function(){
        var simdi=new Date();
        var gun=simdi.getDay();
        var saat=simdi.getHours();
        var sonrakiCmt=gun===6?7:(6-gun);
        return React.createElement('div', {style:{background:"#141824",borderRadius:10,border:"1px solid #2a3050",padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}
          , React.createElement('div', {style:{fontSize:18}}, "ℹ️")
          , React.createElement('div', {style:{flex:1}}
            , React.createElement('div', {style:{fontSize:12,color:"#94a3b8",fontWeight:700}}, "Otomatik İşlemler")
            , React.createElement('div', {style:{fontSize:11,color:"#64748b",marginTop:2}},
                "🌙 Her gece 23:50: Günlük gider raporu Gmail üzerinden iletisimasis@gmail.com adresine gönderilir  ·  " +
                "🗑 Her Cumartesi 16:00: Giderler haftalık arşive alınır ve sıfırlanır" +
                (gun===6&&saat>=16?" (Bugün sıfırlandı ✅)":"  ·  Sonraki sıfırlama: "+sonrakiCmt+" gün sonra"))
          )
        );
      })()

    /* Gider ekleme butonu + form */
    , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:8}}
      , React.createElement('div', {style:{fontWeight:800,fontSize:14}}, "📋 Bu Haftaki Giderler")
      , React.createElement('div', {style:{display:"flex",gap:8,flexWrap:"wrap"}}
        , giderler.length>0&&React.createElement('button', {
            onClick:function(){
              var konu="Asansör Takip - Güncel Gider Raporu "+new Date().toLocaleDateString("tr-TR");
              var satirlar=giderler.map(function(g){return g.tarih+"  |  "+g.aciklama+"  |  "+(g.tutar||0).toLocaleString("tr-TR")+" ₺";});
              var toplam=giderler.reduce(function(s,g){return s+(g.tutar||0);},0);
              var govde="Toplam: "+toplam.toLocaleString("tr-TR")+" ₺ ("+giderler.length+" kayıt)\n\n"+satirlar.join("\n")+"\n\n-- AsansörTakip Pro --";
              window.open("mailto:iletisimasis@gmail.com?subject="+encodeURIComponent(konu)+"&body="+encodeURIComponent(govde),"_blank");
            },
            style:{padding:"7px 14px",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer"}
          }, "📧 Gmail'e Gönder")
        , giderler.length>0&&React.createElement('button', {
            onClick:function(){
              var baslik=["Tarih","Açıklama","Tutar (₺)"];
              var satirlar=[baslik].concat(giderler.map(function(g){return [g.tarih,g.aciklama,(g.tutar||0)];}));
              var toplam=giderler.reduce(function(s,g){return s+(g.tutar||0);},0);
              satirlar.push(["","",""]);
              satirlar.push(["TOPLAM","",toplam]);
              toXLSX(satirlar, "giderler_"+new Date().toLocaleDateString("tr-TR").replace(/\./g,"-"), "Giderler");
            },
            style:{padding:"7px 14px",background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:11,cursor:"pointer"}
          }, "📥 Excel İndir")
        , React.createElement('button', {
            onClick:function(){
              var today=new Date().toLocaleDateString("tr-TR");
              setGiderForm({tarih:today,aciklama:"",tutar:""});
              setGiderFormAcik(true);
            },
            style:{padding:"8px 16px",background:"linear-gradient(135deg,#ef4444,#dc2626)",border:"none",borderRadius:9,color:"#fff",fontWeight:800,fontSize:12,cursor:"pointer"}
          }, "➕ Gider Ekle")
      )
    )

    /* Gider formu (inline) */
    , giderFormAcik&&React.createElement('div', {style:{background:"#1a1f2e",borderRadius:12,border:"2px solid #ef444444",padding:16,marginBottom:14}}
      , React.createElement('div', {style:{fontWeight:700,fontSize:13,color:"#ef4444",marginBottom:12}}, "➕ Yeni Gider")
      , React.createElement('div', {style:{display:"grid",gridTemplateColumns:"1fr 2fr 1fr auto",gap:10,alignItems:"end"}}
        , React.createElement('div', null
          , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "Tarih")
          , React.createElement('input', {type:"date",value:(function(){
              if(!giderForm.tarih) return "";
              var p=giderForm.tarih.split(".");
              if(p.length===3) return p[2]+"-"+p[1].padStart(2,"0")+"-"+p[0].padStart(2,"0");
              return giderForm.tarih;
            })(),
            onChange:function(e){
              var d=new Date(e.target.value);
              var tr=d.toLocaleDateString("tr-TR");
              setGiderForm(function(p){return Object.assign({},p,{tarih:tr});});
            },
            style:{width:"100%",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,padding:"9px 10px",color:"#e0e6f0",fontSize:13,outline:"none",boxSizing:"border-box"}})
        )
        , React.createElement('div', null
          , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "Ne Alındı / Açıklama")
          , React.createElement('input', {type:"text",value:giderForm.aciklama,
            onChange:function(e){setGiderForm(function(p){return Object.assign({},p,{aciklama:e.target.value});});},
            placeholder:"Ör: Yağ, conta, alet...",
            style:{width:"100%",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,padding:"9px 10px",color:"#e0e6f0",fontSize:13,outline:"none",boxSizing:"border-box"}})
        )
        , React.createElement('div', null
          , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "Tutar (₺)")
          , React.createElement('input', {type:"number",value:giderForm.tutar,
            onChange:function(e){setGiderForm(function(p){return Object.assign({},p,{tutar:e.target.value});});},
            placeholder:"0",
            style:{width:"100%",background:"#0d1321",border:"1px solid #ef444444",borderRadius:8,padding:"9px 10px",color:"#ef4444",fontSize:14,fontWeight:700,outline:"none",boxSizing:"border-box"}})
        )
        , React.createElement('div', {style:{display:"flex",gap:6}}
          , React.createElement('button', {
              onClick:function(){
                if(!giderForm.aciklama.trim()||!giderForm.tutar){alert("Açıklama ve tutar zorunlu!");return;}
                var today=new Date().toLocaleDateString("tr-TR");
                var yeni={
                  id:Date.now(),
                  tarih:giderForm.tarih||today,
                  aciklama:giderForm.aciklama.trim(),
                  tutar:parseFloat(giderForm.tutar)||0,
                  girisZamani:new Date().toLocaleString("tr-TR")
                };
                setGiderler(function(p){return [...p,yeni];});
                setGiderForm(function(p){return Object.assign({},p,{aciklama:"",tutar:""});});
              },
              style:{padding:"9px 16px",background:"linear-gradient(135deg,#10b981,#059669)",border:"none",borderRadius:8,color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",whiteSpace:"nowrap"}
            }, "✅ Kaydet")
          , React.createElement('button', {
              onClick:function(){setGiderFormAcik(false);},
              style:{padding:"9px 12px",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,color:"#94a3b8",fontWeight:600,fontSize:12,cursor:"pointer"}
            }, "✕")
        )
      )
    )

    /* Gider listesi */
    , giderler.length===0&&!giderFormAcik
      ? React.createElement('div', {style:{background:"#1a1f2e",borderRadius:13,border:"1px solid #2a3050",padding:"40px",textAlign:"center"}}
          , React.createElement('div', {style:{fontSize:36,marginBottom:10}}, "💸")
          , React.createElement('div', {style:{fontWeight:700,fontSize:14,color:"#94a3b8",marginBottom:6}}, "Bu hafta henüz gider girilmedi")
          , React.createElement('div', {style:{fontSize:12,color:"#475569"}}, "Sağ üstteki ➕ Gider Ekle butonunu kullanın")
        )
      : giderler.length>0&&(function(){
          var gunler={};
          giderler.slice().reverse().forEach(function(g){
            if(!gunler[g.tarih]) gunler[g.tarih]=[];
            gunler[g.tarih].push(g);
          });
          return React.createElement('div', {style:{display:"flex",flexDirection:"column",gap:10}}
            , Object.entries(gunler).map(function(entry){
                var tarih=entry[0];var gunGiderler=entry[1];
                var gunToplam=gunGiderler.reduce(function(s,g){return s+(g.tutar||0);},0);
                var today=new Date().toLocaleDateString("tr-TR");
                return React.createElement('div', {key:tarih,style:{background:"#141824",borderRadius:12,border:"1px solid "+(tarih===today?"#ef444433":"#2a3050"),overflow:"hidden"}}
                  , React.createElement('div', {style:{padding:"10px 14px",background:tarih===today?"#1a0808":"#12111a",borderBottom:"1px solid #2a3050",display:"flex",justifyContent:"space-between",alignItems:"center"}}
                    , React.createElement('div', {style:{fontWeight:800,fontSize:13,color:tarih===today?"#ef4444":"#94a3b8"}},
                        tarih===today?"🔴 Bugün — "+tarih:"📅 "+tarih)
                    , React.createElement('div', {style:{fontWeight:900,color:"#ef4444",fontSize:13}},
                        gunToplam.toLocaleString("tr-TR")+" ₺ ("+gunGiderler.length+" kayıt)")
                  )
                  , React.createElement('div', null
                    , gunGiderler.map(function(g){
                        return React.createElement('div', {key:g.id,style:{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderBottom:"1px solid #1e2640"}}
                          , React.createElement('div', {style:{flex:1}}
                            , React.createElement('div', {style:{fontWeight:700,fontSize:13}}, g.aciklama)
                            , React.createElement('div', {style:{fontSize:10,color:"#64748b",marginTop:2}}, "🕐 "+g.girisZamani)
                          )
                          , React.createElement('div', {style:{fontWeight:900,fontSize:14,color:"#ef4444",whiteSpace:"nowrap"}}, (g.tutar||0).toLocaleString("tr-TR")+" ₺")
                          , React.createElement('button', {
                              onClick:function(){if(window.confirm("Bu gideri silmek istiyor musunuz?")){setGiderler(function(p){return p.filter(function(x){return x.id!==g.id;});});}},
                              style:{background:"#3a1e1e",border:"none",borderRadius:6,width:28,height:28,cursor:"pointer",fontSize:12,color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}
                            }, "🗑")
                        );
                      })
                  )
                );
              })
          );
        })()

    /* Haftalık Gider Arşivi */
    , giderHaftaArsiv.length>0&&React.createElement('div', {style:{marginTop:20,background:"#1a1f2e",borderRadius:13,border:"1px solid #8b5cf644",overflow:"hidden"}}
      , React.createElement('div', {style:{padding:"11px 16px",borderBottom:"1px solid #2a3050",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}
        , React.createElement('div', {style:{fontWeight:800,fontSize:13,color:"#8b5cf6"}}, "📦 Geçmiş Haftalık Gider Arşivi")
        , React.createElement('div', {style:{fontSize:11,color:"#64748b"}}, "Son 5 hafta saklanır")
      )
      , React.createElement('div', {style:{padding:14,display:"flex",flexDirection:"column",gap:8}}
        , giderHaftaArsiv.map(function(k){
            return React.createElement('div', {key:k.id,style:{background:"#0d1321",borderRadius:10,border:"1px solid #2a3050",padding:"11px 14px",display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}
              , React.createElement('div', {style:{flex:1}}
                , React.createElement('div', {style:{fontWeight:700,fontSize:12,color:"#8b5cf6"}}, k.baslarken+" – "+k.biterken)
                , React.createElement('div', {style:{fontSize:10,color:"#64748b",marginTop:2}}, "Kapama: "+k.kapamaZamani+" · "+k.kayitAdedi+" kayıt")
              )
              , React.createElement('div', {style:{fontWeight:900,color:"#ef4444",fontSize:13,whiteSpace:"nowrap"}}, (k.toplam||0).toLocaleString("tr-TR")+" ₺")
              , React.createElement('button', {
                  onClick:function(){
                    var baslik=["Tarih","Açıklama","Tutar (₺)","Giriş Zamanı"];
                    var gRows=(k.giderler||[]).map(function(g){return [g.tarih,g.aciklama,(g.tutar||0),g.girisZamani||""];});
                    var satirlar=[baslik].concat(gRows);
                    satirlar.push(["","","",""]);
                    satirlar.push(["TOPLAM","",(k.toplam||0),k.kayitAdedi+" kayıt"]);
                    toXLSX(satirlar, "gider_"+k.baslarken.replace(/\./g,"-")+"_"+k.biterken.replace(/\./g,"-"), "Dönem Gider");
                  },
                  style:{padding:"5px 12px",background:"#1e3a5f",border:"1px solid #3b82f644",borderRadius:7,color:"#3b82f6",fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}
                }, "📥 Excel")
            );
          })
      )
    )
  )
)

/* NOTLAR - YÖNETİCİ */
, tab===8&&rol==="yonetici"&&(
  React.createElement('div', null,
    React.createElement(NotlarEkrani, {elevs:elevs,notlar:notlar,setNotlar:setNotlar,rol:"yonetici",ilceler:ilceler})
  )
)

/* NOTLAR - BAKIMCI */
, tab===8&&rol==="bakimci"&&(
  React.createElement('div', null,
    React.createElement(NotlarEkrani, {elevs:elevs,notlar:notlar,setNotlar:setNotlar,rol:"bakimci",ilceler:ilceler})
  )
)

/* EKSTRA İŞ - her iki rol de tab===9 kullanır */
, tab===9&&(
  React.createElement(EkstraIsEkrani, {elevs:elevs,ekstraIsler:ekstraIsler,setEkstraIsler:setEkstraIsler,setElevs:setElevs,rol:rol,ilceler:ilceler,today:today})
)

/* PERİYODİK MUAYENE TAKİBİ */
, tab===10&&rol==="yonetici"&&(
  React.createElement('div', {className:"ios-animate"},
    React.createElement(MuayeneTakibi, {elevs:elevs,muayeneler:muayeneler,setMuayeneler:setMuayeneler})
  )
)

/* SÖZLEŞME YÖNETİMİ */
, tab===11&&rol==="yonetici"&&(
  React.createElement('div', {className:"ios-animate"},
    React.createElement(SozlesmeYonetimi, {elevs:elevs,sozlesmeler:sozlesmeler,setSozlesmeler:setSozlesmeler})
  )
)

/* YÖNETİCİ / BİNA PORTALI */
, tab===12&&rol==="yonetici"&&(
  React.createElement('div', {className:"ios-animate"},
    React.createElement(YoneticiPortali, {elevs:elevs,maints:maints,faults:faults,muayeneler:muayeneler,sozlesmeler:sozlesmeler})
  )
)

/* BAKIMCI YÖNETİMİ */
, tab===13&&rol==="yonetici"&&(
  React.createElement('div', {className:"ios-animate"},
    React.createElement(BakimciYonetimPaneli, {bakimcilar:bakimcilar,setBakimcilar:setBakimcilar})
  )
)

      )

      /* MODALLER */
      , modal==="e"&&(
        React.createElement(Modal, { title: edit?"Asansör Düzenle":"Yeni Asansör", onClose: close, onSave: saveE,}
          , !edit&&React.createElement('div', {style:{marginBottom:10,fontSize:11,color:"#f59e0b",fontWeight:700,padding:"6px 10px",background:"#2a1e10",borderRadius:7}}, "⚠️ Tüm alanlar zorunludur")
          , !edit&&React.createElement('div', null
              , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "İlçe *")
              , React.createElement('select', {
                  value:form.ilce||"",
                  onChange:function(e){F("ilce",e.target.value);},
                  style:{width:"100%",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,padding:"9px 12px",color:"#e0e6f0",fontSize:13,outline:"none",cursor:"pointer",marginBottom:8,boxSizing:"border-box"}
                }
                , React.createElement('option',{value:""},"— İlçe seçin —")
                , ISTANBUL_ILCELER.map(function(ilce){return React.createElement('option',{key:ilce,value:ilce},ilce);})
              )
            )
          , edit&&React.createElement('div', null
              , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "İlçe")
              , React.createElement('select', {
                  value:form.ilce||"",
                  onChange:function(e){F("ilce",e.target.value);},
                  style:{width:"100%",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,padding:"9px 12px",color:"#e0e6f0",fontSize:13,outline:"none",cursor:"pointer",marginBottom:8,boxSizing:"border-box"}
                }
                , ISTANBUL_ILCELER.map(function(ilce){return React.createElement('option',{key:ilce,value:ilce},ilce);})
              )
            )
          , form.ilce&&React.createElement(MahallePicker,{ilce:form.ilce,value:form.semt||"",onChange:function(v){F("semt",v);}})
          , React.createElement(FF, { label: edit?"Bina Adı":"Bina Adı *", value: form.ad||"", onChange: v=>F("ad",v),})
          , React.createElement(AdresFF, { label: edit?"Adres":"Adres *", value: form.adres||"", onChange: v=>F("adres",v)})
          , React.createElement(FF, { label: edit?"Yönetici":"Yönetici Adı *", value: form.yonetici||"", onChange: v=>F("yonetici",v),})
          , React.createElement(FF, { label: edit?"Telefon":"Telefon *", value: form.tel||"", onChange: v=>F("tel",v),})
          , React.createElement(FF, { label: edit?"Yönetici Dairesi":"Yönetici Dairesi *", value: form.yoneticiDaire||"", onChange: v=>F("yoneticiDaire",v),})
          , React.createElement(FF, { label: edit?"Bakım Günü":"Bakım Günü (Ayın kaçı?) *", type: "number", value: form.bakimGunu||"", onChange: v=>F("bakimGunu",v),})
          , React.createElement(FF, { label: "Aylık Bakım Ücreti (₺) *", type: "number", value: form.aylikUcret||"", onChange: v=>F("aylikUcret",v),})
          /* Eski Devir + Yeni Devir alanları */
          , React.createElement('div', {style:{background:"var(--bg-elevated)",borderRadius:12,padding:"12px 14px",display:"flex",flexDirection:"column",gap:10,marginBottom:8}}

            /* Eski Devir — kilitli, özel onay gerektirir */
            , React.createElement('div', null
              , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}
                , React.createElement('label', {style:{fontSize:11,fontWeight:700,color:"#94a3b8"}}, "📊 Eski Devir (₺)")
                , React.createElement('button', {
                    type:"button",
                    onClick:function(){
                      if(!form._devirKilidAcik){
                        if(!window.confirm("Eski Devir değerini değiştirmek istediğinizden emin misiniz?\n\nYanlış değer girilmesi finansal hesapları bozabilir!")) return;
                        F("_devirKilidAcik",true);
                      } else {
                        F("_devirKilidAcik",false);
                      }
                    },
                    style:{fontSize:10,padding:"2px 8px",borderRadius:6,background:form._devirKilidAcik?"#3a1e1e":"#1e3050",border:"1px solid "+(form._devirKilidAcik?"#ef444466":"#3b82f666"),color:form._devirKilidAcik?"#ef4444":"#3b82f6",cursor:"pointer",fontWeight:700}
                  }, form._devirKilidAcik?"🔓 Kilitle":"🔒 Düzenle")
              )
              , React.createElement('input', {
                  type:"number",
                  value:form.bakiyeDevir||"",
                  onChange:function(e){F("bakiyeDevir",e.target.value);},
                  placeholder:"0",
                  readOnly:!form._devirKilidAcik,
                  style:{width:"100%",background:form._devirKilidAcik?"#1a0a0a":"#0a0f1a",border:"1px solid "+(form._devirKilidAcik?"#ef444466":"#1e2640"),borderRadius:8,padding:"9px 12px",color:form._devirKilidAcik?"#ef4444":"#64748b",fontSize:14,outline:"none",boxSizing:"border-box",cursor:form._devirKilidAcik?"text":"not-allowed"}
                })
              , React.createElement('div', {style:{fontSize:10,color:form._devirKilidAcik?"#ef4444":"#64748b",marginTop:3,fontWeight:form._devirKilidAcik?700:400}},
                  form._devirKilidAcik?"⚠️ Dikkat: Bu değeri değiştirmek finansal hesapları etkiler!":"Önceki aydan kalan devir bakiye · Düzenlemek için 🔒 butonuna basın")
            )

            /* Yeni Devir — canlı hesap gösterimi + düzenlenebilir override */
            , (function(){
                var eskiD=parseFloat(form.bakiyeDevir)||0;
                var aylikU=parseFloat(form.aylikUcret)||0;
                // Bu asansör için bu ay alınan ödemeleri hesapla
                var simdi=new Date();
                var ayBas=new Date(simdi.getFullYear(),simdi.getMonth(),1);
                var aySon=new Date(simdi.getFullYear(),simdi.getMonth()+1,0);aySon.setHours(23,59,59,999);
                var alinan=edit?sonOdemeler.filter(function(o){
                  var od=new Date(o.tarih);
                  return Number(o.aid)===Number(edit.id)&&!o.iptal&&od>=ayBas&&od<=aySon;
                }).reduce(function(s,o){return s+(o.alinanTutar||0);},0):0;
                var otomatikND=eskiD+aylikU-alinan;
                var ndRenk=otomatikND>0?"#f97316":otomatikND===0?"#64748b":"#34d399";
                var ndBg=otomatikND>0?"rgba(249,115,22,0.10)":otomatikND===0?"rgba(100,116,139,0.08)":"rgba(52,211,153,0.10)";
                return React.createElement('div', null
                  , React.createElement('div', {style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}
                    , React.createElement('label', {style:{fontSize:11,fontWeight:700,color:"#94a3b8"}},"🔄 Yeni Devir (₺)")
                    , React.createElement('span', {style:{fontSize:10,color:ndRenk,background:ndBg,padding:"2px 8px",borderRadius:10,fontWeight:700}},
                        "Otomatik: "+(otomatikND>0?"+":"")+otomatikND.toLocaleString("tr-TR")+" ₺")
                  )
                  , React.createElement('input', {
                      type:"number",
                      value:form._yeniDevirOverride!==undefined?form._yeniDevirOverride:"",
                      onChange:function(e){F("_yeniDevirOverride",e.target.value);},
                      placeholder:(otomatikND>0?"+":"")+String(otomatikND),
                      style:{width:"100%",background:"#0d1321",border:"1px solid "+ndRenk+"66",borderRadius:8,padding:"9px 12px",color:ndRenk,fontSize:14,outline:"none",boxSizing:"border-box"}
                    })
                  , React.createElement('div', {style:{fontSize:10,color:"#64748b",marginTop:3}}, "Boş bırakırsanız otomatik hesaplanır. Doldurursanız bir sonraki ay bu değer eski devir olur.")
                );
              })()
          )
        )
      )
      , modal==="m"&&(
        React.createElement(Modal, { title: edit?"Bakım Düzenle":"Yeni Bakım", onClose: close, onSave: saveM, wide: true,}
          , React.createElement('div', { style: {display:"grid",gridTemplateColumns:"1fr 1fr",gap:16},}
            , React.createElement('div', null
              , React.createElement(FS, { label: "Asansör", value: form.asansorId||"", onChange: v=>F("asansorId",v), options: elevs.map(e=>({v:e.id,l:e.ad+" ("+e.ilce+")"})),})
              , React.createElement(FF, { label: "Tarih", type: "date", value: form.tarih||today, onChange: v=>F("tarih",v),})
              , React.createElement(FF, { label: "Tutar (₺)" , type: "number", value: form.tutar||"", onChange: v=>F("tutar",v),})
              , React.createElement(FF, { label: "Notlar", value: form.notlar||"", onChange: v=>F("notlar",v),})
              , React.createElement(FS, { label: "Yapıldı mı?" , value: form.yapildi===true||form.yapildi==="true"?"true":"false", onChange: v=>F("yapildi",v), options: [{v:"true",l:"Evet"},{v:"false",l:"Hayır"}],})
              , React.createElement(FS, { label: "Ödendi mi?" , value: form.odendi===true||form.odendi==="true"?"true":"false", onChange: v=>F("odendi",v), options: [{v:"true",l:"Evet"},{v:"false",l:"Hayır"}],})
            )
            , React.createElement('div', null
              , React.createElement('div', { style: {fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:8},}, "📋 Kontrol Listesi"  )
              , React.createElement('div', { style: {maxHeight:360,overflowY:"auto"},}, React.createElement(KontrolListesi, { value: form.kl||{}, onChange: kl=>F("kl",kl),}))
            )
          )
        )
      )
      , modal==="f"&&(
        React.createElement(Modal, { title: edit?"Arıza Düzenle":"Yeni Arıza", onClose: close, onSave: saveF,}
          , !edit&&React.createElement('div', {style:{marginBottom:14}}
            , React.createElement('div', {style:{fontSize:13,fontWeight:600,color:"var(--text-muted)",marginBottom:8}}, "Bu bina sistemde kayıtlı mı?")
            , React.createElement('div', {style:{display:"flex",gap:8}}
              , React.createElement('button', {
                  onClick:function(){F("_yeniAdres",false);F("_secimIlce","");F("asansorId","");},
                  style:{flex:1,padding:"12px",borderRadius:14,background:form._yeniAdres===false?"rgba(0,122,255,0.15)":"var(--bg-elevated)",border:"none",color:form._yeniAdres===false?"var(--accent)":"var(--text-muted)",fontWeight:600,fontSize:14,cursor:"pointer",minHeight:44}
                }, "✅ Evet, kayıtlı")
              , React.createElement('button', {
                  onClick:function(){F("_yeniAdres",true);F("asansorId","");},
                  style:{flex:1,padding:"12px",borderRadius:14,background:form._yeniAdres===true?"rgba(255,149,0,0.15)":"var(--bg-elevated)",border:"none",color:form._yeniAdres===true?"var(--ios-orange)":"var(--text-muted)",fontWeight:600,fontSize:14,cursor:"pointer",minHeight:44}
                }, "🆕 Yeni Asansör")
            )
          )
          , !edit&&form._yeniAdres===false&&React.createElement('div', null
            , React.createElement('div', null
              , React.createElement('label', {style:{display:"block",fontSize:13,fontWeight:600,color:"var(--text-muted)",marginBottom:6}}, "İlçe Seçin")
              , React.createElement('select', {
                  value:form._secimIlce||"",
                  onChange:function(e){F("_secimIlce",e.target.value);F("asansorId","");},
                  style:{...S.sel,marginBottom:10}
                }
                , React.createElement('option',{value:""},"— İlçe seçin —")
                , ISTANBUL_ILCELER.map(function(ilce){return React.createElement('option',{key:ilce,value:ilce},ilce);})
              )
            )
            , form._secimIlce&&React.createElement('div', null
              , React.createElement('label', {style:{display:"block",fontSize:13,fontWeight:600,color:"var(--text-muted)",marginBottom:6}}, "Bina Seçin")
              , React.createElement('select', {
                  value:form.asansorId||"",
                  onChange:function(e){F("asansorId",e.target.value);},
                  style:{...S.sel,marginBottom:10}
                }
                , React.createElement('option',{value:""},"— Bina seçin —")
                , elevs.filter(function(e){return (e.ilce||"Diğer")===form._secimIlce;}).map(function(e){return React.createElement('option',{key:e.id,value:e.id},e.ad);})
              )
            )
          )
          , !edit&&form._yeniAdres===true&&React.createElement('div', null
            , React.createElement('div', null
              , React.createElement('label', {style:{display:"block",fontSize:13,fontWeight:600,color:"var(--text-muted)",marginBottom:6}}, "İlçe Seçin")
              , React.createElement('select', {
                  value:form._yeniIlce||"",
                  onChange:function(e){F("_yeniIlce",e.target.value);},
                  style:{...S.sel,marginBottom:10}
                }
                , React.createElement('option',{value:""},"— İlçe seçin —")
                , ISTANBUL_ILCELER.map(function(ilce){return React.createElement('option',{key:ilce,value:ilce},ilce);})
              )
            )
            , form._yeniIlce&&React.createElement(MahallePicker,{ilce:form._yeniIlce,value:form._yeniSemt||"",onChange:function(v){F("_yeniSemt",v);}})
            , form._yeniIlce&&React.createElement('div', null
              , React.createElement(FF, {label:"Bina Adı *", value:form._yeniBinaAd||"", onChange:function(v){F("_yeniBinaAd",v);}})
              , React.createElement(AdresFF, {label:"Adres *", value:form._yeniAdresStr||"", onChange:function(v){F("_yeniAdresStr",v);}})
              , React.createElement(FF, {label:"Yönetici", value:form._yeniYon||"", onChange:function(v){F("_yeniYon",v);}})
              , React.createElement(FF, {label:"Telefon", value:form._yeniTel||"", onChange:function(v){F("_yeniTel",v);}})
            )
          )
          , edit&&React.createElement(FS, { label: "Asansör", value: form.asansorId||"", onChange: v=>F("asansorId",v), options: elevs.map(e=>({v:e.id,l:e.ad+" ("+e.ilce+")"})),})
          , React.createElement(FF, { label: "Arıza Tarihi", type: "date", value: form.tarih||today, onChange: v=>F("tarih",v),})
          , React.createElement(FF, { label: "Açıklama", value: form.aciklama||"", onChange: v=>F("aciklama",v),})
          , React.createElement(FS, { label: "Öncelik", value: form.oncelik||"Orta", onChange: v=>F("oncelik",v), options: ["Düşük","Orta","Yüksek"],})
          , React.createElement(FS, { label: "Durum", value: form.durum||"Beklemede", onChange: v=>F("durum",v), options: ["Beklemede","Devam Ediyor","Çözüldü"],})
          , React.createElement(FF, { label: "Çözüm Tarihi", type: "date", value: form.cozumTarih||"", onChange: v=>F("cozumTarih",v),})
          /* FOTOĞRAF EKLEME */
          , React.createElement('div', {style:{marginBottom:14}},
            React.createElement('label', {style:{display:"block",fontSize:13,fontWeight:600,color:"var(--text-muted)",marginBottom:8}}, "📷 Fotoğraflar"),
            React.createElement('div', {className:"foto-grid"},
              (form.fotolar||[]).map(function(src,idx){
                return React.createElement('div', {key:idx, style:{position:"relative"}},
                  React.createElement('img', {src:src, className:"foto-thumb", alt:"Arıza foto "+idx}),
                  React.createElement('button', {
                    onClick:function(){var arr=(form.fotolar||[]).filter(function(_,i){return i!==idx;});F("fotolar",arr);},
                    style:{position:"absolute",top:-6,right:-6,width:20,height:20,borderRadius:"50%",background:"var(--ios-red)",border:"2px solid var(--bg-panel)",color:"#fff",fontSize:10,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,lineHeight:1}
                  }, "×")
                );
              }),
              (form.fotolar||[]).length<6&&React.createElement('label', {className:"foto-add", style:{cursor:"pointer"}},
                React.createElement('input', {
                  type:"file", accept:"image/*", capture:"environment",
                  style:{display:"none"},
                  onChange:function(e){
                    var file=e.target.files&&e.target.files[0];
                    if(!file) return;
                    var reader=new FileReader();
                    reader.onload=function(ev){
                      var arr=(form.fotolar||[]).concat([ev.target.result]);
                      F("fotolar",arr);
                    };
                    reader.readAsDataURL(file);
                    e.target.value="";
                  }
                }),
                "+"
              )
            )
          )
        )
      )
      , modal==="t"&&(
        React.createElement(Modal, { title: edit?"Görev Düzenle":"Yeni Görev", onClose: close, onSave: saveT,}
          , !edit&&React.createElement('div', {style:{marginBottom:10}}
            , React.createElement('div', {style:{fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:6}}, "Bu bina sistemde kayıtlı mı?")
            , React.createElement('div', {style:{display:"flex",gap:6}}
              , React.createElement('button', {
                  onClick:function(){F("_yeniAdres",false);F("_secimIlce","");F("asansorId","");},
                  style:{flex:1,padding:"9px",borderRadius:8,background:form._yeniAdres===false?"#3b82f622":"#0d1321",border:"2px solid "+(form._yeniAdres===false?"#3b82f6":"#2a3050"),color:form._yeniAdres===false?"#3b82f6":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer"}
                }, "✅ Evet, kayıtlı")
              , React.createElement('button', {
                  onClick:function(){F("_yeniAdres",true);F("asansorId","");},
                  style:{flex:1,padding:"9px",borderRadius:8,background:form._yeniAdres===true?"#f59e0b22":"#0d1321",border:"2px solid "+(form._yeniAdres===true?"#f59e0b":"#2a3050"),color:form._yeniAdres===true?"#f59e0b":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer"}
                }, "🆕 Yeni Asansör")
            )
          )
          , !edit&&form._yeniAdres===false&&React.createElement('div', null
            , React.createElement('div', null
              , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "İlçe Seçin")
              , React.createElement('select', {
                  value:form._secimIlce||"",
                  onChange:function(e){F("_secimIlce",e.target.value);F("asansorId","");},
                  style:{width:"100%",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,padding:"9px 12px",color:"#e0e6f0",fontSize:13,outline:"none",cursor:"pointer",marginBottom:8,boxSizing:"border-box"}
                }
                , React.createElement('option',{value:""},"— İlçe seçin —")
                , ISTANBUL_ILCELER.map(function(ilce){return React.createElement('option',{key:ilce,value:ilce},ilce);})
              )
            )
            , form._secimIlce&&React.createElement('div', null
              , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "Bina Seçin")
              , React.createElement('select', {
                  value:form.asansorId||"",
                  onChange:function(e){F("asansorId",e.target.value);},
                  style:{width:"100%",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,padding:"9px 12px",color:"#e0e6f0",fontSize:13,outline:"none",cursor:"pointer",marginBottom:8,boxSizing:"border-box"}
                }
                , React.createElement('option',{value:""},"— Bina seçin —")
                , elevs.filter(function(e){return (e.ilce||"Diğer")===form._secimIlce;}).map(function(e){return React.createElement('option',{key:e.id,value:e.id},e.ad);})
              )
            )
          )
          , !edit&&form._yeniAdres===true&&React.createElement('div', null
            , React.createElement('div', {style:{fontSize:11,color:"#f59e0b",background:"#2a1e10",borderRadius:7,padding:"7px 10px",marginBottom:10}}, "⚠️ Bu bina asansör listesine eklenmez, sadece bu görev için kullanılır.")
            , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "İlçe Seçin")
            , React.createElement('select', {
                value:form._yeniIlce||"",
                onChange:function(e){F("_yeniIlce",e.target.value);},
                style:{width:"100%",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,padding:"9px 12px",color:"#e0e6f0",fontSize:13,outline:"none",cursor:"pointer",marginBottom:8,boxSizing:"border-box"}
              }
              , React.createElement('option',{value:""},"— İlçe seçin —")
              , ISTANBUL_ILCELER.map(function(ilce){return React.createElement('option',{key:ilce,value:ilce},ilce);})
            )
            , form._yeniIlce&&React.createElement(MahallePicker,{ilce:form._yeniIlce,value:form._yeniSemt||"",onChange:function(v){F("_yeniSemt",v);}})
            , form._yeniIlce&&React.createElement(FF, {label:"Bina Adı *", value:form._yeniBinaAd||"", onChange:function(v){F("_yeniBinaAd",v);}})
          )
          , edit&&React.createElement('div', {style:{marginBottom:10}}
            , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "İlçe Seçin")
            , React.createElement('select', {
                value:form._editIlce||(form.asansorId?(elevs.find(function(e){return e.id===(+form.asansorId||form.asansorId);})||{}).ilce||"":""),
                onChange:function(e){F("_editIlce",e.target.value);F("asansorId","");},
                style:{width:"100%",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,padding:"9px 12px",color:"#e0e6f0",fontSize:13,outline:"none",cursor:"pointer",boxSizing:"border-box",marginBottom:8}
              }
              , React.createElement('option',{value:""},"— İlçe seçin —")
              , ilceler.map(function(ilce){return React.createElement('option',{key:ilce,value:ilce},ilce);})
            )
            , (form._editIlce||(form.asansorId?(elevs.find(function(e){return e.id===(+form.asansorId||form.asansorId);})||{}).ilce||"":""))&&React.createElement('div', null
              , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "Bina Seçin")
              , React.createElement('select', {
                  value:String(form.asansorId||""),
                  onChange:function(e){F("asansorId",+e.target.value||e.target.value);},
                  style:{width:"100%",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,padding:"9px 12px",color:"#e0e6f0",fontSize:13,outline:"none",cursor:"pointer",boxSizing:"border-box"}
                }
                , React.createElement('option',{value:""},"— Bina seçin —")
                , elevs.filter(function(e){
                    var seciliIlce=form._editIlce||(elevs.find(function(x){return x.id===(+form.asansorId||form.asansorId);})||{}).ilce||"";
                    return (e.ilce||"")===seciliIlce;
                  }).map(function(e){return React.createElement('option',{key:e.id,value:String(e.id)},e.ad);})
              )
            )
          )
          , React.createElement(FF, { label: "Tarih", type: "date", value: form.tarih||today, onChange: v=>F("tarih",v),})
          , React.createElement(FF, { label: "Görev", value: form.gorev||"", onChange: v=>F("gorev",v),})
          , React.createElement(FF, { label: "Notlar", value: form.notlar||"", onChange: v=>F("notlar",v),})
          , React.createElement(FS, { label: "Tamamlandı mı?", value: form.tamamlandi===true||form.tamamlandi==="true"?"true":"false", onChange: v=>F("tamamlandi",v), options: [{v:"false",l:"Hayır"},{v:"true",l:"Evet"}],})
        )
      )

      /* Manuel Ödeme Modal */
      , manuelOdemeAcik&&(
        React.createElement('div', {style:{position:"fixed",inset:0,background:"#000000cc",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}
          , React.createElement('div', {style:{background:"#1a1f2e",borderRadius:16,border:"1px solid #10b98144",width:"100%",maxWidth:380}}
            , React.createElement('div', {style:{padding:"14px 18px",borderBottom:"1px solid #2a3050",display:"flex",justifyContent:"space-between",alignItems:"center"}}
              , React.createElement('div', {style:{fontWeight:800,fontSize:15,color:"#10b981"}}, "➕ Manuel Ödeme Gir")
              , React.createElement('button', {onClick:function(){setManuelOdemeAcik(false);},style:{background:"none",border:"none",color:"#64748b",fontSize:22,cursor:"pointer",lineHeight:1}}, "×")
            )
            , React.createElement('div', {style:{padding:18,display:"flex",flexDirection:"column",gap:12}}
              , React.createElement('div', null
                , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "1. İlçe Seçin")
                , React.createElement('select', {
                    value:form.odIlce||"",
                    onChange:function(e){setForm(function(p){return Object.assign({},p,{odIlce:e.target.value,odBinaId:""});});},
                    style:{width:"100%",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,padding:"9px 12px",color:"#e0e6f0",fontSize:13,outline:"none",cursor:"pointer"}
                  }
                  , React.createElement('option',{value:""},"— İlçe seçin —")
                  , ilceler.map(function(ilce){return React.createElement('option',{key:ilce,value:ilce},ilce);})
                )
              )
              , form.odIlce&&React.createElement('div', null
                , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "2. Bina Seçin")
                , React.createElement('select', {
                    value:form.odBinaId||"",
                    onChange:function(e){setForm(function(p){return Object.assign({},p,{odBinaId:e.target.value});});},
                    style:{width:"100%",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,padding:"9px 12px",color:"#e0e6f0",fontSize:13,outline:"none",cursor:"pointer"}
                  }
                  , React.createElement('option',{value:""},"— Bina seçin —")
                  , elevs.filter(function(e){return (e.ilce||"Diğer")===form.odIlce;}).map(function(e){return React.createElement('option',{key:e.id,value:String(e.id)},e.ad+" (Bakiye: "+(bal(e.id)>0?"+":"")+bal(e.id).toLocaleString("tr-TR")+" ₺)");})
                )
              )
              , (form.odIlce&&form.odBinaId)&&React.createElement('div', null
                , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "3. Alınan Tutar (₺)")
                , React.createElement('input', {
                    type:"number",
                    value:form.odTutar||"",
                    onChange:function(e){setForm(function(p){return Object.assign({},p,{odTutar:e.target.value});});},
                    placeholder:"0",
                    style:{width:"100%",background:"#0d1321",border:"1px solid #10b98144",borderRadius:8,padding:"9px 12px",color:"#10b981",fontSize:14,fontWeight:700,outline:"none",boxSizing:"border-box"}
                  })
              )
              , (form.odIlce&&form.odBinaId)&&React.createElement('div', null
                , React.createElement('label', {style:{display:"block",fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:4}}, "Not (isteğe bağlı)")
                , React.createElement('input', {
                    type:"text",
                    value:form.odNot||"",
                    onChange:function(e){setForm(function(p){return Object.assign({},p,{odNot:e.target.value});});},
                    placeholder:"Not...",
                    style:{width:"100%",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,padding:"9px 12px",color:"#e0e6f0",fontSize:12,outline:"none",boxSizing:"border-box"}
                  })
              )
            )
            , React.createElement('div', {style:{padding:"12px 18px",borderTop:"1px solid #2a3050",display:"flex",gap:8,justifyContent:"flex-end"}}
              , React.createElement('button', {onClick:function(){setManuelOdemeAcik(false);},style:{padding:"9px 18px",background:"#0d1321",border:"1px solid #2a3050",borderRadius:8,color:"#94a3b8",cursor:"pointer",fontWeight:600,fontSize:12}}, "İptal")
              , React.createElement('button', {
                  onClick:function(){
                    var aid=parseInt(form.odBinaId);
                    var tutar=parseFloat(form.odTutar)||0;
                    if(!aid||!tutar){alert("Bina ve tutar zorunlu!");return;}
                    var el=elevs.find(function(e){return e.id===aid;});
                    var now=new Date();
                    var saat=now.getHours().toString().padStart(2,"0")+":"+now.getMinutes().toString().padStart(2,"0");
                    var tarih=now.getFullYear()+"-"+(now.getMonth()+1).toString().padStart(2,"0")+"-"+now.getDate().toString().padStart(2,"0");
                    var yapildiSaat=tarih+" "+saat;

                    /* Sadece bu ay bakımcıya atanmış VE henüz tamamlanmamış (planlanmis:true, yapildi:false) kayıt varsa tamamlandıya işaretle */
                    var mevcut=mMonth.find(function(m){return m.asansorId===aid && m.planlanmis===true && !m.yapildi;});
                    if(mevcut){
                      /* Bakımcıya atanmış ve bekleyen bakım var → tamamlandı olarak güncelle */
                      setMaints(function(p){return p.map(function(x){return x.id===mevcut.id?Object.assign({},x,{alinanTutar:tutar,odendi:true,yapildi:true,yapildiSaat:yapildiSaat,notlar:form.odNot||x.notlar||""}):x;});});
                    } else {
                      /* Bakımcıya atanmamış veya zaten tamamlanmış → bakım durumunu DEĞİŞTİRME, sadece ödeme kaydı al */
                    }
                    /* Her durumda son ödemeler listesine ekle */
                    setSonOdemeler(function(p){return p.concat([{id:Date.now(),aid:aid,tarih:tarih,saat:saat,alinanTutar:tutar,not:form.odNot||"",binaAd:el?el.ad:"?",ilce:el?el.ilce:"",yonetici:el?el.yonetici:""}]);});
                    // NOT: bakiyeDevir burada değiştirilmez — ay kapanışında yeniDevir → bakiyeDevir geçer
                    setManuelOdemeAcik(false);
                    setForm(function(p){return Object.assign({},p,{odIlce:"",odBinaId:"",odTutar:"",odNot:""});});
                  },
                  style:{padding:"9px 20px",background:"linear-gradient(135deg,#10b981,#059669)",border:"none",borderRadius:8,color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer"}
                }, "✅ Kaydet")
            )
          )
        )
      )

      /* Yönetici şifre modal */
      , sifreModal&&(
        React.createElement('div', { className:"ios-modal-overlay", onClick:(e)=>{if(e.target===e.currentTarget)setSifreModal(false);},}
          , React.createElement('div', { className:"ios-modal-sheet", style:{maxWidth:420}},
            React.createElement('div', { className:"ios-modal-handle"}),
            React.createElement('div', { className:"ios-modal-header"},
              React.createElement('div', { className:"ios-modal-title"}, "🔒 Yönetici Girişi"),
              React.createElement('button', { onClick: ()=>setSifreModal(false), style: {background:"var(--bg-elevated)",border:"none",color:"var(--text-muted)",fontSize:15,cursor:"pointer",borderRadius:20,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600},}, "✕")
            ),
            React.createElement('div', { className:"ios-modal-body"},
              React.createElement('input', { type: "password", value: sifreInput, onChange: e=>{setSifreInput(e.target.value);setSifreHata("");},
                onKeyDown: e=>{if(e.key==="Enter"){if(sifreInput==="asis94"){firebaseLogin("yonetici@asistakip.app","asis94").then(()=>{setRol("yonetici");setTab(0);setSifreModal(false);});}else{setSifreHata("Hatalı şifre!");setSifreInput("")}}},
                placeholder: "Şifre girin", autoFocus: true,
                style: {...S.inp,fontSize:16,marginBottom:sifreHata?10:0}}),
              sifreHata&&React.createElement('div', { style: {fontSize:13,color:"var(--ios-red)",background:"rgba(255,59,48,0.1)",borderRadius:10,padding:"8px 12px"}}, "🚫 " , sifreHata)
            ),
            React.createElement('div', { style: {padding:"8px 18px 10px",display:"flex",gap:10}},
              React.createElement('button', { onClick: ()=>setSifreModal(false), style: {flex:1,padding:"13px",background:"var(--bg-elevated)",border:"none",borderRadius:14,color:"var(--text-muted)",cursor:"pointer",fontWeight:600,fontSize:15,minHeight:50}}, "İptal"),
              React.createElement('button', { onClick: ()=>{if(sifreInput==="asis94"){firebaseLogin("yonetici@asistakip.app","asis94").then(()=>{setRol("yonetici");setTab(0);setSifreModal(false);});}else{setSifreHata("Hatalı şifre!");setSifreInput("");}},
                style: {flex:1,padding:"13px",background:"var(--accent)",border:"none",borderRadius:14,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:15,minHeight:50}}, "Giriş")
            )
          )
        )
      )

      /* Ana Ekrana Ekle Banner */
      , React.createElement(InstallBanner, null)
    )
  );
}

export default App
