export const MONTHS = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export const ILCE_RENK = {
  'Bahçelievler': '#3b82f6',
  'Esenyurt': '#ef4444',
  'Başakşehir': '#8b5cf6',
  'Küçükçekmece': '#10b981',
  'Beylikdüzü': '#f59e0b',
  'Bakırköy': '#06b6d4',
  'Avcılar': '#ec4899',
  'Fatih': '#84cc16',
  'Zeytinburnu': '#f97316',
  'Bağcılar': '#a855f7',
  'Arnavutköy': '#14b8a6',
  'Eyüpsultan': '#fb923c',
  'Sultangazi': '#6366f1',
  'Gaziosmanpaşa': '#22c55e',
  'Sancaktepe': '#e11d48',
  'Beyoğlu': '#0ea5e9',
  'Beşiktaş': '#d946ef',
  'Kadıköy': '#64748b',
  'Ümraniye': '#78716c',
};

export const getIlceRenk = (ilce) => ILCE_RENK[ilce] || '#64748b';

export const KONTROL = [
  {
    id: 'kp',
    kat: 'Kapı Sistemi',
    m: [
      'Kapı açılış/kapanış hızı',
      'Kapı emniyet sensörü',
      'Kapı rayları yağlama',
      'Kapı kilitleri',
      'Fotosel çalışması',
    ],
  },
  {
    id: 'kt',
    kat: 'Kabin & Tahrik',
    m: [
      'Kabin aydınlatması',
      'Kabin temizliği',
      'Halat/zincir gerginliği',
      'Motor ve dişli kutusu',
      'Hız regülatörü',
    ],
  },
  {
    id: 'ke',
    kat: 'Emniyet',
    m: [
      'Fren sistemi testi',
      'Aşırı yük sensörü',
      'Acil durdurma butonu',
      'Güvenlik kilitleri',
      'Tampon testi',
    ],
  },
  {
    id: 'kel',
    kat: 'Elektrik',
    m: [
      'Kumanda panosu',
      'Buton ve göstergeler',
      'Topraklama',
      'Kablo bağlantıları',
      'Acil aydınlatma pil',
    ],
  },
  {
    id: 'km',
    kat: 'Makine Dairesi',
    m: [
      'Makine dairesi temizliği',
      'Yağ seviyesi kontrolü',
      'Rulman ve yataklar',
      'Havalandırma',
      'Yangın söndürücü',
    ],
  },
];

export const COLORS = {
  dark: {
    bg: '#0f1117',
    bgPanel: '#1c1e2a',
    bgElevated: '#2a2d3a',
    text: '#e0e6f0',
    textMuted: '#94a3b8',
    textDim: '#64748b',
    border: '#2a3050',
    borderSoft: '#1e2236',
    accent: '#007AFF',
    iosGreen: '#34c759',
    iosRed: '#ff3b30',
    iosOrange: '#ff9500',
    iosYellow: '#ffcc00',
  },
  light: {
    bg: '#f2f2f7',
    bgPanel: '#ffffff',
    bgElevated: '#e5e5ea',
    text: '#1c1c1e',
    textMuted: '#8e8e93',
    textDim: '#aeaeb2',
    border: '#c6c6c8',
    borderSoft: '#d1d1d6',
    accent: '#007AFF',
    iosGreen: '#34c759',
    iosRed: '#ff3b30',
    iosOrange: '#ff9500',
    iosYellow: '#ffcc00',
  },
};
