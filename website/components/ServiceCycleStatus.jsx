"use client";

import { useEffect, useState } from "react";

function getIstanbulParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("tr-TR", {
    timeZone: "Europe/Istanbul",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    weekday: map.weekday,
    hour: Number(map.hour),
    minute: Number(map.minute)
  };
}

function getStatus() {
  const { weekday, hour, minute } = getIstanbulParts();
  const isSunday = weekday?.toLowerCase().startsWith("paz");
  const isSaturday = weekday?.toLowerCase().startsWith("cmt") || weekday?.toLowerCase().startsWith("cts");
  const afterSaturdayClose = isSaturday && (hour > 14 || (hour === 14 && minute >= 0));
  const afterWeekdayClose = !isSaturday && !isSunday && (hour > 18 || (hour === 18 && minute >= 0));
  const offline = isSunday || afterSaturdayClose || afterWeekdayClose;

  return {
    online: !offline,
    label: offline ? "OFFLINE" : "ONLINE",
    helper: offline ? "Mesai dışı" : "Servis döngüsü aktif"
  };
}

export default function ServiceCycleStatus() {
  const [status, setStatus] = useState(() => ({ online: true, label: "ONLINE", helper: "Servis döngüsü aktif" }));

  useEffect(() => {
    const update = () => setStatus(getStatus());
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <strong className={status.online ? "cycle-status is-online" : "cycle-status is-offline"} title={status.helper}>
      {status.label}
    </strong>
  );
}
