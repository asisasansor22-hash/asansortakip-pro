import React from 'react'

// Paylaşılan sabitler ve UI bileşenleri

export const MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

export const ISTANBUL_ILCELER = [
  "Adalar","Arnavutköy","Ataşehir","Avcılar","Bağcılar","Bahçelievler","Bakırköy",
  "Başakşehir","Bayrampaşa","Beşiktaş","Beykoz","Beylikdüzü","Beyoğlu","Büyükçekmece",
  "Çatalca","Çekmeköy","Esenler","Esenyurt","Eyüpsultan","Fatih","Gaziosmanpaşa",
  "Güngören","Kadıköy","Kâğıthane","Kartal","Küçükçekmece","Maltepe","Pendik",
  "Sancaktepe","Sarıyer","Silivri","Sultanbeyli","Sultangazi",
  "Şile","Şişli","Tuzla","Ümraniye","Üsküdar","Zeytinburnu"
];


export const ILCE_RENK = {
  "Bahçelievler":"#3b82f6","Esenyurt":"#ef4444","Başakşehir":"#8b5cf6",
  "Küçükçekmece":"#10b981","Beylikdüzü":"#f59e0b","Bakırköy":"#06b6d4",
  "Avcılar":"#ec4899","Fatih":"#84cc16","Zeytinburnu":"#f97316",
  "Bağcılar":"#a855f7","Arnavutköy":"#14b8a6","Eyüpsultan":"#fb923c",
  "Sultangazi":"#6366f1","Gaziosmanpaşa":"#22c55e","Sancaktepe":"#e11d48",
  "Beyoğlu":"#0ea5e9","Beşiktaş":"#d946ef","Kadıköy":"#64748b","Ümraniye":"#78716c",
};
export const getIlceRenk = (ilce) => ILCE_RENK[ilce] || "#64748b";

export const ILCE_MAHALLELER = {
  "Adalar":["Burgazadası", "Heybeliada", "Kınalıada", "Maden", "Nizam"],
  "Arnavutköy":["Anadolu", "Arnavutköy Merkez", "Arnavutköy Yavuzselim", "Arnavutköy İmrahor", "Arnavutköy İslambey", "Atatürk", "Bahşayış", "Bolluca", "Boğazköy Atatürk", "Boğazköy Merkez", "Boğazköy İstiklal", "Deliklikaya", "Dursunköy", "Durusu Cami", "Durusu Zafer", "Haraççı", "Hastane", "Hicret", "Karlıbayır", "Mavigöl", "Nakkaş", "Nenehatun", "Sazlıbosna", "Taşoluk Adnan Menderes", "Taşoluk Fatih", "Taşoluk M. Fevzi Çakmak", "Taşoluk Mehmet Akif Ersoy", "Taşoluk Çilingir", "Yeşilbayır", "Ömerli", "İstasyon"],
  "Ataşehir":["Atatürk", "Aşıkveysel", "Barbaros", "Esatpaşa", "Ferhatpaşa", "Fetih", "Kayışdağı", "Küçükbakkalköy", "Mevlana", "Mimarsinan", "Mustafa Kemal", "Yeniçamlıca", "Yenisahra", "Yenişehir", "Örnek", "İnönü", "İçerenköy"],
  "Avcılar":["Ambarlı", "Cihangir", "Denizköşkler", "Firuzköy", "Gümüşpala", "Merkez", "Mustafa Kemal Paşa", "Tahtakale", "Yeşilkent", "Üniversite"],
  "Bahçelievler":["Bahçelievler", "Cumhuriyet", "Fevzi Çakmak", "Hürriyet", "Kocasinan Merkez", "Siyavuşpaşa", "Soğanlı", "Yenibosna Merkez", "Zafer", "Çobançeşme", "Şirinevler"],
  "Bakırköy":["Ataköy 1. kısım", "Ataköy 2-5-6. kısım", "Ataköy 3-4-11. kısım", "Ataköy 7-8-9-10. kısım", "Basınköy", "Cevizlik", "Kartaltepe", "Osmaniye", "Sakızağacı", "Yenimahalle", "Yeşilköy", "Yeşilyurt", "Zeytinlik", "Zuhuratbaba", "Şenlikköy"],
  "Bayrampaşa":["Altıntepsi", "Cevatpaşa", "Kartaltepe", "Kocatepe", "Muratpaşa", "Orta", "Terazidere", "Vatan", "Yenidoğan", "Yıldırım", "İsmetpaşa"],
  "Bağcılar":["Barbaros", "Bağlar", "Demirkapı", "Evren", "Fatih", "Fevzi Çakmak", "Göztepe", "Güneşli", "Hürriyet", "Kâzım Karabekir", "Kemalpaşa", "Kirazlı", "Mahmutbey", "Merkez", "Sancaktepe", "Yavuzselim", "Yenigün", "Yenimahalle", "Yüzyıl", "Yıldıztepe", "Çınar", "İnönü"],
  "Başakşehir":["Altınşehir", "Bahçeşehir 1. Kısım", "Bahçeşehir 2. Kısım", "Başak", "Başakşehir", "Güvercintepe", "Kayabaşı", "Ziya Gökalp", "İkitelli OSB", "Şahintepe", "Şamlar"],
  "Beykoz":["Acarlar", "Anadoluhisarı", "Anadolukavağı", "Baklacı", "Fatih", "Göksu", "Göztepe", "Gümüşsuyu", "Kanlıca", "Kavacık", "Merkez", "Ortaçeşme", "Paşabahçe", "Rüzgarlıbahçe", "Soğuksu", "Tokatköy", "Yalıköy", "Yavuz Selim", "Yenimahalle", "Çamlıbahçe", "Çengeldere", "Çiftlik", "Çiğdem", "Çubuklu", "İncirköy"],
  "Beylikdüzü":["Adnan Kahveci", "Barış", "Büyükşehir", "Cumhuriyet", "Dereağzı", "Gürpınar", "Güzelce", "Kavaklı", "Marmara", "Yakuplu"],
  "Beyoğlu":["Arapcami", "Asmalımescit", "Bedrettin", "Bereketzade", "Bostan", "Bülbül", "Camiikebir", "Cihangir", "Emekyemez", "Evliya Çelebi", "Fetihtepe", "Firuzağa", "Gümüşsuyu", "Hacıahmet", "Hacımimi", "Halıcıoğlu", "Hüseyinağa", "Kadı Mehmet Efendi", "Kalyoncukulluğu", "Kamerhatun", "Kaptanpaşa", "Katip Mustafa Çelebi", "Kemankeş Kara Mustafa Paşa", "Keçecipiri", "Kocatepe", "Kulaksız", "Kuloğlu", "Küçükpiyale", "Kılıçalipaşa", "Müeyyetzade", "Piripaşa", "Piyalepaşa", "Pürtelaş", "Sururi", "Sütlüce", "Tomtom", "Yahya Kahya", "Yenişehir", "Çatmamescit", "Çukur", "Ömeravni", "Örnektepe", "İstiklal", "Şahkulu", "Şehit Muhtar"],
  "Beşiktaş":["Abbasağa", "Akatlar", "Arnavutköy", "Balmumcu", "Bebek", "Cihangir", "Etiler", "Gayrettepe", "Konaklar", "Kuruçeşme", "Levent", "Mecidiye", "Muradiye", "Nisbetiye", "Ortaköy", "Sinanpaşa", "Türkali", "Ulus", "Vişnezade", "Yıldız"],
  "Büyükçekmece":["19 Mayıs", "Ahmediye", "Alkent", "Atatürk", "Bahçelievler", "Batıköy", "Celaliye", "Cumhuriyet", "Dizdariye", "Fatih", "Güzelce", "Hürriyet", "Kamiloba", "Karaağaç", "Kumburgaz Merkez", "Mimarsinan", "Muratbey", "Muratçeşme", "Pınartepe", "Türkoba", "Ulus", "Yenimahalle", "Çakmaklı"],
  "Esenler":["Birlik", "Davutpaşa", "Fatih", "Fevzi Çakmak", "Havaalanı", "Kazım Karabekir", "Kemer", "Menderes", "Mimar Sinan", "Namık Kemal", "Nenehatun", "Oruçreis", "Tuna", "Turgut Reis", "Yavuz Selim", "Çiftehavuzlar"],
  "Esenyurt":["Akçaburgaz", "Akevler", "Akşemseddin", "Ardıçlı", "Aşık Veysel", "Atatürk", "Bağlarçeşme", "Balıkyolu", "Barbaros Hayrettin Paşa", "Battalgazi", "Cumhuriyet", "Çınar", "Esenkent", "Fatih", "Gökevler", "Güzelyurt", "Hürriyet", "İncirtepe", "İnönü", "İstiklal", "Koza", "Mehmet Akif Ersoy", "Mehterçeşme", "Mevlana", "Namık Kemal", "Necip Fazıl Kısakürek", "Orhan Gazi", "Osmangazi", "Örnek", "Pınar", "Piri Reis", "Saadetdere", "Selahaddin Eyyubi", "Sultaniye", "Süleymaniye", "Şehitler", "Talatpaşa", "Turgut Özal", "Üçevler", "Yenikent", "Yeşilkent", "Yunus Emre", "Zafer"],
  "Eyüpsultan":["Ağaçlı", "Akpınar", "Akşemsettin", "Alibeyköy", "Defterdar", "Düğmeciler", "Emniyettepe", "Esentepe", "Göktürk Merkez", "Güzeltepe", "Işıklar", "Karadolap", "Merkez", "Mimar Sinan", "Mithatpaşa", "Nişancı", "Odayeri", "Pirinççi", "Rami Cuma", "Rami Yeni", "Sakarya", "Silahtarağa", "Topçular", "Yeşilpınar", "Çiftalan", "Çırçır", "İhsaniye", "İslambey"],
  "Fatih":["Aksaray", "Akşemsettin", "Alemdar", "Ali Kuşçu", "Atikali", "Ayvansaray", "Balabanağa", "Balat", "Beyazıt", "Binbirdirek", "Cankurtaran", "Cerrahpaşa", "Cibali", "Demirtaş", "Derviş Ali", "Eminsinan", "Hacıkadın", "Hasekisultan", "Hobyar", "Hoca Giyasettin", "Hocapaşa", "Hırkaişerif", "Kalenderhane", "Karagümrük", "Katip Kasım", "Kemalpaşa", "Kocamustafapaşa", "Küçükayasofya", "Mercan", "Mesihpaşa", "Mevlanakapı", "Mimar Hayrettin", "Mimar Kemalettin", "Mollafenari", "Mollagürani", "Mollahüsrev", "Muhsinehatun", "Nişanca", "Rüstempaşa", "Saraçishak", "Sarıdemir", "Seyyid Ömer", "Silivrikapı", "Sultanahmet", "Sururi", "Süleymaniye", "Sümbülefendi", "Tahtakale", "Tayahatun", "Topkapı", "Yavuz Sultan Selim", "Yavuzsinan", "Yedikule", "Zeyrek", "İskenderpaşa", "Şehremini", "Şehsuvarbey"],
  "Gaziosmanpaşa":["Barbaros Hayrettin Paşa", "Bağlarbaşı", "Fevziçakmak", "Hürriyet", "Karadeniz", "Karayolları", "Karlıtepe", "Kazım Karabekir", "Küçükköy", "Merkez", "Mevlana", "Pazariçi", "Sarıgöl", "Sultançiftliği", "Yenidoğan", "Yenimahalle", "Yıldıztabya", "Şemsipaşa"],
  "Güngören":["Abdurrahman Nafiz Gürman", "Akıncılar", "Gençosman", "Güneştepe", "Güven", "Haznedar", "Mareşal Çakmak", "Mehmet Nesih Özmen", "Merkez", "Sanayi", "Tozkoparan"],
  "Kadıköy":["19 Mayıs", "Acıbadem", "Bostancı", "Caddebostan", "Caferağa", "Dumlupınar", "Erenköy", "Eğitim", "Fenerbahçe", "Feneryolu", "Fikirtepe", "Göztepe", "Hasanpaşa", "Kozyatağı", "Koşuyolu", "Merdivenköy", "Osmanağa", "Rasimpaşa", "Sahrayıcedid", "Suadiye", "Zühtüpaşa"],
  "Kartal":["Atalar", "Cevizli", "Cumhuriyet", "Esentepe", "Gümüşpınar", "Hürriyet", "Karlıktepe", "Kordonboyu", "Orhantepe", "Ortamahalle", "Petrol-İş", "Soğanlık", "Topselvi", "Uğur Mumcu", "Yakacık Yeni", "Yakacık Çarşı", "Yalı", "Yukarımahalle", "Yunus", "Çavuşoğlu"],
  "Kâğıthane":["Çağlayan", "Çeliktepe", "Emniyet", "Gültepe", "Gürsel", "Hamidiye", "Harmantepe", "Hürriyet", "Merkez", "Nurtepe", "Ortabayır", "Seyrantepe", "Şirintepe", "Talatpaşa", "Telsizler", "Yahyakemal"],
  "Küçükçekmece":["Atakent", "Atatürk", "Beşyol", "Cennet", "Cumhuriyet", "Fatih", "Fevzi Çakmak", "Gültepe", "Halkalı", "Kanarya", "Kartaltepe", "Kemalpaşa", "Mehmet Akif", "Sultan Murat", "Söğütlüçeşme", "Tevfikbey", "Yarımburgaz", "Yenimahalle", "Yeşilova", "İnönü", "İstasyon"],
  "Maltepe":["Altayçeşme", "Altıntepe", "Aydınevler", "Bağlarbaşı", "Başıbüyük", "Büyükbakkalköy", "Cevizli", "Esenkent", "Feyzullah", "Fındıklı", "Girne", "Gülensu", "Gülsuyu", "Küçükyalı", "Yalı", "Zümrütevler", "Çınar", "İdealtepe"],
  "Pendik":["Ahmet Yesevi", "Bahçelievler", "Batı", "Doğu", "Dumlupınar", "Ertuğrulgazi", "Esenler", "Esenyalı", "Fatih", "Fevzi Çakmak", "Güllübağlar", "Güzelyalı", "Harmandere", "Kavakpınar", "Kaynarca", "Kurtköy", "Orhangazi", "Orta", "Ramazanoğlu", "Sanayi", "Sapanbağları", "Sülüntepe", "Velibaba", "Yayalar", "Yenimahalle", "Yenişehir", "Yeşilbağlar", "Çamlık", "Çamçeşme", "Çınardere", "Şeyhli"],
  "Sancaktepe":["Abdurrahmangazi", "Akpınar", "Atatürk", "Emek", "Eyüpsultan", "Fatih", "Hilal", "Kemal Türkler", "Meclis", "Merve", "Mevlana", "Osmangazi", "Safa", "Sarıgazi", "Veysel Karani", "Yenidoğan", "Yunus Emre", "İnönü"],
  "Sarıyer":["Ayazağa", "Bahçeköy Kemer", "Bahçeköy Merkez", "Bahçeköy Yenimahalle", "Baltalimanı", "Büyükdere", "Cumhuriyet", "Darüşşafaka", "Derbent", "Emirgân", "Fatih Sultan Mehmet", "Ferahevler", "Huzur", "Kazım Karabekir", "Kireçburnu", "Kumköy", "Kısırkaya", "Maslak", "Pınar", "Reşitpaşa", "Rumelihisarı", "Rumelikavağı", "Sarıyer Merkez", "Tarabya", "Türkali", "Yenimahalle", "Zekeriyaköy", "Çayırbaşı", "İstinye"],
  "Silivri":["Akören", "Alipaşa", "Beyciler", "Büyüksinekli", "Değirmenköy", "Fener", "Gazitepe", "Gümüşyaka", "Güneşli", "Kavaklı", "Küçüksinekli", "Kılıçlı", "Kınıklı", "Marmara Ereğlisi", "Piri Mehmet", "Selimpaşa", "Semizkumlar", "Silivri Merkez", "Yolçatı", "Çantık"],
  "Sultanbeyli":["Abdurrahmangazi", "Battalgazi", "Fatih", "Hamidiye", "Meclis", "Mehmet Akif", "Mithatpaşa", "Turgut Reis", "Yavuz Selim", "Yeni", "İnönü"],
  "Sultangazi":["50. Yıl", "75. Yıl", "Cebeci", "Cumhuriyet", "Esentepe", "Gazi", "Habipler", "İsmetpaşa", "Malkoçoğlu", "Sultançiftliği", "Uğur Mumcu", "Yayla", "Yunus Emre", "Zübeyde Hanım"],
  "Tuzla":["Akfırat", "Anadolu", "Aydınlı", "Aydıntepe", "Cami", "Deriorganizesanayi", "Evliya Çelebi", "Fatih", "Mescit", "Mimar Sinan", "Orhanlı", "Orta", "Postane", "Tepeören", "Yayla", "İstasyon", "İçmeler", "Şifa"],
  "Zeytinburnu":["Beştelsiz", "Çırpıcı", "Gökalp", "Kazlıçeşme", "Maltepe", "Merkezefendi", "Nuripaşa", "Seyitnizam", "Sümer", "Telsiz", "Veliefendi", "Yenidoğan", "Yeşiltepe"],
  "Çatalca":["Altınyıldız", "Aydınlar", "Bahçeköy", "Balaban", "Belgrat", "Büyükyoncalı", "Büyükçavuşlu", "Dağyolu", "Durgalı", "Ferhatpaşa", "Gökçeali", "Gümüşpınar", "Güngörmez", "Halıdere", "Kabakça", "Kalfaköy", "Karacaköy", "Kestanelik", "Küçükçavuşlu", "Kızılcaali", "Mimarsinan", "Muratbey", "Ovayenice", "Pınarca", "Subaşı", "Yaylacık", "Çatalca Merkez", "Çilingöz", "Örcünlü", "İnceğiz"],
  "Çekmeköy":["Alemdağ", "Aydınlar", "Cumhuriyet", "Ekşioğlu", "Güngören", "Hamidiye", "Kirazlıdere", "Mehmet Akif", "Merkez", "Mimar Sinan", "Nişantepe", "Soğukpınar", "Sultançiftliği", "Taşdelen", "Çamlık", "Çatalmeşe", "Ömerli"],
  "Ümraniye":["Altınşehir", "Atakent", "Aşağı Dudullu", "Bulgurlu", "Esenevler", "Eski Dudullu", "Mehmet Akif", "Mimar Sinan", "Namık Kemal", "Site", "Tepeüstü", "Yukarı Dudullu", "Çakmak", "Ünalan", "Şahintepe"],
  "Üsküdar":["Acıbadem", "Ahmediye", "Altunizade", "Ayazma", "Aziz Mahmut Hüdayi", "Barbaros", "Bağlarbaşı", "Beylerbeyi", "Bulgurlu", "Burhaniye", "Büyük Çamlıca", "Doğancılar", "Emek", "Ferah", "Güzeltepe", "Kandilli", "Kirazlıtepe", "Kuzguncuk", "Küçük Çamlıca", "Küçüksu", "Kısıklı", "Mimar Sinan", "Salacak", "Selami Ali", "Sultantepe", "Toygar Hamza", "Uçaksavar", "Validebağ", "Çengelköy", "Ünalan", "İcadiye", "İhsaniye", "Şemsi Paşa"],
  "Şile":["Ahmediye", "Akçakese", "Ağva", "Balibey", "Doğancalı", "Elmalık", "Gökmaslı", "Gölcük", "Hacıllı", "Kadıköy", "Karacaköy", "Kurfallı", "Kurna", "Meşelik", "Ovacık", "Sakarya", "Uskumruköy", "Çavuşlu", "Çavuşoğlu", "Çayırçeşme", "Şilangöz", "Şile Merkez"],
  "Şişli":["Bozkurt", "Büyükdere", "Cumhuriyet", "Ergenekon", "Esentepe", "Feriköy", "Fulya", "Gülbahar", "Halaskargazi", "Harbiye", "Kaptanpaşa", "Kuştepe", "Mahmutbey", "Mecidiyeköy", "Merkez", "Nişantaşı", "Osmanbey", "Piyalepaşa", "Teşvikiye", "İnönü", "Şişli Merkez"]
};

export const MahallePicker=({ilce, value, onChange})=>{
  const mahalleler=(ILCE_MAHALLELER[ilce]||[]).slice().sort();
  if(!mahalleler.length) return null;
  return React.createElement("div",{style:{marginBottom:10}},
    React.createElement("label",{style:{display:"block",fontSize:11,fontWeight:600,color:"var(--text-muted)",marginBottom:4}},"Mahalle *"),
    React.createElement("select",{
      value:value||"",
      onChange:function(e){onChange(e.target.value);},
      style:{width:"100%",background:"var(--bg-elevated)",border:"1px solid var(--border)",borderRadius:8,padding:"9px 12px",color:value?"var(--text)":"var(--text-muted)",fontSize:13,outline:"none",cursor:"pointer",boxSizing:"border-box"}
    },
      React.createElement("option",{value:""},"— Mahalle seçin —"),
      mahalleler.map(function(m){return React.createElement("option",{key:m,value:m},m);})
    )
  );
};


export const KONTROL = [
  {id:"kp", kat:"Kapı Sistemi", m:["Kapı açılış/kapanış hızı","Kapı emniyet sensörü","Kapı rayları yağlama","Kapı kilitleri","Fotosel çalışması"]},
  {id:"kt", kat:"Kabin & Tahrik", m:["Kabin aydınlatması","Kabin temizliği","Halat/zincir gerginliği","Motor ve dişli kutusu","Hız regülatörü"]},
  {id:"ke", kat:"Emniyet", m:["Fren sistemi testi","Aşırı yük sensörü","Acil durdurma butonu","Güvenlik kilitleri","Tampon testi"]},
  {id:"kel",kat:"Elektrik", m:["Kumanda panosu","Buton ve göstergeler","Topraklama","Kablo bağlantıları","Acil aydınlatma pil"]},
  {id:"km", kat:"Makine Dairesi", m:["Makine dairesi temizliği","Yağ seviyesi kontrolü","Rulman ve yataklar","Havalandırma","Yangın söndürücü"]},
];

export const S={
  sel:{background:"var(--bg-elevated,#3a3a3c)",border:"none",borderRadius:12,padding:"12px 14px",color:"var(--text)",fontSize:16,outline:"none",cursor:"pointer",width:"100%",WebkitAppearance:"none",backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")",backgroundRepeat:"no-repeat",backgroundPosition:"right 14px center",paddingRight:36,boxSizing:"border-box"},
  inp:{width:"100%",background:"var(--bg-elevated,#3a3a3c)",border:"none",borderRadius:12,padding:"12px 14px",color:"var(--text)",fontSize:16,outline:"none",boxSizing:"border-box"},
};

export const Badge=({color,label})=>React.createElement('div', { className:"ios-badge", style: {background:color+"22",color},}, label);
export const IlceBadge=({ilce})=>{const c=getIlceRenk(ilce);return React.createElement('span', { style: {fontSize:11,padding:"3px 8px",borderRadius:20,background:c+"20",color:c,fontWeight:600,whiteSpace:"nowrap"},}, ilce);};

export const Stat=({icon,label,value,color})=>(
  React.createElement('div', { className:"ios-stat", style: {"--stat-color":color},}
    , React.createElement('div', { className:"ios-stat-icon"},icon)
    , React.createElement('div', { className:"ios-stat-value"},value)
    , React.createElement('div', { className:"ios-stat-label"},label)
  )
);
export const Card=({title,children,p0})=>(
  React.createElement('div', { style: {background:"var(--bg-panel)",borderRadius:16,overflow:"hidden",marginBottom:12,boxShadow:"var(--shadow-sm)"},}
    , title&&React.createElement('div', { style: {padding:"12px 16px",borderBottom:"0.5px solid var(--border-soft)",fontWeight:700,fontSize:14,color:"var(--text)"},}, title)
    , React.createElement('div', { style: p0?{}:{padding:"12px 16px"},}, children)
  )
);
export const Empty=({t})=>React.createElement('div', { style: {textAlign:"center",color:"var(--text-dim)",fontSize:14,padding:"28px 0"},}, "— " , t, " —" );

export const IBtn=({onClick,icon,danger,title:tt})=>(
  React.createElement('button', { title: tt, onClick: onClick, style: {background:danger?"rgba(255,59,48,0.15)":"var(--bg-elevated)",border:"none",borderRadius:10,width:36,height:36,cursor:"pointer",fontSize:14,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"opacity 0.15s"},}, icon)
);
export const Tog=({active,on,off,color,onClick})=>(
  React.createElement('button', { onClick: onClick, style: {fontSize:12,padding:"6px 12px",borderRadius:20,background:active?color+"20":"var(--bg-elevated)",color:active?color:"var(--text-muted)",border:"none",fontWeight:active?700:500,cursor:"pointer",whiteSpace:"nowrap",minHeight:36},}, active?on:off)
);

export const FF=({label,value,onChange,type})=>(
  React.createElement('div', { style: {marginBottom:14},}
    , React.createElement('label', { style: {display:"block",fontSize:13,fontWeight:600,color:"var(--text-muted)",marginBottom:6},}, label)
    , React.createElement('input', { type: type||"text", value: value, onChange: e=>onChange(e.target.value), style: S.inp,})
  )
);
export const AdresFF=({label,value,onChange})=>(
  React.createElement("div", { style: {marginBottom:14}},
    React.createElement("label", { style: {display:"block",fontSize:13,fontWeight:600,color:"var(--text-muted)",marginBottom:6}}, label)
    , React.createElement("input", {
        type:"text",
        value:value,
        onChange:function(e){onChange(e.target.value);},
        placeholder:"\u00d6rn: Zafer Mah. \u00c7imen Sok. No:20, Bah\u00e7elievler, \u0130stanbul",
        style:Object.assign({},S.inp,{border:"1px solid var(--accent-glow)"})
      })
    , React.createElement("div", { style: {marginTop:4,padding:"6px 10px",background:"color-mix(in srgb, var(--accent) 10%, var(--bg-panel))",border:"1px solid color-mix(in srgb, var(--accent) 22%, transparent)",borderRadius:6,fontSize:10,color:"var(--text-muted)",lineHeight:"1.5"}},
        "\ud83d\uddfa\ufe0f ",
        React.createElement("span",{style:{color:"#3b82f6",fontWeight:700}},"Google Maps Format\u0131: "),
        "Mahalle \u2192 Sokak + No \u2192 \u0130l\u00e7e \u2192 \u0130stanbul",
        React.createElement("br",null),
        React.createElement("span",{style:{color:"var(--text-dim)"}},"Tam adres girilirse Google Maps'te do\u011fru pin at\u0131l\u0131r.")
      )
  )
);
export const FS=({label,value,onChange,options})=>(
  React.createElement('div', { style: {marginBottom:14},}
    , React.createElement('label', { style: {display:"block",fontSize:13,fontWeight:600,color:"var(--text-muted)",marginBottom:6},}, label)
    , React.createElement('select', { value: value, onChange: e=>onChange(e.target.value), style: S.sel,}
      , options.map((o,i)=>typeof o==="string"?React.createElement('option', { key: i, value: o,}, o):React.createElement('option', { key: i, value: o.v,}, o.l))
    )
  )
);
export const Modal=({title,onClose,onSave,children,wide})=>(
  React.createElement('div', { className:"ios-modal-overlay", onClick:(e)=>{if(e.target===e.currentTarget)onClose();},}
    , React.createElement('div', { className:"ios-modal-sheet", style:{maxWidth:wide?720:520},}
      , React.createElement('div', { className:"ios-modal-handle"})
      , React.createElement('div', { className:"ios-modal-header",}
        , React.createElement('div', { className:"ios-modal-title"}, title)
        , React.createElement('button', { onClick: onClose, style: {background:"var(--bg-elevated)",border:"none",color:"var(--text-muted)",fontSize:15,cursor:"pointer",borderRadius:20,width:30,height:30,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600},}, "✕")
      )
      , React.createElement('div', { className:"ios-modal-body"}, children)
      , React.createElement('div', { style: {padding:"8px 18px 10px",display:"flex",gap:10,},}
        , React.createElement('button', { onClick: onClose, style: {flex:1,padding:"13px",background:"var(--bg-elevated)",border:"none",borderRadius:14,color:"var(--text-muted)",cursor:"pointer",fontWeight:600,fontSize:15,minHeight:50},}, "İptal")
        , React.createElement('button', { onClick: onSave, style: {flex:1,padding:"13px",background:"var(--accent)",border:"none",borderRadius:14,color:"#fff",cursor:"pointer",fontWeight:700,fontSize:15,minHeight:50},}, "Kaydet")
      )
    )
  )
);

