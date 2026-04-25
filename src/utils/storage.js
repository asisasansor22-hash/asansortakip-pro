// localStorage yardimcilari

const DEFAULT_TENANT_ID = "asis-asansor";

function activeTenantId(){
  try{return localStorage.getItem("at_active_company")||DEFAULT_TENANT_ID;}catch(e){return DEFAULT_TENANT_ID;}
}

function scopedKey(key){
  if(key==="ls_companies") return key;
  if(/^ls_/.test(key)||key==="at_geo_cache"||/^kapama_/.test(key)){
    return key+"__"+activeTenantId();
  }
  return key;
}

export function lsGet(key){try{var d=localStorage.getItem(scopedKey(key));if(!d)d=localStorage.getItem(key);return d?JSON.parse(d):null;}catch(e){return null;}}
export function lsSet(key,val){try{localStorage.setItem(scopedKey(key),JSON.stringify(val));}catch(e){}}
