-- MonoPlus Supabase Migration Script
-- Generated for complete database setup with 120+ insurance fields

-- Sessions table (for authentication)
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email VARCHAR UNIQUE,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers table with 120+ insurance-specific fields
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  
  -- Temel Poliçe Bilgileri
  tanzim_tarihi DATE,
  musteri_ismi VARCHAR,
  hesap_kodu VARCHAR,
  sigorta_sirketi_adi VARCHAR,
  arac_plakasi VARCHAR,
  ana_brans VARCHAR,
  police_kodu VARCHAR,
  police_turu VARCHAR,
  donem VARCHAR,
  police_numarasi VARCHAR,
  zeyl_numarasi VARCHAR,
  
  -- Prodüktör Bilgileri
  produktor_tali_kodu VARCHAR,
  produktor_tali_adi VARCHAR,
  police_kayit_tipi VARCHAR,
  
  -- Tarih Bilgileri
  baslangic_tarihi DATE,
  bitis_tarihi DATE,
  
  -- Şirket Bilgileri
  sigorta_sirketi_kodu VARCHAR,
  para_birimi VARCHAR,
  
  -- Prim ve Komisyon Bilgileri
  brut DECIMAL(15, 2),
  net DECIMAL(15, 2),
  komisyon DECIMAL(15, 2),
  tali_komisyonu DECIMAL(15, 2),
  acente_komisyonu_yuzde DECIMAL(5, 2),
  tali_komisyonu_yuzde DECIMAL(5, 2),
  
  -- Temsilci Bilgileri
  temsilci_adi VARCHAR,
  hesap_olusturma_tarihi DATE,
  police_aciklamasi TEXT,
  ozel_kod VARCHAR,
  
  -- Ödeme Bilgileri
  pesin_vadeli VARCHAR,
  pesinat DECIMAL(15, 2),
  taksit_sayisi INTEGER,
  kur DECIMAL(10, 4),
  
  -- Branş Bilgileri
  brans_kodu VARCHAR,
  ruhsat_sahibi VARCHAR,
  yenileme_no VARCHAR,
  evrak_no VARCHAR,
  brans_adi VARCHAR,
  
  -- Araç Bilgileri
  arac_markasi VARCHAR,
  arac_modeli VARCHAR,
  arac_kullanim_tarzi VARCHAR,
  
  -- Riziko Adresi
  riziko_adresi_1 VARCHAR,
  riziko_adresi_2 VARCHAR,
  riziko_ili VARCHAR,
  riziko_ilcesi VARCHAR,
  
  -- Ara Branş
  ara_brans_kodu VARCHAR,
  
  -- Ödeme Durumu
  odenen DECIMAL(15, 2),
  kalan DECIMAL(15, 2),
  sirkete_borc DECIMAL(15, 2),
  sirkete_kalan DECIMAL(15, 2),
  sirkete_odenen DECIMAL(15, 2),
  
  -- İptal Bilgileri
  iptal_sebebi VARCHAR,
  sirkete_kartla_odeme_durumu VARCHAR,
  ara_brans VARCHAR,
  
  -- Yenileme Bilgileri
  yenilenme_durumu VARCHAR,
  yenileme_durumu VARCHAR,
  
  -- Kimlik Bilgileri
  tc_kimlik_no VARCHAR,
  vergi_kimlik_no VARCHAR,
  
  -- Şube ve Personel
  sube_adi VARCHAR,
  teknik_personel_adi VARCHAR,
  yenileme_donemi VARCHAR,
  yenileme_kodu VARCHAR,
  
  -- Adres Bilgileri
  sehir VARCHAR,
  semt VARCHAR,
  ilce VARCHAR,
  
  -- Diğer
  tecdit VARCHAR,
  tahsildar_adi VARCHAR,
  
  -- İletişim Bilgileri
  telefon_1 VARCHAR,
  telefon_2 VARCHAR,
  faks_no VARCHAR,
  gsm_no VARCHAR,
  e_posta VARCHAR,
  
  -- Araç Detayları
  motor_no VARCHAR,
  sase_no VARCHAR,
  ruhsat_no VARCHAR,
  
  -- Gruplar
  referans_grubu VARCHAR,
  ozel_kod_adi VARCHAR,
  meslek_grubu VARCHAR,
  model_yili INTEGER,
  
  -- Alternatif Hesap
  alternatif_hesap_kodu VARCHAR,
  musteri_tipi VARCHAR,
  
  -- Adres
  adres_1 TEXT,
  adres_2 TEXT,
  normal_kayit_tipi VARCHAR,
  
  -- Eski Poliçe Bilgileri
  eski_police_brut_prim DECIMAL(15, 2),
  eski_police_net_prim DECIMAL(15, 2),
  eski_police_acente_komisyonu DECIMAL(15, 2),
  eski_police_no VARCHAR,
  eski_police_turu VARCHAR,
  eski_police_sigorta_sirketi VARCHAR,
  eski_police_tanzim_tarihi DATE,
  eski_police_ana_brans VARCHAR,
  eski_police_bitis_tarihi DATE,
  
  -- Yeni Poliçe Bilgileri
  yeni_police_brut_prim DECIMAL(15, 2),
  yeni_police_net_prim DECIMAL(15, 2),
  yeni_police_acente_komisyonu DECIMAL(15, 2),
  yeni_police_no VARCHAR,
  yeni_police_turu VARCHAR,
  yeni_police_sigorta_sirketi VARCHAR,
  yeni_police_tanzim_tarihi DATE,
  yeni_police_ana_brans VARCHAR,
  
  -- Hesap Bilgileri
  hesap_adi_2 VARCHAR,
  portfoy_hakki VARCHAR,
  
  -- Özel Sahalar
  ozel_saha_1 VARCHAR,
  ozel_saha_2 VARCHAR,
  ortaklik_katki_payi DECIMAL(15, 2),
  musteri_karti_tipi VARCHAR,
  duzenleme_nedeni VARCHAR,
  dask_police_no VARCHAR,
  
  -- Kişisel Bilgiler
  dogum_tarihi DATE,
  izinli_pazarlama VARCHAR,
  kvkk VARCHAR,
  hesap_temsilci_adi VARCHAR,
  cinsiyet VARCHAR,
  ozel_saha_3 VARCHAR,
  
  -- Poliçe ID
  police_id VARCHAR,
  firma_tipi VARCHAR,
  kur_farki_zeyli VARCHAR,
  
  -- Kazanılmış Primler
  kazanilmis_net_prim DECIMAL(15, 2),
  kazanilmis_brut_prim DECIMAL(15, 2),
  kazanilmis_net_prim_dvz DECIMAL(15, 2),
  
  -- Hasar Bilgileri
  hasar_karlilik_tl DECIMAL(15, 2),
  hasar_karlilik_dvz DECIMAL(15, 2),
  hasar_karlilik_orani_yuzde DECIMAL(10, 2),
  
  -- Sigortalı Bilgileri
  sigortali_tckn VARCHAR,
  riziko_uavt_kodu VARCHAR,
  arac_bedeli DECIMAL(15, 2),
  
  -- Sistem Alanları
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on TC Kimlik No for duplicate detection during CSV import
CREATE INDEX IF NOT EXISTS idx_customers_tc_kimlik ON customers(tc_kimlik_no);

-- Create index on expiry date for renewal tracking
CREATE INDEX IF NOT EXISTS idx_customers_bitis_tarihi ON customers(bitis_tarihi);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  description TEXT,
  target_audience VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Segments table
CREATE TABLE IF NOT EXISTS segments (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR NOT NULL,
  description TEXT,
  filter_criteria JSONB,
  customer_count INTEGER DEFAULT 0,
  ai_insight TEXT,
  behaviors JSONB,
  is_auto_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR NOT NULL,
  description TEXT,
  segment_id VARCHAR,
  status VARCHAR DEFAULT 'draft',
  target_customer_count INTEGER DEFAULT 0,
  contacted_count INTEGER DEFAULT 0,
  converted_count INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  campaign_type VARCHAR,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI Analyses table
CREATE TABLE IF NOT EXISTS ai_analyses (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid()::text,
  analysis_type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  insight TEXT,
  confidence INTEGER,
  category VARCHAR,
  customer_ids JSONB,
  segment_id VARCHAR,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (optional, recommended for Supabase)
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE products ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
