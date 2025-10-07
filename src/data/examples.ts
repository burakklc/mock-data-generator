export type ExampleCategory = 'jsonSchema' | 'createTable' | 'manual';

export interface ExampleSnippet {
  id: string;
  title: string;
  description?: string;
  content: string;
  language: 'json' | 'sql' | 'text';
}

type ExampleDictionary = Record<ExampleCategory, ExampleSnippet[]>;

export const exampleSnippets: ExampleDictionary = {
  jsonSchema: [
    {
      id: 'user-basic',
      title: 'Kullanıcı Profili',
      description: 'Kimlik ve iletişim alanları içeren temel bir kullanıcı şeması.',
      language: 'json',
      content: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "User",
  "properties": {
    "id": { "type": "integer", "minimum": 1 },
    "fullName": { "type": "string", "minLength": 3 },
    "email": { "type": "string", "format": "email" },
    "signupDate": { "type": "string", "format": "date-time" },
    "isActive": { "type": "boolean", "default": true }
  },
  "required": ["id", "fullName", "email"]
}`,
    },
    {
      id: 'order-extended',
      title: 'Sipariş Kaydı',
      description: 'Adres bilgileri ve satır bazlı ürün listesi içeren karmaşık bir sipariş şeması.',
      language: 'json',
      content: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Order",
  "properties": {
    "orderId": { "type": "string", "pattern": "^ORD-[0-9]{6}$" },
    "customerId": { "type": "integer", "minimum": 1 },
    "status": { "type": "string", "enum": ["pending", "shipped", "delivered", "cancelled"] },
    "items": {
      "type": "array",
      "minItems": 1,
      "items": {
        "type": "object",
        "properties": {
          "sku": { "type": "string" },
          "quantity": { "type": "integer", "minimum": 1 },
          "price": { "type": "number", "minimum": 0 }
        },
        "required": ["sku", "quantity", "price"]
      }
    },
    "shipping": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "address": { "type": "string" },
        "city": { "type": "string" },
        "postalCode": { "type": "string", "pattern": "^[0-9]{5}$" }
      },
      "required": ["name", "address", "city", "postalCode"]
    }
  },
  "required": ["orderId", "customerId", "status", "items"]
}`,
    },
  ],
  createTable: [
    {
      id: 'table-products',
      title: 'Products Tablosu',
      description: 'Fiyat, stok ve kategori bilgilerini tutan bir ürün tablosu.',
      language: 'sql',
      content: `CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  sku VARCHAR(64) UNIQUE NOT NULL,
  price NUMERIC(10, 2) CHECK (price >= 0),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  category VARCHAR(80),
  created_at TIMESTAMP DEFAULT NOW()
);`,
    },
    {
      id: 'table-invoices',
      title: 'Invoices Tablosu',
      description: 'Fatura ve satır detaylarını saklamak için iki ayrı tablo tanımı.',
      language: 'sql',
      content: `CREATE TABLE invoices (
  invoice_id VARCHAR(20) PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  issue_date DATE NOT NULL,
  total NUMERIC(12, 2) NOT NULL CHECK (total >= 0),
  status VARCHAR(20) CHECK (status IN ('draft', 'sent', 'paid', 'void'))
);

CREATE TABLE invoice_items (
  invoice_id VARCHAR(20) REFERENCES invoices(invoice_id),
  line_no INTEGER NOT NULL,
  description VARCHAR(255),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
  PRIMARY KEY (invoice_id, line_no)
);`,
    },
  ],
  manual: [
    {
      id: 'manual-address',
      title: 'Adres Defteri',
      description: 'Manuel editörde oluşturulabilecek örnek alanlar.',
      language: 'text',
      content: `Ad: string (zorunlu, minLength: 2)
Soyad: string (zorunlu, minLength: 2)
Email: string (zorunlu, pattern: ^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$)
Telefon: string (pattern: ^\\+90[0-9]{10}$)
Doğum Tarihi: date (opsiyonel)
Abone mi?: boolean (varsayılan: false)`,
    },
    {
      id: 'manual-product',
      title: 'Ürün Kataloğu',
      description: 'Stok yönetimi için tipik alan kombinasyonu.',
      language: 'text',
      content: `Ürün Adı: string (zorunlu, minLength: 3, maxLength: 120)
Stok Kodu: string (zorunlu, pattern: ^SKU-[0-9]{5}$)
Birim Fiyat: number (minimum: 0)
Stok Adedi: integer (minimum: 0)
Aktif mi?: boolean
Eklenme Tarihi: date`,
    },
  ],
};
