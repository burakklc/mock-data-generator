export interface HowToSection {
  title: string;
  steps: string[];
}

export const howToSections: HowToSection[] = [
  {
    title: 'Genel Akış',
    steps: [
      'Üst menüden veri kaynağı modunu (JSON Schema, CREATE TABLE veya Manuel Tanım) seçin.',
      'Sağ panelde üretmek istediğiniz kayıt sayısını ve edge case oranını belirleyin.',
      'Tanım sekmesinde şemanızı düzenleyin veya Örnekler sekmesinden hızlıca bir şablon kopyalayın.',
      '“Veri Üret” butonuna basarak önizleme tablosu ve JSON çıktısını inceleyin.',
    ],
  },
  {
    title: 'JSON Schema Modu',
    steps: [
      'Şema alanına JSON Schema tanımınızı yapıştırın.',
      'Format, pattern ve enum tanımları pattern-aware üretim sayesinde dikkate alınır.',
      'Örnek tabından hazır şemaları kopyalayabilir, AI Destekli Şema Çıkarma bölümüne örnek JSON yapıştırarak otomatik şema oluşturabilirsiniz.',
    ],
  },
  {
    title: 'CREATE TABLE Modu',
    steps: [
      'SQL komutlarını tek bir CREATE TABLE veya birden fazla tablo olarak tanımlayabilirsiniz.',
      'Parser, tablo adını ve kolon kısıtlarını JSON Schema\'ya dönüştürür.',
      'Örnekler sekmesinden farklı senaryoları kopyalayarak hızlıca başlayabilirsiniz.',
    ],
  },
  {
    title: 'Manuel Tanım Modu',
    steps: [
      'Yeni alan eklemek için “Alan Ekle” butonunu kullanın.',
      'Her alan için veri tipini, zorunluluk durumunu ve opsiyonel kısıtları belirleyin.',
      'Örnek sekmesindeki öneri şablonlarını inceleyerek hızlıca alan kombinasyonları oluşturabilirsiniz.',
    ],
  },
  {
    title: 'Dışa Aktarım',
    steps: [
      'Önizleme tablosu oluşturulduktan sonra JSON, CSV veya SQL INSERT formatında dosya indirebilirsiniz.',
      'SQL çıktısı, şemanızdaki property listesini kullanarak INSERT komutları üretir.',
      'JSON önizleme alanı, ilk 20 kaydın formatlı gösterimini sunar; Tam çıktı için dosya indirin.',
    ],
  },
  {
    title: 'Edge Case Ayarları',
    steps: [
      'Edge case oranı, üretilen veri setinde uç senaryoların yüzdesini belirler.',
      'Açıklama kutusundaki örnekler üzerinden hangi senaryoların üretileceğini görebilirsiniz.',
      'Oranı artırdıkça validasyon hata listesinde daha fazla satır belirebilir; gerçek veri üretiminden önce test amaçlı kullanın.',
    ],
  },
];
