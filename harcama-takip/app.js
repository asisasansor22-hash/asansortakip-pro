/* ===================================================================
   Spendy — Harcama Takip  ·  uygulama mantığı (saf JS, derleme yok)
   =================================================================== */
(function () {
  'use strict';

  // ── Sabitler ──────────────────────────────────────────────────
  var STORE_KEY = 'cuzdan_data_v1';
  var PIN_KEY = 'spendy_pin_v1';   // PIN cihaza özel — buluta gönderilmez, yedekten gelmez
  var MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  var DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var PICK_EMOJIS = ['🍔', '🛒', '🚌', '🧾', '☕', '🎉', '💊', '💰', '🏠', '⛽', '🍻', '👕', '📚', '🎬', '✈️', '🎁', '💳', '📱', '🐶', '💇', '🏋️', '🚕', '🍕', '🧹', '🩺', '🎮', '💡', '🚿', '🌳', '🧴', '👶', '💄'];

  var DEFAULT_CATS = [
    { id: 'yemek', name: 'Yemek', emoji: '🍔', color: '#f97316' },
    { id: 'market', name: 'Market', emoji: '🛒', color: '#16a34a' },
    { id: 'ulasim', name: 'Ulaşım', emoji: '🚌', color: '#3b82f6' },
    { id: 'fatura', name: 'Faturalar', emoji: '🧾', color: '#6366f1' },
    { id: 'kahve', name: 'Kahve', emoji: '☕', color: '#a16207' },
    { id: 'eglence', name: 'Eğlence', emoji: '🎉', color: '#ec4899' },
    { id: 'saglik', name: 'Sağlık', emoji: '💊', color: '#ef4444' },
    { id: 'diger', name: 'Diğer', emoji: '💰', color: '#64748b' }
  ];

  // (öğrenme + kategori tahmini fonksiyonları aşağıda guessCat ile birlikte)
  // İşyeri adından kategori tahmini (ekstre / SMS içe aktarma)
  var AUTO_RULES = [
    { cat: 'market', kw: ['migros', 'bim', 'a101', 'a 101', 'şok', 'sok mar', 'carrefour', 'file', 'tarim kredi', 'macrocenter', 'hakmar', 'onur', 'metro', 'market', 'bakkal', 'manav'] },
    { cat: 'yemek', kw: ['yemeksepeti', 'getir yemek', 'trendyol yemek', 'mcdonald', 'burger', 'kfc', 'dominos', 'pizza', 'restaurant', 'restoran', 'lokanta', 'kebap', 'doner', 'döner', 'cafe', 'kafe', 'starbucks yemek'] },
    { cat: 'kahve', kw: ['starbucks', 'kahve', 'coffee', 'gloria jean', 'caffe', 'espresso'] },
    { cat: 'ulasim', kw: ['istanbulkart', 'iett', 'metro istanbul', 'bilet', 'uber', 'bitaksi', 'taksi', 'opet', 'shell', 'bp ', 'petrol', 'benzin', 'akaryakit', 'total', 'aytemiz', 'po ', 'otopark', 'hgs', 'ogs', 'köprü'] },
    { cat: 'fatura', kw: ['turkcell', 'vodafone', 'turk telekom', 'türk telekom', 'tt mobil', 'elektrik', 'enerjisa', 'bedas', 'igdas', 'iski', 'su fatura', 'dogalgaz', 'doğalgaz', 'netflix', 'spotify', 'youtube premium', 'fatura', 'aidat'] },
    { cat: 'saglik', kw: ['eczane', 'hastane', 'medical', 'tip merkez', 'tıp merkez', 'diş', 'dis ', 'optik', 'laboratuvar', 'pharma'] },
    { cat: 'eglence', kw: ['sinema', 'cinema', 'tiyatro', 'biletix', 'passo', 'oyun', 'steam', 'playstation', 'bar ', 'pub'] },
    { cat: 'giyim', kw: ['lc waikiki', 'lcw', 'defacto', 'koton', 'zara', 'mavi', 'boyner', 'flo', 'ayakkabi', 'h&m', 'pull&bear', 'bershka', 'trendyol', 'hepsiburada', 'giyim'] }
  ];

  // ── Durum ─────────────────────────────────────────────────────
  var state = loadState();
  ensureDiger();

  var ui = {
    tab: 'home',
    amount: '',
    note: '',
    date: todayStr(),
    armedCat: state.cats[0] ? state.cats[0].id : 'diger',
    reportYM: ym(new Date())
  };
  var lastAction = null;
  var sheetState = {};
  var pushTimer = null;
  var toastTimer = null;
  var unlocked = false;   // PIN kilidi açıldı mı?
  var pinEntry = '';      // kilit ekranında girilen PIN

  // ── Yardımcılar ───────────────────────────────────────────────
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function todayStr() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function ym(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1); }
  function ymOf(dateStr) { return (dateStr || '').slice(0, 7); }
  function parseYM(s) { var p = s.split('-'); return { y: +p[0], m: +p[1] - 1 }; }
  function ymLabel(s) { var p = parseYM(s); return MONTHS[p.m] + ' ' + p.y; }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function currency() { return state.settings.currency || '₺'; }
  function fmt(n) {
    n = Number(n) || 0;
    var s = n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    var c = currency();
    return c === '₺' ? s + ' ' + c : c + s;
  }
  function fmt0(n) {
    n = Math.round(Number(n) || 0);
    var s = n.toLocaleString('tr-TR');
    var c = currency();
    return c === '₺' ? s + ' ' + c : c + s;
  }
  function catById(id) {
    for (var i = 0; i < state.cats.length; i++) if (state.cats[i].id === id) return state.cats[i];
    return { id: id, name: 'Diğer', emoji: '💰', color: '#64748b' };
  }
  function ensureDiger() {
    if (!state.cats.some(function (c) { return c.id === 'diger'; })) {
      state.cats.push({ id: 'diger', name: 'Diğer', emoji: '💰', color: '#64748b' });
    }
  }

  // tutar metnini sayıya çevir ("1.234,56" → 1234.56)
  function amountToNumber(s) {
    if (!s) return 0;
    return parseFloat(String(s).replace(/\./g, '').replace(',', '.')) || 0;
  }
  // yazılan tutarı ekranda göster (binlik ayır, ondalığı koru)
  function displayAmount(s) {
    if (!s) return '0';
    var neg = false, t = s;
    var parts = t.split(',');
    var intp = parts[0].replace(/\D/g, '');
    intp = intp.replace(/^0+(?=\d)/, '');
    if (intp === '') intp = '0';
    var grouped = (+intp).toLocaleString('tr-TR');
    if (parts.length > 1) return grouped + ',' + parts[1];
    return grouped;
  }

  // ── Kalıcılık ─────────────────────────────────────────────────
  function freshState() {
    return {
      v: 1, updatedAt: Date.now(),
      expenses: [], incomes: [], fixed: [], learn: {},
      cats: DEFAULT_CATS.map(function (c) { return Object.assign({}, c); }),
      settings: { budget: 0, currency: '₺', theme: 'auto' }
    };
  }
  function loadState() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
      if (raw && raw.expenses) {
        raw.cats = raw.cats && raw.cats.length ? raw.cats : DEFAULT_CATS.slice();
        raw.fixed = raw.fixed || [];
        raw.incomes = raw.incomes || [];
        raw.learn = raw.learn || {};
        raw.settings = Object.assign({ budget: 0, currency: '₺', theme: 'auto' }, raw.settings || {});
        return raw;
      }
    } catch (e) {}
    return freshState();
  }
  function persist(skipCloud) {
    state.updatedAt = Date.now();
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {}
    if (!skipCloud) scheduleCloudPush();
  }

  // ── Bulut yedek ───────────────────────────────────────────────
  function scheduleCloudPush() {
    if (!window.Cloud || !Cloud.isSignedIn()) return;
    clearTimeout(pushTimer);
    setCloudBadge('sync');
    pushTimer = setTimeout(function () {
      Cloud.push(state).then(function (r) {
        setCloudBadge(r && r.ok ? 'ok' : 'err');
      });
    }, 1200);
  }
  function setCloudBadge(kind) {
    var el = document.getElementById('cloudBadge');
    if (!el) return;
    if (kind === 'sync') { el.textContent = '☁︎ yedekleniyor…'; el.style.color = 'var(--muted)'; }
    else if (kind === 'ok') { el.textContent = '☁︎ yedeklendi'; el.style.color = 'var(--ok)'; setTimeout(function () { if (el) el.textContent = ''; }, 2500); }
    else { el.textContent = '☁︎ yedeklenemedi'; el.style.color = 'var(--danger)'; }
  }
  async function cloudSyncOnLoad() {
    if (!window.Cloud || !Cloud.isSignedIn()) return;
    var r = await Cloud.pull();
    if (r && r.ok && r.data && r.data.expenses) {
      if ((r.data.updatedAt || 0) > (state.updatedAt || 0)) {
        state = r.data; ensureDiger(); persist(true); render();
      } else {
        Cloud.push(state);
      }
    } else if (r && r.ok && !r.data) {
      Cloud.push(state); // bulut boş → ilk yedeği gönder
    }
  }

  // ── Hesaplamalar ──────────────────────────────────────────────
  function expensesOfMonth(ymStr) {
    return state.expenses.filter(function (e) { return ymOf(e.date) === ymStr; });
  }
  function fixedSumOfMonth(ymStr) {
    return state.fixed.reduce(function (s, f) {
      if (f.active === false) return s;
      if ((f.startYM || '0000-00') > ymStr) return s;
      return s + (Number(f.amount) || 0);
    }, 0);
  }
  function monthTotal(ymStr) {
    var one = expensesOfMonth(ymStr).reduce(function (s, e) { return s + (Number(e.amount) || 0); }, 0);
    return one + fixedSumOfMonth(ymStr);
  }
  function todayTotal() {
    var t = todayStr();
    return state.expenses.filter(function (e) { return e.date === t; })
      .reduce(function (s, e) { return s + (Number(e.amount) || 0); }, 0);
  }
  function incomeOfMonth(ymStr) {
    return state.incomes.filter(function (e) { return ymOf(e.date) === ymStr; })
      .reduce(function (s, e) { return s + (Number(e.amount) || 0); }, 0);
  }
  function incomeTotalAll() { return state.incomes.reduce(function (s, e) { return s + (Number(e.amount) || 0); }, 0); }
  function expenseTotalAll() { return state.expenses.reduce(function (s, e) { return s + (Number(e.amount) || 0); }, 0); }

  // ── İşlemler (ekle / sil / düzenle) ───────────────────────────
  function addExpense(o) {
    var e = { id: uid(), ts: Date.now(), date: o.date || todayStr(), amount: Number(o.amount) || 0, cat: o.cat || 'diger', note: o.note || '', src: o.src || 'manual' };
    if (e.amount <= 0) return null;
    state.expenses.push(e);
    persist();
    lastAction = { type: 'add', id: e.id };
    return e;
  }
  function deleteExpense(id, silent) {
    var i = state.expenses.findIndex(function (e) { return e.id === id; });
    if (i < 0) return;
    var removed = state.expenses.splice(i, 1)[0];
    persist();
    if (!silent) { lastAction = { type: 'del', obj: removed }; toast('Silindi', 'Geri Al', undo); }
    render();
  }
  function undo() {
    if (!lastAction) return;
    if (lastAction.type === 'add') { var id = lastAction.id; lastAction = null; deleteExpense(id, true); }
    else if (lastAction.type === 'del') { state.expenses.push(lastAction.obj); lastAction = null; persist(); }
    else if (lastAction.type === 'add-income') { var iid = lastAction.id; lastAction = null; deleteIncome(iid, true); }
    else if (lastAction.type === 'del-income') { state.incomes.push(lastAction.obj); lastAction = null; persist(); }
    hideToast(); render();
  }

  // ── Gelir ─────────────────────────────────────────────────────
  function addIncome(o) {
    var amt = Number(o.amount) || 0; if (amt <= 0) return null;
    var e = { id: uid(), ts: Date.now(), date: o.date || todayStr(), amount: amt, note: o.note || '' };
    state.incomes.push(e); persist();
    lastAction = { type: 'add-income', id: e.id };
    return e;
  }
  function deleteIncome(id, silent) {
    var i = state.incomes.findIndex(function (e) { return e.id === id; });
    if (i < 0) return;
    var removed = state.incomes.splice(i, 1)[0]; persist();
    if (!silent) { lastAction = { type: 'del-income', obj: removed }; toast('Gelir silindi', 'Geri Al', undo); }
    render();
  }

  // ── Quick-add (manuel) ────────────────────────────────────────
  function keyPress(k) {
    if (k === 'back') { ui.amount = ui.amount.slice(0, -1); }
    else if (k === ',') { if (ui.amount.indexOf(',') < 0) ui.amount = (ui.amount || '0') + ','; }
    else {
      var parts = ui.amount.split(',');
      if (parts[1] && parts[1].length >= 2) return; // 2 ondalık sınırı
      if (ui.amount.replace(/\D/g, '').length >= 9) return; // taşma koruması
      ui.amount += k;
    }
    patchAmount();
  }
  function patchAmount() {
    var v = document.getElementById('amtVal');
    if (v) { v.textContent = displayAmount(ui.amount); v.classList.toggle('zero', amountToNumber(ui.amount) <= 0); }
    var btn = document.getElementById('addBtn');
    if (btn) btn.disabled = amountToNumber(ui.amount) <= 0;
    var h = document.getElementById('qaHint');
    if (h) h.textContent = amountToNumber(ui.amount) > 0 ? 'Kaydetmek için kategoriye dokun' : '';
  }
  function patchArmed() {
    var nodes = document.querySelectorAll('.cat-chip[data-cat]');
    for (var i = 0; i < nodes.length; i++) nodes[i].classList.toggle('armed', nodes[i].getAttribute('data-cat') === ui.armedCat);
  }
  function commitQuickAdd(catId) {
    var amt = amountToNumber(ui.amount);
    if (amt <= 0) { var h = document.getElementById('qaHint'); if (h) { h.textContent = 'Önce tutarı yaz'; h.classList.add('warn'); setTimeout(function () { h.classList.remove('warn'); }, 1200); } return; }
    var cat = catId || ui.armedCat || 'diger';
    addExpense({ amount: amt, cat: cat, note: ui.note, date: ui.date });
    learnCat(ui.note, cat);
    ui.amount = ''; ui.note = ''; ui.armedCat = cat;
    var c = catById(cat);
    render();
    toast(fmt(amt) + ' · ' + c.emoji + ' ' + c.name + ' eklendi', 'Geri Al', undo);
  }

  // ════════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════════
  function render() {
    applyTheme();
    var app = document.getElementById('app');
    if (getPin() && !unlocked) { app.innerHTML = lockScreen(); return; }
    app.innerHTML = topbar() + screen() + tabbar();
    if (ui.tab === 'home') { patchAmount(); patchArmed(); }
  }

  // ── PIN kilidi ─────────────────────────────────────────────────
  function hashPin(s) { var h = 5381; s = String(s); for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return 'h' + h.toString(36); }
  function getPin() { try { return localStorage.getItem(PIN_KEY) || null; } catch (e) { return null; } }
  function setPin(hash) { try { if (hash) localStorage.setItem(PIN_KEY, hash); else localStorage.removeItem(PIN_KEY); } catch (e) {} }
  function patchPinDots() { var d = document.querySelectorAll('.pin-dot'); for (var i = 0; i < d.length; i++) d[i].classList.toggle('on', i < pinEntry.length); }
  function lockScreen() {
    var dots = '';
    for (var i = 0; i < 4; i++) dots += '<span class="pin-dot' + (i < pinEntry.length ? ' on' : '') + '"></span>';
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];
    var kp = keys.map(function (k) {
      if (k === '') return '<span></span>';
      return '<button class="key" data-act="pin-key" data-k="' + k + '">' + (k === 'back' ? '⌫' : k) + '</button>';
    }).join('');
    return '<div class="lock"><div class="lock__logo">👛</div><div class="lock__title">Spendy</div>' +
      '<div class="lock__sub" id="pinSub">PIN gir</div>' +
      '<div class="pin-dots">' + dots + '</div>' +
      '<div class="keypad keypad--pin">' + kp + '</div>' +
      '<button class="lock__forgot" data-act="pin-forgot">PIN\'i unuttum</button></div>';
  }

  function topbar() {
    var sub = { home: 'Bu ay ' + MONTHS[new Date().getMonth()], report: 'Aylık rapor', fixed: 'Sabit (aylık) giderler', settings: 'Ayarlar' }[ui.tab];
    return '' +
      '<header class="topbar">' +
      '<div class="topbar__title">' +
      '<div class="topbar__logo">👛</div>' +
      '<div><div class="topbar__name">Spendy</div><div class="topbar__sub">' + esc(sub) + '</div></div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
      '<span id="cloudBadge" style="font-size:11px;font-weight:700"></span>' +
      '<button class="icon-btn" data-act="go" data-tab="settings" aria-label="Ayarlar">⚙️</button>' +
      '</div>' +
      '</header>';
  }

  function tabbar() {
    function t(id, ic, label, fab) {
      return '<button class="tab' + (fab ? ' tab--fab' : '') + (ui.tab === id ? ' active' : '') + '" data-act="go" data-tab="' + id + '">' +
        '<span class="tab__ic">' + ic + '</span>' + (fab ? '' : '<span>' + label + '</span>') + '</button>';
    }
    return '<nav class="tabbar">' +
      t('home', '🏠', 'Özet') +
      t('report', '📊', 'Rapor') +
      t('fixed', '🔁', 'Sabit') +
      t('settings', '⚙️', 'Ayarlar') +
      '</nav>';
  }

  function screen() {
    var inner = ui.tab === 'home' ? homeScreen()
      : ui.tab === 'report' ? reportScreen()
        : ui.tab === 'fixed' ? fixedScreen()
          : settingsScreen();
    return '<main class="screen">' + inner + '</main>';
  }

  // ── Özet / Ekle ───────────────────────────────────────────────
  function homeScreen() {
    var cym = ym(new Date());
    var mTotal = monthTotal(cym);
    var tTotal = todayTotal();
    var budget = Number(state.settings.budget) || 0;
    var inc = incomeOfMonth(cym);
    var net = inc - mTotal;
    var summary = '<div class="card card--brand">' +
      '<div class="summary__label">Bu ay harcanan</div>' +
      '<div class="summary__big">' + fmt(mTotal) + '</div>' +
      '<div class="summary__row">' +
      '<span class="summary__chip">Bugün: <b>' + fmt(tTotal) + '</b></span>' +
      '<span class="summary__chip">Sabit: <b>' + fmt(fixedSumOfMonth(cym)) + '</b></span>' +
      (inc > 0 ? '<span class="summary__chip">Gelir: <b>' + fmt(inc) + '</b></span>' : '') +
      '</div>' +
      (inc > 0 ? '<div class="summary__net">Bu ay net: <b>' + (net >= 0 ? '+' : '') + fmt(net) + '</b></div>' : '');
    if (budget > 0) {
      var pct = clamp((mTotal / budget) * 100, 0, 100);
      var over = mTotal > budget;
      summary += '<div class="budget">' +
        '<div class="budget__bar"><div class="budget__fill' + (over ? ' over' : '') + '" style="width:' + pct + '%"></div></div>' +
        '<div class="budget__meta"><span>' + (over ? 'Bütçe aşıldı!' : 'Kalan: ' + fmt(budget - mTotal)) + '</span><span>Bütçe ' + fmt0(budget) + '</span></div>' +
        '</div>';
    }
    summary += '</div>';

    // hızlı ekle
    var keypad = '';
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'back'];
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i];
      var lbl = k === 'back' ? '⌫' : (k === ',' ? ',' : k);
      keypad += '<button class="key' + (k === 'back' || k === ',' ? ' key--util' : '') + '" data-act="key" data-k="' + k + '">' + lbl + '</button>';
    }
    var cats = '';
    state.cats.forEach(function (c) {
      cats += '<button class="cat-chip" data-act="qa-cat" data-cat="' + c.id + '"><span class="cat-chip__emoji">' + c.emoji + '</span><span class="cat-chip__name">' + esc(c.name) + '</span></button>';
    });

    var quick = '<div class="card">' +
      '<div class="amount"><span class="amount__cur">' + currency() + '</span><span class="amount__val zero" id="amtVal">0</span></div>' +
      '<div class="qa-meta">' +
      '<div class="field" style="margin:0;flex:1.4"><span class="chip-input">📝<input type="text" data-bind="note" placeholder="Not (isteğe bağlı)" value="' + esc(ui.note) + '" /></span></div>' +
      '<div class="field" style="margin:0"><input type="date" class="chip-input" data-bind="date" value="' + ui.date + '" style="font-weight:700" /></div>' +
      '</div>' +
      '<div class="keypad">' + keypad + '</div>' +
      '<div class="section-title" style="margin-top:2px">Kategori seç → kaydet</div>' +
      '<div class="cats">' + cats +
      '<button class="cat-chip cat-chip--add" data-act="add-cat"><span class="cat-chip__emoji">＋</span><span class="cat-chip__name">Kategori</span></button>' +
      '</div>' +
      '<button class="btn btn--primary btn--block" id="addBtn" data-act="qa-add" style="margin-top:14px" disabled>＋ Harcamayı Ekle</button>' +
      '<div class="hint" id="qaHint"></div>' +
      '</div>';

    var incomeBtn = '<button class="btn btn--ghost btn--block" data-act="add-income" style="margin:-2px 0 12px">＋ Gelir ekle</button>';
    return summary + incomeBtn + quick + recentList();
  }

  function recentList() {
    var outs = state.expenses.map(function (e) { return { k: 'out', e: e, date: e.date, ts: e.ts || 0 }; });
    var ins = state.incomes.map(function (e) { return { k: 'in', e: e, date: e.date, ts: e.ts || 0 }; });
    var all = outs.concat(ins).sort(function (a, b) { return (b.date + b.ts).localeCompare(a.date + a.ts); }).slice(0, 80);
    if (!all.length) {
      return '<div class="empty"><div class="empty__emoji">🧾</div><div class="empty__title">Henüz hareket yok</div><div class="empty__text">Yukarıdan tutarı yaz, kategoriye dokun.<br>Ya da Ayarlar → Vakıfbank ile SMS / ekstre aktar.</div></div>';
    }
    var groups = {}, order = [];
    all.forEach(function (it) { if (!groups[it.date]) { groups[it.date] = []; order.push(it.date); } groups[it.date].push(it); });
    var html = '<div class="section-title" style="margin-top:20px">Son hareketler</div>';
    order.forEach(function (date) {
      var items = groups[date];
      var sum = items.reduce(function (s, it) { return s + (it.k === 'out' ? (Number(it.e.amount) || 0) : 0); }, 0);
      html += '<div class="day-group"><div class="day-head"><span class="day-head__date">' + dayLabel(date) + '</span><span class="day-head__sum">' + fmt(sum) + '</span></div><div class="tx-list">';
      items.forEach(function (it) {
        var e = it.e;
        if (it.k === 'in') {
          html += '<button class="tx tx--in" data-act="edit-income" data-id="' + e.id + '">' +
            '<span class="tx__emoji tx__emoji--in">▲</span>' +
            '<span class="tx__main"><div class="tx__cat">Gelir</div>' + (e.note ? '<div class="tx__note">' + esc(e.note) + '</div>' : '') + '</span>' +
            '<span class="tx__amt tx__amt--in">+' + fmt(e.amount) + '</span></button>';
        } else {
          var c = catById(e.cat);
          var badge = e.src && e.src !== 'manual' ? '<span class="tx__badge">' + (e.src === 'sms' ? 'SMS' : 'EKSTRE') + '</span>' : '';
          html += '<button class="tx" data-act="edit" data-id="' + e.id + '">' +
            '<span class="tx__emoji" style="background:' + hex2soft(c.color) + '">' + c.emoji + '</span>' +
            '<span class="tx__main"><div class="tx__cat">' + esc(c.name) + badge + '</div>' + (e.note ? '<div class="tx__note">' + esc(e.note) + '</div>' : '') + '</span>' +
            '<span class="tx__amt">' + fmt(e.amount) + '</span></button>';
        }
      });
      html += '</div></div>';
    });
    return html;
  }

  function dayLabel(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var t = todayStr();
    if (dateStr === t) return 'Bugün';
    var y = new Date(); y.setDate(y.getDate() - 1);
    if (dateStr === y.getFullYear() + '-' + pad(y.getMonth() + 1) + '-' + pad(y.getDate())) return 'Dün';
    return d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()] + ' ' + DAYS[d.getDay()];
  }
  function hex2soft(hex) {
    if (!hex || hex[0] !== '#') return 'var(--brand-soft)';
    var r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',.16)';
  }

  // ── Rapor ─────────────────────────────────────────────────────
  function reportScreen() {
    var cur = ui.reportYM;
    var p = parseYM(cur);
    var prev = new Date(p.y, p.m - 1, 1); var prevYM = ym(prev);
    var total = monthTotal(cur), prevTotal = monthTotal(prevYM);

    var nav = '<div class="month-nav">' +
      '<button class="month-nav__btn" data-act="month" data-dir="-1">‹</button>' +
      '<div class="month-nav__label">' + ymLabel(cur) + '</div>' +
      '<button class="month-nav__btn" data-act="month" data-dir="1">›</button></div>';

    var deltaHtml = '';
    if (prevTotal > 0) {
      var diff = total - prevTotal, pc = Math.round((diff / prevTotal) * 100);
      deltaHtml = '<div class="delta ' + (diff > 0 ? 'up' : 'down') + '">' + (diff > 0 ? '▲ +' : '▼ ') + Math.abs(pc) + '% · geçen aya göre</div>';
    }
    var head = '<div class="card card--brand"><div class="summary__label">' + ymLabel(cur) + ' toplam</div>' +
      '<div class="summary__big">' + fmt(total) + '</div>' + deltaHtml + '</div>';

    // kategori dağılımı (sabit giderler kendi kategorisine eklenir)
    var byCat = {};
    expensesOfMonth(cur).forEach(function (e) { byCat[e.cat] = (byCat[e.cat] || 0) + (Number(e.amount) || 0); });
    state.fixed.forEach(function (f) { if (f.active !== false && (f.startYM || '0000-00') <= cur) byCat[f.cat] = (byCat[f.cat] || 0) + (Number(f.amount) || 0); });
    var rows = Object.keys(byCat).map(function (id) { return { id: id, val: byCat[id] }; }).sort(function (a, b) { return b.val - a.val; });

    var bars = '';
    if (!rows.length) {
      bars = '<div class="empty"><div class="empty__emoji">📊</div><div class="empty__title">Bu ay kayıt yok</div></div>';
    } else {
      var max = rows[0].val || 1;
      rows.forEach(function (r) {
        var c = catById(r.id);
        var pct = Math.round((r.val / total) * 100);
        bars += '<div class="cat-bar"><div class="cat-bar__top">' +
          '<span class="cat-bar__name">' + c.emoji + ' ' + esc(c.name) + '<span class="cat-bar__pct">%' + pct + '</span></span>' +
          '<span class="cat-bar__val">' + fmt(r.val) + '</span></div>' +
          '<div class="cat-bar__track"><div class="cat-bar__fill" style="width:' + clamp((r.val / max) * 100, 4, 100) + '%;background:' + c.color + '"></div></div></div>';
      });
      bars = '<div class="card"><div class="section-title" style="margin-top:0">Kategoriye göre</div>' + bars + '</div>';
    }

    // günlük grafik (yalnızca o ayın günlük harcamaları)
    var daysInMonth = new Date(p.y, p.m + 1, 0).getDate();
    var perDay = new Array(daysInMonth).fill(0);
    expensesOfMonth(cur).forEach(function (e) { var d = +e.date.slice(8, 10); if (d >= 1 && d <= daysInMonth) perDay[d - 1] += (Number(e.amount) || 0); });
    var dmax = Math.max.apply(null, perDay.concat([1]));
    var chartBars = '';
    var todayD = (cur === ym(new Date())) ? new Date().getDate() : -1;
    for (var i = 0; i < daysInMonth; i++) {
      var h = Math.round((perDay[i] / dmax) * 100);
      chartBars += '<div class="daychart__bar' + (i + 1 === todayD ? ' today' : '') + '" style="height:' + Math.max(h, 2) + '%" title="' + (i + 1) + ': ' + fmt(perDay[i]) + '"></div>';
    }
    var chart = '<div class="card"><div class="section-title" style="margin-top:0">Günlük dağılım</div><div class="daychart">' + chartBars + '</div>' +
      '<div class="muted" style="font-size:11px;text-align:center;margin-top:8px">' + daysInMonth + ' günlük harcama (sabit giderler hariç)</div></div>';

    var avg = '<div class="note-box">Bu ay günlük ortalama: <b>' + fmt(total / (todayD > 0 ? todayD : daysInMonth)) + '</b> · ' + expensesOfMonth(cur).length + ' işlem</div>';

    return nav + head + bars + chart + avg;
  }

  // ── Sabit (aylık) giderler ────────────────────────────────────
  function fixedScreen() {
    var total = state.fixed.reduce(function (s, f) { return f.active === false ? s : s + (Number(f.amount) || 0); }, 0);
    var head = '<div class="card card--brand"><div class="summary__label">Aylık sabit gider toplamı</div>' +
      '<div class="summary__big">' + fmt(total) + '</div>' +
      '<div class="summary__row"><span class="summary__chip">Bunlar her ay otomatik sayılır</span></div></div>';
    var info = '<div class="note-box" style="margin-bottom:14px">Kira, abonelik, aidat gibi <b>her ay tekrarlayan</b> harcamaları buraya bir kez ekle; raporlarda otomatik hesaplanır. Tek seferlik harcamalar için Özet ekranını kullan.</div>';

    var list;
    if (!state.fixed.length) {
      list = '<div class="empty"><div class="empty__emoji">🔁</div><div class="empty__title">Sabit gider yok</div><div class="empty__text">Kira, Netflix, aidat… bir kez ekle, her ay saysın.</div></div>';
    } else {
      list = '<div class="set-group">';
      state.fixed.forEach(function (f) {
        var c = catById(f.cat);
        list += '<button class="fixed-item" data-act="edit-fixed" data-id="' + f.id + '">' +
          '<span class="tx__emoji" style="background:' + hex2soft(c.color) + '">' + c.emoji + '</span>' +
          '<span class="fixed-item__main"><div class="fixed-item__name">' + esc(f.name || c.name) + (f.active === false ? ' <span class="muted">(pasif)</span>' : '') + '</div>' +
          '<div class="fixed-item__meta">' + esc(c.name) + (f.day ? ' · her ayın ' + f.day + '\'i' : ' · aylık') + '</div></span>' +
          '<span class="fixed-item__amt">' + fmt(f.amount) + '</span></button>';
      });
      list += '</div>';
    }
    var add = '<button class="btn btn--primary btn--block" data-act="add-fixed" style="margin-top:6px">＋ Sabit Gider Ekle</button>';
    return head + info + list + add;
  }

  // ── Ayarlar ───────────────────────────────────────────────────
  function settingsScreen() {
    var s = state.settings;
    var user = window.Cloud && Cloud.getUser();
    var configured = window.Cloud && Cloud.isConfigured();

    var cloud = '<div class="set-group">' +
      '<div class="set-row"><span class="set-row__ic">☁️</span><div class="set-row__main">' +
      '<div class="set-row__title">İnternet Yedeği</div>' +
      '<div class="set-row__sub">' + (user ? '<span class="cloud-status"><span class="dot on"></span>' + esc(user.email) + '</span>' : (configured ? 'Kuruldu — giriş yap' : 'Verilerin buluta yedeklensin')) + '</div>' +
      '</div></div>' +
      (user
        ? '<button class="set-row tappable" data-act="cloud-backup"><span class="set-row__ic">🔄</span><div class="set-row__main"><div class="set-row__title">Şimdi yedekle</div></div><span class="set-row__chev">›</span></button>' +
        '<button class="set-row tappable danger" data-act="cloud-signout"><span class="set-row__ic">🚪</span><div class="set-row__main"><div class="set-row__title">Çıkış yap</div></div></button>'
        : '<button class="set-row tappable" data-act="cloud-setup"><span class="set-row__ic">🔧</span><div class="set-row__main"><div class="set-row__title">' + (configured ? 'Giriş yap' : 'Bulut yedeği kur') + '</div><div class="set-row__sub">Yeni (ayrı) Firebase ile</div></div><span class="set-row__chev">›</span></button>') +
      '</div>';

    var vakif = '<div class="set-group">' +
      '<button class="set-row tappable" data-act="sms-import"><span class="set-row__ic">💬</span><div class="set-row__main"><div class="set-row__title">SMS / dekonttan ekle</div><div class="set-row__sub">Vakıfbank harcama SMS\'ini yapıştır</div></div><span class="set-row__chev">›</span></button>' +
      '<button class="set-row tappable" data-act="stmt-import"><span class="set-row__ic">📥</span><div class="set-row__main"><div class="set-row__title">Ekstre içe aktar</div><div class="set-row__sub">CSV / Excel\'den toplu harcama</div></div><span class="set-row__chev">›</span></button>' +
      '</div>';

    var prefs = '<div class="set-group">' +
      '<button class="set-row tappable" data-act="set-budget"><span class="set-row__ic">🎯</span><div class="set-row__main"><div class="set-row__title">Aylık bütçe</div></div><span class="set-row__val">' + (s.budget > 0 ? fmt0(s.budget) : 'Yok') + '</span><span class="set-row__chev">›</span></button>' +
      '<button class="set-row tappable" data-act="set-currency"><span class="set-row__ic">💱</span><div class="set-row__main"><div class="set-row__title">Para birimi</div></div><span class="set-row__val">' + esc(s.currency) + '</span><span class="set-row__chev">›</span></button>' +
      '<button class="set-row tappable" data-act="manage-cats"><span class="set-row__ic">🏷️</span><div class="set-row__main"><div class="set-row__title">Kategoriler</div></div><span class="set-row__val">' + state.cats.length + '</span><span class="set-row__chev">›</span></button>' +
      '<button class="set-row tappable" data-act="set-pin"><span class="set-row__ic">🔒</span><div class="set-row__main"><div class="set-row__title">Uygulama kilidi (PIN)</div><div class="set-row__sub">Açılışta 4 haneli PIN iste</div></div><span class="set-row__val">' + (getPin() ? 'Açık' : 'Kapalı') + '</span><span class="set-row__chev">›</span></button>' +
      '<div class="set-row"><span class="set-row__ic">🌓</span><div class="set-row__main"><div class="set-row__title">Görünüm</div></div></div>' +
      '<div style="padding:0 14px 14px"><div class="seg">' +
      ['auto', 'light', 'dark'].map(function (t) { return '<button data-act="set-theme" data-theme="' + t + '" class="' + (s.theme === t ? 'active' : '') + '">' + ({ auto: 'Otomatik', light: 'Açık', dark: 'Koyu' }[t]) + '</button>'; }).join('') +
      '</div></div>' +
      '</div>';

    var data = '<div class="set-group">' +
      '<button class="set-row tappable" data-act="export-json"><span class="set-row__ic">💾</span><div class="set-row__main"><div class="set-row__title">Yedek dosyası indir</div><div class="set-row__sub">.json</div></div><span class="set-row__chev">›</span></button>' +
      '<button class="set-row tappable" data-act="import-json"><span class="set-row__ic">📂</span><div class="set-row__main"><div class="set-row__title">Yedeği geri yükle</div></div><span class="set-row__chev">›</span></button>' +
      '<button class="set-row tappable" data-act="export-csv"><span class="set-row__ic">📤</span><div class="set-row__main"><div class="set-row__title">Excel/CSV olarak dışa aktar</div></div><span class="set-row__chev">›</span></button>' +
      '<button class="set-row tappable danger" data-act="wipe"><span class="set-row__ic">🗑️</span><div class="set-row__main"><div class="set-row__title">Tüm verileri sil</div></div><span class="set-row__chev">›</span></button>' +
      '</div>';

    var about = '<div class="note-box center">Spendy · sürüm 1.0<br>Verilerin yalnızca <b>senin cihazında</b> ve kurduğun <b>kendi bulutunda</b> saklanır. Banka şifren hiçbir yerde istenmez.</div>';

    return cloud + vakif + prefs + data + '<input type="file" id="fileInput" accept=".json" style="display:none" />' + about;
  }

  function applyTheme() {
    var t = state.settings.theme || 'auto';
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }

  // ════════════════════════════════════════════════════════════════
  //  SHEET / MODAL
  // ════════════════════════════════════════════════════════════════
  function openSheet(title, body) {
    var ov = document.getElementById('overlay');
    ov.innerHTML = '<div class="backdrop" data-act="close-sheet"><div class="sheet" data-stop="1">' +
      '<div class="sheet__handle"></div>' + (title ? '<div class="sheet__title">' + esc(title) + '</div>' : '') + body + '</div></div>';
  }
  function closeSheet() { document.getElementById('overlay').innerHTML = ''; sheetState = {}; }

  function toast(msg, actLabel, actFn) {
    var el = document.getElementById('toast');
    el.innerHTML = '<div class="toast"><span>' + esc(msg) + '</span>' + (actLabel ? '<button data-act="toast-act">' + esc(actLabel) + '</button>' : '') + '</div>';
    el._fn = actFn || null;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, 4200);
  }
  function hideToast() { var el = document.getElementById('toast'); el.innerHTML = ''; el._fn = null; }

  // ── Düzenleme sheet'i (harcama) ───────────────────────────────
  function openEdit(id) {
    var e = state.expenses.find(function (x) { return x.id === id; }); if (!e) return;
    sheetState = { id: id, amount: String(e.amount).replace('.', ','), cat: e.cat, note: e.note || '', date: e.date };
    openSheet('Harcamayı düzenle', editForm() + '<div class="field--row" style="margin-top:6px"><button class="btn btn--danger" data-act="del-expense" style="flex:1">Sil</button><button class="btn btn--primary" data-act="save-expense" style="flex:2">Kaydet</button></div>');
  }
  function editForm() {
    return '<div class="field"><label>Tutar</label><input type="text" inputmode="decimal" data-bind="s.amount" value="' + esc(sheetState.amount) + '" /></div>' +
      '<div class="field"><label>Kategori</label>' + catSelectChips(sheetState.cat) + '</div>' +
      '<div class="field"><label>Not</label><input type="text" data-bind="s.note" value="' + esc(sheetState.note) + '" placeholder="(isteğe bağlı)" /></div>' +
      '<div class="field"><label>Tarih</label><input type="date" data-bind="s.date" value="' + esc(sheetState.date) + '" /></div>';
  }
  function catSelectChips(sel) {
    var h = '<div class="cats" style="grid-template-columns:repeat(4,1fr)">';
    state.cats.forEach(function (c) {
      h += '<button class="cat-chip' + (c.id === sel ? ' armed' : '') + '" data-act="pick-cat" data-cat="' + c.id + '"><span class="cat-chip__emoji">' + c.emoji + '</span><span class="cat-chip__name">' + esc(c.name) + '</span></button>';
    });
    return h + '</div>';
  }

  // ── Sabit gider sheet'i ───────────────────────────────────────
  function openFixed(id) {
    var f = id ? state.fixed.find(function (x) { return x.id === id; }) : null;
    sheetState = f ? { id: id, name: f.name, amount: String(f.amount).replace('.', ','), cat: f.cat, day: f.day || '', active: f.active !== false }
      : { id: null, name: '', amount: '', cat: state.cats[0].id, day: '', active: true };
    var body = '<div class="field"><label>Ad</label><input type="text" data-bind="s.name" value="' + esc(sheetState.name) + '" placeholder="Kira, Netflix, aidat…" /></div>' +
      '<div class="field"><label>Aylık tutar</label><input type="text" inputmode="decimal" data-bind="s.amount" value="' + esc(sheetState.amount) + '" placeholder="0" /></div>' +
      '<div class="field"><label>Kategori</label>' + catSelectChips(sheetState.cat) + '</div>' +
      '<div class="field"><label>Ödeme günü (isteğe bağlı)</label><input type="number" min="1" max="31" data-bind="s.day" value="' + esc(sheetState.day) + '" placeholder="örn. 5" /></div>' +
      '<div class="field--row" style="margin-top:6px">' +
      (id ? '<button class="btn btn--danger" data-act="del-fixed" style="flex:1">Sil</button>' : '') +
      '<button class="btn btn--primary" data-act="save-fixed" style="flex:2">Kaydet</button></div>';
    openSheet(id ? 'Sabit gideri düzenle' : 'Sabit gider ekle', body);
  }

  // ── Kategori yönetimi ─────────────────────────────────────────
  function openCats() {
    var rows = state.cats.map(function (c) {
      return '<button class="set-row tappable" data-act="edit-cat" data-cat="' + c.id + '"><span class="set-row__ic">' + c.emoji + '</span><div class="set-row__main"><div class="set-row__title">' + esc(c.name) + '</div></div><span class="set-row__chev">›</span></button>';
    }).join('');
    openSheet('Kategoriler', '<div class="set-group">' + rows + '</div><button class="btn btn--primary btn--block" data-act="new-cat">＋ Yeni kategori</button>');
  }
  function openCatEdit(id) {
    var c = id ? catById(id) : null;
    sheetState = c ? { id: id, name: c.name, emoji: c.emoji, color: c.color } : { id: null, name: '', emoji: '🏷️', color: '#10b981' };
    var emojis = PICK_EMOJIS.map(function (e) { return '<button data-act="pick-emoji" data-emoji="' + e + '" class="' + (e === sheetState.emoji ? 'sel' : '') + '">' + e + '</button>'; }).join('');
    var colors = ['#ef4444', '#f97316', '#f59e0b', '#16a34a', '#10b981', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#64748b'];
    var colorH = colors.map(function (col) { return '<button data-act="pick-color" data-color="' + col + '" style="width:30px;height:30px;border-radius:99px;background:' + col + ';border:3px solid ' + (col === sheetState.color ? 'var(--text)' : 'transparent') + '"></button>'; }).join('');
    var body = '<div class="field"><label>Ad</label><input type="text" data-bind="s.name" value="' + esc(sheetState.name) + '" placeholder="Kategori adı" /></div>' +
      '<div class="field"><label>Simge</label><div class="emoji-grid">' + emojis + '</div></div>' +
      '<div class="field"><label>Renk</label><div style="display:flex;gap:8px;flex-wrap:wrap">' + colorH + '</div></div>' +
      '<div class="field--row" style="margin-top:6px">' +
      (id && id !== 'diger' ? '<button class="btn btn--danger" data-act="del-cat" style="flex:1">Sil</button>' : '') +
      '<button class="btn btn--primary" data-act="save-cat" style="flex:2">Kaydet</button></div>';
    openSheet(id ? 'Kategoriyi düzenle' : 'Yeni kategori', body);
  }

  // ── Bütçe / para birimi ───────────────────────────────────────
  function openBudget() {
    sheetState = { v: state.settings.budget ? String(state.settings.budget).replace('.', ',') : '' };
    openSheet('Aylık bütçe', '<div class="note-box" style="margin-bottom:12px">Aylık harcama hedefin. Özet ekranında ilerleme çubuğu görünür. Boş bırakırsan kapanır.</div>' +
      '<div class="field"><label>Tutar (' + currency() + ')</label><input type="text" inputmode="decimal" data-bind="s.v" value="' + esc(sheetState.v) + '" placeholder="örn. 20000" /></div>' +
      '<button class="btn btn--primary btn--block" data-act="save-budget">Kaydet</button>');
  }
  function openCurrency() {
    var opts = [['₺', 'Türk Lirası'], ['$', 'Dolar'], ['€', 'Euro'], ['£', 'Sterlin']];
    var body = '<div class="set-group">' + opts.map(function (o) {
      return '<button class="set-row tappable" data-act="pick-currency" data-cur="' + o[0] + '"><span class="set-row__ic">' + o[0] + '</span><div class="set-row__main"><div class="set-row__title">' + o[1] + '</div></div>' + (state.settings.currency === o[0] ? '<span class="set-row__val">✓</span>' : '') + '</button>';
    }).join('') + '</div>';
    openSheet('Para birimi', body);
  }

  // ── Uygulama kilidi (PIN) ─────────────────────────────────────
  function openPinSetup() {
    var has = !!getPin();
    sheetState = { pin: '', pin2: '' };
    var intro = has
      ? '<div class="note-box" style="margin-bottom:12px">Yeni bir PIN belirle ya da kilidi kaldır.</div>'
      : '<div class="note-box" style="margin-bottom:12px">4 haneli bir PIN belirle; Spendy her açıldığında istenir. PIN <b>yalnızca bu cihazda</b> saklanır (buluta gönderilmez).</div>';
    var body = intro +
      '<div class="field"><label>Yeni PIN (4 rakam)</label><input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]*" data-bind="s.pin" placeholder="••••" autocomplete="off" /></div>' +
      '<div class="field"><label>PIN (tekrar)</label><input type="password" inputmode="numeric" maxlength="4" pattern="[0-9]*" data-bind="s.pin2" placeholder="••••" autocomplete="off" /></div>' +
      '<div class="hint" id="pinErr" style="min-height:0;text-align:left"></div>' +
      '<button class="btn btn--primary btn--block" data-act="save-pin">Kaydet</button>' +
      (has ? '<button class="btn btn--danger btn--block" data-act="remove-pin" style="margin-top:8px">Kilidi kaldır</button>' : '');
    openSheet(has ? 'Uygulama kilidi' : 'PIN belirle', body);
  }

  // ── Bulut kurulum ─────────────────────────────────────────────
  function openCloudSetup() {
    var cfg = (window.Cloud && Cloud.getConfig()) || { apiKey: '', dbUrl: '' };
    var configured = window.Cloud && Cloud.isConfigured();
    sheetState = { apiKey: cfg.apiKey || '', dbUrl: cfg.dbUrl || '', email: '', pw: '' };
    var guide = '<div class="note-box" style="margin-bottom:12px">' +
      '<b>Tek seferlik kurulum (~5 dk):</b><br>' +
      '1) <b>console.firebase.google.com</b> → yeni proje oluştur.<br>' +
      '2) <b>Build → Realtime Database</b> → veritabanı oluştur (Avrupa bölgesi).<br>' +
      '3) <b>Build → Authentication → Sign-in</b> → <b>Email/Password</b>\'ü aç.<br>' +
      '4) ⚙️ <b>Project settings → Web app</b> ekle, <b>apiKey</b> ve <b>databaseURL</b>\'i aşağıya yapıştır.<br>' +
      '<a href="KURULUM.md" target="_blank" style="color:var(--brand);font-weight:700">↗ Ayrıntılı rehber</a></div>';
    var fields = '<div class="field"><label>apiKey</label><input type="text" data-bind="s.apiKey" value="' + esc(sheetState.apiKey) + '" placeholder="AIza…" autocapitalize="off" autocorrect="off" /></div>' +
      '<div class="field"><label>databaseURL</label><input type="text" data-bind="s.dbUrl" value="' + esc(sheetState.dbUrl) + '" placeholder="https://...firebasedatabase.app" autocapitalize="off" autocorrect="off" /></div>' +
      '<div class="field"><label>E-posta</label><input type="email" data-bind="s.email" placeholder="seninmail@ornek.com" autocapitalize="off" autocorrect="off" /></div>' +
      '<div class="field"><label>Şifre (en az 6 hane — yeni belirle)</label><input type="password" data-bind="s.pw" placeholder="••••••" /></div>' +
      '<div class="hint" id="cloudErr" style="min-height:0"></div>' +
      '<button class="btn btn--primary btn--block" data-act="cloud-save">Bağlan / Giriş yap</button>';
    openSheet('Bulut yedeği kur', (configured ? '' : guide) + fields);
  }

  // ── SMS / dekont ekleme ───────────────────────────────────────
  function openSms(prefill) {
    sheetState = { text: prefill || '', parsed: null };
    var body = '<div class="note-box" style="margin-bottom:12px">Vakıfbank harcama <b>SMS\'ini</b> kopyalayıp aşağıya yapıştır. Tutar, işyeri ve tarih otomatik bulunur; onaylayıp eklersin.<br><span class="muted">Not: Uygulama SMS\'i kendisi okuyamaz (iPhone buna izin vermez). Metni sen yapıştırırsın ya da bir iOS Kısayolu verir — bkz. KISAYOL-REHBERI.md</span></div>' +
      '<div class="field"><textarea data-bind="s.text" placeholder="VakıfBank: ... kartınızla 245,90 TL tutarında MIGROS ... işleminiz gerçekleşmiştir.">' + esc(sheetState.text) + '</textarea></div>' +
      '<button class="btn btn--block" data-act="sms-parse">🔍 Ayrıştır</button>' +
      '<div id="smsResult" style="margin-top:12px"></div>';
    openSheet('SMS / dekonttan ekle', body);
    if (prefill) setTimeout(function () { doSmsParse(); }, 50);
  }
  function parseSms(text) {
    if (!text) return null;
    var t = text.replace(/\s+/g, ' ').trim();
    // tutar: 1.234,56 TL / 245,90 TL / 50 TL
    var am = t.match(/(\d{1,3}(?:\.\d{3})*|\d+)(?:,(\d{1,2}))?\s*(?:TL|TRY|₺)/i);
    var amount = am ? amountToNumber(am[1] + (am[2] ? ',' + am[2] : '')) : 0;
    // tarih
    var dm = t.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/);
    var date = todayStr();
    if (dm) { var y = dm[3].length === 2 ? '20' + dm[3] : dm[3]; date = y + '-' + pad(+dm[2]) + '-' + pad(+dm[1]); }
    // işyeri
    var merchant = '';
    var m1 = t.match(/tutar[ıi]nda\s+(.+?)\s+(?:i[sş]yerinde|adresinde|i[sş]leminiz|ma[ğg]azas[ıi]|isimli|firmasında|\d{1,2}[.\/]\d{1,2})/i);
    if (m1) merchant = m1[1];
    if (!merchant) { var m2 = t.match(/(?:TL|₺|TRY)\s+(.+?)\s+(?:i[sş]yerinde|adresinde|i[sş]leminiz|ma[ğg]azas[ıi])/i); if (m2) merchant = m2[1]; }
    if (!merchant) { var m3 = t.match(/\b([A-ZÇĞİÖŞÜ][A-ZÇĞİÖŞÜ0-9 .&'-]{3,30})\b/); if (m3) merchant = m3[1].trim(); }
    merchant = merchant.replace(/\b(kart[ıi]n[ıi]zla|kartınızla|ile|adl[ıi])\b/gi, '').replace(/^\s*(?:TL|TRY|₺)\s+/i, '').replace(/\s+/g, ' ').trim();
    return { amount: amount, date: date, merchant: merchant, cat: guessCat(merchant) };
  }
  function doSmsParse() {
    var p = parseSms(sheetState.text);
    sheetState.parsed = p;
    var box = document.getElementById('smsResult'); if (!box) return;
    if (!p || p.amount <= 0) { box.innerHTML = '<div class="note-box warn" style="color:var(--warn)">Tutar bulunamadı. Metni kontrol et veya manuel ekle.</div>'; return; }
    sheetState.amount = String(p.amount).replace('.', ','); sheetState.cat = p.cat; sheetState.note = p.merchant; sheetState.date = p.date;
    box.innerHTML = '<div class="card" style="margin:0 0 12px"><div class="tx" style="padding:4px 0"><span class="tx__emoji" style="background:' + hex2soft(catById(p.cat).color) + '">' + catById(p.cat).emoji + '</span><span class="tx__main"><div class="tx__cat">' + esc(p.merchant || 'Harcama') + '</div><div class="tx__note">' + dayLabel(p.date) + '</div></span><span class="tx__amt">' + fmt(p.amount) + '</span></div></div>' +
      '<div class="field"><label>Kategori (değiştirebilirsin)</label>' + catSelectChips(p.cat) + '</div>' +
      '<button class="btn btn--primary btn--block" data-act="sms-add">＋ Bu harcamayı ekle</button>';
  }
  // İşyeri adından sade bir anahtar üret (öğrenme için)
  function merchantKey(text) {
    var l = (text || '').toLocaleLowerCase('tr-TR')
      .replace(/[0-9]+/g, ' ')
      .replace(/[^a-zçğıöşü ]/g, ' ')
      .replace(/\b(?:tl|try|kart|kartinizla|ile|adli|isimli|isyeri|magaza|san|tic|ltd|sti|sti|as)\b/g, ' ')
      .replace(/\s+/g, ' ').trim();
    if (l.length < 3) return '';
    return l.split(' ').slice(0, 2).join(' '); // ilk 1-2 anlamlı kelime
  }
  // Kullanıcının seçtiği kategoriyi işyeriyle eşle → bir dahakine otomatik
  function learnCat(note, cat) {
    if (!cat) return;
    var k = merchantKey(note);
    if (!k) return;
    if (!state.learn) state.learn = {};
    state.learn[k] = cat;
  }
  function guessCat(text) {
    // 1) Öğrenilmiş eşleşme (kullanıcının daha önce seçtiği kategori)
    var k = merchantKey(text);
    if (k && state.learn && state.learn[k] && state.cats.some(function (c) { return c.id === state.learn[k]; })) return state.learn[k];
    // 2) Hazır kurallar
    var l = (' ' + (text || '') + ' ').toLocaleLowerCase('tr-TR');
    for (var i = 0; i < AUTO_RULES.length; i++) {
      var r = AUTO_RULES[i];
      for (var j = 0; j < r.kw.length; j++) if (l.indexOf(r.kw[j]) >= 0) {
        return state.cats.some(function (c) { return c.id === r.cat; }) ? r.cat : 'diger';
      }
    }
    return 'diger';
  }

  // ── Ekstre içe aktarma ────────────────────────────────────────
  function openStmt() {
    sheetState = { text: '', rows: null, map: null, items: null };
    var body = '<div class="note-box" style="margin-bottom:12px">Vakıfbank uygulaması/internet bankacılığından <b>hesap/kart ekstresini</b> CSV veya Excel olarak indir. Dosyayı seç ya da içeriğini yapıştır. Çıkan (eksi) tutarlar harcama olarak alınır.</div>' +
      '<button class="btn btn--block" data-act="stmt-file">📂 CSV dosyası seç</button>' +
      '<input type="file" id="stmtFile" accept=".csv,text/csv,.txt" style="display:none" />' +
      '<div class="muted center" style="font-size:12px;margin:10px 0">— veya —</div>' +
      '<div class="field"><textarea data-bind="s.text" placeholder="Tarih;Açıklama;Tutar&#10;05.06.2026;MIGROS;-245,90&#10;06.06.2026;OPET;-800,00"></textarea></div>' +
      '<button class="btn btn--block" data-act="stmt-parse">🔍 Çözümle</button>' +
      '<div id="stmtResult" style="margin-top:12px"></div>';
    openSheet('Ekstre içe aktar', body);
  }
  function splitCSV(line, delim) {
    var out = [], cur = '', q = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (q) { if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; }
      else { if (ch === '"') q = true; else if (ch === delim) { out.push(cur); cur = ''; } else cur += ch; }
    }
    out.push(cur); return out;
  }
  function parseNum(s) {
    if (s == null) return NaN;
    var t = String(s).replace(/[^\d,.\-]/g, '').trim();
    if (!t) return NaN;
    var neg = /-/.test(t); t = t.replace(/-/g, '');
    if (t.indexOf(',') >= 0 && t.indexOf('.') >= 0) t = t.replace(/\./g, '').replace(',', '.');
    else if (t.indexOf(',') >= 0) t = t.replace(',', '.');
    else if (t.indexOf('.') >= 0) { var p = t.split('.'); if (p[p.length - 1].length === 3) t = t.replace(/\./g, ''); }
    var n = parseFloat(t); if (isNaN(n)) return NaN; return neg ? -n : n;
  }
  function parseDateCell(s) {
    if (!s) return null;
    var m = String(s).match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/);
    if (m) { var y = m[3].length === 2 ? '20' + m[3] : m[3]; return y + '-' + pad(+m[2]) + '-' + pad(+m[1]); }
    var m2 = String(s).match(/(\d{4})-(\d{2})-(\d{2})/); if (m2) return m2[0];
    return null;
  }
  function parseStmt(text) {
    var lines = text.split(/\r?\n/).filter(function (l) { return l.trim(); });
    if (!lines.length) return null;
    var delim = (lines[0].match(/;/g) || []).length >= (lines[0].match(/,/g) || []).length ? (lines[0].indexOf('\t') >= 0 ? '\t' : ';') : ',';
    if (lines[0].indexOf('\t') >= 0) delim = '\t';
    var rows = lines.map(function (l) { return splitCSV(l, delim); });
    // başlık var mı? ilk satırda tarih yoksa başlıktır
    var headerless = !!parseDateCell(rows[0].join(' '));
    var header = headerless ? null : rows[0];
    var data = headerless ? rows : rows.slice(1);
    var ncol = Math.max.apply(null, data.map(function (r) { return r.length; }));
    var sample = data.slice(0, 15);
    function colStat(c) {
      var d = 0, amt = 0, comma = 0, alpha = 0;
      sample.forEach(function (r) {
        var cell = r[c] || '';
        if (parseDateCell(cell)) { d++; return; }                 // tarih hücresi sayıya sayılmasın
        var n = parseNum(cell);
        if (!isNaN(n) && /\d/.test(cell)) { amt++; if (cell.indexOf(',') >= 0) comma++; }
        alpha += cell.replace(/[\d.,;:\-\/ ]/g, '').length;
      });
      return { d: d, amt: amt, comma: comma, alpha: alpha };
    }
    var stats = []; for (var c = 0; c < ncol; c++) stats.push(colStat(c));
    var dateCol = -1, ds = -1; stats.forEach(function (s, i) { if (s.d > ds) { ds = s.d; dateCol = i; } });
    var amtCol = -1, as = -1; stats.forEach(function (s, i) { if (i === dateCol || s.amt === 0) return; var sc = s.amt + s.comma * 2; if (sc > as) { as = sc; amtCol = i; } });
    var descCol = -1, ts = -1; stats.forEach(function (s, i) { if (i === dateCol || i === amtCol) return; if (s.alpha > ts) { ts = s.alpha; descCol = i; } });
    // başlık adlarından düzelt
    if (header) header.forEach(function (h, i) {
      var hl = h.toLocaleLowerCase('tr-TR');
      if (/tarih|date/.test(hl)) dateCol = i;
      if (/tutar|amount|borç|işlem tutar|harcama|çıkan/.test(hl)) amtCol = i;
      if (/açıklama|aciklama|description|işyeri|isyeri|detay|tür/.test(hl)) descCol = i;
    });
    return { header: header, data: data, ncol: ncol, map: { date: dateCol, amt: amtCol, desc: descCol } };
  }
  function buildStmtItems() {
    var r = sheetState.rows; if (!r) return [];
    var m = sheetState.map;
    var neg = [], all = [];
    r.data.forEach(function (row) {
      var amt = parseNum(row[m.amt]);
      if (isNaN(amt) || amt === 0) return;
      var date = parseDateCell(row[m.date]) || todayStr();
      var desc = (row[m.desc] || '').trim();
      var it = { date: date, amount: Math.abs(amt), note: desc, cat: guessCat(desc) };
      all.push(it);
      if (amt < 0) neg.push(it); // çıkan (eksi) tutarlar harcamadır
    });
    // Eksi tutar yoksa (tek sütunda artı yazan formatlar) tümünü harcama say
    return neg.length ? neg : all;
  }
  function renderStmtResult() {
    var box = document.getElementById('stmtResult'); if (!box) return;
    var r = sheetState.rows;
    if (!r) { box.innerHTML = '<div class="note-box" style="color:var(--warn)">Veri okunamadı. Sütunlar Tarih ; Açıklama ; Tutar şeklinde mi?</div>'; return; }
    var m = sheetState.map;
    function colSel(which, val) {
      var opts = '';
      for (var c = 0; c < r.ncol; c++) { var name = r.header && r.header[c] ? r.header[c] : 'Sütun ' + (c + 1); opts += '<option value="' + c + '"' + (c === val ? ' selected' : '') + '>' + esc(name) + '</option>'; }
      return '<select data-act="stmt-map" data-which="' + which + '">' + opts + '</select>';
    }
    var items = buildStmtItems(); sheetState.items = items;
    var preview = items.slice(0, 8).map(function (e) {
      return '<div class="tx" style="padding:8px 0"><span class="tx__emoji" style="background:' + hex2soft(catById(e.cat).color) + '">' + catById(e.cat).emoji + '</span><span class="tx__main"><div class="tx__cat">' + esc(e.note || catById(e.cat).name) + '</div><div class="tx__note">' + dayLabel(e.date) + '</div></span><span class="tx__amt">' + fmt(e.amount) + '</span></div>';
    }).join('');
    box.innerHTML = '<div class="field--row"><div class="field" style="flex:1"><label>Tarih</label>' + colSel('date', m.date) + '</div>' +
      '<div class="field" style="flex:1"><label>Açıklama</label>' + colSel('desc', m.desc) + '</div>' +
      '<div class="field" style="flex:1"><label>Tutar</label>' + colSel('amt', m.amt) + '</div></div>' +
      (items.length ? '<div class="card" style="margin:6px 0 12px">' + preview + (items.length > 8 ? '<div class="muted center" style="font-size:12px;padding:8px 0">… ve ' + (items.length - 8) + ' tane daha</div>' : '') + '</div>' +
        '<button class="btn btn--primary btn--block" data-act="stmt-add">＋ ' + items.length + ' harcamayı aktar</button>'
        : '<div class="note-box" style="color:var(--warn)">Harcama (eksi tutar) bulunamadı. Tutar sütununu kontrol et.</div>');
  }
  function importItems(items, src) {
    var added = 0;
    items.forEach(function (it) {
      var dup = state.expenses.some(function (e) { return e.src === src && e.date === it.date && Math.abs(e.amount - it.amount) < 0.005 && (e.note || '') === (it.note || ''); });
      if (dup) return;
      state.expenses.push({ id: uid(), ts: Date.now(), date: it.date, amount: it.amount, cat: it.cat, note: it.note || '', src: src });
      added++;
    });
    persist();
    return added;
  }

  // ── Dosya indir/yükle ─────────────────────────────────────────
  function download(name, text, mime) {
    var blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 500);
  }
  function exportCSV() {
    var head = 'Tarih;Kategori;Not;Tutar\n';
    var body = state.expenses.slice().sort(function (a, b) { return a.date.localeCompare(b.date); }).map(function (e) {
      return [e.date, catById(e.cat).name, '"' + (e.note || '').replace(/"/g, '""') + '"', String(e.amount).replace('.', ',')].join(';');
    }).join('\n');
    download('spendy-harcamalar-' + todayStr() + '.csv', '﻿' + head + body, 'text/csv;charset=utf-8');
  }

  // ════════════════════════════════════════════════════════════════
  //  OLAYLAR (delegasyon)
  // ════════════════════════════════════════════════════════════════
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act');
    var H = handlers[act];
    if (H) { H(t, ev); }
  });
  document.addEventListener('input', function (ev) {
    var b = ev.target.getAttribute && ev.target.getAttribute('data-bind');
    if (!b) return;
    var val = ev.target.value;
    if (b === 'note') ui.note = val;
    else if (b.indexOf('s.') === 0) sheetState[b.slice(2)] = val;
  });
  document.addEventListener('change', function (ev) {
    var el = ev.target;
    var a = el.getAttribute && el.getAttribute('data-act');
    if (a && el.tagName === 'SELECT' && handlers[a]) { handlers[a](el, ev); return; }
    var b = el.getAttribute && el.getAttribute('data-bind');
    if (b === 'date') { ui.date = el.value; }
    else if (b && b.indexOf('s.') === 0) { sheetState[b.slice(2)] = el.value; }
  });

  var handlers = {
    go: function (t) { ui.tab = t.getAttribute('data-tab'); window.scrollTo(0, 0); render(); var s = document.querySelector('.screen'); if (s) s.scrollTop = 0; },
    key: function (t) { keyPress(t.getAttribute('data-k')); },
    'qa-cat': function (t) {
      var cat = t.getAttribute('data-cat');
      if (amountToNumber(ui.amount) > 0) commitQuickAdd(cat);
      else { ui.armedCat = cat; patchArmed(); var h = document.getElementById('qaHint'); if (h) h.textContent = catById(cat).name + ' seçildi · şimdi tutarı yaz'; }
    },
    'qa-add': function () { commitQuickAdd(ui.armedCat); },
    'add-cat': function () { openCatEdit(null); },
    edit: function (t) { openEdit(t.getAttribute('data-id')); },
    'close-sheet': function (t, ev) { if (ev.target.closest('[data-stop]')) return; closeSheet(); },
    'toast-act': function () { var el = document.getElementById('toast'); var fn = el._fn; if (fn) fn(); },

    month: function (t) { var p = parseYM(ui.reportYM); var d = new Date(p.y, p.m + (+t.getAttribute('data-dir')), 1); ui.reportYM = ym(d); render(); },

    // harcama düzenle
    'pick-cat': function (t) { sheetState.cat = t.getAttribute('data-cat'); document.querySelectorAll('.cat-chip[data-cat]').forEach(function (n) { n.classList.toggle('armed', n.getAttribute('data-cat') === sheetState.cat); }); },
    'save-expense': function () {
      var e = state.expenses.find(function (x) { return x.id === sheetState.id; }); if (!e) return;
      var amt = parseNum(sheetState.amount); if (!(amt > 0)) return;
      e.amount = amt; e.cat = sheetState.cat; e.note = sheetState.note; e.date = sheetState.date;
      persist(); closeSheet(); render(); toast('Güncellendi');
    },
    'del-expense': function () { var id = sheetState.id; closeSheet(); deleteExpense(id); },

    // sabit
    'add-fixed': function () { openFixed(null); },
    'edit-fixed': function (t) { openFixed(t.getAttribute('data-id')); },
    'save-fixed': function () {
      var amt = parseNum(sheetState.amount); if (!(amt > 0)) { toast('Tutar gir'); return; }
      if (sheetState.id) {
        var f = state.fixed.find(function (x) { return x.id === sheetState.id; });
        f.name = sheetState.name; f.amount = amt; f.cat = sheetState.cat; f.day = sheetState.day ? clamp(+sheetState.day, 1, 31) : null;
      } else {
        state.fixed.push({ id: uid(), name: sheetState.name, amount: amt, cat: sheetState.cat, day: sheetState.day ? clamp(+sheetState.day, 1, 31) : null, startYM: ym(new Date()), active: true });
      }
      persist(); closeSheet(); render();
    },
    'del-fixed': function () { state.fixed = state.fixed.filter(function (x) { return x.id !== sheetState.id; }); persist(); closeSheet(); render(); },

    // kategori
    'manage-cats': function () { openCats(); },
    'edit-cat': function (t) { openCatEdit(t.getAttribute('data-cat')); },
    'new-cat': function () { openCatEdit(null); },
    'pick-emoji': function (t) { sheetState.emoji = t.getAttribute('data-emoji'); document.querySelectorAll('.emoji-grid button').forEach(function (n) { n.classList.toggle('sel', n.getAttribute('data-emoji') === sheetState.emoji); }); },
    'pick-color': function (t) { sheetState.color = t.getAttribute('data-color'); document.querySelectorAll('[data-act="pick-color"]').forEach(function (n) { n.style.borderColor = n.getAttribute('data-color') === sheetState.color ? 'var(--text)' : 'transparent'; }); },
    'save-cat': function () {
      if (!sheetState.name.trim()) { toast('Ad gir'); return; }
      if (sheetState.id) { var c = catById(sheetState.id); c.name = sheetState.name.trim(); c.emoji = sheetState.emoji; c.color = sheetState.color; }
      else state.cats.push({ id: uid(), name: sheetState.name.trim(), emoji: sheetState.emoji, color: sheetState.color });
      persist(); openCats(); render();
    },
    'del-cat': function () {
      if (sheetState.id === 'diger') return;
      state.expenses.forEach(function (e) { if (e.cat === sheetState.id) e.cat = 'diger'; });
      state.fixed.forEach(function (f) { if (f.cat === sheetState.id) f.cat = 'diger'; });
      state.cats = state.cats.filter(function (c) { return c.id !== sheetState.id; });
      persist(); openCats(); render();
    },

    // bütçe / para birimi / tema
    'set-budget': function () { openBudget(); },
    'save-budget': function () { var b = parseNum(sheetState.v); state.settings.budget = b > 0 ? b : 0; persist(); closeSheet(); render(); },
    'set-currency': function () { openCurrency(); },
    'pick-currency': function (t) { state.settings.currency = t.getAttribute('data-cur'); persist(); closeSheet(); render(); },
    'set-theme': function (t) { state.settings.theme = t.getAttribute('data-theme'); persist(); render(); },

    // uygulama kilidi (PIN)
    'set-pin': function () { openPinSetup(); },
    'pin-key': function (t) {
      var k = t.getAttribute('data-k');
      if (k === 'back') pinEntry = pinEntry.slice(0, -1);
      else if (pinEntry.length < 4) pinEntry += k;
      patchPinDots();
      if (pinEntry.length === 4) {
        if (hashPin(pinEntry) === getPin()) { pinEntry = ''; unlocked = true; render(); }
        else {
          pinEntry = '';
          var sub = document.getElementById('pinSub');
          var dots = document.querySelector('.pin-dots');
          if (sub) { sub.textContent = 'Yanlış PIN, tekrar dene'; sub.classList.add('err'); }
          if (dots) dots.classList.add('shake');
          setTimeout(function () { patchPinDots(); if (dots) dots.classList.remove('shake'); }, 450);
        }
      }
    },
    'save-pin': function () {
      var err = document.getElementById('pinErr');
      var p = String(sheetState.pin || '').trim(), p2 = String(sheetState.pin2 || '').trim();
      if (!/^\d{4}$/.test(p)) { if (err) { err.textContent = 'PIN tam 4 rakam olmalı.'; err.classList.add('warn'); } return; }
      if (p !== p2) { if (err) { err.textContent = 'İki PIN aynı değil.'; err.classList.add('warn'); } return; }
      setPin(hashPin(p)); unlocked = true; closeSheet(); render(); toast('Uygulama kilidi açıldı 🔒');
    },
    'remove-pin': function () { setPin(null); unlocked = true; closeSheet(); render(); toast('Kilit kaldırıldı'); },
    'pin-forgot': function () {
      openSheet('PIN\'i unuttum', '<div class="note-box" style="margin-bottom:14px">PIN yalnızca <b>bu cihazda</b> saklanır ve geri getirilemez. Sıfırlamak için bu cihazdaki Spendy verisi silinir. <b>Bulut yedeğin varsa</b> tekrar giriş yapınca tüm harcamaların geri gelir.</div><button class="btn btn--danger btn--block" data-act="pin-reset-local">PIN\'i sıfırla (bu cihazdaki veriyi sil)</button>');
    },
    'pin-reset-local': function () {
      setPin(null);
      try { localStorage.removeItem(STORE_KEY); } catch (e) {}
      unlocked = true; location.reload();
    },

    // bulut
    'cloud-setup': function () { openCloudSetup(); },
    'cloud-save': async function () {
      var err = document.getElementById('cloudErr');
      if (!sheetState.apiKey || !sheetState.dbUrl) { if (err) err.textContent = 'apiKey ve databaseURL gerekli.'; return; }
      Cloud.setConfig({ apiKey: sheetState.apiKey, dbUrl: sheetState.dbUrl });
      if (!sheetState.email || !sheetState.pw) { if (err) err.textContent = 'E-posta ve şifre gir.'; return; }
      if (err) { err.textContent = 'Bağlanılıyor…'; err.classList.remove('warn'); }
      var r = await Cloud.signIn(sheetState.email, sheetState.pw);
      if (!r.ok) { if (err) { err.textContent = r.error; err.classList.add('warn'); } return; }
      var pr = await Cloud.pull();
      if (pr && pr.ok && pr.data && pr.data.expenses && (pr.data.updatedAt || 0) > (state.updatedAt || 0)) { state = pr.data; ensureDiger(); persist(true); }
      else { Cloud.push(state); }
      closeSheet(); render(); toast('Bulut yedeği aktif ☁︎');
    },
    'cloud-backup': async function () { setCloudBadge('sync'); var r = await Cloud.push(state); setCloudBadge(r && r.ok ? 'ok' : 'err'); toast(r && r.ok ? 'Yedeklendi ☁︎' : 'Yedeklenemedi'); },
    'cloud-signout': function () { Cloud.signOut(); render(); toast('Çıkış yapıldı'); },

    // SMS
    'sms-import': function () { openSms(''); },
    'sms-parse': function () { doSmsParse(); },
    'sms-add': function () {
      var amt = amountToNumber(sheetState.amount); if (amt <= 0) return;
      addExpense({ amount: amt, cat: sheetState.cat, note: sheetState.note, date: sheetState.date, src: 'sms' });
      closeSheet(); render(); toast(fmt(amt) + ' eklendi (SMS)', 'Geri Al', undo);
    },

    // ekstre
    'stmt-import': function () { openStmt(); },
    'stmt-file': function () { var f = document.getElementById('stmtFile'); if (f) f.click(); },
    'stmt-parse': function () { sheetState.rows = parseStmt(sheetState.text || ''); if (sheetState.rows) sheetState.map = sheetState.rows.map; renderStmtResult(); },
    'stmt-map': function (t) { sheetState.map[t.getAttribute('data-which')] = +t.value; renderStmtResult(); },
    'stmt-add': function () { var n = importItems(sheetState.items || [], 'import'); closeSheet(); render(); toast(n + ' harcama içe aktarıldı'); },

    // veri
    'export-json': function () { download('spendy-yedek-' + todayStr() + '.json', JSON.stringify(state, null, 2), 'application/json'); },
    'export-csv': function () { exportCSV(); },
    'import-json': function () { var f = document.getElementById('fileInput'); if (f) f.click(); },
    wipe: function () {
      openSheet('Tüm verileri sil', '<div class="note-box" style="margin-bottom:14px;color:var(--danger)">Bu işlem cihazdaki tüm harcamaları, sabit giderleri ve kategorileri siler. Buluttaki yedek bir sonraki açılışta geri gelebilir. Emin misin?</div><button class="btn btn--danger btn--block" data-act="wipe-yes">Evet, hepsini sil</button>');
    },
    'wipe-yes': function () { state = freshState(); persist(); closeSheet(); ui.tab = 'home'; render(); toast('Silindi'); }
  };

  // dosya seçimi (change)
  document.addEventListener('change', function (ev) {
    if (ev.target.id === 'fileInput' && ev.target.files[0]) {
      var fr = new FileReader();
      fr.onload = function () {
        try { var d = JSON.parse(fr.result); if (d && d.expenses) { state = d; ensureDiger(); persist(); render(); toast('Yedek geri yüklendi'); } else toast('Geçersiz dosya'); }
        catch (e) { toast('Dosya okunamadı'); }
      };
      fr.readAsText(ev.target.files[0]); ev.target.value = '';
    }
    if (ev.target.id === 'stmtFile' && ev.target.files[0]) {
      var fr2 = new FileReader();
      fr2.onload = function () { sheetState.text = fr2.result; sheetState.rows = parseStmt(fr2.result); if (sheetState.rows) sheetState.map = sheetState.rows.map; renderStmtResult(); };
      fr2.readAsText(ev.target.files[0], 'utf-8'); ev.target.value = '';
    }
  });

  // ── Derin bağlantı: #sms=... (iOS Kısayolu için) ──────────────
  function handleDeepLink() {
    var h = location.hash || '';
    var idx = h.indexOf('sms=');
    if (idx >= 0) {
      // Kısayol biçimi:  #sms=METİN   ya da otomatik için  #auto=1&sms=METİN
      var auto = /(?:^#|&)auto=1(?:&|$)/.test(h.slice(0, idx));
      var text = decodeURIComponent(h.slice(idx + 4).replace(/\+/g, ' '));
      history.replaceState(null, '', location.pathname + location.search);
      if (auto) {
        var p = parseSms(text);
        if (p && p.amount > 0) { addExpense({ amount: p.amount, cat: p.cat, note: p.merchant, date: p.date, src: 'sms' }); render(); toast(fmt(p.amount) + ' eklendi (SMS)', 'Geri Al', undo); return; }
      }
      openSms(text);
    }
  }

  // ── Otomatik kilit: arka plana geçince yeniden kilitle ────────
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { if (getPin()) unlocked = false; }
    else if (getPin() && !unlocked) { closeSheet(); hideToast(); render(); }
  });

  // ── Başlat ────────────────────────────────────────────────────
  render();
  handleDeepLink();
  cloudSyncOnLoad();
  window.addEventListener('hashchange', handleDeepLink);
})();
