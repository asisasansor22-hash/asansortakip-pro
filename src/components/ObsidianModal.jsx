import React, { useState, useRef } from 'react';
import { sendToObsidian } from '../utils/obsidian.js';

var KAYIT_KEY = 'at_obsidian_ayarlar';

function kayitYukle() {
  try { return JSON.parse(localStorage.getItem(KAYIT_KEY) || '{}'); } catch(e) { return {}; }
}

export default function ObsidianModal({ onKapat, veri }) {
  var kayit = kayitYukle();
  var [apiKey, setApiKey] = useState(kayit.apiKey || '');
  var [port, setPort] = useState(kayit.port || '27124');
  var [klasor, setKlasor] = useState(kayit.klasor || 'Asansor Takip');
  var [durum, setDurum] = useState('bekle'); // bekle | gonderiyor | bitti | hata
  var [ilerleme, setIlerleme] = useState({ yapilan: 0, toplam: 0, basarili: 0, hatali: 0 });
  var [hataMsg, setHataMsg] = useState('');
  var iptalRef = useRef(false);

  async function gonder() {
    if (!apiKey.trim()) { setHataMsg('API anahtarı boş olamaz.'); return; }
    setHataMsg('');
    setDurum('gonderiyor');
    iptalRef.current = false;
    localStorage.setItem(KAYIT_KEY, JSON.stringify({ apiKey, port, klasor }));

    try {
      var sonuc = await sendToObsidian({
        apiKey: apiKey.trim(),
        port: Number(port) || 27124,
        klasorAdi: klasor.trim() || 'Asansor Takip',
        ...veri,
        onProgress: function(yapilan, toplam, basarili, hatali) {
          setIlerleme({ yapilan, toplam, basarili, hatali });
        },
      });
      setIlerleme({ yapilan: sonuc.toplam, toplam: sonuc.toplam, basarili: sonuc.basarili, hatali: sonuc.hatali });
      setDurum('bitti');
    } catch (e) {
      setHataMsg('Bağlantı hatası: ' + (e.message || String(e)));
      setDurum('hata');
    }
  }

  var yuzdePct = ilerleme.toplam > 0 ? Math.round((ilerleme.yapilan / ilerleme.toplam) * 100) : 0;

  return React.createElement('div', {
    style: {
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 16,
    },
    onClick: function(e) { if (e.target === e.currentTarget) onKapat(); },
  },
    React.createElement('div', {
      style: {
        background: '#1a1f2e', borderRadius: 18, padding: 28, width: '100%', maxWidth: 480,
        border: '1px solid #2a3050', boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      },
    },
      // Başlık
      React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } },
        React.createElement('div', null,
          React.createElement('div', { style: { fontSize: 18, fontWeight: 900, color: '#a78bfa' } }, '🟣 Obsidian\'a Gönder'),
          React.createElement('div', { style: { fontSize: 12, color: '#64748b', marginTop: 3 } }, 'Local REST API eklentisi gereklidir'),
        ),
        React.createElement('button', {
          onClick: onKapat,
          style: { background: 'none', border: 'none', color: '#64748b', fontSize: 20, cursor: 'pointer', lineHeight: 1 },
        }, '✕'),
      ),

      // Kurulum kılavuzu
      durum === 'bekle' && React.createElement('div', {
        style: { background: '#0f1520', borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 12, color: '#94a3b8', lineHeight: 1.7 },
      },
        React.createElement('div', { style: { fontWeight: 700, color: '#a78bfa', marginBottom: 6 } }, '📋 Kurulum adımları:'),
        React.createElement('ol', { style: { margin: 0, paddingLeft: 18 } },
          React.createElement('li', null, 'Obsidian\'ı açın → Ayarlar → Community Plugins'),
          React.createElement('li', null, '"Local REST API" eklentisini kurun ve etkinleştirin'),
          React.createElement('li', null, 'Eklenti ayarlarından ', React.createElement('b', { style: { color: '#f59e0b' } }, 'HTTP Sunucu'), ' seçeneğini açın'),
          React.createElement('li', null, 'Aşağıdaki API anahtarını eklenti ayarlarından kopyalayın'),
        ),
      ),

      // Form
      durum === 'bekle' && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 } },
        React.createElement('div', null,
          React.createElement('label', { style: { fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 } }, 'API Anahtarı'),
          React.createElement('input', {
            value: apiKey,
            onChange: function(e) { setApiKey(e.target.value); setHataMsg(''); },
            placeholder: 'Eklenti ayarlarından kopyalayın...',
            type: 'password',
            style: {
              width: '100%', boxSizing: 'border-box',
              background: '#0f1520', border: '1px solid #2a3050', borderRadius: 8,
              color: '#e2e8f0', padding: '9px 12px', fontSize: 13,
            },
          }),
        ),
        React.createElement('div', { style: { display: 'flex', gap: 10 } },
          React.createElement('div', { style: { flex: 1 } },
            React.createElement('label', { style: { fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 } }, 'Port (HTTP)'),
            React.createElement('input', {
              value: port,
              onChange: function(e) { setPort(e.target.value); },
              placeholder: '27124',
              style: {
                width: '100%', boxSizing: 'border-box',
                background: '#0f1520', border: '1px solid #2a3050', borderRadius: 8,
                color: '#e2e8f0', padding: '9px 12px', fontSize: 13,
              },
            }),
          ),
          React.createElement('div', { style: { flex: 2 } },
            React.createElement('label', { style: { fontSize: 12, color: '#94a3b8', display: 'block', marginBottom: 4 } }, 'Vault\'taki klasör adı'),
            React.createElement('input', {
              value: klasor,
              onChange: function(e) { setKlasor(e.target.value); },
              placeholder: 'Asansor Takip',
              style: {
                width: '100%', boxSizing: 'border-box',
                background: '#0f1520', border: '1px solid #2a3050', borderRadius: 8,
                color: '#e2e8f0', padding: '9px 12px', fontSize: 13,
              },
            }),
          ),
        ),
        hataMsg && React.createElement('div', { style: { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#f87171' } }, '⚠️ ' + hataMsg),
      ),

      // Gönderiliyor: ilerleme
      durum === 'gonderiyor' && React.createElement('div', { style: { marginBottom: 20 } },
        React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 } },
          React.createElement('span', { style: { color: '#a78bfa' } }, 'Gönderiliyor...'),
          React.createElement('span', { style: { color: '#94a3b8' } }, ilerleme.yapilan + ' / ' + ilerleme.toplam + ' dosya'),
        ),
        React.createElement('div', { style: { background: '#0f1520', borderRadius: 20, height: 10, overflow: 'hidden' } },
          React.createElement('div', {
            style: {
              height: '100%', borderRadius: 20,
              background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
              width: yuzdePct + '%', transition: 'width 0.3s',
            },
          }),
        ),
        React.createElement('div', { style: { fontSize: 11, color: '#64748b', marginTop: 6, textAlign: 'right' } },
          '✅ ' + ilerleme.basarili + '  ❌ ' + ilerleme.hatali,
        ),
      ),

      // Bitti
      durum === 'bitti' && React.createElement('div', {
        style: { background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.4)', borderRadius: 10, padding: 18, marginBottom: 20, textAlign: 'center' },
      },
        React.createElement('div', { style: { fontSize: 32, marginBottom: 8 } }, '✅'),
        React.createElement('div', { style: { fontWeight: 700, color: '#a78bfa', marginBottom: 4 } }, 'Obsidian\'a aktarım tamamlandı'),
        React.createElement('div', { style: { fontSize: 13, color: '#94a3b8' } },
          ilerleme.basarili + ' dosya başarıyla gönderildi',
          ilerleme.hatali > 0 && (', ' + ilerleme.hatali + ' dosyada hata oluştu'),
        ),
      ),

      // Hata
      durum === 'hata' && React.createElement('div', {
        style: { background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 10, padding: 14, marginBottom: 20, fontSize: 13, color: '#f87171' },
      },
        React.createElement('div', { style: { fontWeight: 700, marginBottom: 4 } }, '⚠️ Bağlantı kurulamadı'),
        React.createElement('div', { style: { color: '#94a3b8' } }, hataMsg),
        React.createElement('div', { style: { marginTop: 8, color: '#64748b', fontSize: 12 } },
          '• Obsidian\'ın açık olduğundan emin olun', React.createElement('br', null),
          '• Local REST API eklentisi aktif mi?', React.createElement('br', null),
          '• Eklenti ayarlarında HTTP sunucusu açık mı?', React.createElement('br', null),
          '• Port numarası doğru mu? (varsayılan: 27124)',
        ),
      ),

      // Butonlar
      React.createElement('div', { style: { display: 'flex', gap: 10, justifyContent: 'flex-end' } },
        React.createElement('button', {
          onClick: onKapat,
          style: { padding: '9px 18px', borderRadius: 10, background: '#1a2535', border: '1px solid #2a3050', color: '#94a3b8', fontWeight: 600, cursor: 'pointer', fontSize: 13 },
        }, durum === 'bitti' ? 'Kapat' : 'İptal'),

        (durum === 'bekle' || durum === 'hata') && React.createElement('button', {
          onClick: function() { setDurum('bekle'); gonder(); },
          style: {
            padding: '9px 22px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', color: '#fff', border: 'none',
          },
        }, '🟣 Gönder'),
      ),
    ),
  );
}
