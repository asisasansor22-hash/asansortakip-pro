// localStorage yardimcilari

// Gerçekten yazılan tenant anahtarı firebase.js içindeki "at_tenant_id".
// Eski "at_active_company" hiç yazılmıyordu; tüm firmalar fallback ile aynı
// scope'a düşüp birbirinin localStorage cache'ini görüyordu (cross-tenant leak).
const NO_TENANT_BUCKET = "_no_tenant";

function activeTenantId(){
  try{return localStorage.getItem("at_tenant_id")||NO_TENANT_BUCKET;}catch(e){return NO_TENANT_BUCKET;}
}

function scopedKey(key){
  // Global anahtarlar tenant-scope dışında bırakılır:
  //  ls_companies     — süper-admin'e özgü firma listesi
  //  ls_last_tenant   — son aktif tenant (cross-tenant leak detection için global olmalı)
  if(key==="ls_companies"||key==="ls_last_tenant") return key;
  if(/^ls_/.test(key)||key==="at_geo_cache"||/^kapama_/.test(key)){
    return key+"__"+activeTenantId();
  }
  return key;
}

export function lsGet(key){try{var d=localStorage.getItem(scopedKey(key));if(!d)d=localStorage.getItem(key);return d?JSON.parse(d):null;}catch(e){return null;}}
export function lsSet(key,val){try{localStorage.setItem(scopedKey(key),JSON.stringify(val));}catch(e){}}
