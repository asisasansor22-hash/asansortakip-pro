import React, { useState, useEffect, useRef, useMemo } from 'react'
import { dbGet, dbSet, dbSetRaw, firebaseLogout, firebaseLogin, auth, getTenantId, setTenantId, getTenantConfig, saveTenantConfig, getTenantSubscription, getTenantPublic, setTenantPublic, getUserProfile, isSuperAdmin, createBakimciUser, updateBakimciUser } from './firebase.js'
import { lsGet, lsSet } from './utils/storage.js'
import { EXCEL_ELEVS } from './data/elevators.js'
import {
  MONTHS, ISTANBUL_ILCELER, ILCE_RENK, ILCE_MAHALLELER,
  getIlceRenk, MahallePicker, KONTROL,
  S, Badge, IlceBadge, Stat, Card, Empty, IBtn, Tog, FF, AdresFF, FS, Modal
} from './utils/constants.js'
import LoginScreen from './components/LoginScreen.jsx'
import FirmaKoduGate from './components/FirmaKoduGate.jsx'
import FirmalarPaneli from './components/FirmalarPaneli.jsx'
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
import TeklifYonetimi from './components/TeklifYonetimi.jsx'
import { toXLSX, exportAsansorlerExcel, exportExcel } from './utils/excel.js'

// _optionalChain helper (Babel/Sucrase tarafından üretilen uyumluluk yardımcısı)
function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }

/** Finans: ödeme tarihi (YYYY-MM-DD, DD.MM.YYYY) — yerel gün kaymasını azaltmak için öğlen parse */
function parseFinansDate(raw){
  if(raw==null||raw==="") return null;
  var s=String(raw).trim();
  var m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if(m){
    var d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
    if(!isNaN(d.getTime())){ d.setHours(12,0,0,0); return d; }
  }
  m=s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if(m){
    var d2=new Date(Number(m[3]),Number(m[2])-1,Number(m[1]));
    if(!isNaN(d2.getTime())){ d2.setHours(12,0,0,0); return d2; }
  }
  var d3=new Date(s);
  if(!isNaN(d3.getTime())) return d3;
  return null;
}
function finansTutar(v){ var n=Number(v); return isNaN(n)?0:n; }
/** Bakımda fiilen tahsil edilen tutar: alinanTutar 0 olsa da 0 kabul et (|| tutar ile 0'ın ezilmesini önler — Geri Al sonrası liste/toplamlar düzelir). Alan yoksa eski kayıt için tutar. */
function finansMaintAlinan(m){
  if(!m) return 0;
  if(m.alinanTutar!==undefined && m.alinanTutar!==null && m.alinanTutar!=="") return finansTutar(m.alinanTutar);
  return finansTutar(m.tutar);
}
/** Finans listesi: bakım sentetik satırında saat — m.saat yoksa yapildiSaat'ten (BakimciGorunum ile uyum) */
function finansSaatFromMaint(m){
  if(!m) return "--:--";
  var raw=String(m.saat||"").trim();
  if(raw&&raw!=="--:--"){
    if(/^\d{1,2}:\d{2}/.test(raw)) return raw.substring(0,5);
    return raw;
  }
  var ys=m.yapildiSaat;
  if(ys==null||ys==="") return "--:--";
  var str=String(ys).trim();
  var parts=str.split(/\s+/).filter(Boolean);
  if(parts.length>=2){
    var t=parts[parts.length-1];
    if(/^\d{1,2}:\d{2}/.test(t)) return t.substring(0,5);
  }
  var mm=str.match(/(\d{1,2}):(\d{2})/);
  if(mm){
    var hn=Number(mm[1]);
    return (isNaN(hn)?0:hn).toString().padStart(2,"0")+":"+mm[2];
  }
  return "--:--";
}
/** Bakım kaydındaki tahsilat, aynı tutar+asansör sonOdemeler'de yoksa ekle (çift sayım yok) */
function maintTahsilatNotInSonOdemeler(sonOdemeler,maints,ayBas,aySon){
  return maints.filter(function(m){
    var amt=finansMaintAlinan(m);
    if(!m.yapildi||amt<=0) return false;
    var od=parseFinansDate(m.tarih);
    if(!od||od<ayBas||od>aySon) return false;
    return !hasSonOdemeMatchForMaint(sonOdemeler,m,ayBas,aySon,amt);
  }).reduce(function(s,m){ return s+finansMaintAlinan(m); },0);
}
function hasSonOdemeMatchForMaint(sonOdemeler,m,bas,son,amt){
  function dateKeyFromAny(v){
    var d=parseFinansDate(v);
    if(!d) return "";
    var y=d.getFullYear();
    var mo=String(d.getMonth()+1).padStart(2,"0");
    var da=String(d.getDate()).padStart(2,"0");
    return y+"-"+mo+"-"+da;
  }
  var maintDateKey=dateKeyFromAny(m&&m.yapildiSaat)||dateKeyFromAny(m&&m.tarih);
  return (sonOdemeler||[]).some(function(o){
    if(!o||o.iptal) return false;
    if(Number(o.aid)!==Number(m.asansorId)) return false;
    if(finansTutar(o.alinanTutar)!==finansTutar(amt)) return false;
    var od=parseFinansDate(o.tarih);
    if(!od) return false;
    if(bas&&od<bas) return false;
    if(son&&od>son) return false;
    // Aynı asansörde aynı tutar tekrar edebildiği için günü de eşleştir.
    // Böylece farklı günlerdeki kısmi tahsilatlar yanlışlıkla "zaten var" sayılıp düşmez.
    var odemeDateKey=dateKeyFromAny(o.tarih);
    if(maintDateKey&&odemeDateKey&&maintDateKey!==odemeDateKey) return false;
    return true;
  });
}

var DASHBOARD_CARD_SIZES=["small","medium","full"];
var DASHBOARD_CARDS_DEFAULT=[
  {id:"planBadge",icon:"🚀",label:"Plan Kullanım Badge",desc:"Paket ve asansör limiti",enabled:true,size:"small"},
  {id:"quickStats",icon:"📦",label:"Hızlı Durum Kartları",desc:"Toplam asansör, arıza, bakım",enabled:true,size:"medium"},
  {id:"financeSummary",icon:"💰",label:"Bu Dönem Finansal Özet",desc:"Tahsil / Hedef / Bekleyen",enabled:true,size:"full"},
  {id:"totalDevir",icon:"📊",label:"Toplam Devir Bakiye",desc:"Tüm asansörlerin devri",enabled:true,size:"medium"},
  {id:"openFaults",icon:"⚠️",label:"Açık Arızalar Listesi",desc:"Son 5 açık arıza",enabled:true,size:"medium",lockEnabled:true},
  {id:"districtStatus",icon:"🗺️",label:"İlçe Durumu",desc:"İlçe bazlı bakım oranı",enabled:true,size:"small"},
  {id:"faultTrend",icon:"📈",label:"Arıza Trendi",desc:"Son 6 ay arıza grafiği",enabled:true,size:"small"},
  {id:"maintenancePerformance",icon:"👨‍🔧",label:"Bakım Performansı",desc:"Bu ay / toplam / ödenmemiş",enabled:true,size:"small"},
  {id:"inspectionAlerts",icon:"🔍",label:"Muayene Uyarıları",desc:"Geciken ve yaklaşan",enabled:true,size:"small"},
  {id:"contractAlerts",icon:"📄",label:"Sözleşme Uyarıları",desc:"Biten ve yaklaşan",enabled:true,size:"small"}
];
function normalizeDashboardLayout(raw){
  var fallback=DASHBOARD_CARDS_DEFAULT.map(function(c){return {id:c.id,enabled:c.enabled!==false,size:c.size||"medium"};});
  if(!Array.isArray(raw)||raw.length===0) return fallback;
  var map={};
  raw.forEach(function(it){
    if(!it||!it.id) return;
    var size=(typeof it.size==="string"&&DASHBOARD_CARD_SIZES.indexOf(it.size)>=0)?it.size:"medium";
    map[it.id]={id:String(it.id),enabled:it.enabled!==false,size:size};
  });
  var ordered=[];
  DASHBOARD_CARDS_DEFAULT.forEach(function(c){
    var locked=c.lockEnabled===true;
    if(map[c.id]){
      ordered.push({id:c.id,enabled:locked?true:map[c.id].enabled,size:map[c.id].size||c.size||"medium"});
      delete map[c.id];
    } else {
      ordered.push({id:c.id,enabled:c.enabled!==false,size:c.size||"medium"});
    }
  });
  return ordered;
}

// Rota yardımcı fonksiyonları
function routeAddressKey(e){ return [e.ad||"",e.semt||"",e.adres||"",e.ilce||""].join(" | "); }
function routeAddressLabel(e){ return (e.semt?e.semt+" Mahallesi, ":"")+(e.adres||"")+(e.ilce?", "+e.ilce+", İstanbul":""); }
function getElevCoords(e){
  var lat=Number(e&&e.lat);
  var lng=Number(e&&e.lng);
  if(Number.isFinite(lat)&&Number.isFinite(lng)) return {lat:lat,lng:lng};
  return null;
}
function isUsableIstanbulCoord(lat,lng){
  return Number.isFinite(lat)&&Number.isFinite(lng)&&lat>=40.5&&lat<=41.6&&lng>=28.0&&lng<=30.0;
}
function parseGoogleMapsCoords(value){
  var text=String(value||"").trim();
  if(!text) return null;
  text=text.replace(/&amp;/g,"&");
  try{text=decodeURIComponent(text);}catch(e){}
  var patterns=[
    /!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/g,
    /!1d(-?\d+(?:\.\d+)?)!2d(-?\d+(?:\.\d+)?)/g,
    /@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/g,
    /[?&](?:q|query|ll)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/g,
    /(-?\d{2}\.\d+)\s*,\s*(-?\d{2}\.\d+)/g
  ];
  for(var p=0;p<patterns.length;p++){
    var re=patterns[p]; var m;
    while((m=re.exec(text))!==null){
      var a=Number(m[1]); var b=Number(m[2]);
      var lat=p===0?b:a;
      var lng=p===0?a:b;
      if(isUsableIstanbulCoord(lat,lng)) return {lat:lat,lng:lng};
    }
  }
  return null;
}
function routeMapTarget(e){
  var coords=getElevCoords(e);
  return coords?(coords.lat+","+coords.lng):routeAddressLabel(e);
}
function buildGoogleMapsUrl(targets,origin){
  if(!targets||targets.length===0) return "";
  var base="https://www.google.com/maps/dir/?api=1";
  if(origin) base+="&origin="+encodeURIComponent(origin);
  base+="&destination="+encodeURIComponent(targets[targets.length-1]);
  if(targets.length>1) base+="&waypoints="+targets.slice(0,-1).map(function(a){return encodeURIComponent(a);}).join("|");
  base+="&travelmode=driving";
  return base;
}
function buildGoogleMapsChunks(elevs,origin){
  if(!elevs||elevs.length===0) return [];
  var chunks=[]; var startIndex=0; var currentOrigin=origin||"";
  while(startIndex<elevs.length){
    var chunkElevs=elevs.slice(startIndex,startIndex+GOOGLE_MAPS_MAX_STOPS_PER_LINK);
    var targets=chunkElevs.map(function(e){return routeMapTarget(e);});
    chunks.push({url:buildGoogleMapsUrl(targets,currentOrigin),start:startIndex+1,end:startIndex+chunkElevs.length});
    currentOrigin=targets[targets.length-1];
    startIndex+=chunkElevs.length;
  }
  return chunks;
}
function deg2rad(v){ return v*(Math.PI/180); }
function haversineKm(a,b){
  if(!a||!b) return Infinity;
  var R=6371;
  var dLat=deg2rad((b.lat||0)-(a.lat||0));
  var dLon=deg2rad((b.lng||0)-(a.lng||0));
  var lat1=deg2rad(a.lat||0); var lat2=deg2rad(b.lat||0);
  var x=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));
}
const ROAD_ROUTE_MAX_COORDS=100;
const EXACT_ROUTE_MAX_POINTS=16;
const GOOGLE_MAPS_MAX_STOPS_PER_LINK=10;
const ROUTE_IMPROVE_EPS=0.0001;
const LARGE_ROUTE_COST=999999999;
function createHaversineCost(startPoint){
  return function(prev,next){
    var from=prev?prev.coords:startPoint;
    if(!from||!next||!next.coords) return 0;
    return haversineKm(from,next.coords);
  };
}
function routeCost(order,startPoint,costBetween){
  var costFn=costBetween||createHaversineCost(startPoint);
  var total=0; var prev=null;
  order.forEach(function(p){
    var cost=costFn(prev,p);
    if(Number.isFinite(cost)) total+=cost; else total+=LARGE_ROUTE_COST;
    prev=p;
  });
  return total;
}
function routeTotalKm(order,startPoint,distanceBetween){
  var distanceFn=distanceBetween||createHaversineCost(startPoint);
  var total=0; var prev=null;
  order.forEach(function(p){
    if(!p.coords) return;
    var km=distanceFn(prev,p);
    if(Number.isFinite(km)) total+=km;
    prev=p;
  });
  return total;
}
function selectRouteStarts(points,startPoint,costBetween){
  if(points.length<=25) return points.slice();
  var maxStarts=points.length<=40?10:6;
  var starts=[]; var seen={};
  function add(p){
    if(!p) return;
    var key=p.elev&&p.elev.id!==undefined?p.elev.id:points.indexOf(p);
    if(seen[key]) return;
    seen[key]=true; starts.push(p);
  }
  if(startPoint){
    var byStart=points.slice().sort(function(a,b){return costBetween(null,a)-costBetween(null,b);});
    byStart.slice(0,Math.max(4,maxStarts-2)).forEach(add);
    byStart.slice(-2).forEach(add);
  }else{
    var byManual=points.slice().sort(function(a,b){return (a.manualIndex||0)-(b.manualIndex||0);});
    add(byManual[0]); add(byManual[byManual.length-1]);
    add(points.slice().sort(function(a,b){return (a.coords.lng||0)-(b.coords.lng||0);})[0]);
    add(points.slice().sort(function(a,b){return (b.coords.lng||0)-(a.coords.lng||0);})[0]);
    add(points.slice().sort(function(a,b){return (a.coords.lat||0)-(b.coords.lat||0);})[0]);
    add(points.slice().sort(function(a,b){return (b.coords.lat||0)-(a.coords.lat||0);})[0]);
  }
  points.forEach(function(p){ if(starts.length<maxStarts) add(p); });
  return starts.slice(0,maxStarts);
}
function greedyRoute(points,startPoint,costBetween,firstPoint){
  var remaining=points.slice(); var ordered=[]; var current=null;
  if(firstPoint){
    var firstIdx=remaining.indexOf(firstPoint);
    if(firstIdx>=0){ current=remaining.splice(firstIdx,1)[0]; ordered.push(current); }
  }
  while(remaining.length){
    var bestIdx=0; var bestScore=Infinity;
    remaining.forEach(function(p,i){
      var score=current?costBetween(current,p):costBetween(null,p);
      if(score<bestScore){bestScore=score;bestIdx=i;}
    });
    current=remaining.splice(bestIdx,1)[0];
    ordered.push(current);
  }
  return ordered;
}
function sweepRoute(points,startPoint,costBetween,reverse){
  if(points.length<=1) return points.slice();
  var center=points.reduce(function(a,p){a.lat+=p.coords.lat||0;a.lng+=p.coords.lng||0;return a;},{lat:0,lng:0});
  center.lat/=points.length; center.lng/=points.length;
  var ordered=points.slice().sort(function(a,b){
    var aa=Math.atan2((a.coords.lat||0)-center.lat,(a.coords.lng||0)-center.lng);
    var bb=Math.atan2((b.coords.lat||0)-center.lat,(b.coords.lng||0)-center.lng);
    return reverse?bb-aa:aa-bb;
  });
  if(startPoint){
    var bestIdx=0; var bestCost=Infinity;
    ordered.forEach(function(p,i){var cost=costBetween(null,p); if(cost<bestCost){bestCost=cost;bestIdx=i;}});
    ordered=ordered.slice(bestIdx).concat(ordered.slice(0,bestIdx));
  }
  return ordered;
}
function optimizeRouteExact(points,startPoint,costBetween){
  var n=points.length;
  if(n===0) return [];
  if(n>EXACT_ROUTE_MAX_POINTS) return null;
  var stateCount=1<<n;
  var dp=new Float64Array(stateCount*n);
  var parent=new Int16Array(stateCount*n);
  for(var d=0;d<dp.length;d++) dp[d]=Infinity;
  parent.fill(-1);
  for(var i=0;i<n;i++){
    var startCost=startPoint?costBetween(null,points[i]):0;
    if(!Number.isFinite(startCost)) startCost=LARGE_ROUTE_COST;
    dp[((1<<i)*n)+i]=startCost;
  }
  for(var mask=1;mask<stateCount;mask++){
    for(var last=0;last<n;last++){
      var baseIdx=mask*n+last;
      var baseCost=dp[baseIdx];
      if(!Number.isFinite(baseCost)) continue;
      for(var next=0;next<n;next++){
        var bit=1<<next;
        if(mask&bit) continue;
        var step=costBetween(points[last],points[next]);
        if(!Number.isFinite(step)) step=LARGE_ROUTE_COST;
        var nextMask=mask|bit;
        var nextIdx=nextMask*n+next;
        var candidate=baseCost+step;
        if(candidate+ROUTE_IMPROVE_EPS<dp[nextIdx]){
          dp[nextIdx]=candidate;
          parent[nextIdx]=last;
        }
      }
    }
  }
  var fullMask=stateCount-1; var bestLast=-1; var bestCost=Infinity;
  for(var end=0;end<n;end++){
    var cost=dp[fullMask*n+end];
    if(cost<bestCost){bestCost=cost;bestLast=end;}
  }
  if(bestLast<0||bestCost>=LARGE_ROUTE_COST/2) return null;
  var route=[]; var current=bestLast; var currentMask=fullMask;
  while(current>=0){
    route.push(points[current]);
    var idx=currentMask*n+current;
    var prev=parent[idx];
    currentMask=currentMask^(1<<current);
    current=prev;
  }
  return route.reverse();
}
function improveTwoOpt(order,startPoint,costBetween){
  if(order.length<4) return order.slice();
  var best=order.slice(); var bestCost=routeCost(best,startPoint,costBetween);
  var maxPasses=order.length>60?2:4; var pass=0; var improved=true;
  while(improved&&pass<maxPasses){
    improved=false; pass++;
    for(var i=0;i<best.length-1;i++){
      for(var j=i+1;j<best.length;j++){
        var candidate=best.slice(0,i).concat(best.slice(i,j+1).reverse(),best.slice(j+1));
        var candidateCost=routeCost(candidate,startPoint,costBetween);
        if(candidateCost+ROUTE_IMPROVE_EPS<bestCost){
          best=candidate; bestCost=candidateCost; improved=true;
        }
      }
    }
  }
  return best;
}
function improveRelocate(order,startPoint,costBetween){
  if(order.length<3) return order.slice();
  var best=order.slice(); var bestCost=routeCost(best,startPoint,costBetween);
  var maxPasses=order.length>60?1:3; var pass=0; var improved=true;
  while(improved&&pass<maxPasses){
    improved=false; pass++;
    for(var i=0;i<best.length;i++){
      for(var pos=0;pos<=best.length;pos++){
        if(pos===i||pos===i+1) continue;
        var candidate=best.slice();
        var moved=candidate.splice(i,1)[0];
        var insertAt=pos>i?pos-1:pos;
        candidate.splice(insertAt,0,moved);
        var candidateCost=routeCost(candidate,startPoint,costBetween);
        if(candidateCost+ROUTE_IMPROVE_EPS<bestCost){
          best=candidate; bestCost=candidateCost; improved=true;
        }
      }
    }
  }
  return best;
}
function improveSwap(order,startPoint,costBetween){
  if(order.length<4) return order.slice();
  var best=order.slice(); var bestCost=routeCost(best,startPoint,costBetween);
  var maxPasses=order.length>70?1:2; var pass=0; var improved=true;
  while(improved&&pass<maxPasses){
    improved=false; pass++;
    for(var i=0;i<best.length-1;i++){
      for(var j=i+1;j<best.length;j++){
        var candidate=best.slice();
        var tmp=candidate[i]; candidate[i]=candidate[j]; candidate[j]=tmp;
        var candidateCost=routeCost(candidate,startPoint,costBetween);
        if(candidateCost+ROUTE_IMPROVE_EPS<bestCost){
          best=candidate; bestCost=candidateCost; improved=true;
        }
      }
    }
  }
  return best;
}
function improveSegmentRelocate(order,startPoint,costBetween){
  if(order.length<5) return order.slice();
  var best=order.slice(); var bestCost=routeCost(best,startPoint,costBetween);
  var maxPasses=order.length>70?1:2; var pass=0; var improved=true;
  while(improved&&pass<maxPasses){
    improved=false; pass++;
    for(var segmentSize=2;segmentSize<=3;segmentSize++){
      if(segmentSize>=best.length) continue;
      for(var i=0;i<=best.length-segmentSize;i++){
        for(var pos=0;pos<=best.length;pos++){
          if(pos>=i&&pos<=i+segmentSize) continue;
          var candidate=best.slice();
          var segment=candidate.splice(i,segmentSize);
          var insertAt=pos>i?pos-segmentSize:pos;
          candidate.splice.apply(candidate,[insertAt,0].concat(segment));
          var candidateCost=routeCost(candidate,startPoint,costBetween);
          if(candidateCost+ROUTE_IMPROVE_EPS<bestCost){
            best=candidate; bestCost=candidateCost; improved=true;
          }
        }
      }
    }
  }
  return best;
}
function polishRoute(order,startPoint,costBetween){
  var best=order.slice();
  best=improveTwoOpt(best,startPoint,costBetween);
  best=improveRelocate(best,startPoint,costBetween);
  best=improveSwap(best,startPoint,costBetween);
  best=improveSegmentRelocate(best,startPoint,costBetween);
  best=improveTwoOpt(best,startPoint,costBetween);
  return best;
}
function optimizeRoute(points,startPoint,costBetween){
  if(points.length<=1) return points.slice();
  var costFn=costBetween||createHaversineCost(startPoint);
  var exact=optimizeRouteExact(points,startPoint,costFn);
  if(exact) return exact;
  var starts=selectRouteStarts(points,startPoint,costFn);
  var bestOrder=null; var bestCost=Infinity;
  var candidates=[];
  starts.forEach(function(firstPoint){ candidates.push(greedyRoute(points,startPoint,costFn,firstPoint)); });
  candidates.push(sweepRoute(points,startPoint,costFn,false));
  candidates.push(sweepRoute(points,startPoint,costFn,true));
  candidates.forEach(function(candidate){
    candidate=polishRoute(candidate,startPoint,costFn);
    var candidateCost=routeCost(candidate,startPoint,costFn);
    if(candidateCost<bestCost){ bestCost=candidateCost; bestOrder=candidate; }
  });
  return bestOrder||points.slice();
}
async function getRoadCostContext(points,startPoint){
  if(points.length<2||typeof fetch!=="function") return null;
  var hasStart=!!startPoint;
  if(points.length+(hasStart?1:0)>ROAD_ROUTE_MAX_COORDS) return null;
  var matrixPoints=points.map(function(p,i){return Object.assign({},p,{_routeIndex:hasStart?i+1:i});});
  var coords=(hasStart?[startPoint]:[]).concat(matrixPoints.map(function(p){return p.coords;}));
  if(coords.some(function(c){return !c||!Number.isFinite(Number(c.lat))||!Number.isFinite(Number(c.lng));})) return null;
  var coordStr=coords.map(function(c){return Number(c.lng)+","+Number(c.lat);}).join(";");
  var url="https://router.project-osrm.org/table/v1/driving/"+coordStr+"?annotations=distance";
  var controller=typeof AbortController!=="undefined"?new AbortController():null;
  var timer=controller?setTimeout(function(){controller.abort();},5500):null;
  try{
    var res=await fetch(url,controller?{signal:controller.signal}:undefined);
    if(!res.ok) return null;
    var data=await res.json();
    if(data.code&&data.code!=="Ok") return null;
    if(!Array.isArray(data.distances)) return null;
    return {
      points:matrixPoints,
      costBetween:function(prev,next){
        var fromIdx=prev?prev._routeIndex:(hasStart?0:null);
        if(fromIdx===null) return 0;
        var toIdx=next&&next._routeIndex;
        var v=data.distances[fromIdx]&&data.distances[fromIdx][toIdx];
        return Number.isFinite(v)?v/1000:Infinity;
      },
      distanceBetween:function(prev,next){
        var fromIdx=prev?prev._routeIndex:(hasStart?0:null);
        if(fromIdx===null) return 0;
        var toIdx=next&&next._routeIndex;
        var v=data.distances[fromIdx]&&data.distances[fromIdx][toIdx];
        return Number.isFinite(v)?v/1000:Infinity;
      }
    };
  }catch(e){
    return null;
  }finally{
    if(timer) clearTimeout(timer);
  }
}
async function getBackendRouteContext(points,startPoint){
  if(points.length<2||typeof fetch!=="function") return null;
  var payload={
    start:startPoint?{lat:Number(startPoint.lat),lng:Number(startPoint.lng)}:null,
    stops:points.map(function(p){return {id:p.elev&&p.elev.id,lat:Number(p.coords.lat),lng:Number(p.coords.lng)};})
  };
  var controller=typeof AbortController!=="undefined"?new AbortController():null;
  var timer=controller?setTimeout(function(){controller.abort();},22000):null;
  try{
    var res=await fetch("/api/optimize-route",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify(payload),
      signal:controller?controller.signal:undefined
    });
    if(!res.ok) return null;
    var data=await res.json();
    if(!data||!Array.isArray(data.orderedIds)) return null;
    var byId={};
    points.forEach(function(p){byId[String(p.elev&&p.elev.id)]=p;});
    var ordered=[];
    data.orderedIds.forEach(function(id){
      var p=byId[String(id)];
      if(p) ordered.push(p);
    });
    if(ordered.length!==points.length) return null;
    return {
      points:ordered,
      totalKm:Number.isFinite(Number(data.totalKm))?Number(data.totalKm):null,
      mode:data.mode||"",
      distanceSource:data.distanceSource||"",
      warnings:Array.isArray(data.warnings)?data.warnings:[]
    };
  }catch(e){
    return null;
  }finally{
    if(timer) clearTimeout(timer);
  }
}


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
  const [teklifler,setTeklifler]=useState([]);
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
  const [rotaEditingId,setRotaEditingId]=useState(null);
  const [rotaEditingVal,setRotaEditingVal]=useState({adres:"",semt:"",ilce:""});
  const [rotaGeoCache,setRotaGeoCache]=useState(function(){return lsGet("at_geo_cache")||{};});
  const [rotaOtomatikIds,setRotaOtomatikIds]=useState([]);
  const [rotaHesaplaniyor,setRotaHesaplaniyor]=useState(false);
  const [rotaOptHata,setRotaOptHata]=useState("");
  const [rotaTahminiKm,setRotaTahminiKm]=useState(null);
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
  const [finansYenileniyor,setFinansYenileniyor]=useState(false);
  const [giderler,setGiderler]=useState([]);
  const [giderForm,setGiderForm]=useState({tarih:"",aciklama:"",tutar:""});
  const [giderFormAcik,setGiderFormAcik]=useState(false);
  const [giderHaftaArsiv,setGiderHaftaArsiv]=useState([]);
  const [muayeneler,setMuayeneler]=useState([]);
  const [asansorDetay,setAsansorDetay]=useState(null); // bakım geçmişi için
  const [bakimcilar,setBakimcilar]=useState(function(){var c=lsGet("ls_bakimcilar");return Array.isArray(c)?c:[];}); // login ekranı için localStorage'dan
  const [aktifBakimci,setAktifBakimci]=useState(null); // giriş yapan bakımcı objesi
  // ---- Çoklu firma (tenant) durumu ----
  const [tenantId,setTenantIdState]=useState(function(){return getTenantId();});
  // tenantConfig: login öncesi public (ad, adminEmail), login sonrası full config ile zenginleştirilir
  const [tenantConfig,setTenantConfig]=useState(null);
  const [subscription,setSubscription]=useState(null);
  const [isSuper,setIsSuper]=useState(false);
  const [userProfile,setUserProfile]=useState(null);
  const [firmalarAcik,setFirmalarAcik]=useState(false);
  const [firmaAyarlariAcik,setFirmaAyarlariAcik]=useState(false);
  const [firmaAyarlariForm,setFirmaAyarlariForm]=useState({});
  const [firmaAyarlariKaydediliyor,setFirmaAyarlariKaydediliyor]=useState(false);
  const [dashboardEditorAcik,setDashboardEditorAcik]=useState(false);
  const [dashboardLayout,setDashboardLayout]=useState(function(){ return normalizeDashboardLayout(null); });
  const [dashboardKaydediliyor,setDashboardKaydediliyor]=useState(false);
  const [dashboardRange,setDashboardRange]=useState("month");
  // FirmaKoduGate'den gelen public bilgi (ad, adminEmail) — şifre içermez
  function handleFirmaKodu(slug, pub){ setTenantIdState(slug); setTenantConfig(pub||null); }
  function farkliFirma(){ setTenantId(null); setTenantIdState(null); setTenantConfig(null); setRol(null); firebaseLogout(); }
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
  const haftalikKapamaRef=React.useRef([]);
  useEffect(function(){haftalikKapamaRef.current=haftalikKapamalar;},[haftalikKapamalar]);

  useEffect(function(){
    if(!tenantId) { setDashboardLayout(normalizeDashboardLayout(null)); return; }
    var key="at_dashboard_layout_"+tenantId;
    setDashboardLayout(normalizeDashboardLayout(lsGet(key)));
  },[tenantId]);
  useEffect(function(){
    if(!tenantId) return;
    if(!(tenantConfig&&Array.isArray(tenantConfig.dashboardLayout)&&tenantConfig.dashboardLayout.length>0)) return;
    setDashboardLayout(normalizeDashboardLayout(tenantConfig.dashboardLayout));
  },[tenantId,tenantConfig&&tenantConfig.dashboardLayout]);
  useEffect(function(){
    if(!tenantId) return;
    lsSet("at_dashboard_layout_"+tenantId,dashboardLayout);
  },[tenantId,dashboardLayout]);

  // Login öncesi pre-auth yükleme: public bilgiler + bakımcı listesi (public/bakimcilar, şifresiz)
  useEffect(function(){
    if(!tenantId) return;
    // Tenant değiştiğinde önceki tenant'ın localStorage cache'lerini temizle (cross-tenant sızıntıyı önler)
    var lastTenant=lsGet("ls_last_tenant");
    if(lastTenant && lastTenant!==tenantId){
      ["ls_elevs","ls_maints","ls_aylik","ls_sonodemeler","ls_bakimcilar"].forEach(function(k){lsSet(k,null);});
      setBakimcilar([]);
    }
    lsSet("ls_last_tenant",tenantId);
    async function yukPublic(){
      try{
        var pub=await getTenantPublic(tenantId);
        var bakList=null;
        if(pub){
          if(pub.bakimcilar && Array.isArray(pub.bakimcilar) && pub.bakimcilar.length>0)
            bakList=pub.bakimcilar;
          if(!tenantConfig) setTenantConfig(pub);
        }
        // Asis için yedek: public yoksa at_bakimcilar_pub flat path'inden oku (auth gerektirmez)
        if(!bakList && tenantId==="asis"){
          var pubRaw=await import('./firebase.js').then(function(m){return m.dbGetRaw("at_bakimcilar_pub");});
          if(Array.isArray(pubRaw) && pubRaw.length>0) bakList=pubRaw;
        }
        if(bakList){
          setBakimcilar(bakList);
          lsSet("ls_bakimcilar",bakList);
        }
      }catch(e){}
    }
    yukPublic();
  },[tenantId]);

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
          dbGet("at_teklifler"),   // r13
          dbGet("at_muayeneler"),  // r14
          dbGet("at_bakimcilar"),  // r15
        ]);
        var r1=sonuclar[0],r2=sonuclar[1],r3=sonuclar[2],r4=sonuclar[3];
        var r5=sonuclar[4],r6=sonuclar[5],r7=sonuclar[6],r8=sonuclar[7];
        var r9=sonuclar[8],r10=sonuclar[9],r11=sonuclar[10],r12=sonuclar[11],r13=sonuclar[12],r14=sonuclar[13],r15=sonuclar[14],r16=sonuclar[15];
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
                else if(tenantId==="asis"){ setElevs(EXCEL_ELEVS); dbSet("at_elevs",EXCEL_ELEVS); }
                else{ setElevs([]); }
              }
            }catch(e){
              if(lsBak&&lsBak.length>0){ setElevs(lsBak); }
              else if(tenantId==="asis"){ setElevs(EXCEL_ELEVS); }
              else{ setElevs([]); }
            }
          } else {
            // Firebase erişilemedi (null) — asla EXCEL_ELEVS yazma, yedekten yükle
            if(lsBak&&lsBak.length>0){
              setElevs(lsBak);
            } else if(tenantId==="asis") {
              // İlk açılış: Firebase da yok, yedek de yok → Excel ile başlat (sadece Asis)
              setElevs(EXCEL_ELEVS);
              dbSet("at_elevs",EXCEL_ELEVS);
            } else {
              setElevs([]);
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
        if(r14){try{var d=fb(r14);if(Array.isArray(d))setTeklifler(d);}catch(e){}}
        if(r15){try{var d=fb(r15);if(Array.isArray(d))setMuayeneler(d);}catch(e){}}
        if(r16){try{var d=fb(r16);if(Array.isArray(d)){setBakimcilar(d);lsSet("ls_bakimcilar",d);}}catch(e){}}
        // Login sonrası tam config + subscription yükle (auth gerektirir)
        try{
          var cfg=await getTenantConfig(tenantId);
          if(cfg) setTenantConfig(function(prev){ return Object.assign({},prev||{},cfg); });
          var sub=await getTenantSubscription(tenantId);
          if(sub) setSubscription(sub);
        }catch(e){}
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
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_teklifler",teklifler);}},[teklifler]);
  useEffect(function(){if(!ilkYukleme.current){dbSet("at_muayeneler",muayeneler);}},[muayeneler]);
  useEffect(function(){
    if(!ilkYukleme.current){
      dbSet("at_bakimcilar",bakimcilar);
      lsSet("ls_bakimcilar",bakimcilar);
      if(tenantId){
        var pubList=bakimcilar.map(function(b){return {id:b.id,ad:b.ad,renk:b.renk||"#3b82f6",hasSifre:!!(b.sifre)};});
        setTenantPublic(tenantId,Object.assign({},tenantConfig||{},{bakimcilar:pubList}));
        // Asis için auth gerektirmeyen yedek public path'e de yaz
        if(tenantId==="asis") dbSetRaw("at_bakimcilar_pub", pubList);
      }
    }
  },[bakimcilar]);

  // Finans sekmesi için canlı yenileme
  const finansYenile=React.useCallback(async function(){
    setFinansYenileniyor(true);
    try{
      var [rO,rM]=await Promise.all([dbGet("at_sonodemeler"),dbGet("at_maints")]);
      if(rO){var d=Array.isArray(rO)?rO:(typeof rO==='string'?JSON.parse(rO):null);if(Array.isArray(d)){setSonOdemeler(d);lsSet("ls_sonodemeler",d);}}
      if(rM){var d2=Array.isArray(rM)?rM:(typeof rM==='string'?JSON.parse(rM):null);if(Array.isArray(d2)){setMaints(d2);lsSet("ls_maints",d2);}}
    }catch(e){}
    setFinansYenileniyor(false);
  },[]);

  // Finans sekmesinde otomatik 2 dakikada bir yenile
  React.useEffect(function(){
    if(tab!==6||rol!=="yonetici") return;
    var t=setInterval(finansYenile,120000);
    return function(){clearInterval(t);};
  },[tab,rol,finansYenile]);

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
      var lsKey="kapama_"+kapamaKey;
      var zatenKapandi=localStorage.getItem(lsKey)||haftalikKapamaRef.current.find(function(k){return k.kapamaKey===kapamaKey;});
      if(zatenKapandi) return;
      var baslangic=new Date(simdi);
      baslangic.setDate(simdi.getDate()-6);
      baslangic.setHours(0,0,0,0);
      var bitis=new Date(simdi);
      bitis.setHours(23,59,59,999);
      var donemOdemeleri=sonOdemeler.filter(function(o){
        var d=new Date(o.tarih);
        return !isNaN(d)&&d>=baslangic&&d<=bitis;
      });
      setHaftalikKapamalar(function(prev){
        var zatenVar=prev.find(function(k){return k.kapamaKey===kapamaKey;});
        if(zatenVar) return prev;
        var basStr=baslangic.toLocaleDateString("tr-TR");
        var bitStr=bitis.toLocaleDateString("tr-TR");
        var snap={
          id:Date.now(),
          kapamaKey:kapamaKey,
          tip:"haftalik",
          baslarken:basStr,
          biterken:bitStr,
          kapamaZamani:simdi.toLocaleString("tr-TR"),
          odemeler:donemOdemeleri.slice(),
          toplam:donemOdemeleri.reduce(function(s,o){return s+(o.alinanTutar||0);},0),
          odemeAdedi:donemOdemeleri.length
        };
        var yeni=[snap,...prev];
        if(yeni.length>26) yeni=yeni.slice(0,26);
        return yeni;
      });
      try{localStorage.setItem(lsKey,"1");}catch(e){}
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
      var ayBaslangic=new Date(yil,ay,1);ayBaslangic.setHours(0,0,0,0);
      var aySon=new Date(yil,ay+1,0);aySon.setHours(23,59,59,999);
      var donemOdemeleri=sonOdemeler.filter(function(o){
        var d=new Date(o.tarih);
        return !isNaN(d)&&d>=ayBaslangic&&d<=aySon;
      });
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
          odemeler:donemOdemeleri.slice(),
          toplam:donemOdemeleri.reduce(function(s,o){return s+(o.alinanTutar||0);},0),
          odemeAdedi:donemOdemeleri.length
        };
        var yeni=[snap,...prev];
        if(yeni.length>12) yeni=yeni.slice(0,12);
        return yeni;
      });
      // Devir hesabı zaten yapıldıysa tekrar yapma
      if(zatenKapandi) return;
      // localStorage'a hemen kaydet — Firebase yazılmadan sayfa yenilenirse tekrar çalışmasın
      try{localStorage.setItem(lsKey,"1");}catch(e){}
      /* Ay kapanışında: her asansör için yeniDevir → bakiyeDevir olarak geçir */
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
            var sonOdemelerAlinan=sonOdemeler.filter(function(o){
              var od=new Date(o.tarih);
              return Number(o.aid)===Number(ev.id)&&!o.iptal&&od>=ayBaslangic&&od<=aySon;
            }).reduce(function(s,o){return s+(o.alinanTutar||0);},0);
            // sonOdemeler'de kayıt yoksa maints.alinanTutar'a fallback yap (eski kayıtlar için)
            var ekstraAlinan=0;
            if(sonOdemelerAlinan===0){
              ekstraAlinan=maints.filter(function(m){
                var md=new Date(m.tarih);
                return Number(m.asansorId)===Number(ev.id)&&m.yapildi&&m.odendi&&md>=ayBaslangic&&md<=aySon;
              }).reduce(function(s,m){return s+finansMaintAlinan(m);},0);
            }
            var toplamAlinan=sonOdemelerAlinan+ekstraAlinan;
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
  // Rota sekmesi açılınca otomatik konum al
  useEffect(()=>{
    if(tab===5&&!rotaKonum&&!konumYukleniyor){ konumAl(true); }
  },[tab]);

  // Geo cache localStorage'a kaydet
  useEffect(function(){ lsSet("at_geo_cache",rotaGeoCache); },[rotaGeoCache]);

  // Rota: Nominatim geocoding + Greedy/2-Opt optimizasyon
  useEffect(function(){
    if(tab!==5) return;
    var seciliElevs=elevs.filter(function(e){return rotaSec.includes(e.id);});
    if(seciliElevs.length===0){ setRotaOtomatikIds([]); setRotaTahminiKm(null); setRotaOptHata(""); setRotaHesaplaniyor(false); return; }
    var iptal=false;
    function bekle(ms){ return new Promise(function(r){setTimeout(r,ms);}); }
    var sonGeoIstegi=0;
    async function nominatimSorgu(text){
      var simdi=Date.now();
      var beklenecek=1100-(simdi-sonGeoIstegi);
      if(beklenecek>0) await bekle(beklenecek);
      sonGeoIstegi=Date.now();
      var res=await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&countrycodes=tr&limit=1&q="+encodeURIComponent(text),{headers:{Accept:"application/json","Accept-Language":"tr","User-Agent":"AsansorTakipPro/1.0"}});
      if(!res.ok) return null;
      var data=await res.json();
      if(!Array.isArray(data)||!data[0]) return null;
      return {lat:Number(data[0].lat),lng:Number(data[0].lon)};
    }
    function adresSadele(adres){
      var s=adres;
      // "ŞİRİNEVLER MAHALLESİ BADEM SOKAK" → "BADEM SOKAK"
      // ^\S+ = mahalle adı (boşluksuz), \s+ = boşluk, MAH\S* = MAH/MAHALLE/MAHALLESİ
      s=s.replace(/^\S+\s+MAH\S*\.?\s*/i,"");
      // Kısaltmaları aç (SOK./SK. → Sokak, CAD. → Caddesi vb.)
      s=s.replace(/\bS[Oo][Kk]\.?\b/g,"Sokak").replace(/\bCAD\.?\b/gi,"Caddesi");
      s=s.replace(/\bBLV\.?\b/gi,"Bulvarı").replace(/\bBULV\.?\b/gi,"Bulvarı");
      // Bina/kat/daire ve "No:" temizle
      s=s.replace(/\bNo\s*[:.]?\s*\d+[\d\/\-]*/gi,"").replace(/\bKat\s*[:.]?\s*\d+/gi,"");
      s=s.replace(/\bD(?:aire)?\s*[:.]?\s*\d+/gi,"");
      return s.replace(/\s+/g," ").trim().replace(/[,\s]+$/,"");
    }
    function sokaciAl(adres){
      // "Badem Sokak 5/3" → "Badem Sokak" (sondaki rakam ve sonrasını at)
      return adres.replace(/\s+\d[\d\/\-]*\s*.*$/,"").replace(/,.*$/,"").trim();
    }
    async function geocodeAddress(elev){
      var adresRaw=elev.adres||""; var semt=elev.semt||""; var ilce=elev.ilce||"";
      var suffix=ilce?", "+ilce+", İstanbul":", İstanbul";
      var temiz=adresSadele(adresRaw);
      var sokak=sokaciAl(temiz);
      // Fallback zinciri — tekrarları filtrele
      var kandidatlar=[
        sokak+suffix,                                              // Sokak adı + ilçe
        temiz!==sokak?temiz+suffix:null,                          // Numaralı hali (farklıysa)
        semt&&sokak?semt+" Mahallesi, "+sokak+suffix:null,        // Semt + sokak
        semt?semt+" Mahallesi"+suffix:null,                       // Sadece semt
        ilce?ilce+", İstanbul":null,                              // Son çare: ilçe merkezi
      ];
      var goruldu={};
      var sorgular=kandidatlar.filter(function(s){
        if(!s||s.trim().length<6) return false;
        var k=s.trim().toLowerCase();
        if(goruldu[k]) return false;
        goruldu[k]=true; return true;
      });
      for(var s=0;s<sorgular.length;s++){
        if(iptal) return null;
        try{ var geo=await nominatimSorgu(sorgular[s]); if(geo) return geo; }catch(e){}
      }
      return null;
    }
    async function hesapla(){
      setRotaHesaplaniyor(true); setRotaOptHata("");
      var cacheGuncel=Object.assign({},rotaGeoCache);
      var routePoints=[];
      for(var i=0;i<seciliElevs.length;i++){
        if(iptal) return;
        var elev=seciliElevs[i];
        var key=routeAddressKey(elev);
        var storedCoords=getElevCoords(elev);
        var cached=storedCoords||cacheGuncel[key];
        if(!cached&&elev.adres){
          try{ var geo=await geocodeAddress(elev); if(geo){cached={lat:geo.lat,lng:geo.lng};cacheGuncel[key]=cached;} }catch(e){}
        }
        routePoints.push({elev:elev,coords:cached?{lat:Number(cached.lat),lng:Number(cached.lng)}:null,manualIndex:rotaSec.indexOf(elev.id)});
      }
      var startPoint=rotaKonum?{lat:rotaKonum.lat,lng:rotaKonum.lng}:null;
      if(!startPoint&&rotaStart.trim()){
        var startKey="__start__:"+rotaStart.trim().toLowerCase();
        var startCached=cacheGuncel[startKey];
        if(!startCached){ try{ var sg=await nominatimSorgu(rotaStart.trim()+", İstanbul"); if(sg){startCached={lat:sg.lat,lng:sg.lng};cacheGuncel[startKey]=startCached;} }catch(e){} }
        if(startCached) startPoint={lat:Number(startCached.lat),lng:Number(startCached.lng)};
      }
      if(iptal) return;
      if(JSON.stringify(cacheGuncel)!==JSON.stringify(rotaGeoCache)) setRotaGeoCache(cacheGuncel);
      var coordsOlan=routePoints.filter(function(p){return p.coords;});
      var coordsOlmayan=routePoints.filter(function(p){return !p.coords;}).sort(function(a,b){return a.manualIndex-b.manualIndex;});
      // Her zaman optimize et — konum bulunamayanları sona ekle
      var backendContext=null;
      try{ backendContext=await getBackendRouteContext(coordsOlan,startPoint); }catch(e){ backendContext=null; }
      if(backendContext){
        var backendFinalPoints=backendContext.points.concat(coordsOlmayan);
        var backendHatalar=[];
        if(coordsOlmayan.length>0) backendHatalar.push(coordsOlmayan.length+" adresin konumu bulunamadı, sona eklendi");
        if(backendContext.distanceSource&&backendContext.distanceSource!=="osrm-road-distance") backendHatalar.push("Yol mesafesi servisi yerine yedek mesafe hesabı kullanıldı");
        if(backendContext.mode==="heuristic") backendHatalar.push("Durak sayısı yüksek olduğu için en iyi bulunan rota kullanıldı");
        setRotaOtomatikIds(backendFinalPoints.map(function(p){return p.elev.id;}));
        setRotaTahminiKm(backendContext.totalKm!==null?backendContext.totalKm:routeTotalKm(backendFinalPoints,startPoint));
        setRotaOptHata(backendHatalar.join(" · "));
        setRotaHesaplaniyor(false);
        return;
      }
      var roadContext=null;
      try{ roadContext=await getRoadCostContext(coordsOlan,startPoint); }catch(e){ roadContext=null; }
      var optimizerPoints=roadContext?roadContext.points:coordsOlan;
      var optimizeEdilen=optimizerPoints.length>0?optimizeRoute(optimizerPoints,startPoint,roadContext&&roadContext.costBetween):[];
      if(roadContext&&routeCost(optimizeEdilen,startPoint,roadContext.costBetween)>=LARGE_ROUTE_COST/2){
        roadContext=null;
        optimizeEdilen=coordsOlan.length>0?optimizeRoute(coordsOlan,startPoint):[];
      }
      var finalPoints=optimizeEdilen.concat(coordsOlmayan);
      var toplamKm=routeTotalKm(finalPoints,startPoint,roadContext&&roadContext.distanceBetween);
      var fallbackHatalar=[];
      if(coordsOlmayan.length>0) fallbackHatalar.push(coordsOlmayan.length+" adresin konumu bulunamadı, sona eklendi");
      if(coordsOlan.length>1) fallbackHatalar.push("Backend rota servisine ulaşılamadı; cihaz içi yedek hesap kullanıldı");
      setRotaOtomatikIds(finalPoints.map(function(p){return p.elev.id;}));
      setRotaTahminiKm(toplamKm>0?toplamKm:null);
      setRotaOptHata(fallbackHatalar.join(" · "));
      setRotaHesaplaniyor(false);
    }
    var hesapTimer=setTimeout(function(){
      hesapla().catch(function(){
        if(!iptal){ setRotaOtomatikIds(seciliElevs.map(function(e){return e.id;})); setRotaTahminiKm(null); setRotaOptHata("Akıllı rota hesaplanamadı. Seçim sırasına göre gösteriliyor."); setRotaHesaplaniyor(false); }
      });
    },350);
    return function(){ iptal=true; clearTimeout(hesapTimer); };
  },[tab,rotaSec,rotaKonum,rotaStart,elevs,rotaGeoCache]);

  const today=(function(){var d=new Date();var y=d.getFullYear();var m=(d.getMonth()+1).toString().padStart(2,"0");var g=d.getDate().toString().padStart(2,"0");return y+"-"+m+"-"+g;})();
  const ilceler=useMemo(()=>[...new Set(elevs.map(e=>e.ilce))].sort(),[elevs]);
  const elevByIlce=useMemo(()=>elevs.reduce((a,e)=>{if(!a[e.ilce])a[e.ilce]=[];a[e.ilce].push(e);return a;},{}),[elevs]);
  const todayTasks=tasks.filter(t=>t.tarih===today);
  const openFaults=faults.filter(f=>f.durum!=="Çözüldü");
  const mMonth=useMemo(()=>maints.filter(m=>{const d=new Date(m.tarih);return d.getMonth()===fMonth&&d.getFullYear()===new Date().getFullYear();}),[maints,fMonth]);
  const unpaid=maints.filter(m=>m.yapildi&&!m.odendi).length;

  const buAyToplamAlinan=(id)=>{
    const simdi=new Date();
    const ayBaslangic=new Date(simdi.getFullYear(),simdi.getMonth(),1);
    ayBaslangic.setHours(0,0,0,0);
    const aySon=new Date(simdi.getFullYear(),simdi.getMonth()+1,0);
    aySon.setHours(23,59,59,999);
    const soAlinan=sonOdemeler.filter(function(o){
      var od=parseFinansDate(o.tarih);
      var ayniAsansor=Number(o.aid)===Number(id);
      return ayniAsansor&&!o.iptal&&od&&od>=ayBaslangic&&od<=aySon;
    }).reduce(function(s,o){return s+finansTutar(o.alinanTutar);},0);
    const maintEk=maints.filter(function(m){
      var amt=finansMaintAlinan(m);
      if(Number(m.asansorId)!==Number(id)||!m.yapildi||amt<=0) return false;
      var od=parseFinansDate(m.tarih);
      if(!od||od<ayBaslangic||od>aySon) return false;
      return !hasSonOdemeMatchForMaint(sonOdemeler,m,ayBaslangic,aySon,amt);
    }).reduce(function(s,m){return s+finansMaintAlinan(m);},0);
    return soAlinan+maintEk;
  };

  /** Bakım kartı / seçim listesi: makbuz ile aynı — eski devir + bu ay aylık ücret − bu ay tahsilat */
  const bal=(id)=>{
    const e=elevs.find(x=>x.id===id);if(!e) return 0;
    const eskiDevir=e.bakiyeDevir||0;
    const aylikUcret=e.aylikUcret||0;
    const alinan=buAyToplamAlinan(id);
    return Math.max(0,eskiDevir+aylikUcret-alinan);
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
    const toplamAlinan=buAyToplamAlinan(id);
    return eskiDevir+aylikUcret-toplamAlinan;
  };
  const guncelBorc=(id)=>{
    const nd=yeniDevir(id);
    return nd!==null?nd:bal(id);
  };
  const normalizeWhatsappTel=(rawTel)=>{
    var tel=(rawTel||"").replace(/[\s\-\(\)]/g,"");
    if(!tel) return "";
    if(tel.startsWith("0")) tel="90"+tel.slice(1);
    else if(!tel.startsWith("90")&&!tel.startsWith("+90")) tel="90"+tel;
    return tel.replace(/^\+/,"");
  };
  const firmaAdi=(tenantConfig&&tenantConfig.ad)||(isSuper?"Asis Asansör Bakım ve Servis Hizmetleri":"Şirketimiz");
  const dashboardMetaById=useMemo(function(){
    var map={};
    DASHBOARD_CARDS_DEFAULT.forEach(function(c){ map[c.id]=c; });
    return map;
  },[]);
  const dashboardLayoutNormalized=useMemo(function(){
    return normalizeDashboardLayout(dashboardLayout);
  },[dashboardLayout]);
  const dashboardEnabledMap=useMemo(function(){
    var map={};
    dashboardLayoutNormalized.forEach(function(c){ map[c.id]=c.enabled!==false; });
    return map;
  },[dashboardLayoutNormalized]);
  const dashboardSizeMap=useMemo(function(){
    var map={};
    dashboardLayoutNormalized.forEach(function(c){ map[c.id]=c.size||"medium"; });
    return map;
  },[dashboardLayoutNormalized]);
  const dashboardHiddenLabels=useMemo(function(){
    return dashboardLayoutNormalized.filter(function(x){return x.enabled===false;}).map(function(x){
      var meta=dashboardMetaById[x.id];
      return meta?meta.label:x.id;
    });
  },[dashboardLayoutNormalized,dashboardMetaById]);
  const dashboardCanEdit=(rol==="yonetici"||isSuper)&&!!tenantId;
  function dashboardPad(id,small,medium,full){
    var size=dashboardSizeMap[id]||"medium";
    if(size==="small") return small;
    if(size==="full") return full;
    return medium;
  }
  const dashboardWindow=useMemo(function(){
    var now=new Date();
    if(dashboardRange==="today"){
      var bas=new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0,0);
      var son=new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59,999);
      return {mode:"today",label:"Bugün",start:bas,end:son,days:1};
    }
    if(dashboardRange==="week"){
      var gun=now.getDay();
      var pazartesiFark=gun===0?-6:1-gun;
      var hb=new Date(now); hb.setDate(now.getDate()+pazartesiFark); hb.setHours(0,0,0,0);
      var hs=new Date(hb); hs.setDate(hb.getDate()+6); hs.setHours(23,59,59,999);
      return {mode:"week",label:"Bu Hafta",start:hb,end:hs,days:7};
    }
    var ayBas=new Date(now.getFullYear(),now.getMonth(),1); ayBas.setHours(0,0,0,0);
    var aySon=new Date(now.getFullYear(),now.getMonth()+1,0); aySon.setHours(23,59,59,999);
    var days=Math.max(1,Math.round((aySon-ayBas)/86400000)+1);
    return {mode:"month",label:"Bu Ay",start:ayBas,end:aySon,days:days};
  },[dashboardRange]);
  function dashboardMove(itemId,delta){
    setDashboardLayout(function(prev){
      var list=normalizeDashboardLayout(prev);
      var idx=list.findIndex(function(x){return x.id===itemId;});
      if(idx<0) return list;
      var ni=idx+delta;
      if(ni<0||ni>=list.length) return list;
      var copy=list.slice();
      var tmp=copy[idx]; copy[idx]=copy[ni]; copy[ni]=tmp;
      return copy;
    });
  }
  function dashboardToggle(itemId){
    var meta=dashboardMetaById[itemId];
    if(meta&&meta.lockEnabled) return;
    setDashboardLayout(function(prev){
      return normalizeDashboardLayout(prev).map(function(x){
        return x.id===itemId?Object.assign({},x,{enabled:!(x.enabled!==false)}):x;
      });
    });
  }
  function dashboardSizeNext(itemId){
    setDashboardLayout(function(prev){
      return normalizeDashboardLayout(prev).map(function(x){
        if(x.id!==itemId) return x;
        var cur=x.size||"medium";
        var idx=DASHBOARD_CARD_SIZES.indexOf(cur);
        if(idx<0) idx=1;
        var next=DASHBOARD_CARD_SIZES[(idx+1)%DASHBOARD_CARD_SIZES.length];
        return Object.assign({},x,{size:next});
      });
    });
  }
  function dashboardReset(){
    setDashboardLayout(normalizeDashboardLayout(null));
  }
  async function dashboardKaydetSunucu(){
    if(!tenantId) return;
    var payload=normalizeDashboardLayout(dashboardLayout);
    setDashboardKaydediliyor(true);
    var ok=await saveTenantConfig(tenantId,{dashboardLayout:payload});
    setDashboardKaydediliyor(false);
    if(ok){
      setTenantConfig(function(prev){return Object.assign({},prev||{},{dashboardLayout:payload});});
      setDashboardEditorAcik(false);
      alert("Dashboard düzeni kaydedildi.");
    } else {
      setDashboardEditorAcik(false);
      alert("Sunucuya kaydedilemedi. Düzen bu cihazda korunacak.");
    }
  }
  const borcWhatsappMesaji=(e,borc)=>{
    var tutar=(borc||0).toLocaleString("tr-TR")+" ₺";
    return "Sayın "+e.ad+" Yönetimi,\n\n"+
      firmaAdi+" olarak binanıza sunduğumuz hizmet için teşekkür ederiz.\n\n"+
      "Bilginize sunmak istediğimiz husus; binanızın asansörüne ait aylık periyodik bakımlar tarafımızca düzenli ve eksiksiz olarak gerçekleştirilmektedir.\n\n"+
      "Güncel hesap durumunuza göre toplam bakım borcunuz *"+tutar+"* olup, ödemenizin en kısa sürede tarafımıza iletilmesini saygılarımızla arz ederiz.\n\n"+
      "Herhangi bir sorunuz veya talebiniz olması halinde bizimle iletişime geçmekten çekinmeyiniz.\n\n"+
      "Saygılarımızla,\n"+
      firmaAdi;
  };
  const borcWhatsappGonder=(e)=>{
    if(!e||!e.tel) return;
    var tel=normalizeWhatsappTel(e.tel);
    if(!tel){ alert("Geçerli telefon numarası bulunamadı."); return; }
    var borc=guncelBorc(e.id);
    var mesaj=borcWhatsappMesaji(e,borc);
    window.open("https://wa.me/"+tel+"?text="+encodeURIComponent(mesaj),"_blank");
  };
  const eName=(id)=>{const nid=typeof id==="string"?+id:id;return _optionalChain([elevs, 'access', _7 => _7.find, 'call', _8 => _8(e=>e.id===nid||e.id===id), 'optionalAccess', _9 => _9.ad])||"?"};
  const F=(k,v)=>setForm(p=>({...p,[k]:v}));
  const MapsLinkInput=({value,onChange,required,existingCoords})=>{
    var text=value||"";
    var coords=parseGoogleMapsCoords(text);
    var hasExisting=!!existingCoords;
    return React.createElement('div',{style:{marginTop:6,marginBottom:14,background:"#0d1321",border:"1px solid "+(coords?"#10b98166":required&&!hasExisting?"#f59e0b66":"#2a3050"),borderRadius:12,padding:"12px 14px"}},
      React.createElement('label',{style:{display:"block",fontSize:13,fontWeight:800,color:coords?"#10b981":"#f59e0b",marginBottom:6}},
        "Google Maps linki / iframe"+(required&&!hasExisting?" *":"")
      ),
      React.createElement('textarea',{
        value:text,
        onChange:function(e){onChange(e.target.value);},
        placeholder:'Google Maps iframe veya paylaş linkini buraya yapıştırın',
        rows:4,
        style:{width:"100%",background:"#070b14",border:"1px solid #2a3050",borderRadius:10,padding:"10px 12px",color:"#e0e6f0",fontSize:12,outline:"none",resize:"vertical",boxSizing:"border-box",lineHeight:1.45}
      }),
      React.createElement('div',{style:{fontSize:10,color:coords?"#6ee7b7":"#64748b",marginTop:7,lineHeight:1.45}},
        coords
          ? "Koordinat okunacak: "+coords.lat.toFixed(7)+", "+coords.lng.toFixed(7)
          : hasExisting
            ? "Mevcut koordinat korunacak: "+existingCoords.lat.toFixed(7)+", "+existingCoords.lng.toFixed(7)+". Değiştirmek için yeni link yapıştırın."
            : "Yeni bina kaydı için zorunlu. Linkten koordinat okunamazsa kayıt yapılmaz."
      )
    );
  };
  const oAdd=(t)=>{setEdit(null);setForm({tarih:today});setModal(t);};
  const oEdit=(t,item)=>{setEdit(item);setForm({...item});setModal(t);};
  const close=()=>setModal(null);

  const saveE=()=>{
    var ilceDeger=form.ilce==="__yeni__"?(form.ilceYeni||"").trim():form.ilce;
    if(!ilceDeger){alert("İlçe seçiniz!");return;}
    var mapsInput=(form._mapsInput||"").trim();
    var parsedMapsCoords=mapsInput?parseGoogleMapsCoords(mapsInput):null;
    var mevcutCoords=getElevCoords(form);
    if(mapsInput&&!parsedMapsCoords){alert("Google Maps linki/iframe içinden geçerli koordinat okunamadı. Lütfen paylaşılan linki veya embed kodunu kontrol edin.");return;}
    if(!edit&&!parsedMapsCoords){alert("Google Maps linki / iframe zorunludur. Yeni bina rotaya girebilmesi için koordinatla kaydedilmelidir.");return;}
    if(edit&&!parsedMapsCoords&&!mevcutCoords){alert("Bu binada koordinat yok. Google Maps linki / iframe girmeniz zorunludur.");return;}
    // _yeniDevirOverride girilmişse yeniDevirManuel olarak kaydet, boşsa null (otomatik)
    var yeniDevirManuelDeger=null;
    if(form._yeniDevirOverride!==undefined&&form._yeniDevirOverride!==""){
      yeniDevirManuelDeger=parseFloat(form._yeniDevirOverride);
    }
    const d={...form,ilce:ilceDeger,aylikUcret:+form.aylikUcret||0,bakiyeDevir:+form.bakiyeDevir||0,kat:+form.kat||0,kapasite:+form.kapasite||0,yeniDevirManuel:yeniDevirManuelDeger};
    if(parsedMapsCoords){
      d.lat=Number(parsedMapsCoords.lat.toFixed(7));
      d.lng=Number(parsedMapsCoords.lng.toFixed(7));
      d.geoQuality="manual";
      d.geoScore=100;
      d.geoType="GoogleMaps";
      d.geoAddress="Google Maps link/iframe";
      d.geoUpdatedAt=new Date().toISOString();
    }
    delete d._yeniDevirOverride;
    delete d._devirKilidAcik;
    delete d._mapsInput;
    edit?setElevs(p=>p.map(e=>e.id===edit.id?{...e,...d}:e)):setElevs(p=>[...p,{...d,id:Date.now()}]);
    close();
  };
  const saveM=()=>{const d={...form,asansorId:+form.asansorId,tutar:+form.tutar||0,yapildi:form.yapildi===true||form.yapildi==="true",odendi:form.odendi===true||form.odendi==="true",kl:form.kl||{}};edit?setMaints(p=>p.map(m=>m.id===edit.id?{...m,...d}:m)):setMaints(p=>[...p,{...d,id:Date.now()}]);close();};
  const saveF=()=>{
    if(!edit&&form._yeniAdres===true){
      if(!(form._yeniIlce&&form._yeniBinaAd&&form._yeniAdresStr)){alert("İlçe, Bina Adı ve Adres zorunlu!");return;}
      var yeniFaultCoords=parseGoogleMapsCoords(form._yeniMapsInput||"");
      if(!yeniFaultCoords){alert("Google Maps linki / iframe zorunludur. Yeni bina koordinatla kaydedilmelidir.");return;}
      var newId=Date.now();
      var newElevF={id:newId,ad:(form._yeniBinaAd||"").trim(),ilce:form._yeniIlce,semt:(form._yeniSemt||"").trim(),adres:(form._yeniAdresStr||"").trim(),yonetici:(form._yeniYon||"").trim(),tel:(form._yeniTel||"").trim(),bakimGunu:"0",aylikUcret:0,bakiyeDevir:0,tip:"Elektrikli",kat:0,kapasite:0,lat:Number(yeniFaultCoords.lat.toFixed(7)),lng:Number(yeniFaultCoords.lng.toFixed(7)),geoQuality:"manual",geoScore:100,geoType:"GoogleMaps",geoAddress:"Google Maps link/iframe",geoUpdatedAt:new Date().toISOString()};
      setElevs(function(p){return p.concat([newElevF]);});
      const d={...form,asansorId:newId};
      delete d._yeniMapsInput;
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
  const filteredByIlce=useMemo(()=>filteredElevs.reduce((a,e)=>{if(!a[e.ilce])a[e.ilce]=[];a[e.ilce].push(e);return a;},{}),[filteredElevs]);

  const rotaPool=rotaIlce==="Tümü"?elevs:elevs.filter(e=>e.ilce===rotaIlce);
  const rotaOrder=rotaOtomatikIds.length===rotaSec.length?rotaOtomatikIds:rotaSec;
  const rotaElevs=rotaOrder.map(function(id){return elevs.find(function(e){return e.id===id;});}).filter(Boolean);
  const rotaStartStr=rotaKonum?`${rotaKonum.lat},${rotaKonum.lng}`:rotaStart;
  // Google Maps Directions API formatı: origin + waypoints + destination
  const mapsUrls=buildGoogleMapsChunks(rotaElevs,rotaStartStr);
  const mapsUrl=mapsUrls[0]?mapsUrls[0].url:"";
  // Bakımcı için: atanmış ama henüz tamamlanmamış asansörler
  const bekleyenRotaIds=[...new Set(mMonth.filter(function(m){
    if(!m.planlanmis||m.yapildi) return false;
    if(!elevs.some(function(e){return e.id===m.asansorId;})) return false;
    if(rol==="bakimci"){
      if(!aktifBakimci) return false;
      if(m.bakimciId!==aktifBakimci.id) return false;
    }
    return true;
  }).map(function(m){return m.asansorId;}))];

  // Tab yapısı
  // ---- Plan bazlı kısıtlamalar ----
  const tenantPlan = (subscription && subscription.plan) || "baslangic";
  const planLimits = {
    baslangic:   { ad:"Başlangıç",   elevLimit:250,      userLimit:3,        finans:false, teklif:false, sozlesme:false, marka:false },
    profesyonel: { ad:"Profesyonel", elevLimit:1000,     userLimit:10,       finans:true,  teklif:true,  sozlesme:true,  marka:true  },
    kurumsal:    { ad:"Kurumsal",    elevLimit:Infinity, userLimit:Infinity, finans:true,  teklif:true,  sozlesme:true,  marka:true  }
  };
  const limits = isSuper ? planLimits.kurumsal : (planLimits[tenantPlan] || planLimits.baslangic);
  const [kilitModal,setKilitModal]=useState(null); // {ozellik:"Finans", gerekenPlan:"Profesyonel"}
  const planAdi = isSuper ? "Asis (Sınırsız)" : (planLimits[tenantPlan] || planLimits.baslangic).ad;

  const TABS_YON_BASE=["📊 Dashboard","🛗 Asansörler","🔧 Bakım Atama","⚠️ Arızalar","📋 Günlük İşler","🗺️ Rota","💰 Finans","💸 Giderler","📝 Notlar","🔩 Ekstra İş","📑 Teklif Oluşturma","🔍 Muayene","📄 Sözleşmeler","🏢 Bina Portali","👥 Bakımcılar"];
  const TABS_YON = isSuper ? TABS_YON_BASE.concat(["🏭 Firmalar"]) : TABS_YON_BASE;
  const TABS_BAK=["🔧 Bakım & Arızalar","🗺️ Rota","📝 Notlar","🔩 Ekstra İş"];
  const visibleTabs=rol==="bakimci"?TABS_BAK:TABS_YON;
  const tabIdx=rol==="bakimci"?[2,5,8,9]:TABS_YON.map(function(_,i){return i;});

  // Hangi tab indeksi hangi özelliğe karşılık geliyor (yönetici için)
  // 6:Finans, 7:Giderler, 10:Teklif, 12:Sözleşmeler
  function tabKilitliMi(idx){
    if(rol!=="yonetici"||isSuper) return null;
    if(idx===6 && !limits.finans) return {ozellik:"Finans Yönetimi", gerekenPlan:"Profesyonel"};
    if(idx===7 && !limits.finans) return {ozellik:"Giderler", gerekenPlan:"Profesyonel"};
    if(idx===10 && !limits.teklif) return {ozellik:"Teklif Oluşturma", gerekenPlan:"Profesyonel"};
    if(idx===12 && !limits.sozlesme) return {ozellik:"Sözleşmeler", gerekenPlan:"Profesyonel"};
    return null;
  }

  if(!tenantId) return React.createElement(FirmaKoduGate, { onReady: handleFirmaKodu });

  // Yönetici yeni bakımcı eklerken Firebase Auth + users profili oluşturur
  async function handleBakimciEkle(bakimci){
    return await createBakimciUser(tenantId, bakimci);
  }

  // Yönetici mevcut bakımcının şifresini değiştirirken Firebase Auth günceller
  async function handleBakimciGuncelle(bakimci, eskiSifre){
    return await updateBakimciUser(tenantId, bakimci, eskiSifre);
  }

  if(rol===null) return React.createElement(LoginScreen, {
    onLogin: async (r,bk)=>{
      // Giriş sonrası: süper-admin ve user profil kontrolü
      try{
        var uid = auth && auth.currentUser ? auth.currentUser.uid : null;
        if(uid){
          var sup = await isSuperAdmin(uid);
          setIsSuper(!!sup);
          var prof = await getUserProfile(uid);
          setUserProfile(prof||null);
          // Abonelik kontrolü (süper-admin bypass)
          if(!sup){
            // Yönetici: profil + tenant eşleşmesi zorunlu
            if(r==="yonetici" && (!prof || prof.tenantId !== tenantId || prof.active === false)){
              alert("Yönetici hesabınız bu firma için yapılandırılmamış görünüyor. Süper-admin panelinden firma kaydını 'Düzenle → Güncelle' ile yenilemeniz gerekiyor.");
              firebaseLogout(); setRol(null); return;
            }
            // Bakımcı: profil varsa ve yanlış tenanta bağlıysa reddet
            if(r==="bakimci" && prof && prof.tenantId && prof.tenantId !== tenantId){
              alert("Bu bakımcı hesabı başka bir firmaya kayıtlı.");
              firebaseLogout(); setRol(null); return;
            }
            var sub = await getTenantSubscription(tenantId);
            setSubscription(sub||null);
            var bitis = sub && sub.bitis ? new Date(sub.bitis) : null;
            var durum = sub && sub.status ? sub.status : "active";
            var gecmis = bitis && bitis.getTime() < Date.now();
            if(durum !== "active" || gecmis){
              alert("Firmanızın aboneliği aktif değil. Lütfen Asis Asansör ile iletişime geçin.");
              firebaseLogout(); setRol(null); return;
            }
          }
        }
      }catch(e){}
      setRol(r); setAktifBakimci(bk||null); setTab(r==="bakimci"?2:0);
    },
    bakimcilar: bakimcilar,
    tenantPublic: tenantConfig,
    onFarkliFirma: farkliFirma,
  });

  const atanmayanCount=elevs.filter(e=>{const kayitlar=mMonth.filter(m=>m.asansorId===e.id);return kayitlar.length===0||!kayitlar.some(m=>m.planlanmis);}).length;
  const atananArizaCount=faults.filter(function(f){
    if(!f.bakimciAtandi||f.durum==="Çözüldü") return false;
    if(rol==="bakimci"&&aktifBakimci&&f.bakimciId!==aktifBakimci.id) return false;
    return true;
  }).length;

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
                  rol==="bakimci" ? ("● " + (aktifBakimci ? aktifBakimci.ad : "Bakımcı")) :
                  isSuper ? "● SuperAdmin · "+elevs.length+" asansör" :
                  "● "+planAdi+" · "+elevs.length+" asansör"
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
            rol==="yonetici"&&!isSuper&&React.createElement('button', {
              onClick:()=>{setFirmaAyarlariForm({ad:tenantConfig&&tenantConfig.ad||"",adres:tenantConfig&&tenantConfig.adres||"",tel:tenantConfig&&tenantConfig.tel||"",tel2:tenantConfig&&tenantConfig.tel2||"",tel3:tenantConfig&&tenantConfig.tel3||"",email:tenantConfig&&tenantConfig.email||"",email2:tenantConfig&&tenantConfig.email2||"",logoUrl:tenantConfig&&tenantConfig.logoUrl||""});setFirmaAyarlariAcik(true);},
              title:"Firma Ayarları",
              style:{width:30,height:30,borderRadius:8,background:"rgba(255,255,255,0.07)",border:"1px solid rgba(255,255,255,0.10)",color:"rgba(255,255,255,0.70)",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center"}
            }, "🏢"),
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
            const kilit=tabKilitliMi(realIdx);
            const tabLabel = kilit ? (t+" 🔒") : t;
            return React.createElement('button', {
              key: i,
              onClick: ()=>{
                if(kilit){ setKilitModal(kilit); return; }
                setTab(realIdx);
              },
              className:"header-tab "+(tab===realIdx?"aktif":""),
              style: kilit ? {opacity:0.6} : undefined
            }, tabLabel);
          })
        )
      )

      , React.createElement('div', { className:"content-with-tabs scroll-y", style: {maxWidth:1200,margin:"0 auto",padding:16},}

/* DASHBOARD */
, tab===0&&(
  React.createElement('div', { className:"ios-animate"}
    , React.createElement('div', { style: {display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,marginBottom:16,marginTop:4,flexWrap:"wrap"}}
      , React.createElement('div', { style: {fontSize:28,fontWeight:800,letterSpacing:-1}}, "Genel Bakış" )
      , dashboardCanEdit&&React.createElement('button',{
          onClick:function(){setDashboardEditorAcik(true);},
          style:{padding:"8px 13px",background:"#1a1f2e",border:"1px solid #2a3050",borderRadius:10,color:"#3b82f6",fontSize:12,fontWeight:800,cursor:"pointer"}
        },"⚙️ Dashboard Düzenle")
    )
    , React.createElement('div',{style:{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}},
      [{id:"today",label:"Bugün"},{id:"week",label:"Bu Hafta"},{id:"month",label:"Bu Ay"}].map(function(r){
        var aktif=dashboardRange===r.id;
        return React.createElement('button',{
          key:r.id,
          onClick:function(){setDashboardRange(r.id);},
          style:{padding:"7px 12px",borderRadius:20,border:"1px solid "+(aktif?"#3b82f688":"#2a3050"),background:aktif?"#3b82f622":"#141824",color:aktif?"#93c5fd":"#94a3b8",fontSize:11,fontWeight:700,cursor:"pointer"}
        },r.label);
      })
    )
    , dashboardHiddenLabels.length>0&&React.createElement('div',{style:{fontSize:11,color:"var(--text-muted)",marginBottom:10,background:"var(--bg-elevated)",borderRadius:10,padding:"8px 10px"}},
      "Gizli kartlar: "+dashboardHiddenLabels.join(", ")+" (Dashboard Düzenle'den açabilirsiniz)."
    )
    /* PLAN KULLANIM BADGE'i */
    , dashboardEnabledMap.planBadge&&rol==="yonetici"&&!isSuper&&(function(){
        var oran = limits.elevLimit===Infinity ? 0 : (elevs.length / limits.elevLimit);
        var renk = oran>=1 ? "#ef4444" : (oran>=0.8 ? "#f59e0b" : "#3b82f6");
        var bg = oran>=1 ? "rgba(239,68,68,0.1)" : (oran>=0.8 ? "rgba(245,158,11,0.1)" : "rgba(59,130,246,0.1)");
        var ikon = tenantPlan==="kurumsal"?"🏛️":(tenantPlan==="profesyonel"?"⚡":"🚀");
        return React.createElement('div',{
          style:{background:bg,border:"1px solid "+renk+"55",borderRadius:14,padding:"12px 16px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap"}
        },
          React.createElement('div',{style:{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}},
            React.createElement('span',{style:{fontSize:20}}, ikon),
            React.createElement('div',null,
              React.createElement('div',{style:{fontSize:13,fontWeight:800,color:renk}}, planAdi+" Paketi"),
              React.createElement('div',{style:{fontSize:11,color:"var(--text-muted)",marginTop:2}},
                limits.elevLimit===Infinity ? (elevs.length+" asansör · sınırsız") : (elevs.length+" / "+limits.elevLimit+" asansör")
              )
            )
          ),
          oran>=0.8 && React.createElement('a',{
            href:"https://wa.me/905435070794?text="+encodeURIComponent("Paketimi yükseltmek istiyorum"),
            target:"_blank",
            rel:"noreferrer",
            style:{padding:"7px 14px",background:renk,color:"#fff",borderRadius:9,fontSize:12,fontWeight:800,textDecoration:"none",whiteSpace:"nowrap"}
          }, "Yükselt →")
        );
      })()
    /* BENTO GRID - Ana istatistikler */
    , dashboardEnabledMap.quickStats&&(function(){
        var doneInRange=maints.filter(function(m){
          if(!m.yapildi) return false;
          var d=parseFinansDate(m.tarih);
          return d&&d>=dashboardWindow.start&&d<=dashboardWindow.end;
        }).length;
        var targetInRange=dashboardWindow.mode==="month"
          ? elevs.length
          : Math.round((elevs.length/30)*dashboardWindow.days);
        var kalan=Math.max(0,targetInRange-doneInRange);
        var size=dashboardSizeMap.quickStats||"medium";
        var cols=size==="full"?"repeat(4,minmax(0,1fr))":"repeat(2,minmax(0,1fr))";
        return React.createElement('div', { style: {display:"grid",gridTemplateColumns:cols,gap:10,marginBottom:10},}
          , React.createElement(Stat, { icon: "🛗", label: "Toplam Asansör", value: elevs.length, color: "var(--accent)",})
          , React.createElement(Stat, { icon: "⚠️", label: "Açık Arıza", value: openFaults.length, color: "var(--ios-red)",})
          , React.createElement(Stat, { icon: "✅", label: dashboardWindow.label+" Yapılan", value: doneInRange, color: "var(--ios-green)",})
          , React.createElement(Stat, { icon: "⏳", label: dashboardWindow.label+" Kalan", value: kalan, color: "var(--ios-orange)",})
        );
      })()
    /* FİNANSAL BENTO */
    , dashboardEnabledMap.financeSummary&&(function(){
        var tahsil=sonOdemeler.filter(function(o){var od=parseFinansDate(o.tarih);return !o.iptal&&od&&od>=dashboardWindow.start&&od<=dashboardWindow.end;}).reduce(function(s,o){return s+finansTutar(o.alinanTutar);},0);
        tahsil+=maintTahsilatNotInSonOdemeler(sonOdemeler,maints,dashboardWindow.start,dashboardWindow.end);
        var aylikToplam=elevs.reduce(function(s,e){return s+e.aylikUcret;},0);
        var hedef=dashboardWindow.mode==="month"?aylikToplam:Math.round((aylikToplam/30)*dashboardWindow.days);
        var bekleyen=Math.max(0,hedef-tahsil);
        var pct=hedef>0?Math.round(tahsil/hedef*100):0;
        var p=dashboardPad("financeSummary","12px 14px","18px","22px 24px");
        return React.createElement('div', { style: {background:"var(--bg-panel)",borderRadius:20,padding:p,marginBottom:10,boxShadow:"var(--shadow-sm)"},}
          , React.createElement('div', { style: {fontSize:13,fontWeight:600,color:"var(--text-muted)",marginBottom:12}}, "💰 "+dashboardWindow.label+" Finansal Özet")
          , React.createElement('div', { style: {display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}},
            React.createElement('div', {style:{textAlign:"center"}},
              React.createElement('div', {style:{fontSize:18,fontWeight:700,color:"var(--ios-green)"}}, tahsil.toLocaleString("tr-TR")+"₺"),
              React.createElement('div', {style:{fontSize:11,color:"var(--text-muted)",marginTop:2}}, "Tahsil")
            ),
            React.createElement('div', {style:{textAlign:"center"}},
              React.createElement('div', {style:{fontSize:18,fontWeight:700,color:"var(--accent)"}}, hedef.toLocaleString("tr-TR")+"₺"),
              React.createElement('div', {style:{fontSize:11,color:"var(--text-muted)",marginTop:2}}, "Hedef")
            ),
            React.createElement('div', {style:{textAlign:"center"}},
              React.createElement('div', {style:{fontSize:18,fontWeight:700,color:bekleyen>0?"var(--ios-orange)":"var(--ios-green)"}}, bekleyen.toLocaleString("tr-TR")+"₺"),
              React.createElement('div', {style:{fontSize:11,color:"var(--text-muted)",marginTop:2}}, "Bekleyen")
            )
          )
          , React.createElement('div', { style: {height:8,background:"var(--bg-elevated)",borderRadius:10,overflow:"hidden"}},
            React.createElement('div', { style: {height:"100%",width:pct+"%",background:"linear-gradient(90deg,var(--ios-green),var(--accent))",borderRadius:10,transition:"width 0.8s cubic-bezier(.34,1.32,.64,1)"}})
          )
          , React.createElement('div', { style: {display:"flex",justifyContent:"space-between",marginTop:6}},
            React.createElement('span', {style:{fontSize:12,color:"var(--text-muted)"}}, "Tahsilat oranı"),
            React.createElement('span', {style:{fontSize:12,fontWeight:700,color:"var(--accent)"}}, pct+"%")
          )
        );
      })()
    /* Toplam Devir Kartı */
    , dashboardEnabledMap.totalDevir&&(function(){
        var toplamDevir=elevs.reduce(function(s,e){return s+(e.bakiyeDevir||0);},0);
        var pad=dashboardPad("totalDevir","12px 14px","16px 18px","20px 22px");
        return React.createElement('div', {style:{background:"var(--bg-panel)",borderRadius:20,padding:pad,marginBottom:10,boxShadow:"var(--shadow-sm)",borderLeft:"4px solid "+(toplamDevir>0?"var(--ios-red)":toplamDevir===0?"var(--ios-green)":"var(--ios-orange)")}}
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
    , dashboardEnabledMap.openFaults&&React.createElement('div', { style: {background:"var(--bg-panel)",borderRadius:20,overflow:"hidden",marginBottom:10,boxShadow:"var(--shadow-sm)"}},
      React.createElement('div', { style: {padding:"14px 16px 8px",display:"flex",justifyContent:"space-between",alignItems:"center"}},
        React.createElement('div', {style:{fontSize:14,fontWeight:700}}, "⚠️ Açık Arızalar"),
        openFaults.length>0&&React.createElement('span', {style:{background:"rgba(255,59,48,0.15)",color:"var(--ios-red)",fontSize:12,fontWeight:700,padding:"2px 10px",borderRadius:20}}, openFaults.length)
      ),
      openFaults.length===0
        ?React.createElement('div', {style:{padding:"14px 16px",color:"var(--text-dim)",fontSize:14}}, "Harika! Şu an açık arıza kaydı yok ✅")
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
    , dashboardEnabledMap.districtStatus&&React.createElement('div', { style: {background:"var(--bg-panel)",borderRadius:20,padding:dashboardPad("districtStatus","10px 12px","14px 16px","18px 20px"),marginBottom:10,boxShadow:"var(--shadow-sm)"}},
      React.createElement('div', { style: {fontSize:14,fontWeight:700,marginBottom:12}}, "🗺️ İlçe Durumu"),
      Object.keys(elevByIlce).length===0
        ? React.createElement('div', {style:{fontSize:12,color:"var(--text-muted)"}}, "Henüz ilçe dağılımı gösterecek asansör verisi yok.")
        : React.createElement('div', { style: {display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}},
        Object.entries(elevByIlce).sort((a,b)=>b[1].length-a[1].length).slice(0,6).map(([ilce,es])=>{
          const c=getIlceRenk(ilce);
          const tamam=maints.filter(function(m){
            if(!m.yapildi) return false;
            if(!es.some(function(e){return e.id===m.asansorId;})) return false;
            var d=parseFinansDate(m.tarih);
            return d&&d>=dashboardWindow.start&&d<=dashboardWindow.end;
          }).length;
          const pct=es.length>0?Math.round(tamam/es.length*100):0;
          return(
            React.createElement('div', { key: ilce, style: {background:"var(--bg-elevated)",borderRadius:14,padding:"10px 12px",borderLeft:"3px solid "+c},}
              , React.createElement('div', { style: {fontWeight:700,fontSize:13,color:c,marginBottom:3}}, ilce)
              , React.createElement('div', { style: {fontSize:12,color:"var(--text-muted)",marginBottom:5}}, es.length+" asansör")
              , React.createElement('div', { style: {height:4,background:"var(--border)",borderRadius:10}},
                React.createElement('div', { style: {height:"100%",width:pct+"%",background:c,borderRadius:10}})
              )
            )
          );
        })
      )
    )
    /* Arıza Trendi Grafiği - son 6 ay */
    , dashboardEnabledMap.faultTrend&&(function(){
        var simdi=new Date();
        var aylar=[];
        for(var i=5;i>=0;i--){
          var d=new Date(simdi.getFullYear(),simdi.getMonth()-i,1);
          aylar.push({yil:d.getFullYear(),ay:d.getMonth(),etiket:MONTHS[d.getMonth()].slice(0,3)});
        }
        var maxSayi=Math.max(1,...aylar.map(function(a){return faults.filter(function(f){var fd=new Date(f.tarih||"");return fd.getFullYear()===a.yil&&fd.getMonth()===a.ay;}).length;}));
        return React.createElement('div', {style:{background:"var(--bg-panel)",borderRadius:20,padding:dashboardPad("faultTrend","10px 12px","14px 16px","18px 20px"),marginBottom:10,boxShadow:"var(--shadow-sm)"}}
          , React.createElement('div', {style:{fontSize:14,fontWeight:700,marginBottom:12}}, "📈 Arıza Trendi (Son 6 Ay)")
          , React.createElement('div', {style:{display:"flex",alignItems:"flex-end",gap:6,height:80}}
            , aylar.map(function(a){
                var sayi=faults.filter(function(f){var fd=new Date(f.tarih||"");return fd.getFullYear()===a.yil&&fd.getMonth()===a.ay;}).length;
                var pct=maxSayi>0?sayi/maxSayi*100:0;
                var isSimdi=a.yil===simdi.getFullYear()&&a.ay===simdi.getMonth();
                return React.createElement('div', {key:a.etiket,style:{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3}}
                  , React.createElement('div', {style:{fontSize:10,fontWeight:700,color:isSimdi?"var(--accent)":"var(--text-muted)"}}, sayi||"")
                  , React.createElement('div', {style:{width:"100%",background:"var(--bg-elevated)",borderRadius:6,height:60,display:"flex",alignItems:"flex-end"}}
                    , React.createElement('div', {style:{width:"100%",height:Math.max(4,pct)+"%",background:isSimdi?"var(--accent)":sayi>0?"var(--ios-red)":"var(--border)",borderRadius:6,transition:"height 0.5s"}})
                  )
                  , React.createElement('div', {style:{fontSize:9,color:isSimdi?"var(--accent)":"var(--text-dim)",fontWeight:isSimdi?700:400}}, a.etiket)
                );
              })
          )
        );
      })()
    /* Teknisyen Performans Özeti */
    , dashboardEnabledMap.maintenancePerformance&&(function(){
        var yapilan=maints.filter(function(m){return m.yapildi;});
        var donem=maints.filter(function(m){
          if(!m.yapildi) return false;
          var d=parseFinansDate(m.tarih);
          return d&&d>=dashboardWindow.start&&d<=dashboardWindow.end;
        });
        var odenmemis=maints.filter(function(m){return m.yapildi&&!m.odendi;}).length;
        return React.createElement('div', {style:{background:"var(--bg-panel)",borderRadius:20,padding:dashboardPad("maintenancePerformance","10px 12px","14px 16px","18px 20px"),marginBottom:10,boxShadow:"var(--shadow-sm)"}}
          , React.createElement('div', {style:{fontSize:14,fontWeight:700,marginBottom:10}}, "👨‍🔧 Bakım Performansı")
          , React.createElement('div', {style:{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}
            , React.createElement('div', {style:{textAlign:"center",padding:"8px 4px",background:"var(--bg-elevated)",borderRadius:12}}
              , React.createElement('div', {style:{fontSize:20,fontWeight:800,color:"var(--ios-green)"}},(donem.length))
              , React.createElement('div', {style:{fontSize:10,color:"var(--text-muted)",marginTop:2}},dashboardWindow.label+" Yapılan")
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
    , dashboardEnabledMap.inspectionAlerts&&(function(){
        var gecikti=muayeneler.filter(function(m){var g=new Date(m.sonrakiTarih||"");var b=new Date();b.setHours(0,0,0,0);return m.sonrakiTarih&&g<b;});
        var yakin=muayeneler.filter(function(m){var g=new Date(m.sonrakiTarih||"");var b=new Date();b.setHours(0,0,0,0);var diff=Math.round((g-b)/86400000);return m.sonrakiTarih&&diff>=0&&diff<=30;});
        return React.createElement('div', {style:{background:"rgba(255,59,48,0.08)",border:"1px solid rgba(255,59,48,0.25)",borderRadius:16,padding:dashboardPad("inspectionAlerts","10px 12px","12px 14px","16px 18px"),marginBottom:10}}
          , React.createElement('div', {style:{fontSize:13,fontWeight:700,color:"var(--ios-red)",marginBottom:8}}, "🔴 Muayene Uyarıları")
          , gecikti.length===0&&yakin.length===0&&React.createElement('div', {style:{fontSize:12,color:"var(--text-muted)"}},"Şu an acil muayene uyarısı yok.")
          , gecikti.length>0&&React.createElement('div', {style:{fontSize:12,color:"var(--text-muted)",marginBottom:4}},
              "⚠️ "+gecikti.length+" asansörün muayene süresi geçmiş → "
              , React.createElement('button', {onClick:function(){setTab(11);},style:{background:"none",border:"none",color:"var(--ios-red)",cursor:"pointer",fontSize:12,fontWeight:700,padding:0}}, "Muayene Sekmesine Git →")
            )
          , yakin.length>0&&React.createElement('div', {style:{fontSize:12,color:"var(--text-muted)"}},
              "🟡 "+yakin.length+" asansörün muayenesi 30 gün içinde dolacak"
            )
        );
      })()
    /* Sözleşme Uyarıları */
    , dashboardEnabledMap.contractAlerts&&(function(){
        var b=new Date();b.setHours(0,0,0,0);
        var biten=sozlesmeler.filter(function(s){return s.bitis&&new Date(s.bitis)<b;}).length;
        var yakin=sozlesmeler.filter(function(s){if(!s.bitis) return false;var diff=Math.round((new Date(s.bitis)-b)/86400000);return diff>=0&&diff<=30;}).length;
        return React.createElement('div', {style:{background:"rgba(255,149,0,0.08)",border:"1px solid rgba(255,149,0,0.25)",borderRadius:16,padding:dashboardPad("contractAlerts","10px 12px","12px 14px","16px 18px"),marginBottom:10}}
          , React.createElement('div', {style:{fontSize:13,fontWeight:700,color:"var(--ios-orange)",marginBottom:6}}, "📄 Sözleşme Uyarıları")
          , biten===0&&yakin===0&&React.createElement('div', {style:{fontSize:12,color:"var(--text-muted)"}}, "Sözleşmelerde yaklaşan/geciken kayıt yok.")
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
                  , React.createElement(IBtn, { onClick: ()=>{
                      if(!window.confirm((e.ad||"Bu asansörü")+" silmek istediğinize emin misiniz?")) return;
                      del("e",e.id);
                    }, icon: "🗑️", danger: true,})
                  )
                )
                , React.createElement('div', { style: {fontSize:10,color:"#64748b",marginBottom:2},}, "📍 " , (e.semt?e.semt+" Mah., ":"")+e.adres)
                , React.createElement('div', { style: {fontSize:10,color:"#94a3b8",marginBottom:2},}, "👤 " , e.yonetici, " · 📞 "   , e.tel)
                , e.yoneticiDaire&&React.createElement('div', { style: {fontSize:10,color:"#f59e0b",marginBottom:2,fontWeight:700},}, "🚪 Daire: " , e.yoneticiDaire)
                /* Teknik Kart mini özeti */
                , (e.marka||e.tip)&&React.createElement('div', {style:{fontSize:10,color:"#64748b",marginBottom:2}},
                    "🔩 "+(e.marka||"")+(e.model?" "+e.model:"")+(e.tip?" · "+e.tip:"")+(e.imalatYili?" · "+e.imalatYili:"")
                  )
                , (function(){
                    var mevcutEskiDevir=bal(e.id);
                    var eskiDevirEtiket=mevcutEskiDevir!==(e.bakiyeDevir||0)?"Kalan Eski Devir":"Eski Devir";
                    return React.createElement('div', { style: {display:"flex",gap:6,marginTop:8,flexWrap:"wrap"},}
                      , React.createElement('span', { style: {fontSize:10,background:"#1e3a5f",color:"#3b82f6",padding:"2px 8px",borderRadius:6,fontWeight:700},}, e.aylikUcret.toLocaleString("tr-TR"), " ₺/ay")
                      , React.createElement('span', { style: {fontSize:10,background:mevcutEskiDevir>0?"#3a1e1e":mevcutEskiDevir<0?"#0a2a1a":"#1a1f2e",color:mevcutEskiDevir>0?"#ef4444":mevcutEskiDevir<0?"#34d399":"#64748b",padding:"2px 8px",borderRadius:6,fontWeight:700},}, eskiDevirEtiket+": " , (mevcutEskiDevir>0?"+":"")+mevcutEskiDevir.toLocaleString("tr-TR"), " ₺" )
                    );
                  })()
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
                        var konu="Asansör Bakım Bildirimi - "+e.ad;
                        var govde="Sayın "+e.yonetici+",\n\n"+e.ad+" binanızın asansörüne ait bakım bilgisi.\n\nAdres: "+(e.semt?e.semt+" Mah., ":"")+e.adres+", "+e.ilce+"\n\n-- AsansörTakip Pro --";
                        window.location.href="mailto:?subject="+encodeURIComponent(konu)+"&body="+encodeURIComponent(govde);
                      },
                      style:{padding:"5px 8px",borderRadius:8,background:"#1a1f2e",border:"1px solid #2a3050",color:"#94a3b8",fontSize:11,cursor:"pointer"}
                    }, "✉️"
                  )
                  , e.tel&&React.createElement('button', {
                      onClick:function(ev){
                        ev.stopPropagation();
                        borcWhatsappGonder(e);
                        return;
                        var nd=yeniDevir(e.id);
                        var borc=nd!==null?nd:(e.bakiyeDevir||0)+(e.aylikUcret||0);
                        var tutar=borc.toLocaleString("tr-TR")+" ₺";
                        var tel=(e.tel||"").replace(/[\s\-\(\)]/g,"");
                        if(tel.startsWith("0")) tel="90"+tel.slice(1);
                        else if(!tel.startsWith("90")&&!tel.startsWith("+90")) tel="90"+tel;
                        tel=tel.replace(/^\+/,"");
                        var mesaj=
                          "Sayın "+e.ad+" Yönetimi,\n\n"+
                          firmaAdi+" olarak binanıza sunduğumuz hizmet için teşekkür ederiz.\n\n"+
                          "Bilginize sunmak istediğimiz husus; binanızın asansörüne ait aylık periyodik bakımlar tarafımızca düzenli ve eksiksiz olarak gerçekleştirilmektedir.\n\n"+
                          "Güncel hesap durumunuza göre toplam bakım borcunuz *"+tutar+"* olup, ödemenizin en kısa sürede tarafımıza iletilmesini saygılarımızla arz ederiz.\n\n"+
                          "Herhangi bir sorunuz veya talebiniz olması halinde bizimle iletişime geçmekten çekinmeyiniz.\n\n"+
                          "Saygılarımızla,\n"+
                          firmaAdi;
                        window.open("https://wa.me/"+tel+"?text="+encodeURIComponent(mesaj),"_blank");
                      },
                      style:{padding:"5px 8px",borderRadius:8,background:"#0d2518",border:"1px solid #25d36633",color:"#25d366",fontSize:14,cursor:"pointer",lineHeight:1}
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
                                , m.yapildi&&React.createElement('span', {style:{fontSize:11,fontWeight:700,color:"#34c759"}}, finansMaintAlinan(m).toLocaleString("tr-TR"),"₺")
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
  React.createElement(BakimAtamaPaneli, { elevs: elevs, maints: maints, setMaints: setMaints, faults: faults, setFaults: setFaults, fMonth: fMonth, setFMonth: setFMonth, ilceler: ilceler, elevByIlce: elevByIlce, today: today, eName: eName, bakimcilar: bakimcilar, bal: bal,})
)

/* BAKIMCI GÖRÜNÜMÜ */
, tab===2&&rol==="bakimci"&&(
  React.createElement(BakimciGorunum, { elevs: elevs, maints: maints, setMaints: setMaints, faults: faults, setFaults: setFaults, bal: bal, buAyToplamAlinan: buAyToplamAlinan, ilceler: ilceler, today: today, fMonth: fMonth, setFMonth: setFMonth, eName: eName, sonOdemeler: sonOdemeler, setSonOdemeler: setSonOdemeler, aktifBakimci: aktifBakimci, firmaAdi: firmaAdi,})
)

/* ARIZALAR - YÖNETİCİ */
, tab===3&&(
  React.createElement(ArizaYonetimiAdmin, { faults: faults, setFaults: setFaults, elevs: elevs, eName: eName, oAdd: oAdd, oEdit: oEdit, del: del, bakimcilar: bakimcilar, firmaAdi: firmaAdi,})
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
        ? React.createElement('div', {style:{display:"flex",alignItems:"center",gap:6,background:"#0a2a1a",border:"1px solid #10b98144",borderRadius:8,padding:"5px 10px"}},
            React.createElement('span',{style:{fontSize:10,color:"#10b981",fontWeight:700}},"📡 Konumunuz alındı"),
            React.createElement('button',{onClick:()=>setRotaKonum(null),style:{background:"none",border:"none",color:"#64748b",cursor:"pointer",fontSize:14,lineHeight:1,padding:"0 2px"}},"×")
          )
        : React.createElement('button',{onClick:()=>konumAl(false),disabled:konumYukleniyor,
            style:{padding:"7px 13px",background:"#1e3a5f",border:"1px solid #3b82f644",borderRadius:8,color:"#3b82f6",cursor:"pointer",fontSize:12,fontWeight:700}},
            konumYukleniyor?"⏳ Alınıyor...":"📡 Konumu Al"
          )
    )

    /* Konum hatası */
    , konumHata&&React.createElement('div',{style:{fontSize:11,color:"#ef4444",background:"#2a1010",border:"1px solid #ef444433",borderRadius:7,padding:"8px 12px",marginBottom:10}},"⚠️ "+konumHata)

    /* Konum bilgisi veya manuel adres */
    , rotaKonum
      ? React.createElement('div',{style:{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"#0a2a1a",border:"1px solid #10b98133",borderRadius:10,marginBottom:12}},
          React.createElement('div',{style:{width:28,height:28,borderRadius:"50%",background:"#10b981",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",flexShrink:0}},"📍"),
          React.createElement('div',{style:{flex:1}},
            React.createElement('div',{style:{fontSize:11,fontWeight:700,color:"#10b981"}},"Başlangıç: Mevcut Konumunuz"),
            React.createElement('div',{style:{fontSize:10,color:"#6ee7b7",marginTop:1}},rotaKonum.label)
          )
        )
      : React.createElement('div',{style:{marginBottom:12}},
          React.createElement('div',{style:{fontSize:11,fontWeight:600,color:"#94a3b8",marginBottom:5}},"📍 Başlangıç noktası"),
          React.createElement('input',{value:rotaStart,onChange:e=>setRotaStart(e.target.value),
            placeholder:"Adres yazın veya yukarıdan konumu alın...",
            style:{...S.inp,width:"100%",boxSizing:"border-box",border:"1px solid "+(rotaStart?"#3b82f666":"#2a3050")}
          }),
          !rotaStart&&React.createElement('div',{style:{fontSize:10,color:"#ef4444",marginTop:4,fontWeight:600}},
            "⚠️ Konum alınmadan rota Google Maps'te mevcut konumdan başlamayabilir."
          )
        )

    /* BAKIMCI: Bekleyen Bakımlar akıllı filtresi */
    , rol==="bakimci"&&bekleyenRotaIds.length>0&&React.createElement('div',{style:{background:"linear-gradient(135deg,#0a2a1a,#0d1f1a)",border:"1px solid #10b98155",borderRadius:12,padding:"12px 14px",marginBottom:12}},
        React.createElement('div',{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}},
          React.createElement('div',null,
            React.createElement('div',{style:{fontSize:13,fontWeight:800,color:"#10b981"}},"🔧 Bekleyen Bakımlar"),
            React.createElement('div',{style:{fontSize:10,color:"#6ee7b7",marginTop:2}},bekleyenRotaIds.length+" asansör bu ay henüz tamamlanmadı")
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
                background:sec?"#10b981":"#162820",
                color:sec?"#fff":"#6ee7b7",
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
      React.createElement('div',{style:{fontSize:11,fontWeight:700,color:"#94a3b8",marginBottom:6}},"⚡ Hızlı Bölge Seçimi"),
      React.createElement('div',{style:{display:"flex",flexWrap:"wrap",gap:5}},
        React.createElement('button',{
          onClick:()=>{setRotaIlce("Tümü");setRotaSec([]);},
          style:{fontSize:10,padding:"4px 10px",borderRadius:6,background:rotaIlce==="Tümü"?"#1e3a5f":"#1a1f2e",color:rotaIlce==="Tümü"?"#3b82f6":"#64748b",border:"1px solid "+(rotaIlce==="Tümü"?"#3b82f6":"#2a3050"),cursor:"pointer",fontWeight:700}
        },"Tüm İlçeler"),
        Object.entries(elevByIlce).map(function([ilce,es]){
          var c=getIlceRenk(ilce);
          var secili=rotaIlce===ilce;
          // Bakımcı modunda ilçedeki bekleyen sayısını göster
          var bekleyen=bekleyenRotaIds.filter(function(id){return es.some(function(e){return e.id===id;});}).length;
          return React.createElement('button',{key:ilce,
            onClick:()=>{setRotaIlce(ilce);setRotaSec([]);},
            style:{fontSize:10,padding:"4px 10px",borderRadius:6,background:secili?c+"33":"#1a1f2e",color:secili?c:"#94a3b8",border:"1px solid "+(secili?c+"66":"#2a3050"),cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",gap:4}
          },
            ilce+" ("+es.length+")",
            bekleyen>0&&React.createElement('span',{style:{background:"#10b98133",color:"#10b981",borderRadius:10,padding:"0px 5px",fontSize:9,fontWeight:800}},bekleyen+" ⏳")
          );
        })
      )
    )

    /* Asansör listesi */
    , React.createElement('div',{style:{background:"#161b2e",borderRadius:12,border:"1px solid #2a3050",marginBottom:10}},
      React.createElement('div',{style:{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",borderBottom:"1px solid #2a3050",flexWrap:"wrap",gap:6}},
        React.createElement('span',{style:{fontSize:12,fontWeight:700,color:"#94a3b8"}},
          "Asansörler — ",
          React.createElement('span',{style:{color:"#3b82f6"}},rotaSec.length," seçili")
        ),
        React.createElement('div',{style:{display:"flex",gap:6}},
          React.createElement('button',{onClick:()=>setRotaSec(rotaPool.map(e=>e.id)),style:{fontSize:10,padding:"4px 10px",borderRadius:6,background:"#1e3a5f",color:"#3b82f6",border:"none",cursor:"pointer",fontWeight:700}},"Tümünü Seç"),
          React.createElement('button',{onClick:()=>setRotaSec([]),style:{fontSize:10,padding:"4px 10px",borderRadius:6,background:"#2a3050",color:"#64748b",border:"none",cursor:"pointer",fontWeight:700}},"Temizle")
        )
      ),
      React.createElement('div',{style:{maxHeight:260,overflowY:"auto",padding:"6px 8px",display:"flex",flexDirection:"column",gap:3}},
        rotaPool.length===0
          ? React.createElement('div',{style:{padding:"20px",textAlign:"center",color:"#64748b",fontSize:12}},"Asansör bulunamadı")
          : rotaPool.map(function(e){
            var sec=rotaSec.includes(e.id);
            var sira=rotaSec.indexOf(e.id)+1;
            var c=getIlceRenk(e.ilce);
            var bekliyor=bekleyenRotaIds.includes(e.id);
            var maint=mMonth.find(function(m){return m.asansorId===e.id;});
            var tamam=maint&&maint.yapildi;
            return React.createElement('div',{
              key:e.id,
              onClick:()=>setRotaSec(p=>sec?p.filter(x=>x!==e.id):[...p,e.id]),
              style:{display:"flex",alignItems:"center",gap:8,padding:"9px 10px",borderRadius:8,
                background:sec?"#1a2a4a":bekliyor?"#0d1f15":"#0d1321",
                border:"1px solid "+(sec?"#3b82f6":bekliyor?"#10b98144":"#1e2640"),
                cursor:"pointer",transition:"all 0.1s"}
            },
              /* Checkbox / sıra numarası */
              React.createElement('div',{style:{width:22,height:22,borderRadius:5,background:sec?"#3b82f6":"#2a3050",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff",flexShrink:0}},sec?sira:"☐"),
              /* Bina bilgisi */
              React.createElement('div',{style:{flex:1,minWidth:0}},
                React.createElement('div',{style:{fontSize:12,fontWeight:600,color:sec?"#e0e6f0":bekliyor?"#6ee7b7":"#94a3b8"}},e.ad),
                React.createElement('div',{style:{fontSize:10,color:"#64748b",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}},e.ilce+(e.semt?", "+e.semt:""))
              ),
              /* Durum badge */
              tamam
                ? React.createElement('span',{style:{fontSize:9,padding:"2px 7px",borderRadius:10,background:"#0a2a1a",color:"#10b981",fontWeight:700,flexShrink:0}},"✅ Tamam")
                : bekliyor
                  ? React.createElement('span',{style:{fontSize:9,padding:"2px 7px",borderRadius:10,background:"#10b98120",color:"#10b981",fontWeight:700,flexShrink:0,border:"1px solid #10b98144"}},"⏳ Bekliyor")
                  : React.createElement('div',{style:{width:6,height:6,borderRadius:"50%",background:c,flexShrink:0}})
            );
          })
      )
    )

    /* Akıllı rota durum kartları */
    , rotaSec.length>0&&React.createElement('div',{style:{display:"flex",gap:8,marginBottom:4,flexWrap:"wrap"}},
        React.createElement('div',{style:{flex:1,minWidth:140,padding:"10px 12px",borderRadius:10,background:rotaHesaplaniyor?"rgba(59,130,246,0.12)":"rgba(16,185,129,0.10)",border:"1px solid "+(rotaHesaplaniyor?"#3b82f655":"#10b98133")}},
          React.createElement('div',{style:{fontSize:9,fontWeight:800,color:rotaHesaplaniyor?"#60a5fa":"#10b981",marginBottom:3}},"AKILLI ROTA"),
          React.createElement('div',{style:{fontSize:12,fontWeight:700,color:"#e0e6f0"}},rotaHesaplaniyor?"Adresler analiz ediliyor...":"Rota sırası hazır")
        ),
        rotaTahminiKm!==null&&React.createElement('div',{style:{padding:"10px 12px",borderRadius:10,background:"rgba(16,185,129,0.10)",border:"1px solid #10b98133"}},
          React.createElement('div',{style:{fontSize:9,fontWeight:800,color:"#10b981",marginBottom:3}},"TAHMİNİ MESAFE"),
          React.createElement('div',{style:{fontSize:12,fontWeight:700,color:"#a7f3d0"}},rotaTahminiKm.toFixed(1)+" km")
        )
      )
    , rotaOptHata&&React.createElement('div',{style:{fontSize:11,color:"#f59e0b",background:"rgba(245,158,11,0.10)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:8,padding:"8px 12px",marginBottom:4,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}},
        React.createElement('span',null,"⚠️ "+rotaOptHata),
        React.createElement('button',{
          onClick:function(){setRotaGeoCache({});lsSet("at_geo_cache",{});},
          style:{fontSize:10,padding:"4px 8px",borderRadius:6,background:"#f59e0b22",color:"#f59e0b",border:"1px solid #f59e0b55",cursor:"pointer",fontWeight:700,whiteSpace:"nowrap",flexShrink:0}
        },"🔄 Yeniden Dene")
      )

    /* Rota özeti + butonlar */
    , rotaElevs.length>0
      ? React.createElement('div',{style:{display:"flex",flexDirection:"column",gap:8}},
          /* Başlangıç noktası özeti */
          rotaStartStr
            ? React.createElement('div',{style:{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#0a2a1a",borderRadius:9,border:"1px solid #10b98133"}},
                React.createElement('div',{style:{width:22,height:22,borderRadius:"50%",background:"#10b981",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff",flexShrink:0}},"S"),
                React.createElement('div',null,
                  React.createElement('div',{style:{fontSize:10,fontWeight:700,color:"#10b981"}},"Başlangıç Noktası"),
                  React.createElement('div',{style:{fontSize:10,color:"#6ee7b7"}},rotaKonum?rotaKonum.label:rotaStart)
                )
              )
            : React.createElement('div',{style:{padding:"8px 12px",background:"#2a1010",border:"1px solid #ef444433",borderRadius:9}},
                React.createElement('div',{style:{fontSize:11,color:"#ef4444",fontWeight:700}},"⚠️ Başlangıç konumu yok"),
                React.createElement('div',{style:{fontSize:10,color:"#f87171",marginTop:2}},"Google Maps size başlangıç soracak. Daha iyi deneyim için yukarıdan konumu alın.")
              ),

          /* Durak listesi */
          React.createElement('div',{style:{background:"#161b2e",borderRadius:10,border:"1px solid #2a3050",padding:"8px 10px",display:"flex",flexDirection:"column",gap:3}},
            rotaElevs.map(function(e,i){
              var c=getIlceRenk(e.ilce);
              var bekliyor=bekleyenRotaIds.includes(e.id);
              var defaultAddr=(e.semt?e.semt+" Mahallesi, ":"")+e.adres+(e.ilce?", "+e.ilce+", İstanbul":"");
              var coords=getElevCoords(e);
              var mapsAddr=coords?(coords.lat+","+coords.lng):(e.rotaAdres||defaultAddr);
              var displayAddr=e.rotaAdres||((e.semt?e.semt+" Mah., ":"")+e.adres);
              var editing=rotaEditingId===e.id;
              return React.createElement('div',{key:e.id,style:{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:bekliyor?"#0d1f15":"#0d1321",borderRadius:7,border:"1px solid "+(bekliyor?"#10b98133":"#1e2640")}},
                React.createElement('div',{style:{width:22,height:22,borderRadius:"50%",background:c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff",flexShrink:0}},i+1),
                React.createElement('div',{style:{flex:1,minWidth:0}},
                  React.createElement('div',{style:{fontSize:12,fontWeight:700,color:"#e0e6f0",display:"flex",alignItems:"center",gap:6}},
                    e.ad,
                    bekliyor&&React.createElement('span',{style:{fontSize:9,color:"#10b981",background:"#10b98120",padding:"1px 6px",borderRadius:8,fontWeight:700}},"⏳ Bekliyor")
                  ),
                  editing
                    ? React.createElement('div',{style:{display:"flex",flexDirection:"column",gap:3,marginTop:3}},
                        React.createElement('div',{style:{display:"flex",alignItems:"center",gap:4}},
                          React.createElement('span',{style:{fontSize:9,color:"#64748b",width:34,flexShrink:0}},"Sokak"),
                          React.createElement('input',{
                            value:rotaEditingVal.adres,
                            onChange:function(ev){setRotaEditingVal(function(p){return {...p,adres:ev.target.value};});},
                            onKeyDown:function(ev){if(ev.key==="Escape")setRotaEditingId(null);},
                            autoFocus:true,
                            placeholder:"Sokak, bina no...",
                            style:{flex:1,fontSize:10,padding:"3px 7px",borderRadius:5,background:"#0d1321",border:"1px solid #3b82f6",color:"#e0e6f0",outline:"none"}
                          })
                        ),
                        React.createElement('div',{style:{display:"flex",alignItems:"center",gap:4}},
                          React.createElement('span',{style:{fontSize:9,color:"#64748b",width:34,flexShrink:0}},"Semt"),
                          React.createElement('input',{
                            value:rotaEditingVal.semt,
                            onChange:function(ev){setRotaEditingVal(function(p){return {...p,semt:ev.target.value};});},
                            onKeyDown:function(ev){if(ev.key==="Escape")setRotaEditingId(null);},
                            placeholder:"Mahalle/Semt...",
                            style:{flex:1,fontSize:10,padding:"3px 7px",borderRadius:5,background:"#0d1321",border:"1px solid #2a3050",color:"#e0e6f0",outline:"none"}
                          })
                        ),
                        React.createElement('div',{style:{display:"flex",alignItems:"center",gap:4}},
                          React.createElement('span',{style:{fontSize:9,color:"#64748b",width:34,flexShrink:0}},"İlçe"),
                          React.createElement('input',{
                            value:rotaEditingVal.ilce,
                            onChange:function(ev){setRotaEditingVal(function(p){return {...p,ilce:ev.target.value};});},
                            onKeyDown:function(ev){if(ev.key==="Escape")setRotaEditingId(null);},
                            placeholder:"İlçe...",
                            style:{flex:1,fontSize:10,padding:"3px 7px",borderRadius:5,background:"#0d1321",border:"1px solid #2a3050",color:"#e0e6f0",outline:"none"}
                          })
                        ),
                        React.createElement('div',{style:{display:"flex",gap:4,marginTop:2}},
                          React.createElement('button',{
                            onClick:function(){var yeni=elevs.map(function(x){return x.id===e.id?{...x,adres:rotaEditingVal.adres,semt:rotaEditingVal.semt,ilce:rotaEditingVal.ilce,rotaAdres:"",lat:null,lng:null,geoQuality:"",geoScore:null,geoType:"",geoAddress:"",geoUpdatedAt:""}:x;});setElevs(yeni);dbSet("at_elevs",yeni);lsSet("ls_elevs",yeni);setRotaEditingId(null);},
                            style:{flex:1,fontSize:11,padding:"4px 0",borderRadius:5,background:"#10b981",color:"#fff",border:"none",cursor:"pointer",fontWeight:800}
                          },"✓ Kaydet"),
                          React.createElement('button',{
                            onClick:function(){setRotaEditingId(null);},
                            style:{fontSize:11,padding:"4px 10px",borderRadius:5,background:"#2a3050",color:"#94a3b8",border:"none",cursor:"pointer"}
                          },"✗")
                        )
                      )
                    : React.createElement('div',{style:{display:"flex",alignItems:"center",gap:4,marginTop:1}},
                        React.createElement('span',{style:{fontSize:9,color:e.rotaAdres?"#60a5fa":"#64748b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}},
                          displayAddr
                        ),
                        e.rotaAdres&&React.createElement('button',{
                          onClick:function(ev){ev.stopPropagation();setElevs(function(p){return p.map(function(x){return x.id===e.id?{...x,rotaAdres:""}:x;});});},
                          title:"Orijinal adrese dön",
                          style:{fontSize:10,padding:"1px 5px",borderRadius:4,background:"#2a3050",color:"#94a3b8",border:"none",cursor:"pointer",flexShrink:0,lineHeight:1.5}
                        },"↺"),
                        React.createElement('button',{
                          onClick:function(ev){ev.stopPropagation();setRotaEditingVal({adres:e.adres||"",semt:e.semt||"",ilce:e.ilce||""});setRotaEditingId(e.id);},
                          style:{fontSize:10,padding:"1px 5px",borderRadius:4,background:"#1e3a5f",color:"#3b82f6",border:"none",cursor:"pointer",flexShrink:0,lineHeight:1.5}
                        },"✏️")
                      )
                ),
                React.createElement('a',{
                  href:"https://maps.google.com/?q="+encodeURIComponent(mapsAddr),
                  target:"_blank",rel:"noreferrer",
                  style:{fontSize:10,padding:"5px 9px",borderRadius:6,background:"#1e3a5f",color:"#3b82f6",textDecoration:"none",fontWeight:700,flexShrink:0}
                },"📍")
              );
            })
          ),

          /* Ana butonlar */
          rotaHesaplaniyor
            ? React.createElement('div',{style:{display:"flex",alignItems:"center",justifyContent:"center",gap:10,padding:"15px 0",
                background:"#1a2a20",borderRadius:12,color:"#6ee7b7",fontWeight:700,fontSize:13,
                border:"2px solid #10b98144",letterSpacing:"0.3px"}},
                React.createElement('span',{style:{display:"inline-block",animation:"spin 1s linear infinite"}},"⏳"),
                "Rota optimize ediliyor, lütfen bekleyin..."
              )
            : React.createElement('a',{href:mapsUrl,target:"_blank",rel:"noreferrer",
                style:{display:"flex",alignItems:"center",justifyContent:"center",gap:8,padding:"15px 0",
                  background:"linear-gradient(135deg,#10b981,#059669)",borderRadius:12,color:"#fff",
                  textDecoration:"none",fontWeight:800,fontSize:14,letterSpacing:"0.3px",boxShadow:"0 4px 14px #10b98144"}
              }, mapsUrls.length>1?"🗺️ 1. Parçayı Google Maps'te Başlat":"🗺️ Google Maps'te Rotayı Başlat"),

          mapsUrls.length>1&&React.createElement('div',{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:8}},
            mapsUrls.slice(1).map(function(m,idx){
              return React.createElement('a',{key:idx,href:m.url,target:"_blank",rel:"noreferrer",
                style:{display:"flex",alignItems:"center",justifyContent:"center",padding:"10px 8px",borderRadius:9,background:"#10233f",border:"1px solid #2563eb55",color:"#93c5fd",textDecoration:"none",fontWeight:800,fontSize:12}
              },(idx+2)+". Parça ("+m.start+"-"+m.end+")");
            })
          ),

          React.createElement('button',{
            onClick:function(){var text=mapsUrls.length>1?mapsUrls.map(function(m,i){return (i+1)+". Parça ("+m.start+"-"+m.end+"): "+m.url;}).join("\n"):mapsUrl;_optionalChain([navigator,'access',_12=>_12.clipboard,'optionalAccess',_13=>_13.writeText,'call',_14=>_14(text),'access',_15=>_15.then,'call',_16=>_16(()=>alert("Kopyalandı!")),'access',_17=>_17.catch,'call',_18=>_18(()=>{})]);},
            style:{padding:"10px 0",background:"#1a1f2e",border:"1px solid #2a3050",borderRadius:10,color:"#94a3b8",fontWeight:600,fontSize:12,cursor:"pointer"}
          },"📋 Rota Linkini Kopyala")
        )
      : React.createElement('div',{style:{textAlign:"center",padding:"30px 20px",background:"#161b2e",borderRadius:12,border:"1px solid #2a3050"}},
          React.createElement('div',{style:{fontSize:36,marginBottom:8}},"🗺️"),
          React.createElement('div',{style:{color:"#64748b",fontSize:13,fontWeight:600,marginBottom:4}},"Yukarıdan asansör seçin"),
          React.createElement('div',{style:{color:"#475569",fontSize:11}},
            rol==="bakimci"&&bekleyenRotaIds.length>0
              ?"🔧 "+bekleyenRotaIds.length+" bekleyen bakımınız var — yeşil karttan hepsini seçin"
              :"Seçilen asansörler mevcut konumunuzdan sıralanır"
          )
        )
  )
)

/* FİNANS */
, tab===6&&(rol!=="yonetici"||isSuper||limits.finans)&&(
  React.createElement('div', null
    , React.createElement('div',{style:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}
        , React.createElement('h2', {style:{fontSize:18,fontWeight:900,margin:0}}, "💰 Finansal Durum")
        , React.createElement('button',{
            onClick:finansYenile,
            disabled:finansYenileniyor,
            style:{padding:"7px 14px",background:"#1a1f2e",border:"1px solid #2a3050",borderRadius:9,color:finansYenileniyor?"#475569":"#3b82f6",fontSize:12,fontWeight:700,cursor:finansYenileniyor?"default":"pointer",display:"flex",alignItems:"center",gap:6,transition:"all .2s"}
          }
          , React.createElement('span',{style:{display:"inline-block",animation:finansYenileniyor?"spin 1s linear infinite":"none"}},"🔄")
          , finansYenileniyor?"Yenileniyor...":"Yenile"
        )
      )

    /* Özet İstatistikler */
    , (function(){
        var simdi=new Date();
        /* Bu ayki tahsilat: ayın 1'i 00:00 - ayın son günü 23:59 */
        var ayBaslangic=new Date(simdi.getFullYear(),simdi.getMonth(),1);ayBaslangic.setHours(0,0,0,0);
        var aySon=new Date(simdi.getFullYear(),simdi.getMonth()+1,0);aySon.setHours(23,59,59,999);
        var buAyTahsilat=sonOdemeler.filter(function(o){var od=parseFinansDate(o.tarih);return !o.iptal&&od&&od>=ayBaslangic&&od<=aySon;}).reduce(function(s,o){return s+finansTutar(o.alinanTutar);},0);
        buAyTahsilat+=maintTahsilatNotInSonOdemeler(sonOdemeler,maints,ayBaslangic,aySon);
        /* Bu haftaki tahsilat: Pazartesi 00:00 - Pazar 23:59 */
        var gun=simdi.getDay(); // 0=Pazar
        var pazartesiFark=gun===0?-6:1-gun;
        var haftaBaslangic=new Date(simdi);haftaBaslangic.setDate(simdi.getDate()+pazartesiFark);haftaBaslangic.setHours(0,0,0,0);
        var haftaSon=new Date(haftaBaslangic);haftaSon.setDate(haftaBaslangic.getDate()+6);haftaSon.setHours(23,59,59,999);
        var buHaftaTahsilat=sonOdemeler.filter(function(o){var od=parseFinansDate(o.tarih);return !o.iptal&&od&&od>=haftaBaslangic&&od<=haftaSon;}).reduce(function(s,o){return s+finansTutar(o.alinanTutar);},0);
        buHaftaTahsilat+=maintTahsilatNotInSonOdemeler(sonOdemeler,maints,haftaBaslangic,haftaSon);
        /* Bugünün tahsilatı: 00:00 - 23:59 */
        var bugunBaslangic=new Date(simdi.getFullYear(),simdi.getMonth(),simdi.getDate(),0,0,0,0);
        var bugunSon=new Date(simdi.getFullYear(),simdi.getMonth(),simdi.getDate(),23,59,59,999);
        var bugunTahsilat=sonOdemeler.filter(function(o){var od=parseFinansDate(o.tarih);return !o.iptal&&od&&od>=bugunBaslangic&&od<=bugunSon;}).reduce(function(s,o){return s+finansTutar(o.alinanTutar);},0);
        bugunTahsilat+=maintTahsilatNotInSonOdemeler(sonOdemeler,maints,bugunBaslangic,bugunSon);
        /* Tarih aralığı yazıları */
        var ayAd=["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"][simdi.getMonth()];
        var gunler=["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
        var haftaBasStr=haftaBaslangic.getDate()+"."+(haftaBaslangic.getMonth()+1).toString().padStart(2,"0");
        var haftaSonStr=haftaSon.getDate()+"."+(haftaSon.getMonth()+1).toString().padStart(2,"0");
        return React.createElement('div', {style:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:10,marginBottom:16}}
          , React.createElement(Stat, {icon:"💰", label:"Bu Ayki Tahsilat ("+ayAd+")", value:buAyTahsilat.toLocaleString("tr-TR")+" ₺", color:"#10b981"})
          , React.createElement(Stat, {icon:"📅", label:"Bu Hafta ("+haftaBasStr+" - "+haftaSonStr+")", value:buHaftaTahsilat.toLocaleString("tr-TR")+" ₺", color:"#3b82f6"})
          , React.createElement(Stat, {icon:"☀️", label:"Bugün ("+gunler[simdi.getDay()]+")", value:bugunTahsilat.toLocaleString("tr-TR")+" ₺", color:"#f59e0b"})
          , React.createElement(Stat, {icon:"🗓️", label:"Haftalık Kapama", value:haftalikKapamalar.length+" / 26", color:"#8b5cf6"})
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
        var bugunOdemeler=sonOdemeler.filter(function(o){var od=parseFinansDate(o.tarih);return od&&od>=bugunBas&&od<=bugunSon;}).slice().reverse();
        maints.filter(function(m){var amt=finansMaintAlinan(m);if(!m.yapildi||amt<=0) return false;var od=parseFinansDate(m.tarih);if(!od||od<bugunBas||od>bugunSon) return false;return !hasSonOdemeMatchForMaint(sonOdemeler,m,bugunBas,bugunSon,amt);}).forEach(function(m){var elev=elevs.find(function(e){return e.id===m.asansorId;})||{};bugunOdemeler.push({id:"maint_"+m.id,aid:m.asansorId,tarih:m.tarih,saat:finansSaatFromMaint(m),alinanTutar:finansMaintAlinan(m),not:"Bakım sonrası tahsilat",binaAd:elev.ad||"?",ilce:elev.ilce||"",yonetici:elev.yonetici||"",_fromMaint:true});});
        var bugunToplam=bugunOdemeler.filter(function(o){return !o.iptal;}).reduce(function(s,o){return s+finansTutar(o.alinanTutar);},0);
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
                                if(o._fromMaint){
                                  if(!window.confirm("Geri al: "+o.binaAd+" · "+(o.alinanTutar||0).toLocaleString("tr-TR")+" ₺?")) return;
                                  setMaints(function(p){return p.map(function(m){return String("maint_"+m.id)===String(o.id)?Object.assign({},m,{odendi:false,alinanTutar:0}):m;});});
                                } else {
                                  if(!window.confirm("Bu ödeme geri alınsın mı?\n"+o.binaAd+" · "+(o.alinanTutar||0).toLocaleString("tr-TR")+" ₺")) return;
                                  setSonOdemeler(function(p){return p.map(function(x){return x.id===o.id?Object.assign({},x,{iptal:true,iptalZamani:new Date().toLocaleString("tr-TR")}):x;});});
                                  setMaints(function(p){return p.map(function(m){if(m.asansorId===o.aid&&m.odendi&&finansMaintAlinan(m)===finansTutar(o.alinanTutar)){return Object.assign({},m,{odendi:false,alinanTutar:0});}return m;});});
                                }
                              },
                              style:{marginTop:4,padding:"3px 8px",background:"#3a1e1e",border:"1px solid #ef444444",borderRadius:5,color:"#ef4444",fontSize:10,fontWeight:700,cursor:"pointer"}
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
        var haftaOdemeler=sonOdemeler.filter(function(o){var od=parseFinansDate(o.tarih);return od&&od>=haftaBas&&od<=haftaSon;});
        maints.filter(function(m){var amt=finansMaintAlinan(m);if(!m.yapildi||amt<=0) return false;var od=parseFinansDate(m.tarih);if(!od||od<haftaBas||od>haftaSon) return false;return !hasSonOdemeMatchForMaint(sonOdemeler,m,haftaBas,haftaSon,amt);}).forEach(function(m){var elev=elevs.find(function(e){return e.id===m.asansorId;})||{};haftaOdemeler.push({id:"maint_"+m.id,aid:m.asansorId,tarih:m.tarih,saat:finansSaatFromMaint(m),alinanTutar:finansMaintAlinan(m),not:"Bakım sonrası tahsilat",binaAd:elev.ad||"?",ilce:elev.ilce||"",yonetici:elev.yonetici||"",_fromMaint:true});});
        var haftaToplam=haftaOdemeler.filter(function(o){return !o.iptal;}).reduce(function(s,o){return s+finansTutar(o.alinanTutar);},0);
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
                    var gunToplam=gunOdemeler.filter(function(o){return !o.iptal;}).reduce(function(s,o){return s+finansTutar(o.alinanTutar);},0);
                    var tarihObj=parseFinansDate(tarih)||new Date(tarih);
                    var gunAdi=gunAdlari[tarihObj.getDay()];
                    var bugun=tarih===today;
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
                                        if(o._fromMaint){
                                          if(!window.confirm("Geri al: "+o.binaAd+" · "+(o.alinanTutar||0).toLocaleString("tr-TR")+" ₺?")) return;
                                          setMaints(function(p){return p.map(function(m){return String("maint_"+m.id)===String(o.id)?Object.assign({},m,{odendi:false,alinanTutar:0}):m;});});
                                        } else {
                                          if(!window.confirm("Geri al: "+o.binaAd+" · "+(o.alinanTutar||0).toLocaleString("tr-TR")+" ₺?")) return;
                                          setSonOdemeler(function(p){return p.map(function(x){return x.id===o.id?Object.assign({},x,{iptal:true,iptalZamani:new Date().toLocaleString("tr-TR")}):x;});});
                                          setMaints(function(p){return p.map(function(m){if(m.asansorId===o.aid&&m.odendi&&finansMaintAlinan(m)===finansTutar(o.alinanTutar)){return Object.assign({},m,{odendi:false,alinanTutar:0});}return m;});});
                                        }
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
        var ayOdemeler=sonOdemeler.filter(function(o){var od=parseFinansDate(o.tarih);return od&&od>=ayBas&&od<=aySon;}).slice().reverse();
        maints.filter(function(m){var amt=finansMaintAlinan(m);if(!m.yapildi||amt<=0) return false;var od=parseFinansDate(m.tarih);if(!od||od<ayBas||od>aySon) return false;return !hasSonOdemeMatchForMaint(sonOdemeler,m,ayBas,aySon,amt);}).forEach(function(m){var elev=elevs.find(function(e){return e.id===m.asansorId;})||{};ayOdemeler.push({id:"maint_"+m.id,aid:m.asansorId,tarih:m.tarih,saat:finansSaatFromMaint(m),alinanTutar:finansMaintAlinan(m),not:"Bakım sonrası tahsilat",binaAd:elev.ad||"?",ilce:elev.ilce||"",yonetici:elev.yonetici||"",_fromMaint:true});});
        var ayToplam=ayOdemeler.filter(function(o){return !o.iptal;}).reduce(function(s,o){return s+finansTutar(o.alinanTutar);},0);
        var ayHedef=elevs.reduce(function(s,e){return s+(e.aylikUcret||0);},0);
        var ayIptalToplam=ayOdemeler.filter(function(o){return o.iptal;}).reduce(function(s,o){return s+finansTutar(o.alinanTutar);},0);
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
                                      if(o._fromMaint){
                                        if(!window.confirm("Geri al: "+o.binaAd+" · "+(o.alinanTutar||0).toLocaleString("tr-TR")+" ₺?")) return;
                                        setMaints(function(p){return p.map(function(m){return String("maint_"+m.id)===String(o.id)?Object.assign({},m,{odendi:false,alinanTutar:0}):m;});});
                                      } else {
                                        if(!window.confirm("Geri al: "+o.binaAd+" · "+(o.alinanTutar||0).toLocaleString("tr-TR")+" ₺?")) return;
                                        setSonOdemeler(function(p){return p.map(function(x){return x.id===o.id?Object.assign({},x,{iptal:true,iptalZamani:new Date().toLocaleString("tr-TR")}):x;});});
                                        setMaints(function(p){return p.map(function(m){if(m.asansorId===o.aid&&m.odendi&&finansMaintAlinan(m)===finansTutar(o.alinanTutar)){return Object.assign({},m,{odendi:false,alinanTutar:0});}return m;});});
                                      }
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
            , React.createElement('div', {style:{fontSize:10,color:"#64748b",marginTop:2}}, "Her Cumartesi 16:00 · Son 26 hafta")
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
            , React.createElement('div', {style:{fontSize:10,color:"#64748b",marginTop:2}}, "Her ayın 1'i · Son 12 ay")
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
, tab===7&&(rol!=="yonetici"||isSuper||limits.finans)&&(
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
    React.createElement(NotlarEkrani, {elevs:elevs,notlar:notlar,setNotlar:setNotlar,rol:"yonetici",ilceler:ilceler,aktifBakimci:aktifBakimci})
  )
)

/* NOTLAR - BAKIMCI */
, tab===8&&rol==="bakimci"&&(
  React.createElement('div', null,
    React.createElement(NotlarEkrani, {elevs:elevs,notlar:notlar,setNotlar:setNotlar,rol:"bakimci",ilceler:ilceler,aktifBakimci:aktifBakimci})
  )
)

/* EKSTRA İŞ - her iki rol de tab===9 kullanır */
, tab===9&&(
  React.createElement(EkstraIsEkrani, {elevs:elevs,ekstraIsler:ekstraIsler,setEkstraIsler:setEkstraIsler,setElevs:setElevs,rol:rol,ilceler:ilceler,today:today,aktifBakimci:aktifBakimci})
)

/* PERİYODİK MUAYENE TAKİBİ */
, tab===10&&rol==="yonetici"&&(isSuper||limits.teklif)&&(
  React.createElement('div', {className:"ios-animate"},
    React.createElement(TeklifYonetimi, {elevs:elevs,teklifler:teklifler,setTeklifler:setTeklifler,ilceler:ilceler,tenantConfig:tenantConfig?Object.assign({},tenantConfig,{_isAsis:isSuper}):null})
  )
)

/* SÖZLEŞME YÖNETİMİ */
, tab===11&&rol==="yonetici"&&(
  React.createElement('div', {className:"ios-animate"},
    React.createElement(MuayeneTakibi, {elevs:elevs,muayeneler:muayeneler,setMuayeneler:setMuayeneler})
  )
)

/* SÃ–ZLEÅME YÃ–NETÄ°MÄ° */
, tab===12&&rol==="yonetici"&&(isSuper||limits.sozlesme)&&(
  React.createElement('div', {className:"ios-animate"},
    React.createElement(SozlesmeYonetimi, {elevs:elevs,sozlesmeler:sozlesmeler,setSozlesmeler:setSozlesmeler})
  )
)

/* YÖNETİCİ / BİNA PORTALI */
, tab===13&&rol==="yonetici"&&(
  React.createElement('div', {className:"ios-animate"},
    React.createElement(YoneticiPortali, {elevs:elevs,maints:maints,faults:faults,muayeneler:muayeneler,sozlesmeler:sozlesmeler})
  )
)

/* BAKIMCI YÖNETİMİ */
, tab===14&&rol==="yonetici"&&(
  React.createElement('div', {className:"ios-animate"},
    React.createElement(BakimciYonetimPaneli, {bakimcilar:bakimcilar,setBakimcilar:setBakimcilar,onBakimciEkle:handleBakimciEkle,onBakimciGuncelle:handleBakimciGuncelle})
  )
)

/* FIRMALAR (süper-admin) */
, tab===15&&rol==="yonetici"&&isSuper&&(
  React.createElement('div', {className:"ios-animate"},
    React.createElement(FirmalarPaneli, { currentTenantId: tenantId })
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
          , React.createElement(MapsLinkInput,{
              value:form._mapsInput||"",
              onChange:function(v){F("_mapsInput",v);},
              required:!edit||!getElevCoords(form),
              existingCoords:getElevCoords(form)
            })
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
              , React.createElement(MapsLinkInput,{
                  value:form._yeniMapsInput||"",
                  onChange:function(v){F("_yeniMapsInput",v);},
                  required:true,
                  existingCoords:null
                })
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
                onKeyDown: e=>{if(e.key==="Enter"){firebaseLogin("yonetici@asistakip.app",sifreInput,{noCreate:true}).then(function(res){if(res.success){setRol("yonetici");setTab(0);setSifreModal(false);}else{setSifreHata("Hatalı şifre!");setSifreInput("");}});}},
                placeholder: "Şifre girin", autoFocus: true,
                style: {...S.inp,fontSize:16,marginBottom:sifreHata?10:0}}),
              sifreHata&&React.createElement('div', { style: {fontSize:13,color:"var(--ios-red)",background:"rgba(255,59,48,0.1)",borderRadius:10,padding:"8px 12px"}}, "🚫 " , sifreHata)
            ),
            React.createElement('div', { style: {padding:"8px 18px 10px",display:"flex",gap:10}},
              React.createElement('button', { onClick: ()=>setSifreModal(false), style: {flex:1,padding:"13px",background:"var(--bg-elevated)",border:"none",borderRadius:14,color:"var(--text-muted)",cursor:"pointer",fontWeight:600,fontSize:15,minHeight:50}}, "İptal"),
              React.createElement('button', { onClick: ()=>{firebaseLogin("yonetici@asistakip.app",sifreInput,{noCreate:true}).then(function(res){if(res.success){setRol("yonetici");setTab(0);setSifreModal(false);}else{setSifreHata("Hatalı şifre!");setSifreInput("");}});},
                style: {flex:1,padding:"13px",background:"var(--accent)",border:"none",borderRadius:14,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:15,minHeight:50}}, "Giriş")
            )
          )
        )
      )

      /* DASHBOARD DÜZENLE MODAL */
      , dashboardEditorAcik&&dashboardCanEdit&&React.createElement('div',{
          style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:3050,display:"flex",alignItems:"center",justifyContent:"center",padding:16},
          onClick:function(){setDashboardEditorAcik(false);}
        },
        React.createElement('div',{
          onClick:function(e){e.stopPropagation();},
          style:{width:"min(560px,100%)",background:"var(--bg-panel)",borderRadius:20,border:"1px solid var(--border)",boxShadow:"0 24px 64px rgba(0,0,0,0.5)",overflow:"hidden",maxHeight:"90vh",display:"flex",flexDirection:"column"}
        },
          React.createElement('div',{style:{padding:"16px 18px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",gap:10}},
            React.createElement('div',null,
              React.createElement('div',{style:{fontWeight:800,fontSize:20,color:"var(--text)"}}, "⚙️ Dashboard Düzenle"),
              React.createElement('div',{style:{fontSize:12,color:"var(--text-muted)",marginTop:2}}, "Kartları göster/gizle ve sırala")
            ),
            React.createElement('button',{onClick:function(){setDashboardEditorAcik(false);},style:{width:34,height:34,borderRadius:999,border:"1px solid var(--border)",background:"var(--bg-elevated)",color:"var(--text-muted)",fontSize:18,lineHeight:1,cursor:"pointer"}},"×")
          ),
          React.createElement('div',{style:{padding:"12px 14px",display:"flex",flexDirection:"column",gap:8,overflowY:"auto"}},
            dashboardLayoutNormalized.map(function(item,idx,arr){
              var meta=dashboardMetaById[item.id];
              if(!meta) return null;
              var enabled=item.enabled!==false;
              var size=item.size||"medium";
              var lockEnabled=!!meta.lockEnabled;
              var sizeLabel=size==="small"?"Küçük":(size==="full"?"Büyük":"Orta");
              return React.createElement('div',{key:item.id,style:{background:"var(--bg-elevated)",border:"1px solid var(--border)",borderRadius:12,padding:"10px 12px",display:"grid",gridTemplateColumns:"20px 1fr auto auto auto auto",gap:8,alignItems:"center"}},
                React.createElement('span',{style:{color:"#64748b",fontSize:16,lineHeight:1,textAlign:"center"}},"⋮"),
                React.createElement('div',null,
                  React.createElement('div',{style:{fontSize:14,fontWeight:700,color:"var(--text)"}},meta.icon+" "+meta.label),
                  React.createElement('div',{style:{fontSize:11,color:"var(--text-muted)",marginTop:2}},
                    meta.desc+(lockEnabled?" · Zorunlu açık":"")
                  )
                ),
                React.createElement('button',{
                  onClick:function(){dashboardMove(item.id,-1);},
                  disabled:idx===0,
                  style:{width:34,height:34,borderRadius:8,border:"1px solid "+(idx===0?"var(--border-soft)":"var(--border)"),background:"var(--bg-panel)",color:idx===0?"#475569":"var(--text)",fontSize:12,cursor:idx===0?"default":"pointer",opacity:idx===0?0.5:1}
                },"▲"),
                React.createElement('button',{
                  onClick:function(){dashboardMove(item.id,1);},
                  disabled:idx===arr.length-1,
                  style:{width:34,height:34,borderRadius:8,border:"1px solid "+(idx===arr.length-1?"var(--border-soft)":"var(--border)"),background:"var(--bg-panel)",color:idx===arr.length-1?"#475569":"var(--text)",fontSize:12,cursor:idx===arr.length-1?"default":"pointer",opacity:idx===arr.length-1?0.5:1}
                },"▼"),
                React.createElement('button',{
                  onClick:function(){dashboardSizeNext(item.id);},
                  style:{minWidth:58,height:30,padding:"0 8px",borderRadius:8,border:"1px solid var(--border)",background:"#1b2437",color:"#cbd5e1",fontSize:11,fontWeight:700,cursor:"pointer"}
                },sizeLabel),
                React.createElement('button',{
                  onClick:function(){dashboardToggle(item.id);},
                  disabled:lockEnabled,
                  style:{width:52,height:30,borderRadius:999,border:"1px solid "+(enabled?"rgba(16,185,129,.45)":"var(--border)"),background:enabled?"linear-gradient(135deg,#10b981,#34d399)":"#233047",color:"#fff",fontSize:11,fontWeight:700,cursor:lockEnabled?"default":"pointer",opacity:lockEnabled?0.7:1}
                },enabled?"Açık":"Kapalı")
              );
            })
          ),
          React.createElement('div',{style:{padding:"12px 14px",borderTop:"1px solid var(--border)",display:"flex",gap:10}},
            React.createElement('button',{
              onClick:function(){dashboardReset();},
              style:{flex:1,padding:"12px",borderRadius:12,border:"1px solid var(--border)",background:"var(--bg-elevated)",color:"var(--text-muted)",fontWeight:700,cursor:"pointer"}
            },"↺ Sıfırla"),
            React.createElement('button',{
              onClick:dashboardKaydetSunucu,
              disabled:dashboardKaydediliyor,
              style:{flex:1.3,padding:"12px",borderRadius:12,border:"none",background:"linear-gradient(135deg,#10b981,#059669)",color:"#fff",fontWeight:800,cursor:dashboardKaydediliyor?"default":"pointer",opacity:dashboardKaydediliyor?0.7:1}
            },dashboardKaydediliyor?"Kaydediliyor...":"✓ Kaydet")
          )
        )
      )

      /* PLAN KİLİT MODAL */
      , kilitModal&&React.createElement('div',{
          style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.78)",zIndex:3100,display:"flex",alignItems:"center",justifyContent:"center",padding:16},
          onClick:()=>setKilitModal(null)
        },
        React.createElement('div',{
          onClick:(e)=>e.stopPropagation(),
          style:{width:"min(440px,100%)",background:"var(--bg-panel)",borderRadius:20,border:"1px solid var(--border)",boxShadow:"0 24px 64px rgba(0,0,0,0.5)",padding:"32px 28px",textAlign:"center"}
        },
          React.createElement('div',{style:{fontSize:48,marginBottom:14}},"🔒"),
          React.createElement('div',{style:{fontWeight:900,fontSize:18,color:"var(--text)",marginBottom:8}}, kilitModal.ozellik),
          React.createElement('div',{style:{fontSize:14,color:"var(--text-muted)",marginBottom:18,lineHeight:1.6}},
            "Bu özellik ",
            React.createElement('b',{style:{color:"#3b82f6"}}, kilitModal.gerekenPlan),
            " paketinde kullanılabilir."
          ),
          React.createElement('div',{style:{background:"var(--bg-elevated)",borderRadius:12,padding:"12px 14px",marginBottom:18,fontSize:13,color:"var(--text-dim)"}},
            "Mevcut paketiniz: ",
            React.createElement('b',{style:{color:"var(--text)"}}, planAdi)
          ),
          React.createElement('a',{
            href:"https://wa.me/905435070794?text="+encodeURIComponent("Paketimi yükseltmek istiyorum: "+kilitModal.gerekenPlan),
            target:"_blank",
            rel:"noreferrer",
            style:{display:"block",padding:"13px 20px",background:"linear-gradient(135deg,#2563eb,#3b82f6)",color:"#fff",borderRadius:12,fontWeight:800,fontSize:14,textDecoration:"none",marginBottom:10}
          }, "💬 WhatsApp ile Yükselt"),
          React.createElement('button',{
            onClick:()=>setKilitModal(null),
            style:{display:"block",width:"100%",padding:"11px 20px",background:"transparent",border:"1px solid var(--border)",borderRadius:12,color:"var(--text-muted)",fontSize:13,fontWeight:700,cursor:"pointer"}
          }, "Kapat")
        )
      )

      /* FIRMA AYARLARI MODAL */
      , firmaAyarlariAcik&&React.createElement('div',{
          style:{position:"fixed",inset:0,background:"rgba(0,0,0,0.72)",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}
        },
        React.createElement('div',{
          style:{width:"min(480px,100%)",background:"var(--bg-panel)",borderRadius:20,border:"1px solid var(--border)",boxShadow:"0 24px 64px rgba(0,0,0,0.5)",overflowY:"auto",maxHeight:"90vh"}
        },
          React.createElement('div',{style:{padding:"16px 20px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"var(--bg-panel)",zIndex:1}},
            React.createElement('div',{style:{fontWeight:800,fontSize:16,color:"var(--accent)"}}, "🏢 Firma Bilgileri"),
            React.createElement('button',{onClick:()=>setFirmaAyarlariAcik(false),style:{background:"none",border:"none",color:"var(--text-muted)",fontSize:22,cursor:"pointer",lineHeight:1}}, "×")
          ),
          React.createElement('div',{style:{padding:"16px 20px",display:"flex",flexDirection:"column",gap:12}},
            React.createElement('div',{style:{fontSize:12,color:"var(--text-muted)",background:"var(--bg-elevated)",borderRadius:10,padding:"10px 14px",lineHeight:1.5}},
              "Bu bilgiler WhatsApp mesajlarında, teklif belgelerinde ve makbuzlarda otomatik olarak kullanılır."
            ),
            (function(){
              var inp=function(label,key,placeholder,hint){
                return React.createElement('div',null,
                  React.createElement('label',{style:{display:"block",fontSize:11,fontWeight:700,color:"var(--text-muted)",marginBottom:4}},label),
                  React.createElement('input',{
                    value:firmaAyarlariForm[key]||"",
                    onChange:function(e){setFirmaAyarlariForm(function(p){var n=Object.assign({},p);n[key]=e.target.value;return n;});},
                    placeholder:placeholder||"",
                    style:{width:"100%",background:"var(--bg-elevated)",border:"1px solid var(--border)",borderRadius:10,padding:"10px 12px",color:"var(--text)",fontSize:13,boxSizing:"border-box",outline:"none"}
                  }),
                  hint&&React.createElement('div',{style:{fontSize:10,color:"var(--text-muted)",marginTop:3}},hint)
                );
              };
              return React.createElement(React.Fragment,null,
                inp("Firma Adı *","ad","Çakır Asansör Sistemleri"),
                inp("Adres","adres","Mahalle, Sokak No, İlçe / Şehir"),
                inp("Telefon 1","tel","0212 000 00 00"),
                inp("Telefon 2 (Cep)","tel2","0532 000 00 00"),
                inp("Telefon 3 (Cep)","tel3","0543 000 00 00"),
                inp("E-posta 1","email","info@firmaadi.com"),
                inp("E-posta 2","email2",""),
                React.createElement('div',null,
                  React.createElement('label',{style:{display:"block",fontSize:11,fontWeight:700,color:"var(--text-muted)",marginBottom:4}},"Firma Logosu (PNG/JPG — teklif başlık görseli)"),
                  React.createElement('input',{
                    type:"file",
                    accept:"image/png,image/jpeg,image/jpg",
                    style:{display:"block",marginBottom:6,color:"var(--text)",fontSize:13,width:"100%"},
                    onChange:function(e){
                      var file=e.target.files&&e.target.files[0];
                      if(!file)return;
                      var reader=new FileReader();
                      reader.onload=function(ev){setFirmaAyarlariForm(function(p){return Object.assign({},p,{logoUrl:ev.target.result});});};
                      reader.readAsDataURL(file);
                    }
                  }),
                  firmaAyarlariForm.logoUrl
                    ? React.createElement('img',{src:firmaAyarlariForm.logoUrl,alt:"logo",style:{maxHeight:50,maxWidth:260,borderRadius:6,border:"1px solid var(--border)",display:"block"}})
                    : React.createElement('div',{style:{fontSize:10,color:"var(--text-muted)"}},"Logo seçilmedi — boş bırakılırsa teklif çıktısında başlık görseli olmaz.")
                )
              );
            })()
          ),
          React.createElement('div',{style:{padding:"0 20px 20px",display:"flex",gap:10}},
            React.createElement('button',{
              onClick:()=>setFirmaAyarlariAcik(false),
              style:{flex:1,padding:"13px",background:"var(--bg-elevated)",border:"1px solid var(--border)",borderRadius:14,color:"var(--text-muted)",cursor:"pointer",fontWeight:600,fontSize:14}
            },"İptal"),
            React.createElement('button',{
              disabled:firmaAyarlariKaydediliyor||!firmaAyarlariForm.ad,
              onClick:async function(){
                if(!firmaAyarlariForm.ad){alert("Firma adı zorunludur.");return;}
                setFirmaAyarlariKaydediliyor(true);
                var fields={
                  ad:firmaAyarlariForm.ad.trim(),
                  adres:(firmaAyarlariForm.adres||"").trim(),
                  tel:(firmaAyarlariForm.tel||"").trim(),
                  tel2:(firmaAyarlariForm.tel2||"").trim(),
                  tel3:(firmaAyarlariForm.tel3||"").trim(),
                  email:(firmaAyarlariForm.email||"").trim(),
                  email2:(firmaAyarlariForm.email2||"").trim(),
                  logoUrl:(firmaAyarlariForm.logoUrl||"")
                };
                var ok=await saveTenantConfig(tenantId,fields);
                setFirmaAyarlariKaydediliyor(false);
                if(ok){
                  setTenantConfig(function(prev){return Object.assign({},prev||{},fields);});
                  setFirmaAyarlariAcik(false);
                  alert("Firma bilgileri kaydedildi.");
                } else {
                  alert("Kaydedilemedi. Bağlantınızı kontrol edin.");
                }
              },
              style:{flex:2,padding:"13px",background:"var(--accent)",border:"none",borderRadius:14,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:14,opacity:firmaAyarlariKaydediliyor?0.6:1}
            }, firmaAyarlariKaydediliyor?"Kaydediliyor...":"Kaydet")
          )
        )
      )

      /* Ana Ekrana Ekle Banner */
      , React.createElement(InstallBanner, null)
    )
  );
}

export default App
