const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

async function importData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // Read CSV with Windows-1254 (Turkish) encoding
  const csvPath = path.join(__dirname, '../attached_assets/MERKEZ_MUTABAKATdata18112026_1766055466162.csv');
  const buffer = fs.readFileSync(csvPath);
  const content = iconv.decode(buffer, 'cp1254');
  
  const lines = content.split('\n');
  const header = lines[0].split(';').map(h => h.trim());
  
  console.log(`Found ${lines.length - 1} records to import`);
  
  // Column mapping from CSV to database
  const columnMap = {
    'Tanzim Tarihi': 'tanzim_tarihi',
    'Müşteri İsmi': 'musteri_ismi',
    'Hesap Kodu': 'hesap_kodu',
    'Sigorta Şirketi Adı': 'sigorta_sirketi_adi',
    'Araç Plakası': 'arac_plakasi',
    'Ana Branş': 'ana_brans',
    'Poliçe Kodu': 'police_kodu',
    'Poliçe Türü': 'police_turu',
    'Dönem': 'donem',
    'Poliçe Numarası': 'police_numarasi',
    'Zeyl Numarası': 'zeyl_numarasi',
    'Prodüktör (Tali) Kodu': 'produktor_tali_kodu',
    'Prodüktör (Tali) Adı': 'produktor_tali_adi',
    'Poliçe Kayıt Tipi': 'police_kayit_tipi',
    'Başlangıç Tarihi': 'baslangic_tarihi',
    'Bitiş Tarihi': 'bitis_tarihi',
    'Sigorta Şirketi Kodu': 'sigorta_sirketi_kodu',
    'Para Birimi': 'para_birimi',
    'Brüt': 'brut',
    'Net': 'net',
    'Komisyon': 'komisyon',
    'Tali Komisyonu': 'tali_komisyonu',
    'Acente Komisyonu %': 'acente_komisyonu_yuzde',
    'Tali Komisyonu %': 'tali_komisyonu_yuzde',
    'Temsilci Adı': 'temsilci_adi',
    'Hesap Oluşturma Tarihi': 'hesap_olusturma_tarihi',
    'Poliçe Açıklaması': 'police_aciklamasi',
    'Özel Kod': 'ozel_kod',
    'Peşin/Vadeli': 'pesin_vadeli',
    'Peşinat': 'pesinat',
    'Taksit Sayısı': 'taksit_sayisi',
    'Kur': 'kur',
    'Branş Kodu': 'brans_kodu',
    'Ruhsat Sahibi': 'ruhsat_sahibi',
    'Yenileme No': 'yenileme_no',
    'Evrak No': 'evrak_no',
    'Branş Adı': 'brans_adi',
    'Araç Marka': 'arac_markasi',
    'Araç Model': 'arac_modeli',
    'Araç Kullanım Tarzı': 'arac_kullanim_tarzi',
    'Riziko Adresi 1': 'riziko_adresi_1',
    'Riziko Adresi 2': 'riziko_adresi_2',
    'Riziko İli': 'riziko_ili',
    'Riziko İlçesi': 'riziko_ilcesi',
    'Ödenen': 'odenen',
    'Kalan': 'kalan',
    'Şirkete Borç': 'sirkete_borc',
    'Şirkete Kalan': 'sirkete_kalan',
    'Şirkete Ödenen': 'sirkete_odenen',
    'İptal Sebebi': 'iptal_sebebi',
    'Şirkete Kartla Ödeme Durumu': 'sirkete_kartla_odeme_durumu',
    'Ara Branş': 'ara_brans',
    'Yenilenme Durumu': 'yenilenme_durumu',
    'Yenileme Durumu': 'yenileme_durumu',
    'T.C. Kimlik No': 'tc_kimlik_no',
    'Vergi Kimlik No': 'vergi_kimlik_no',
    'Şube Adı': 'sube_adi',
    'Teknik Personel Adı': 'teknik_personel_adi',
    'Yenileme Dönemi': 'yenileme_donemi',
    'Yenileme Kodu': 'yenileme_kodu',
    'Şehir': 'sehir',
    'Semt': 'semt',
    'Tahsildar Adı': 'tahsildar_adi',
    'Telefon 1': 'telefon_1',
    'Telefon 2': 'telefon_2',
    'Faks No': 'faks_no',
    'GSM No': 'gsm_no',
    'E-Posta': 'e_posta',
    'Motor No': 'motor_no',
    'Şase No': 'sase_no',
    'Ruhsat No': 'ruhsat_no',
    'Referans Grubu': 'referans_grubu',
    'Özel Kod Adı': 'ozel_kod_adi',
    'Meslek Grubu': 'meslek_grubu',
    'Model Yılı': 'model_yili',
    'Alternatif Hesap Kodu': 'alternatif_hesap_kodu',
    'Müşteri Tipi': 'musteri_tipi',
    'Adres 1': 'adres_1',
    'Adres 2': 'adres_2',
    'Normal Kayıt Tipi': 'normal_kayit_tipi',
    'Eski Poliçe Brüt Prim': 'eski_police_brut_prim',
    'Eski Poliçe Net Prim': 'eski_police_net_prim',
    'Eski Poliçe Acente Komisyonu': 'eski_police_acente_komisyonu',
    'Eski Poliçe No': 'eski_police_no',
    'Eski Poliçe Türü': 'eski_police_turu',
    'Eski Poliçe Sigorta Şirketi': 'eski_police_sigorta_sirketi',
    'Eski Poliçe Tanzim Tarihi': 'eski_police_tanzim_tarihi',
    'Eski Poliçe Ana Branş': 'eski_police_ana_brans',
    'Eski Poliçe Bitiş Tarihi': 'eski_police_bitis_tarihi',
    'Yeni Poliçe Brüt Prim': 'yeni_police_brut_prim',
    'Yeni Poliçe Net Prim': 'yeni_police_net_prim',
    'Yeni Poliçe Acente Komisyonu': 'yeni_police_acente_komisyonu',
    'Yeni Poliçe No': 'yeni_police_no',
    'Yeni Poliçe Türü': 'yeni_police_turu',
    'Yeni Poliçe Sigorta Şirketi': 'yeni_police_sigorta_sirketi',
    'Yeni Poliçe Tanzim Tarihi': 'yeni_police_tanzim_tarihi',
    'Yeni Poliçe Ana Branş': 'yeni_police_ana_brans',
    'Doğum Tarihi': 'dogum_tarihi',
    'Cinsiyet': 'cinsiyet'
  };

  // Build header index map
  const headerIndex = {};
  header.forEach((h, i) => {
    const dbCol = columnMap[h];
    if (dbCol) headerIndex[dbCol] = i;
  });

  const dbColumns = Object.values(columnMap);
  
  // Parse date from DD-MM-YY or DD-MM-YYYY to YYYY-MM-DD
  function parseDate(val) {
    if (!val || val.trim() === '') return null;
    const parts = val.split('-');
    if (parts.length !== 3) return null;
    let [day, month, year] = parts;
    if (year.length === 2) {
      year = parseInt(year) > 50 ? '19' + year : '20' + year;
    }
    // Validate
    if (parseInt(day) === 0) day = '01';
    if (parseInt(month) === 0) month = '01';
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Parse Turkish decimal format
  function parseDecimal(val) {
    if (!val || val.trim() === '') return null;
    return parseFloat(val.replace('.', '').replace(',', '.')) || null;
  }

  // Parse integer
  function parseInt2(val) {
    if (!val || val.trim() === '') return null;
    return parseInt(val) || null;
  }

  const dateColumns = ['tanzim_tarihi', 'baslangic_tarihi', 'bitis_tarihi', 'hesap_olusturma_tarihi', 
    'eski_police_tanzim_tarihi', 'eski_police_bitis_tarihi', 'yeni_police_tanzim_tarihi', 'dogum_tarihi'];
  const decimalColumns = ['brut', 'net', 'komisyon', 'tali_komisyonu', 'acente_komisyonu_yuzde', 
    'tali_komisyonu_yuzde', 'pesinat', 'kur', 'odenen', 'kalan', 'sirkete_borc', 'sirkete_kalan', 
    'sirkete_odenen', 'eski_police_brut_prim', 'eski_police_net_prim', 'eski_police_acente_komisyonu',
    'yeni_police_brut_prim', 'yeni_police_net_prim', 'yeni_police_acente_komisyonu'];
  const intColumns = ['taksit_sayisi', 'model_yili'];

  let imported = 0;
  let errors = 0;
  const batchSize = 100;
  let batch = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = line.split(';');
    if (values.length < 10) continue; // Skip invalid rows
    
    const row = {};
    for (const col of dbColumns) {
      const idx = headerIndex[col];
      let val = idx !== undefined ? values[idx]?.trim() : null;
      
      if (!val || val === '') {
        row[col] = null;
      } else if (dateColumns.includes(col)) {
        row[col] = parseDate(val);
      } else if (decimalColumns.includes(col)) {
        row[col] = parseDecimal(val);
      } else if (intColumns.includes(col)) {
        row[col] = parseInt2(val);
      } else {
        row[col] = val;
      }
    }
    
    batch.push(row);
    
    if (batch.length >= batchSize) {
      try {
        await insertBatch(pool, dbColumns, batch);
        imported += batch.length;
        if (imported % 500 === 0) console.log(`Imported ${imported} records...`);
      } catch (err) {
        errors += batch.length;
        console.error(`Error at batch starting record ${i - batchSize}: ${err.message}`);
      }
      batch = [];
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    try {
      await insertBatch(pool, dbColumns, batch);
      imported += batch.length;
    } catch (err) {
      errors += batch.length;
      console.error(`Error in final batch: ${err.message}`);
    }
  }

  console.log(`\n=== Import Complete ===`);
  console.log(`Total imported: ${imported}`);
  console.log(`Errors: ${errors}`);

  await pool.end();
}

async function insertBatch(pool, columns, rows) {
  const colList = columns.join(', ');
  const values = [];
  const placeholders = rows.map((row, rowIdx) => {
    const rowPlaceholders = columns.map((col, colIdx) => {
      values.push(row[col]);
      return `$${rowIdx * columns.length + colIdx + 1}`;
    });
    return `(${rowPlaceholders.join(', ')})`;
  });
  
  const sql = `INSERT INTO customers (${colList}) VALUES ${placeholders.join(', ')}`;
  await pool.query(sql, values);
}

importData().catch(console.error);
