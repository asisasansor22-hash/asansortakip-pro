// Mobil tarayıcılarda bir dokunuş, katman kapandıktan ~300ms sonra sahte bir
// "click" üretir; bu da altta kalan öğeye düşüp katmanı yeniden açabilir.
// Kapanış anında kısa bir süre boyunca bir sonraki click'i capture aşamasında
// yutarak bunu kesin olarak engelle.
export function swallowNextClick(ms = 400) {
  if (typeof document === "undefined") return;
  const handler = (e) => { e.stopPropagation(); e.preventDefault(); };
  document.addEventListener("click", handler, true);
  setTimeout(() => document.removeEventListener("click", handler, true), ms);
}
