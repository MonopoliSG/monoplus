# MonoPlus - Supabase ve Render Entegrasyon Rehberi

Bu rehber, MonoPlus uygulamasını Supabase veritabanı ve Render hosting ile production ortamına taşımanız için adım adım talimatlar içerir.

---

## BÖLÜM 1: SUPABASE VERİTABANI KURULUMU

### Adım 1.1: Supabase Hesabı Oluşturma

1. **Supabase'e Gidin**: [https://supabase.com](https://supabase.com)
2. **Kayıt Olun**: "Start your project" butonuna tıklayın
3. **GitHub ile Giriş**: GitHub hesabınızla giriş yapın (en kolay yöntem)

### Adım 1.2: Yeni Proje Oluşturma

1. Dashboard'da **"New Project"** butonuna tıklayın
2. Aşağıdaki bilgileri doldurun:
   - **Organization**: Mevcut bir organizasyon seçin veya yeni oluşturun
   - **Name**: `monoplus` (veya istediğiniz bir isim)
   - **Database Password**: Güçlü bir şifre belirleyin
     - ⚠️ **ÖNEMLİ**: Bu şifreyi mutlaka kaydedin! Daha sonra gerekecek.
   - **Region**: `EU Central (Frankfurt)` - Türkiye'ye en yakın bölge
   - **Pricing Plan**: Free tier başlangıç için yeterli
3. **"Create new project"** butonuna tıklayın
4. Proje oluşturulana kadar bekleyin (1-2 dakika)

### Adım 1.3: Veritabanı Bağlantı Bilgilerini Alma

1. Sol menüden **Settings** (dişli ikonu) seçin
2. **Database** sekmesine tıklayın
3. **"Connection string"** bölümüne gidin
4. **Mode**: "Transaction" seçin (connection pooling için)
5. **URI** kısmındaki bağlantı string'ini kopyalayın

Bağlantı string'i şu formatta olacak:
```
postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

⚠️ **DİKKAT**: `[YOUR-PASSWORD]` yerine Adım 1.2'de belirlediğiniz şifreyi yazın!

### Adım 1.4: Veritabanı Tablolarını Oluşturma

1. Sol menüden **SQL Editor** seçin
2. **"New query"** butonuna tıklayın
3. Projenizdeki `supabase_migration.sql` dosyasının tüm içeriğini kopyalayın
4. SQL Editor'e yapıştırın
5. **"Run"** butonuna tıklayın
6. Başarılı mesajını görene kadar bekleyin

### Adım 1.5: Tabloları Doğrulama

1. Sol menüden **Table Editor** seçin
2. Aşağıdaki tabloların oluşturulduğunu doğrulayın:
   - `sessions`
   - `users`
   - `customers`
   - `products`
   - `segments`
   - `campaigns`
   - `ai_analyses`

---

## BÖLÜM 2: REPLİT'TE SUPABASE BAĞLANTISI

### Adım 2.1: Environment Variable Ekleme

Replit'te Supabase'i test etmek için:

1. Replit projenizde sol panelden **"Secrets"** (veya "Environment Variables") seçin
2. Yeni bir secret ekleyin:
   - **Key**: `SUPABASE_DATABASE_URL`
   - **Value**: Adım 1.3'te aldığınız bağlantı string'i

### Adım 2.2: Veritabanı Bağlantısını Test Etme

Production veritabanına geçiş yapmak için:

1. Mevcut `DATABASE_URL` değerini yedekleyin
2. `DATABASE_URL` değerini Supabase bağlantı string'i ile değiştirin
3. Uygulamayı yeniden başlatın

---

## BÖLÜM 3: RENDER DEPLOYMENT

### Adım 3.1: Render Hesabı Oluşturma

1. [https://render.com](https://render.com) adresine gidin
2. **"Get Started for Free"** butonuna tıklayın
3. GitHub hesabınızla kayıt olun

### Adım 3.2: GitHub Repo Hazırlığı

Render, GitHub'dan deploy yapar. Projenizi GitHub'a yüklemeniz gerekiyor:

1. GitHub'da yeni bir private repo oluşturun: `monoplus`
2. Replit projenizi bu repo'ya push edin

### Adım 3.3: Render'da Web Service Oluşturma

1. Render Dashboard'da **"New +"** > **"Web Service"** seçin
2. GitHub repo'nuzu bağlayın ve `monoplus` repo'sunu seçin
3. Aşağıdaki ayarları yapın:
   
   **Basic Settings:**
   - **Name**: `monoplus`
   - **Region**: `Frankfurt (EU Central)` - Supabase ile aynı bölge
   - **Branch**: `main`
   - **Root Directory**: Boş bırakın
   - **Runtime**: `Node`
   
   **Build & Deploy:**
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Adım 3.4: Environment Variables Ekleme

Render'da aşağıdaki environment variable'ları ekleyin:

| Key | Value | Açıklama |
|-----|-------|----------|
| `DATABASE_URL` | Supabase bağlantı string'i | Veritabanı bağlantısı |
| `SESSION_SECRET` | Rastgele güçlü bir string | Session şifreleme |
| `NODE_ENV` | `production` | Production modu |
| `PORT` | `5000` | Uygulama portu |
| `ADMIN_USERNAME` | Admin kullanıcı adı | Giriş için kullanıcı adı |
| `ADMIN_PASSWORD` | Admin şifresi | Giriş için şifre |

**SESSION_SECRET oluşturmak için:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Adım 3.5: Build Script Ekleme

`package.json` dosyasına production için gerekli script'leri ekleyin:

```json
{
  "scripts": {
    "build": "vite build",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

### Adım 3.6: Deploy Etme

1. **"Create Web Service"** butonuna tıklayın
2. Build sürecini takip edin (5-10 dakika)
3. Başarılı olduğunda size bir URL verilecek: `https://monoplus.onrender.com`

---

## BÖLÜM 4: ÖNEMLİ NOTLAR

### 4.1 Supabase Free Tier Limitleri
- 500 MB veritabanı alanı
- 2 GB bandwidth/ay
- 50,000 monthly active users
- 7 gün inactivity sonrası pause (upgrade ile kaldırılır)

### 4.2 Render Free Tier Limitleri
- 750 saat/ay (yaklaşık sürekli çalışma)
- 15 dakika inactivity sonrası spin down
- Otomatik wake-up (ilk istek 30-60 saniye sürer)

### 4.3 Production Kontrol Listesi

Canlıya almadan önce:
- [ ] Supabase tablolar oluşturuldu
- [ ] DATABASE_URL doğru ayarlandı
- [ ] SESSION_SECRET güçlü ve benzersiz
- [ ] CSV import test edildi
- [ ] Login/logout çalışıyor
- [ ] Müşteri listesi görüntüleniyor

---

## BÖLÜM 5: SORUN GİDERME

### Bağlantı Hatası
```
Error: Connection refused
```
**Çözüm**: Supabase bağlantı string'inde şifrenin doğru olduğunu kontrol edin.

### SSL Hatası
```
Error: SSL required
```
**Çözüm**: Bu projede SSL otomatik olarak etkinleştirilmiştir. Bağlantı string'inin Supabase'den doğru kopyalandığını kontrol edin.

### Tablo Bulunamadı Hatası
```
Error: relation "customers" does not exist
```
**Çözüm**: SQL Editor'da `supabase_migration.sql` dosyasını çalıştırdığınızdan emin olun.

---

## BÖLÜM 6: YARDIMCI KOMUTLAR

### Veritabanı Şemasını Kontrol Etme (Supabase SQL Editor)
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### Müşteri Sayısını Kontrol Etme
```sql
SELECT COUNT(*) FROM customers;
```

### Tüm Tabloları Temizleme (DİKKAT!)
```sql
TRUNCATE customers, products, segments, campaigns, ai_analyses CASCADE;
```

---

## Sonraki Adımlar

1. Bu rehberi takip ederek Supabase kurulumunu tamamlayın
2. Bağlantı bilgilerini aldıktan sonra bana bildirin
3. Render deployment için gerekli düzenlemeleri birlikte yapacağız

Herhangi bir adımda takılırsanız, ekran görüntüsü ile birlikte bana sorun!
