// localStorage yardımcıları (firma scope'lu)

var _storageCompanyId = null;

export function setStorageCompany(companyId) {
  _storageCompanyId = companyId;
}

function scopedKey(key) {
  if (_storageCompanyId) return _storageCompanyId + "_" + key;
  return key;
}

export function lsGet(key){try{var d=localStorage.getItem(scopedKey(key));return d?JSON.parse(d):null;}catch(e){return null;}}
export function lsSet(key,val){try{localStorage.setItem(scopedKey(key),JSON.stringify(val));}catch(e){}}

// Scope'suz okuma (login ekranı, tema vb.)
export function lsGetRaw(key){try{var d=localStorage.getItem(key);return d?JSON.parse(d):null;}catch(e){return null;}}
export function lsSetRaw(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}}
