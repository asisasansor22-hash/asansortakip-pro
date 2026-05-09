import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: {
    default: "Asis Asansör | İstanbul Avrupa Yakası Asansör Servisi",
    template: "%s | Asis Asansör"
  },
  description: "Asis Asansör; İstanbul Avrupa Yakası'nda asansör bakım, montaj, revizyon ve 7/24 arıza servisi sunar.",
  metadataBase: new URL("https://asisasansor.com")
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
