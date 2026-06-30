import React from "react";

// Tek bir render hatası tüm uygulamayı boş ekrana düşürmesin diye sınır.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
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
          <button className="btn-primary" style={{ maxWidth: 280 }} onClick={() => window.location.reload()}>
            Yenile
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
