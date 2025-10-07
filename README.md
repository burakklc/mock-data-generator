# Mock Data Generator

Tarayıcı üzerinde çalışan Mock Data Generator uygulaması; JSON Schema, SQL `CREATE TABLE` scriptleri veya manuel alan tanımlarından sahte veri üretmeye yardımcı olur. Uygulama tamamıyla client-side çalışır ve oluşturulan veriler hiçbir sunucuya gönderilmez.

## Özellikler

- **JSON Schema modu:** Draft-07 uyumlu şemalardan json-schema-faker ile veri üretir, AJV ile doğrular.
- **CREATE TABLE modu:** SQL tablo tanımını çözümler, kolon tiplerini/kısıtları algılar ve INSERT script’leri oluşturur.
- **Manual modu:** Alan adı, veri tipi ve kısıtları manuel girerek JSON Schema oluşturur.
- **Edge case üretimi:** İsteğe bağlı olarak sınır değerlerini deneyen kayıtlar ekler ve doğrulama hatalarını raporlar.
- **Dışa aktarma:** JSON, CSV veya SQL formatında veri indirme seçenekleri sunar.
- **Önizleme:** İlk 20 kaydı tablo ve JSON formatında görüntüler.

## Geliştirme

```bash
npm install
npm run dev
```

> Not: Çevrimdışı ortamda çalışıyorsanız `npm install` komutu kayıtlı npm mirror’larına erişemeyebilir.

## Derleme

```bash
npm run build
```

## Lisans

MIT
