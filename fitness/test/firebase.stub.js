// firebase.js yerine geçen sahte modül: ağ durumunu ve bulut düğümlerini taklit eder
export const _state = { online: true, cloud: {}, reads: 0, writes: 0 };
export async function dbGetR(key) {
  _state.reads++;
  if (!_state.online) return { ok: false, data: null };
  return { ok: true, data: _state.cloud[key] === undefined ? null : _state.cloud[key] };
}
export async function dbSetR(key, value) {
  if (!_state.online) return false;
  _state.writes++;
  _state.cloud[key] = JSON.parse(JSON.stringify(value));
  return true;
}
export async function dbGet(key) { return (await dbGetR(key)).data; }
export async function dbSet(key, v) { await dbSetR(key, v); }
