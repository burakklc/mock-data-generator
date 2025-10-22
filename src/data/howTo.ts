import type { Language } from '../types';

export interface HowToSection {
  title: string;
  steps: string[];
}

const howToByLanguage: Record<Language, HowToSection[]> = {
  en: [
    {
      title: 'General Flow',
      steps: [
        'Select your data source mode (JSON Schema, CREATE TABLE or Manual Definition) from the top navigation.',
        'Use the controls on the right to set the record count and edge case ratio.',
        'Edit your schema in the Definition tab or copy a template from the Examples tab.',
        'Click “Generate Data” to review the preview table and formatted JSON output.',
      ],
    },
    {
      title: 'JSON Schema Mode',
      steps: [
        'Paste your JSON Schema definition into the editor.',
        'Format, pattern and enum constraints are respected thanks to pattern-aware generation.',
        'Copy ready-made schemas from the Examples tab or infer one automatically via the AI helper.',
      ],
    },
    {
      title: 'CREATE TABLE Mode',
      steps: [
        'Provide SQL as a single CREATE TABLE command or multiple table definitions.',
        'The parser converts table names and column constraints into JSON Schema.',
        'Browse the Examples tab for different scenarios you can copy instantly.',
      ],
    },
    {
      title: 'Manual Definition Mode',
      steps: [
        'Use the “Add Field” button to introduce new fields.',
        'Configure data type, required state and optional constraints for each field.',
        'Explore the suggested templates under Examples to assemble field combinations faster.',
      ],
    },
    {
      title: 'Exporting Data',
      steps: [
        'After generating the preview table, download JSON, CSV or SQL INSERT outputs.',
        'SQL exports rely on your schema properties to build complete INSERT statements.',
        'The JSON preview lists the first 20 records; download the file for the full dataset.',
      ],
    },
    {
      title: 'Edge Case Settings',
      steps: [
        'Edge case ratio controls the percentage of mock records dedicated to edge scenarios.',
        'Check the explanation panel to see which situations will be generated.',
        'Higher ratios may surface extra validation warnings—ideal for testing before real data runs.',
      ],
    },
  ],
  tr: [
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
  ],
};

export function getHowToSections(language: Language): HowToSection[] {
  return howToByLanguage[language];
}
