"use client";

import Script from "next/script";
import { useEffect } from "react";

const GOOGLE_ADS_ID = "AW-17896379358";
const PHONE_CONVERSION_SEND_TO = "AW-17896379358/vMcVCIz_sqocEN6n1NVC";
const WHATSAPP_CONVERSION_SEND_TO = "AW-17896379358/UNzKCK-036ocEN6n1NVC";

function reportConversion(sendTo, url) {
  let navigated = false;

  const go = () => {
    if (navigated || !url) return;
    navigated = true;
    window.location.href = url;
  };

  if (typeof window.gtag !== "function") {
    go();
    return;
  }

  window.gtag("event", "conversion", {
    send_to: sendTo,
    value: 1.0,
    currency: "TRY",
    event_callback: go
  });

  window.setTimeout(go, 800);
}

export function reportWhatsAppConversion(url) {
  reportConversion(WHATSAPP_CONVERSION_SEND_TO, url);
}

export default function GoogleAdsTracking() {
  useEffect(() => {
    function handleClick(event) {
      const phoneLink = event.target.closest?.("a[href^='tel:']");

      if (phoneLink) {
        event.preventDefault();
        reportConversion(PHONE_CONVERSION_SEND_TO, phoneLink.href);
        return;
      }

      const whatsappLink = event.target.closest?.("a[href*='wa.me'], a[href*='api.whatsapp.com']");

      if (!whatsappLink) return;

      event.preventDefault();
      reportWhatsAppConversion(whatsappLink.href);
    }

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
      <Script id="google-ads-tag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
    </>
  );
}
