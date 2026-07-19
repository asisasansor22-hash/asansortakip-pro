import React, { useState } from "react";
import Timeline from "./Timeline";
import Leaderboard from "./Leaderboard";
import Messages from "./Messages";

const SUBTABS = [
  { id: "feed", label: "💬 Akış" },
  { id: "lb", label: "🏆 Fit Ligi" },
  { id: "dm", label: "✉️ Mesajlar" },
];

// Sosyal sekme: Akış + Fit Ligi (liderlik) + Mesajlar (DM & kullanıcı arama)
export default function Social({ onDmSeen }) {
  const [sub, setSub] = useState("feed");
  return (
    <div>
      <div className="subtabs">
        {SUBTABS.map((t) => (
          <button key={t.id} className={"subtab" + (sub === t.id ? " on" : "")} onClick={() => setSub(t.id)}>{t.label}</button>
        ))}
      </div>
      {sub === "feed" && <Timeline />}
      {sub === "lb" && <Leaderboard />}
      {sub === "dm" && <Messages onSeen={onDmSeen} />}
    </div>
  );
}
