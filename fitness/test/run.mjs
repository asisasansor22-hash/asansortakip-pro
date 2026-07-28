// Testleri çalıştır: npm test
//
// Projede test çerçevesi yok ve gerekmiyor — buradaki iki modül (data/merge.js
// ve utils/sync.js) saf mantık ve yanlış çalışırlarsa kullanıcının TÜM antrenman
// geçmişini bozabilirler. Bu yüzden bağımlılık eklemeden, Vite'ın zaten getirdiği
// esbuild ile paketleyip düz Node'da çalıştırıyoruz.
//
// firebase.js modülü test/firebase.stub.js ile değiştirilir: gerçek ağ yerine
// çevrimiçi/çevrimdışı durumu ve bulut düğümleri taklit edilir.

import * as esbuild from "esbuild";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

const here = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(here, "..", "node_modules", ".cache", "gymo-test");
fs.mkdirSync(outDir, { recursive: true });

const stub = path.join(here, "firebase.stub.js");
const files = fs.readdirSync(here).filter((f) => f.endsWith(".test.mjs")).sort();

let failed = 0;
for (const f of files) {
  const out = path.join(outDir, f.replace(".test.mjs", ".built.mjs"));
  await esbuild.build({
    entryPoints: [path.join(here, f)],
    bundle: true, format: "esm", platform: "node",
    resolveExtensions: [".js"], outfile: out, logLevel: "error",
    plugins: [{
      name: "stub-firebase",
      setup(b) { b.onResolve({ filter: /(^|\/)firebase(\.js)?$/ }, () => ({ path: stub })); },
    }],
  });
  console.log("\n— " + f + " —");
  try {
    await import(pathToFileURL(out).href);
  } catch (e) {
    // Test dosyaları başarısızlıkta process.exit(1) çağırır; buraya düşmesi
    // beklenmedik bir çökme demektir.
    console.error(e);
    failed++;
  }
}
process.exit(failed ? 1 : 0);
