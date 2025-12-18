import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
  date,
  decimal,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - Required for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table - Required for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Customers table - Insurance customers with all policy data
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Temel Poliçe Bilgileri
  tanzimTarihi: date("tanzim_tarihi"),
  musteriIsmi: varchar("musteri_ismi"),
  hesapKodu: varchar("hesap_kodu"),
  sigortaSirketiAdi: varchar("sigorta_sirketi_adi"),
  aracPlakasi: varchar("arac_plakasi"),
  anaBrans: varchar("ana_brans"),
  policeKodu: varchar("police_kodu"),
  policeTuru: varchar("police_turu"),
  donem: varchar("donem"),
  policeNumarasi: varchar("police_numarasi"),
  zeylNumarasi: varchar("zeyl_numarasi"),
  
  // Prodüktör Bilgileri
  produktorTaliKodu: varchar("produktor_tali_kodu"),
  produktorTaliAdi: varchar("produktor_tali_adi"),
  policeKayitTipi: varchar("police_kayit_tipi"),
  
  // Tarih Bilgileri
  baslangicTarihi: date("baslangic_tarihi"),
  bitisTarihi: date("bitis_tarihi"),
  
  // Şirket Bilgileri
  sigortaSirketiKodu: varchar("sigorta_sirketi_kodu"),
  paraBirimi: varchar("para_birimi"),
  
  // Prim ve Komisyon Bilgileri
  brut: decimal("brut", { precision: 15, scale: 2 }),
  net: decimal("net", { precision: 15, scale: 2 }),
  komisyon: decimal("komisyon", { precision: 15, scale: 2 }),
  taliKomisyonu: decimal("tali_komisyonu", { precision: 15, scale: 2 }),
  acenteKomisyonuYuzde: decimal("acente_komisyonu_yuzde", { precision: 15, scale: 2 }),
  taliKomisyonuYuzde: decimal("tali_komisyonu_yuzde", { precision: 15, scale: 2 }),
  
  // Temsilci Bilgileri
  temsilciAdi: varchar("temsilci_adi"),
  hesapOlusturmaTarihi: date("hesap_olusturma_tarihi"),
  policeAciklamasi: text("police_aciklamasi"),
  ozelKod: varchar("ozel_kod"),
  
  // Ödeme Bilgileri
  pesinVadeli: varchar("pesin_vadeli"),
  pesinat: decimal("pesinat", { precision: 15, scale: 2 }),
  taksitSayisi: integer("taksit_sayisi"),
  kur: decimal("kur", { precision: 10, scale: 4 }),
  
  // Branş Bilgileri
  bransKodu: varchar("brans_kodu"),
  ruhsatSahibi: varchar("ruhsat_sahibi"),
  yenilemeNo: varchar("yenileme_no"),
  evrakNo: varchar("evrak_no"),
  bransAdi: varchar("brans_adi"),
  
  // Araç Bilgileri
  aracMarkasi: varchar("arac_markasi"),
  aracModeli: varchar("arac_modeli"),
  aracKullanimTarzi: varchar("arac_kullanim_tarzi"),
  
  // Riziko Adresi
  rizikoAdresi1: varchar("riziko_adresi_1"),
  rizikoAdresi2: varchar("riziko_adresi_2"),
  rizikoIli: varchar("riziko_ili"),
  rizikoIlcesi: varchar("riziko_ilcesi"),
  
  // Ara Branş
  araBransKodu: varchar("ara_brans_kodu"),
  
  // Ödeme Durumu
  odenen: decimal("odenen", { precision: 15, scale: 2 }),
  kalan: decimal("kalan", { precision: 15, scale: 2 }),
  sirketeBorc: decimal("sirkete_borc", { precision: 15, scale: 2 }),
  sirketeKalan: decimal("sirkete_kalan", { precision: 15, scale: 2 }),
  sirketeOdenen: decimal("sirkete_odenen", { precision: 15, scale: 2 }),
  
  // İptal Bilgileri
  iptalSebebi: varchar("iptal_sebebi"),
  sirketeKartlaOdemeDurumu: varchar("sirkete_kartla_odeme_durumu"),
  araBrans: varchar("ara_brans"),
  
  // Yenileme Bilgileri
  yenilenmeDurumu: varchar("yenilenme_durumu"),
  yenilemeDurumu: varchar("yenileme_durumu"),
  
  // Kimlik Bilgileri
  tcKimlikNo: varchar("tc_kimlik_no"),
  vergiKimlikNo: varchar("vergi_kimlik_no"),
  
  // Şube ve Personel
  subeAdi: varchar("sube_adi"),
  teknikPersonelAdi: varchar("teknik_personel_adi"),
  yenilemeDonemi: varchar("yenileme_donemi"),
  yenilemeKodu: varchar("yenileme_kodu"),
  
  // Adres Bilgileri
  sehir: varchar("sehir"),
  semt: varchar("semt"),
  ilce: varchar("ilce"),
  
  // Diğer
  tecdit: varchar("tecdit"),
  tahsildarAdi: varchar("tahsildar_adi"),
  
  // İletişim Bilgileri
  telefon1: varchar("telefon_1"),
  telefon2: varchar("telefon_2"),
  faksNo: varchar("faks_no"),
  gsmNo: varchar("gsm_no"),
  ePosta: varchar("e_posta"),
  
  // Araç Detayları
  motorNo: varchar("motor_no"),
  saseNo: varchar("sase_no"),
  ruhsatNo: varchar("ruhsat_no"),
  
  // Gruplar
  referansGrubu: varchar("referans_grubu"),
  ozelKodAdi: varchar("ozel_kod_adi"),
  meslekGrubu: varchar("meslek_grubu"),
  modelYili: integer("model_yili"),
  
  // Alternatif Hesap
  alternatifHesapKodu: varchar("alternatif_hesap_kodu"),
  musteriTipi: varchar("musteri_tipi"),
  
  // Adres
  adres1: text("adres_1"),
  adres2: text("adres_2"),
  normalKayitTipi: varchar("normal_kayit_tipi"),
  
  // Eski Poliçe Bilgileri
  eskiPoliceBrutPrim: decimal("eski_police_brut_prim", { precision: 15, scale: 2 }),
  eskiPoliceNetPrim: decimal("eski_police_net_prim", { precision: 15, scale: 2 }),
  eskiPoliceAcenteKomisyonu: decimal("eski_police_acente_komisyonu", { precision: 15, scale: 2 }),
  eskiPoliceNo: varchar("eski_police_no"),
  eskiPoliceTuru: varchar("eski_police_turu"),
  eskiPoliceSigortaSirketi: varchar("eski_police_sigorta_sirketi"),
  eskiPoliceTanzimTarihi: date("eski_police_tanzim_tarihi"),
  eskiPoliceAnaBrans: varchar("eski_police_ana_brans"),
  eskiPoliceBitisTarihi: date("eski_police_bitis_tarihi"),
  
  // Yeni Poliçe Bilgileri
  yeniPoliceBrutPrim: decimal("yeni_police_brut_prim", { precision: 15, scale: 2 }),
  yeniPoliceNetPrim: decimal("yeni_police_net_prim", { precision: 15, scale: 2 }),
  yeniPoliceAcenteKomisyonu: decimal("yeni_police_acente_komisyonu", { precision: 15, scale: 2 }),
  yeniPoliceNo: varchar("yeni_police_no"),
  yeniPoliceTuru: varchar("yeni_police_turu"),
  yeniPoliceSigortaSirketi: varchar("yeni_police_sigorta_sirketi"),
  yeniPoliceTanzimTarihi: date("yeni_police_tanzim_tarihi"),
  yeniPoliceAnaBrans: varchar("yeni_police_ana_brans"),
  
  // Hesap Bilgileri
  hesapAdi2: varchar("hesap_adi_2"),
  portfoyHakki: varchar("portfoy_hakki"),
  
  // Özel Sahalar
  ozelSaha1: varchar("ozel_saha_1"),
  ozelSaha2: varchar("ozel_saha_2"),
  ortaklikKatkiPayi: decimal("ortaklik_katki_payi", { precision: 15, scale: 2 }),
  musteriKartiTipi: varchar("musteri_karti_tipi"),
  duzenlemeNedeni: varchar("duzenleme_nedeni"),
  daskPoliceNo: varchar("dask_police_no"),
  
  // Kişisel Bilgiler
  dogumTarihi: date("dogum_tarihi"),
  izinliPazarlama: varchar("izinli_pazarlama"),
  kvkk: varchar("kvkk"),
  hesapTemsilciAdi: varchar("hesap_temsilci_adi"),
  cinsiyet: varchar("cinsiyet"),
  ozelSaha3: varchar("ozel_saha_3"),
  
  // Poliçe ID
  policeId: varchar("police_id"),
  firmaTipi: varchar("firma_tipi"),
  kurFarkiZeyli: varchar("kur_farki_zeyli"),
  
  // Kazanılmış Primler
  kazanilmisNetPrim: decimal("kazanilmis_net_prim", { precision: 15, scale: 2 }),
  kazanilmisBrutPrim: decimal("kazanilmis_brut_prim", { precision: 15, scale: 2 }),
  kazanilmisNetPrimDvz: decimal("kazanilmis_net_prim_dvz", { precision: 15, scale: 2 }),
  
  // Hasar Bilgileri
  hasarKarlilikTl: decimal("hasar_karlilik_tl", { precision: 15, scale: 2 }),
  hasarKarlilikDvz: decimal("hasar_karlilik_dvz", { precision: 15, scale: 2 }),
  hasarKarlilikOraniYuzde: decimal("hasar_karlilik_orani_yuzde", { precision: 10, scale: 2 }),
  
  // Sigortalı Bilgileri
  sigortaliTckn: varchar("sigortali_tckn"),
  rizikoUavtKodu: varchar("riziko_uavt_kodu"),
  aracBedeli: decimal("arac_bedeli", { precision: 15, scale: 2 }),
  
  // Sistem Alanları
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Customer = typeof customers.$inferSelect;

// Customer Profiles table - Unified view of customers with aggregated data
export const customerProfiles = pgTable("customer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Unique identifier - uses hesapKodu as primary business key
  hesapKodu: varchar("hesap_kodu").unique(),
  
  // Customer identification
  tcKimlikNo: varchar("tc_kimlik_no"),
  vergiKimlikNo: varchar("vergi_kimlik_no"),
  
  // Customer info
  musteriIsmi: varchar("musteri_ismi"),
  musteriTipi: varchar("musteri_tipi"), // Bireysel / Kurumsal
  
  // Contact information (consolidated from latest policy)
  telefon1: varchar("telefon_1"),
  telefon2: varchar("telefon_2"),
  gsmNo: varchar("gsm_no"),
  ePosta: varchar("e_posta"),
  faksNo: varchar("faks_no"),
  
  // Address
  sehir: varchar("sehir"),
  semt: varchar("semt"),
  ilce: varchar("ilce"),
  adres1: text("adres_1"),
  adres2: text("adres_2"),
  
  // Personal info
  dogumTarihi: date("dogum_tarihi"),
  cinsiyet: varchar("cinsiyet"),
  meslekGrubu: varchar("meslek_grubu"),
  
  // Categorization
  referansGrubu: varchar("referans_grubu"),
  musteriKartiTipi: varchar("musteri_karti_tipi"),
  alternatifHesapKodu: varchar("alternatif_hesap_kodu"),
  
  // Representative
  hesapTemsilciAdi: varchar("hesap_temsilci_adi"),
  subeAdi: varchar("sube_adi"),
  
  // KVKK / Pazarlama
  izinliPazarlama: varchar("izinli_pazarlama"),
  kvkk: varchar("kvkk"),
  
  // Aggregated metrics (computed from policies)
  toplamPolice: integer("toplam_police").default(0),
  aktifPolice: integer("aktif_police").default(0),
  toplamBrutPrim: decimal("toplam_brut_prim", { precision: 15, scale: 2 }).default("0"),
  toplamNetPrim: decimal("toplam_net_prim", { precision: 15, scale: 2 }).default("0"),
  sahipOlunanUrunler: text("sahip_olunan_urunler"), // Comma separated list of branch names (ana_brans)
  sahipOlunanPoliceTurleri: text("sahip_olunan_police_turleri"), // Comma separated list of policy types
  aracSayisi: integer("arac_sayisi").default(0),
  
  // Vehicle information (aggregated from policies with vehicles)
  aracBilgileri: text("arac_bilgileri"), // JSON array of {marka, model, yil} objects
  
  // AI Analysis - hashtags generated by AI based on customer profile
  aiAnaliz: text("ai_analiz"), // Comma separated hashtags like #premium #kasko #audi
  aiAnalizTarihi: timestamp("ai_analiz_tarihi"), // Last AI analysis date
  
  // System fields
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCustomerProfileSchema = createInsertSchema(customerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCustomerProfile = z.infer<typeof insertCustomerProfileSchema>;
export type CustomerProfile = typeof customerProfiles.$inferSelect;

// Insurance Products table
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  category: varchar("category").notNull(),
  description: text("description"),
  targetAudience: varchar("target_audience"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// Segments table
export const segments = pgTable("segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  filterCriteria: jsonb("filter_criteria"),
  customerCount: integer("customer_count").default(0),
  aiInsight: text("ai_insight"),
  behaviors: jsonb("behaviors"),
  isAutoGenerated: boolean("is_auto_generated").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSegmentSchema = createInsertSchema(segments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertSegment = z.infer<typeof insertSegmentSchema>;
export type Segment = typeof segments.$inferSelect;

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  segmentId: varchar("segment_id"),
  status: varchar("status").default("draft"),
  targetCustomerCount: integer("target_customer_count").default(0),
  contactedCount: integer("contacted_count").default(0),
  convertedCount: integer("converted_count").default(0),
  startDate: date("start_date"),
  endDate: date("end_date"),
  campaignType: varchar("campaign_type"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;

// AI Analysis Results table
export const aiAnalyses = pgTable("ai_analyses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisType: varchar("analysis_type").notNull(),
  title: varchar("title").notNull(),
  insight: text("insight"),
  confidence: integer("confidence"),
  category: varchar("category"),
  customerIds: jsonb("customer_ids"),
  segmentId: varchar("segment_id"),
  metadata: jsonb("metadata"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiAnalysisSchema = createInsertSchema(aiAnalyses).omit({
  id: true,
  createdAt: true,
});
export type InsertAiAnalysis = z.infer<typeof insertAiAnalysisSchema>;
export type AiAnalysis = typeof aiAnalyses.$inferSelect;

export const aiCustomerPredictions = pgTable("ai_customer_predictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  analysisType: varchar("analysis_type").notNull(),
  customerId: varchar("customer_id").notNull(),
  profileId: varchar("profile_id"),
  customerName: varchar("customer_name"),
  currentProduct: varchar("current_product"),
  suggestedProduct: varchar("suggested_product"),
  probability: integer("probability").notNull(),
  reason: text("reason"),
  city: varchar("city"),
  hashtags: text("hashtags"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAiCustomerPredictionSchema = createInsertSchema(aiCustomerPredictions).omit({
  id: true,
  createdAt: true,
});
export type InsertAiCustomerPrediction = z.infer<typeof insertAiCustomerPredictionSchema>;
export type AiCustomerPrediction = typeof aiCustomerPredictions.$inferSelect;

// Column mapping for CSV import - maps Turkish CSV headers to database field names
export const csvColumnMapping: Record<string, keyof InsertCustomer> = {
  "Tanzim Tarihi": "tanzimTarihi",
  "Müşteri İsmi (Unvan)": "musteriIsmi",
  "Ünvan": "musteriIsmi",
  "Sigorta Ettiren": "musteriIsmi",
  "Hesap Kodu": "hesapKodu",
  "Sigorta Şirketi Adı": "sigortaSirketiAdi",
  "Araç Plakası": "aracPlakasi",
  "Ana Branş": "anaBrans",
  "Poliçe Kodu": "policeKodu",
  "Poliçe Türü": "policeTuru",
  "Dönem": "donem",
  "Poliçe Numarası": "policeNumarasi",
  "Zeyl Numarası": "zeylNumarasi",
  "Prodüktör / Tali Kodu": "produktorTaliKodu",
  "Prodüktör/ Tali Adı": "produktorTaliAdi",
  "Poliçe Kayıt Tipi": "policeKayitTipi",
  "Başlangıç Tarihi": "baslangicTarihi",
  "Bitiş Tarihi": "bitisTarihi",
  "Sigorta Şirketi Kodu": "sigortaSirketiKodu",
  "Para Birimi": "paraBirimi",
  "Brüt": "brut",
  "Net": "net",
  "Komisyon": "komisyon",
  "Tali Komsiyonu": "taliKomisyonu",
  "Acente Komisyonu (%)": "acenteKomisyonuYuzde",
  "Tali Komisyonu (%)": "taliKomisyonuYuzde",
  "Temsilci Adı": "temsilciAdi",
  "Hesap Oluşturma Tarihi": "hesapOlusturmaTarihi",
  "Poliçe Açıklaması": "policeAciklamasi",
  "Özel Kod": "ozelKod",
  "Peşin / Vadeli": "pesinVadeli",
  "Peşinat (TL)": "pesinat",
  "Taksit Sayısı": "taksitSayisi",
  "Kur": "kur",
  "Branş Kodu": "bransKodu",
  "Ruhsat Sahibi": "ruhsatSahibi",
  "Yenileme No": "yenilemeNo",
  "Evrak No": "evrakNo",
  "Branş Adı": "bransAdi",
  "Araç Markası": "aracMarkasi",
  "Araç Modeli": "aracModeli",
  "Araç Kullanım Tarzı": "aracKullanimTarzi",
  "Riziko Adresi-1": "rizikoAdresi1",
  "Riziko Adresi-2": "rizikoAdresi2",
  "Riziko İli": "rizikoIli",
  "Riziko İlçesi": "rizikoIlcesi",
  "Ara Branş Kodu": "araBransKodu",
  "Ödenen": "odenen",
  "Kalan": "kalan",
  "Şirkete Borç": "sirketeBorc",
  "Şirkete Kalan": "sirketeKalan",
  "Şirkete Ödenen": "sirketeOdenen",
  "İptal Sebebi": "iptalSebebi",
  "Şirkete Kartla Ödeme Durumu": "sirketeKartlaOdemeDurumu",
  "Ara Branş": "araBrans",
  "Yenilenme Durumu": "yenilenmeDurumu",
  "Yenileme Durumu": "yenilemeDurumu",
  "TC Kimlik No": "tcKimlikNo",
  "Vergi Kimlik No": "vergiKimlikNo",
  "Şube Adı": "subeAdi",
  "Teknik Personel Adı": "teknikPersonelAdi",
  "Yenileme Dönemi": "yenilemeDonemi",
  "Yenileme Kodu": "yenilemeKodu",
  "Şehir": "sehir",
  "Semt": "semt",
  "İlçe": "ilce",
  "Tecdit": "tecdit",
  "Tahsildar Adı": "tahsildarAdi",
  "Telefon-1": "telefon1",
  "Telefon-2": "telefon2",
  "Faks No": "faksNo",
  "GSM No": "gsmNo",
  "E-Posta": "ePosta",
  "Motor No": "motorNo",
  "Şase No": "saseNo",
  "Ruhsat No": "ruhsatNo",
  "Referans Grubu": "referansGrubu",
  "Özel Kod Adı": "ozelKodAdi",
  "Meslek Grubu": "meslekGrubu",
  "Model Yılı": "modelYili",
  "Alternatif Hesap Kodu": "alternatifHesapKodu",
  "Müşteri Tipi": "musteriTipi",
  "Adres-1": "adres1",
  "Adres-2": "adres2",
  "Normal Kayıt Tipi": "normalKayitTipi",
  "Eski Poliçe Brüt Prim": "eskiPoliceBrutPrim",
  "Eski Poliçe Net Prim": "eskiPoliceNetPrim",
  "Eski Poliçe Acente Komsiyonu": "eskiPoliceAcenteKomisyonu",
  "Eski Poliçe No": "eskiPoliceNo",
  "Eski Poliçe Türü": "eskiPoliceTuru",
  "Eski Poliçe Sigorta Şirketi": "eskiPoliceSigortaSirketi",
  "Eski Poliçe Tanzim Tarihi": "eskiPoliceTanzimTarihi",
  "Eski Poliçe Ana Branş": "eskiPoliceAnaBrans",
  "Eski Poliçe Bitiş Tarihi": "eskiPoliceBitisTarihi",
  "Yeni Poliçe Brüt Prim": "yeniPoliceBrutPrim",
  "Yeni Poliçe Net Prim": "yeniPoliceNetPrim",
  "Yeni Poliçe Acente Komisyonu": "yeniPoliceAcenteKomisyonu",
  "Yeni Poliçe No": "yeniPoliceNo",
  "Yeni Poliçe Türü": "yeniPoliceTuru",
  "Yeni Poliçe Sigorta Şirketi": "yeniPoliceSigortaSirketi",
  "Yeni Poliçe Tanzim Tarihi": "yeniPoliceTanzimTarihi",
  "Yeni Poliçe Ana Branş": "yeniPoliceAnaBrans",
  "Hesap Adı-2": "hesapAdi2",
  "Portföy Hakkı": "portfoyHakki",
  "Özel Saha-1": "ozelSaha1",
  "Özel Saha-2": "ozelSaha2",
  "Ortaklık Katkı Payı": "ortaklikKatkiPayi",
  "Müşteri Kartı Tipi": "musteriKartiTipi",
  "Düzenlenme Nedeni": "duzenlemeNedeni",
  "Dask Poliçe No": "daskPoliceNo",
  "Doğum Tarihi": "dogumTarihi",
  "İzinli Pazarlama": "izinliPazarlama",
  "KVKK": "kvkk",
  "Hesap Temsilci Adı": "hesapTemsilciAdi",
  "Cinsiyet": "cinsiyet",
  "Özel Saha-3": "ozelSaha3",
  "Poliçe ID": "policeId",
  "Firma Tipi": "firmaTipi",
  "Kur Farkı Zeyli": "kurFarkiZeyli",
  "Kazanılmış Net Prim": "kazanilmisNetPrim",
  "Kazanılmış Brüt Prim": "kazanilmisBrutPrim",
  "Kazanılmış Net Prim (DVZ)": "kazanilmisNetPrimDvz",
  "Hasar Kârlılık TL": "hasarKarlilikTl",
  "Hasar Kârlılık DVZ": "hasarKarlilikDvz",
  "Hasar Kârlılık Oranı (%)": "hasarKarlilikOraniYuzde",
  "Sigortalı TCKN": "sigortaliTckn",
  "Riziko UAVT Kodu": "rizikoUavtKodu",
  "Araç Bedeli": "aracBedeli",
};
