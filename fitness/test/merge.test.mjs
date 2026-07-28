import { mergeHistory, sameHistory, mergePrograms, mergeSchedule, mergeProgress, mergeFavorites } from "../src/data/merge.js";
import { toArchive, totalsOf, bestOf } from "../src/data/history.js";

let fail = 0;
const ok = (name, cond, extra="") => { console.log((cond?"  ok  ":"  FAIL") + "  " + name + (cond?"":"  "+extra)); if(!cond) fail++; };
const D = 86400000, now = Date.now();
const sess = (d, n, w=100) => ({ date: d, program: "Push",
  sets: Array.from({length:n}, () => ({ exId:"bench-press", weight:w, reps:"5", rir:2 })) });

// 1) Çevrimdışı seans korunuyor mu? (asıl hata buydu)
const cloud = [sess(now-2*D,10), sess(now-4*D,10)];
const local = [sess(now,10), ...cloud];             // cihazda bir fazla
let m = mergeHistory(local, cloud);
ok("cevrimdisi seans korunuyor", m.length === 3, "len="+m.length);

// 2) İki cihaz: her biri diğerinde olmayan bir seansa sahip
const devA = [sess(now,10), sess(now-2*D,10)];
const devB = [sess(now-1*D,10), sess(now-2*D,10)];
m = mergeHistory(devA, devB);
ok("iki cihaz birlesiyor", m.length === 3, "len="+m.length);
ok("siralama yeni->eski", m.every((s,i)=> i===0 || m[i-1].date >= s.date));

// 3) Tam satır arşiv satırını yenmeli (set dökümü yok olmasın)
const full = sess(now-2*D, 12);
const arch = toArchive(full);
ok("tam > arsiv (arsiv once)", !!mergeHistory([full],[arch])[0].sets);
ok("tam > arsiv (tam once)",  !!mergeHistory([arch],[full])[0].sets);

// 4) Aynı seansın iki kopyası tekilleşiyor
ok("kopya tekillesiyor", mergeHistory([sess(now,10)],[sess(now,10)]).length === 1);

// 5) Bozuk/gelecek tarihli satırlar eleniyor
m = mergeHistory([sess(now,10), {date:NaN,sets:[]}, {date:0,sets:[]}, sess(now+5*D,10)], []);
ok("bozuk/gelecek tarih eleniyor", m.length === 1, "len="+m.length);

// 6) Toplamlar ve rekor GERİLEMİYOR (plan doğrulama maddesi)
const before = totalsOf(cloud);
const after  = totalsOf(mergeHistory(local, cloud));
ok("seans sayisi gerilemiyor", after.sessions >= before.sessions);
ok("tonaj gerilemiyor", after.vol >= before.vol);
const best = (h)=>Math.max(0,...h.map(s=>bestOf(s)["bench-press"]||0));
ok("rekor gerilemiyor", best(mergeHistory([sess(now,5,200)], cloud)) >= best(cloud));

// 7) sameHistory
ok("sameHistory esit", sameHistory(cloud, cloud.slice()));
ok("sameHistory farkli", !sameHistory(local, cloud));

// 8) Programlar: yerel kazanir, ikisi de korunur
const P = mergePrograms(
  { list:[{id:"a",name:"Yerel A"},{id:"c",name:"Yeni C"}], activeId:"c" },
  { list:[{id:"a",name:"Bulut A"},{id:"b",name:"Bulut B"}], activeId:"b" });
ok("program birlesimi", P.list.length === 3, "len="+P.list.length);
ok("yerel kazanir", P.list.find(p=>p.id==="a").name === "Yerel A");
ok("activeId yerel", P.activeId === "c");
const P2 = mergePrograms({ list:[], activeId:"yok" }, { list:[{id:"b"}], activeId:"b" });
ok("gecersiz activeId buluta duser", P2.activeId === "b");

// 9) Plan
const S = mergeSchedule({0:"x"}, {0:"y",3:"z"});
ok("plan: yerel gun kazanir", S[0]==="x" && S[3]==="z");

// 10) Ilerleme: t bazinda birlesim + ARTAN sira
const G = mergeProgress(
  { weights:[{t:3,kg:80}], measures:[], goalKg:75 },
  { weights:[{t:1,kg:82},{t:3,kg:99}], measures:[], goalKg:70 }, false);
ok("olcum birlesimi", G.weights.length===2, "len="+G.weights.length);
ok("olcumde yerel kazanir", G.weights.find(w=>w.t===3).kg===80);
ok("olcum ARTAN sirada", G.weights[0].t < G.weights[1].t);
ok("goalKg localWins=false -> bulut", G.goalKg===70);
ok("goalKg localWins=true -> yerel",
   mergeProgress({weights:[],measures:[],goalKg:75},{weights:[],measures:[],goalKg:70},true).goalKg===75);

// 11) Favoriler: birlesim YOK
ok("favori localWins=true -> yerel", JSON.stringify(mergeFavorites(["a"],["b","c"],true))===JSON.stringify(["a"]));
ok("favori localWins=false -> bulut", JSON.stringify(mergeFavorites(["a"],["b","c"],false))===JSON.stringify(["b","c"]));

// 12) Bos/null girdiler cokmemeli
ok("null girdiler guvenli", mergeHistory(null,null).length===0 && mergeSchedule(null,null) && mergeProgress(null,null,false).weights.length===0);

console.log(fail ? "\n" + fail + " TEST BASARISIZ" : "\nhepsi gecti");
if (fail) process.exit(1);
