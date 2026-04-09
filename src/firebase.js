// Firebase Realtime Database - REST API üzerinden
// Orijinal uygulama Firebase SDK yerine fetch kullandığı için bu yapıyı koruyoruz

const FIREBASE_DB_URL = "https://asansortakipv3-default-rtdb.europe-west1.firebasedatabase.app";

export async function dbGet(key) {
  try {
    var controller = new AbortController();
    var timer = setTimeout(function(){ controller.abort(); }, 8000);
    var res = await fetch(FIREBASE_DB_URL + "/asansor/" + key + ".json", {
      signal: controller.signal
    });
    clearTimeout(timer);
    if(!res.ok) return null;
    var data = await res.json();
    return (data !== null && data !== undefined) ? data : null;
  } catch(e) { return null; }
}

export async function dbSet(key, value) {
  try {
    await fetch(FIREBASE_DB_URL + "/asansor/" + key + ".json", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(value)
    });
  } catch(e) {}
}
