// localStorage shim
const mem = {};
globalThis.localStorage = {
  getItem: (k) => (k in mem ? mem[k] : null),
  setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; },
};
Object.defineProperty(globalThis, "navigator", { value: { onLine: true }, writable: true, configurable: true });

const { _state } = await import("../src/firebase.js");
const { push, flushOutbox } = await import("../src/utils/sync.js");
const { pendingKeys, isPending } = await import("../src/utils/outbox.js");

let fail = 0;
const ok = (n, c, x="") => { console.log((c?"  ok  ":"  FAIL")+"  "+n+(c?"":"  "+x)); if(!c) fail++; };
const D = 86400000, now = Date.now();
const sess = (d) => ({ date: d, program: "Push", sets: [{ exId:"bench-press", weight:100, reps:"5", rir:2 }] });

// Baslangic: bulutta iki seans
_state.cloud.workouts = [sess(now-2*D), sess(now-4*D)];

// 1) CEVRIMDISI antrenman -> yazilamaz ama kuyruga girer
_state.online = false; globalThis.navigator.onLine = false;
const local1 = [sess(now), ..._state.cloud.workouts];
await push("workouts", local1);
ok("cevrimdisi yazma kuyruga girdi", isPending("workouts"));
ok("buluta yazilmadi", _state.cloud.workouts.length === 2);

// 2) Bu sirada BASKA CIHAZ buluta yeni bir seans yazdi
_state.cloud.workouts = [sess(now-1*D), ..._state.cloud.workouts];

// 3) Baglanti dondu -> flush: ONCE BIRLESTIR sonra yaz
_state.online = true; globalThis.navigator.onLine = true;
const snap = () => ({ workouts: local1 });
const r = await flushOutbox(snap);
ok("gonderildi", r.sent === 1, JSON.stringify(r));
ok("kuyruk temizlendi", !isPending("workouts"));
ok("her iki seans da bulutta", _state.cloud.workouts.length === 4, "len="+_state.cloud.workouts.length);
const dates = _state.cloud.workouts.map(s=>s.date);
ok("cevrimdisi seans bulutta", dates.includes(now));
ok("diger cihazin seansi KORUNDU", dates.includes(now-1*D));

// 4) Cevrimdisiyken flush denenmemeli
_state.online = false; globalThis.navigator.onLine = false;
await push("progress", { weights:[{t:1,kg:80}], measures:[] });
const before = _state.reads;
await flushOutbox(() => ({ progress: { weights:[{t:1,kg:80}], measures:[] } }));
ok("cevrimdisi flush hic okuma yapmadi", _state.reads === before);
ok("progress hala bekliyor", isPending("progress"));

// 5) Okuma basarisizsa YAZMA (bulutu korumali koru)
globalThis.navigator.onLine = true;  // "online" der ama erisim yok
_state.online = false;
const w = _state.writes;
await flushOutbox(() => ({ progress: { weights:[{t:1,kg:80}], measures:[] } }));
ok("erisim yokken yazma yapilmadi", _state.writes === w);
ok("hala bekliyor", isPending("progress"));

// 6) Erisim gelince gider
_state.online = true;
await flushOutbox(() => ({ progress: { weights:[{t:1,kg:80}], measures:[] } }));
ok("erisim gelince gonderildi", !isPending("progress") && !!_state.cloud.progress);

console.log(fail ? "\n"+fail+" TEST BASARISIZ" : "\nhepsi gecti");
if (fail) process.exit(1);
