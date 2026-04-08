// localStorage yardımcıları

export function lsGet(key){try{var d=localStorage.getItem(key);return d?JSON.parse(d):null;}catch(e){return null;}}
export function lsSet(key,val){try{localStorage.setItem(key,JSON.stringify(val));}catch(e){}}
