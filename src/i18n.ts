import type { GeneratorMode, Language } from './types';

interface ExportButtonCopy {
  label: string;
  description: string;
  tooltip: string;
}

export interface ManualFieldCopy {
  newFieldFallback: string;
  remove: string;
  fieldName: string;
  dataType: string;
  required: string;
  minLength: string;
  maxLength: string;
  pattern: string;
  patternPlaceholder: string;
  enum: string;
  enumPlaceholder: string;
  minimum: string;
  maximum: string;
  addField: string;
  previewTitle: string;
}

interface Translations {
  brandTagline: string;
  menuToggle: {
    open: string;
    close: string;
  };
  nav: {
    viewLabel: string;
    viewTabs: {
      generator: string;
      howTo: string;
    };
    modeLabel: string;
    languageLabel: string;
  };
  hero: {
    title: string;
    description: string;
    ctaPrimary: string;
    ctaSecondary: string;
    highlights: string[];
    modeLabel: string;
  };
  modeNames: Record<GeneratorMode, string>;
  modeCards: Record<
    GeneratorMode,
    {
      description: string;
      highlight: string;
    }
  >;
  modeSelectedLabel: string;
  definitionPanel: {
    title: string;
    recordCountLabel: string;
    edgeCaseLabel: string;
    edgeCaseSliderAria: string;
    edgeCaseNumberAria: string;
    generateIdle: string;
    generateBusy: string;
    edgeSummary: string;
    edgeDescription: (ratio: number) => string;
    edgeBullets: string[];
  };
  definitionTabs: {
    definition: string;
    examples: string;
  };
  schemaHelper: {
    title: string;
    description: string;
    placeholder: string;
    action: string;
    success: string;
    emptyError: string;
    parseErrorPrefix: string;
  };
  manualEditor: ManualFieldCopy;
  examples: {
    copy: string;
    copied: string;
    empty: string;
  };
  schemaErrorsTitle: string;
  schemaParseErrorPrefix: string;
  previewPanel: {
    title: string;
    subtitle: string;
    empty: string;
    jsonSummary: string;
    recordChip: (count: number) => string;
    limitedChip: (shown: number, total: number) => string;
    allChip: (shown: number) => string;
  };
  exportButtons: {
    json: ExportButtonCopy;
    csv: ExportButtonCopy;
    sql: ExportButtonCopy;
  };
  validationTitle: string;
  howToTitle: string;
  themeToggle: {
    caption: string;
    lightActive: string;
    darkActive: string;
    toLightAria: string;
    toDarkAria: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    brandTagline: 'Generate mock data from JSON Schema, SQL or manual field definitions.',
    menuToggle: {
      open: 'Open navigation',
      close: 'Close navigation',
    },
    nav: {
      viewLabel: 'View',
      viewTabs: {
        generator: 'Data Generator',
        howTo: 'How it Works',
      },
      modeLabel: 'Mode',
      languageLabel: 'Language',
    },
    hero: {
      title: 'Prepare test data in minutes',
      description:
        'Mock Data Generator validates your schema while producing mock datasets. Experiment with edge cases, download outputs, and share them with your team.',
      ctaPrimary: 'Start generating data',
      ctaSecondary: 'How it works?',
      highlights: [
        'Export JSON, CSV and SQL formats',
        'Edge case coverage with validation feedback',
        'Runs entirely in the browser—your data stays local',
      ],
      modeLabel: 'Generation mode',
    },
    modeNames: {
      jsonSchema: 'JSON Schema',
      createTable: 'CREATE TABLE',
      manual: 'Manual Definition',
    },
    modeCards: {
      jsonSchema: {
        description: 'Infer schemas from samples and generate records that stay within validation rules.',
        highlight: 'Validated with AJV',
      },
      createTable: {
        description: 'Parse SQL table definitions, detect constraints and export ready-to-run INSERT scripts.',
        highlight: 'INSERT script ready',
      },
      manual: {
        description: 'Add fields from scratch, fine-tune constraints and share the generated JSON Schema.',
        highlight: 'Instant schema preview',
      },
    },
    modeSelectedLabel: 'Selected',
    definitionPanel: {
      title: 'Structure Definition',
      recordCountLabel: 'Record count',
      edgeCaseLabel: 'Edge case ratio',
      edgeCaseSliderAria: 'Edge case ratio',
      edgeCaseNumberAria: 'Edge case ratio percent',
      generateIdle: 'Generate Data',
      generateBusy: 'Generating…',
      edgeSummary: 'Edge case details',
      edgeDescription: (ratio: number) =>
        `Edge case records help you test boundary values and unexpected combinations. ${ratio}% of the dataset will consist of edge cases.`,
      edgeBullets: [
        'Values that exceed minimum or maximum limits',
        'Strings that violate pattern or enum constraints',
        'Scenarios where optional fields are omitted or returned as NULL',
      ],
    },
    definitionTabs: {
      definition: 'Definition',
      examples: 'Examples',
    },
    schemaHelper: {
      title: 'AI-Assisted Schema Extraction',
      description: 'Paste a sample JSON payload and let the schema be inferred automatically.',
      placeholder: '[{"id":1,"name":"Ada","email":"ada@example.com"}]',
      action: 'Generate schema from sample',
      success: 'Schema generated from sample JSON.',
      emptyError: 'Sample JSON cannot be empty.',
      parseErrorPrefix: 'Sample JSON could not be parsed: ',
    },
    manualEditor: {
      newFieldFallback: 'New Field',
      remove: 'Remove',
      fieldName: 'Field Name',
      dataType: 'Data Type',
      required: 'Required',
      minLength: 'Min length',
      maxLength: 'Max length',
      pattern: 'Pattern (RegExp)',
      patternPlaceholder: '^[A-Z]{3}$',
      enum: 'Enum (comma separated)',
      enumPlaceholder: 'A, B, C',
      minimum: 'Minimum',
      maximum: 'Maximum',
      addField: 'Add Field',
      previewTitle: 'Generated JSON Schema',
    },
    examples: {
      copy: 'Copy',
      copied: 'Copied!',
      empty: 'No examples added for this mode yet.',
    },
    schemaErrorsTitle: 'Definition Errors',
    schemaParseErrorPrefix: 'JSON Schema could not be parsed: ',
    previewPanel: {
      title: 'Preview & Export',
      subtitle: 'Pick a format and share instantly.',
      empty: 'No data generated yet.',
      jsonSummary: 'JSON Preview',
      recordChip: (count: number) => `${count} records`,
      limitedChip: (shown: number, total: number) => `Showing first ${shown} of ${total} records`,
      allChip: (shown: number) => `Showing ${shown} records`,
    },
    exportButtons: {
      json: {
        label: 'Download JSON',
        description: 'Ready-to-use API payload',
        tooltip: '[{"id":1,"status":"active"}]',
      },
      csv: {
        label: 'Download CSV',
        description: 'Spreadsheet-friendly column layout',
        tooltip: 'id,name,status',
      },
      sql: {
        label: 'Download SQL INSERT',
        description: 'Insert directly into your database',
        tooltip: 'INSERT INTO mock_data ...',
      },
    },
    validationTitle: 'Validation Warnings',
    howToTitle: 'How to Use the App?',
    themeToggle: {
      caption: 'Switch',
      lightActive: 'Light theme active',
      darkActive: 'Dark theme active',
      toLightAria: 'Switch to light theme',
      toDarkAria: 'Switch to dark theme',
    },
  },
  tr: {
    brandTagline: 'JSON Schema, SQL veya manuel alan tanımlarından hızla sahte veri üretin.',
    menuToggle: {
      open: 'Navigasyonu aç',
      close: 'Navigasyonu kapat',
    },
    nav: {
      viewLabel: 'Görünüm',
      viewTabs: {
        generator: 'Veri Üretici',
        howTo: 'Nasıl Kullanılır?',
      },
      modeLabel: 'Mod',
      languageLabel: 'Dil',
    },
    hero: {
      title: 'Test verinizi dakikalar içinde hazırlayın',
      description:
        'Mock Data Generator, şemanızı doğrularken farklı formatlarda mock veri üretir. Edge case’leri deneyin, çıktıları indirin ve ekibinizle paylaşın.',
      ctaPrimary: 'Veri üretmeye başla',
      ctaSecondary: 'Nasıl çalışır?',
      highlights: [
        'JSON, CSV ve SQL formatlarında dışa aktarma',
        'Edge case ve validasyon uyarılarıyla güvenilir veri',
        'Tamamı tarayıcıda, verileriniz güvende',
      ],
      modeLabel: 'Üretim modu',
    },
    modeNames: {
      jsonSchema: 'JSON Schema',
      createTable: 'CREATE TABLE',
      manual: 'Manuel Tanım',
    },
    modeCards: {
      jsonSchema: {
        description: 'Örnekten şema çıkarın, validasyonu geçecek kayıtlar oluşturun.',
        highlight: 'AJV ile doğrulandı',
      },
      createTable: {
        description: 'SQL tablo tanımlarını çözümler, kolon kısıtlarını algılar ve INSERT scriptleri üretir.',
        highlight: 'INSERT script hazır',
      },
      manual: {
        description: 'Sıfırdan alanlar ekleyin, JSON Schema çıktısını düzenleyin ve paylaşın.',
        highlight: 'Anında şema çıktısı',
      },
    },
    modeSelectedLabel: 'Seçili',
    definitionPanel: {
      title: 'Yapı Tanımı',
      recordCountLabel: 'Kayıt sayısı',
      edgeCaseLabel: 'Edge case oranı',
      edgeCaseSliderAria: 'Edge case oranı',
      edgeCaseNumberAria: 'Edge case oranı yüzde',
      generateIdle: 'Veri Üret',
      generateBusy: 'Üretiliyor…',
      edgeSummary: 'Edge case açıklaması',
      edgeDescription: (ratio: number) =>
        `Edge case kayıtları, sınır değerlerin ve beklenmeyen kombinasyonların test edilmesine yardımcı olur. Veri kümesinin %${ratio} kadarı uç örneklerden oluşur.`,
      edgeBullets: [
        'Minimum veya maksimum kısıtlarının dışına çıkan değerler',
        'Pattern veya enum tanımlarına uymayan string içerikleri',
        'Zorunlu olmayan alanların boş bırakıldığı veya NULL döndüğü senaryolar',
      ],
    },
    definitionTabs: {
      definition: 'Tanım',
      examples: 'Örnekler',
    },
    schemaHelper: {
      title: 'AI Destekli Şema Çıkarma',
      description: 'Örnek JSON verisini yapıştırın, şema otomatik çıkarılsın.',
      placeholder: '[{"id":1,"name":"Ada","email":"ada@example.com"}]',
      action: 'Örnekten Şema Üret',
      success: "Şema örnek JSON'dan üretildi.",
      emptyError: 'Örnek JSON boş olamaz.',
      parseErrorPrefix: 'Örnek JSON parse edilemedi: ',
    },
    manualEditor: {
      newFieldFallback: 'Yeni Alan',
      remove: 'Sil',
      fieldName: 'Alan Adı',
      dataType: 'Veri Tipi',
      required: 'Zorunlu',
      minLength: 'Min. Uzunluk',
      maxLength: 'Maks. Uzunluk',
      pattern: 'Pattern (RegExp)',
      patternPlaceholder: '^[A-Z]{3}$',
      enum: 'Enum (virgülle ayrılmış)',
      enumPlaceholder: 'A, B, C',
      minimum: 'Minimum',
      maximum: 'Maksimum',
      addField: 'Alan Ekle',
      previewTitle: 'Oluşan JSON Schema',
    },
    examples: {
      copy: 'Kopyala',
      copied: 'Kopyalandı!',
      empty: 'Bu mod için henüz örnek eklenmedi.',
    },
    schemaErrorsTitle: 'Tanım Hataları',
    schemaParseErrorPrefix: 'JSON Schema parse edilemedi: ',
    previewPanel: {
      title: 'Önizleme & Dışa Aktarım',
      subtitle: 'Formatı seçin, tek tuşla paylaşın.',
      empty: 'Henüz veri üretilmedi.',
      jsonSummary: 'JSON Önizlemesi',
      recordChip: (count: number) => `${count} kayıt`,
      limitedChip: (shown: number, total: number) => `İlk ${shown} kaydı görüyorsunuz (toplam ${total})`,
      allChip: (shown: number) => `${shown} kayıt görüntüleniyor`,
    },
    exportButtons: {
      json: {
        label: 'JSON indir',
        description: 'API testleri için hazır payload',
        tooltip: '[{"id":1,"status":"active"}]',
      },
      csv: {
        label: 'CSV indir',
        description: 'Spreadsheet uyumlu sütun düzeni',
        tooltip: 'id,name,status',
      },
      sql: {
        label: 'SQL INSERT indir',
        description: 'Veritabanına direkt ekleyin',
        tooltip: 'INSERT INTO mock_data ...',
      },
    },
    validationTitle: 'Validasyon Uyarıları',
    howToTitle: 'Uygulama Nasıl Kullanılır?',
    themeToggle: {
      caption: 'Geçiş yap',
      lightActive: 'Aydınlık tema aktif',
      darkActive: 'Karanlık tema aktif',
      toLightAria: 'Aydınlık temaya geç',
      toDarkAria: 'Karanlık temaya geç',
    },
  },
};

export const languageOptions: Array<{ value: Language; shortLabel: string; fullLabel: string }> = [
  { value: 'en', shortLabel: 'EN', fullLabel: 'English' },
  { value: 'tr', shortLabel: 'TR', fullLabel: 'Türkçe' },
];
