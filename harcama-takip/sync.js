/* ===================================================================
   Cüzdan — Bulut yedek modülü  (window.Cloud)
   Kendi (ayrı) Firebase projene REST ile bağlanır. SDK/derleme YOK.
   - Kimlik: Firebase Auth (e-posta + şifre)
   - Depo:   Realtime Database  /harcama/<uid>
   Yapılandırma & oturum yalnızca senin cihazında (localStorage) tutulur.
   =================================================================== */
(function () {
  'use strict';

  var CFG_KEY = 'cuzdan_cloud_cfg';
  var AUTH_KEY = 'cuzdan_cloud_auth';

  function load(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (e) { return null; } }
  function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }
  function del(key) { try { localStorage.removeItem(key); } catch (e) {} }

  function getConfig() { return load(CFG_KEY); }
  function setConfig(cfg) {
    if (!cfg || !cfg.apiKey || !cfg.dbUrl) return false;
    cfg.dbUrl = String(cfg.dbUrl).replace(/\/+$/, '');
    save(CFG_KEY, { apiKey: cfg.apiKey.trim(), dbUrl: cfg.dbUrl.trim() });
    return true;
  }
  function isConfigured() { var c = getConfig(); return !!(c && c.apiKey && c.dbUrl); }
  function clearConfig() { del(CFG_KEY); del(AUTH_KEY); }

  function getAuth() { return load(AUTH_KEY); }
  function getUser() { var a = getAuth(); return a ? { email: a.email, uid: a.uid } : null; }
  function isSignedIn() { return !!getAuth(); }

  // Firebase hata kodlarını Türkçeleştir
  function trError(code) {
    var m = {
      EMAIL_NOT_FOUND: 'Bu e-posta kayıtlı değil.',
      INVALID_PASSWORD: 'Şifre hatalı.',
      INVALID_LOGIN_CREDENTIALS: 'E-posta veya şifre hatalı.',
      INVALID_EMAIL: 'Geçersiz e-posta adresi.',
      EMAIL_EXISTS: 'Bu e-posta zaten kayıtlı.',
      WEAK_PASSWORD: 'Şifre en az 6 karakter olmalı.',
      MISSING_PASSWORD: 'Şifre girilmedi.',
      'WEAK_PASSWORD : Password should be at least 6 characters': 'Şifre en az 6 karakter olmalı.',
      OPERATION_NOT_ALLOWED: 'Firebase\'de E-posta/Şifre girişi kapalı. Authentication > Sign-in method bölümünden aç.',
      ADMIN_ONLY_OPERATION: 'Kayıt kapalı görünüyor (Authentication ayarlarını kontrol et).'
    };
    if (m[code]) return m[code];
    if (code && code.indexOf('WEAK_PASSWORD') === 0) return 'Şifre en az 6 karakter olmalı.';
    return code || 'Bilinmeyen hata.';
  }

  function idpUrl(method) {
    return 'https://identitytoolkit.googleapis.com/v1/accounts:' + method + '?key=' + getConfig().apiKey;
  }

  async function authRequest(method, body) {
    var res = await fetch(idpUrl(method), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign({ returnSecureToken: true }, body))
    });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) {
      var code = data && data.error && data.error.message ? data.error.message : 'HTTP ' + res.status;
      throw new Error(code);
    }
    return data;
  }

  function storeSession(data, email) {
    save(AUTH_KEY, {
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      uid: data.localId,
      email: email || data.email,
      expiresAt: Date.now() + (Number(data.expiresIn || 3600) * 1000) - 60000
    });
  }

  // Giriş yap; hesap yoksa otomatik oluştur.
  async function signIn(email, password) {
    if (!isConfigured()) return { ok: false, error: 'Önce Firebase bilgilerini gir.' };
    email = (email || '').trim();
    try {
      var data;
      try {
        data = await authRequest('signInWithPassword', { email: email, password: password });
      } catch (e1) {
        var msg = e1.message || '';
        if (msg.indexOf('EMAIL_NOT_FOUND') === 0 || msg.indexOf('INVALID_LOGIN_CREDENTIALS') === 0) {
          // Hesap yok → oluşturmayı dene (yanlış şifreyse signUp EMAIL_EXISTS verir)
          data = await authRequest('signUp', { email: email, password: password });
        } else { throw e1; }
      }
      storeSession(data, email);
      return { ok: true, user: { email: email, uid: data.localId } };
    } catch (e) {
      return { ok: false, error: trError(e.message) };
    }
  }

  function signOut() { del(AUTH_KEY); }

  // Geçerli idToken döndür (gerekirse yenile)
  async function ensureToken() {
    var a = getAuth();
    if (!a) return null;
    if (Date.now() < a.expiresAt) return a.idToken;
    try {
      var res = await fetch('https://securetoken.googleapis.com/v1/token?key=' + getConfig().apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(a.refreshToken)
      });
      var d = await res.json();
      if (!res.ok || !d.id_token) { signOut(); return null; }
      a.idToken = d.id_token;
      a.refreshToken = d.refresh_token || a.refreshToken;
      a.expiresAt = Date.now() + (Number(d.expires_in || 3600) * 1000) - 60000;
      save(AUTH_KEY, a);
      return a.idToken;
    } catch (e) { return null; }
  }

  function dataUrl(token) {
    var a = getAuth();
    return getConfig().dbUrl + '/harcama/' + a.uid + '.json?auth=' + token;
  }

  // Buluttan veriyi çek
  async function pull() {
    var token = await ensureToken();
    if (!token) return { ok: false, error: 'Oturum yok' };
    try {
      var res = await fetch(dataUrl(token));
      if (!res.ok) return { ok: false, error: 'HTTP ' + res.status };
      var data = await res.json();
      return { ok: true, data: data };
    } catch (e) { return { ok: false, error: 'Bağlantı yok' }; }
  }

  // Veriyi buluta yaz
  async function push(data) {
    var token = await ensureToken();
    if (!token) return { ok: false, error: 'Oturum yok' };
    try {
      var res = await fetch(dataUrl(token), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        var t = await res.text().catch(function () { return ''; });
        if (res.status === 401 || /permission|denied/i.test(t)) {
          return { ok: false, error: 'İzin reddedildi — Realtime Database kurallarını kontrol et.' };
        }
        return { ok: false, error: 'HTTP ' + res.status };
      }
      return { ok: true };
    } catch (e) { return { ok: false, error: 'Bağlantı yok' }; }
  }

  window.Cloud = {
    getConfig: getConfig, setConfig: setConfig, isConfigured: isConfigured, clearConfig: clearConfig,
    getUser: getUser, isSignedIn: isSignedIn,
    signIn: signIn, signOut: signOut,
    pull: pull, push: push
  };
})();
