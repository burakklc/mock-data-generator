# Mock Data Generator

Tarayıcı üzerinde çalışan Mock Data Generator uygulaması; JSON Schema, SQL `CREATE TABLE` scriptleri veya manuel alan tanımlarından sahte veri üretmeye yardımcı olur. Uygulama tamamıyla client-side çalışır ve oluşturulan veriler hiçbir sunucuya gönderilmez.

## Özellikler

- **JSON Schema modu:** Draft-07 uyumlu şemalardan json-schema-faker ile veri üretir, AJV ile doğrular.
- **CREATE TABLE modu:** SQL tablo tanımını çözümler, kolon tiplerini/kısıtları algılar ve INSERT script’leri oluşturur.
- **Manual modu:** Alan adı, veri tipi ve kısıtları manuel girerek JSON Schema oluşturur.
- **Edge case üretimi:** İsteğe bağlı olarak sınır değerlerini deneyen kayıtlar ekler ve doğrulama hatalarını raporlar.
- **Dışa aktarma:** JSON, CSV veya SQL formatında veri indirme seçenekleri sunar.
- **Önizleme:** İlk 20 kaydı tablo ve JSON formatında görüntüler.

## Hızlı Başlangıç (Basit Anlatım)

1. **Projeyi GitHub’dan indir:** Sağ üstteki yeşil `Code` düğmesine tıklayıp `Download ZIP` seçebilirsiniz veya Git kuruluysa `git clone https://github.com/<kullanıcı-adı>/mock-data-generator.git` komutunu çalıştırabilirsiniz.
2. **Bilgisayarınızda açın:** ZIP indirdiyseniz klasörü çıkarın; klonladıysanız komut satırı sizi proje klasörüne götürür (`cd mock-data-generator`).
3. **Bağımlılıkları yükleyin:** Proje klasöründe bir terminal açıp `npm install` yazın. Bu adım internet bağlantısı gerektirir.
4. **Uygulamayı başlatın:** Aynı terminalde `npm run dev` komutu ile geliştirme sunucusunu çalıştırın ve ekranda çıkan adresi (genelde http://localhost:5173) tarayıcıda açın.
5. **Hazırsınız:** Arayüz üzerinden JSON Schema, SQL `CREATE TABLE` ya da manuel tanımlar girerek sahte veri oluşturabilirsiniz.

> Not: Çevrimdışı bir ortamda çalışıyorsanız `npm install` komutu gerekli paket depolarına ulaşamadığı için başarısız olabilir.

## Geliştirme Komutları

- `npm run dev`: Geliştirme sunucusunu başlatır.
- `npm run build`: Üretim derlemesi oluşturur.
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

## Vercel Analytics

- `@vercel/analytics` paketi projeye eklendi ve `src/main.tsx` içinde `<Analytics />` bileşeni yerleştirildi.
- Vercel panelinde ilgili projede **Analytics** özelliğini etkinleştirerek üretim trafiğini izleyebilirsiniz.
- Analytics yalnızca Vercel üzerinde çalışan deploy’larda veri toplayacaktır; yerelde çalışırken ek bir ayara gerek yoktur.
- Google Analytics için `index.html` dosyasına `G-EMEEEJT4CC` kimliğini kullanan gtag snippet’i eklendi.

## Lisans

MIT
