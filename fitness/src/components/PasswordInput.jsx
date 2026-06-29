import React, { useState } from "react";

// Şifre girişi + göster/gizle (göz) düğmesi.
// NOT: Bu yalnızca kutuya O AN yazılan şifreyi gösterir; kayıtlı bir şifreyi açmaz
// (kayıtlı şifreler geri döndürülemez şekilde hash'lidir, okunamaz).
export default function PasswordInput({ value, onChange, placeholder, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        className="input"
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        style={{ paddingRight: 46 }}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Şifreyi gizle" : "Şifreyi göster"}
        style={{
          position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)",
          background: "none", color: "var(--muted)", fontSize: 18, padding: "6px 10px", lineHeight: 1,
        }}
      >
        {show ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
