import React from "react";

// Tek bir render hatası tüm uygulamayı boş ekrana düşürmesin diye sınır.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, msg: "" };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, msg: (error && (error.message || String(error))) || "" };
  }
  componentDidCatch(error, info) {
    // İleride uzak loglama eklenebilir
    try { console.error("UI hatası:", error, info); } catch (e) {}
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="login-wrap" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 44 }}>😕</div>
          <h2>Bir şeyler ters gitti</h2>
          <p style={{ color: "var(--muted)", maxWidth: 320 }}>
            Beklenmedik bir hata oluştu. Sayfayı yenilemek genelde çözer.
          </p>
          {this.state.msg && (
            <p style={{ color: "var(--muted)", fontSize: 11, maxWidth: 320, wordBreak: "break-word", opacity: 0.7 }}>
              Teknik detay: {this.state.msg}
            </p>
          )}
          <button className="btn-primary" style={{ maxWidth: 280 }} onClick={() => window.location.reload()}>
            Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
