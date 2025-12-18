const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

async function importData() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const csvPath = path.join(__dirname, '../attached_assets/MERKEZ_MUTABAKATdata18112026_1766055466162.csv');
  const buffer = fs.readFileSync(csvPath);
  const content = iconv.decode(buffer, 'cp1254');
  
  const lines = content.split('\n');
  console.log(`Total lines: ${lines.length}`);
  
  // CSV uses commas and may have quoted fields
  function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  // Column mapping from CSV index to database column name
  const colMapping = [
    { idx: 0, db: 'tanzim_tarihi', type: 'date' },
    { idx: 1, db: 'musteri_ismi', type: 'text' },
    { idx: 2, db: 'hesap_kodu', type: 'text' },
    { idx: 3, db: 'sigorta_sirketi_adi', type: 'text' },
    { idx: 4, db: 'arac_plakasi', type: 'text' },
    { idx: 5, db: 'ana_brans', type: 'text' },
    { idx: 6, db: 'police_kodu', type: 'text' },
    { idx: 7, db: 'police_turu', type: 'text' },
    { idx: 8, db: 'donem', type: 'text' },
    { idx: 9, db: 'police_numarasi', type: 'text' },
    { idx: 10, db: 'zeyl_numarasi', type: 'text' },
    { idx: 11, db: 'produktor_tali_kodu', type: 'text' },
    { idx: 12, db: 'produktor_tali_adi', type: 'text' },
    { idx: 13, db: 'police_kayit_tipi', type: 'text' },
    { idx: 14, db: 'baslangic_tarihi', type: 'date' },
    { idx: 15, db: 'bitis_tarihi', type: 'date' },
    { idx: 16, db: 'sigorta_sirketi_kodu', type: 'text' },
    { idx: 17, db: 'para_birimi', type: 'text' },
    { idx: 18, db: 'brut', type: 'decimal' },
    { idx: 19, db: 'net', type: 'decimal' },
    { idx: 20, db: 'komisyon', type: 'decimal' },
    { idx: 21, db: 'tali_komisyonu', type: 'decimal' },
    { idx: 22, db: 'acente_komisyonu_yuzde', type: 'decimal' },
    { idx: 23, db: 'tali_komisyonu_yuzde', type: 'decimal' },
    { idx: 25, db: 'temsilci_adi', type: 'text' },
    { idx: 26, db: 'hesap_olusturma_tarihi', type: 'date' },
    { idx: 27, db: 'police_aciklamasi', type: 'text' },
    { idx: 28, db: 'ozel_kod', type: 'text' },
    { idx: 29, db: 'pesin_vadeli', type: 'text' },
    { idx: 30, db: 'pesinat', type: 'decimal' },
    { idx: 31, db: 'taksit_sayisi', type: 'int' },
    { idx: 32, db: 'kur', type: 'decimal' },
    { idx: 33, db: 'brans_kodu', type: 'text' },
    { idx: 34, db: 'ruhsat_sahibi', type: 'text' },
    { idx: 35, db: 'yenileme_no', type: 'text' },
    { idx: 36, db: 'evrak_no', type: 'text' },
    { idx: 37, db: 'brans_adi', type: 'text' },
    { idx: 38, db: 'arac_markasi', type: 'text' },
    { idx: 39, db: 'arac_modeli', type: 'text' },
    { idx: 40, db: 'arac_kullanim_tarzi', type: 'text' },
    { idx: 41, db: 'riziko_adresi_1', type: 'text' },
    { idx: 42, db: 'riziko_adresi_2', type: 'text' },
    { idx: 43, db: 'riziko_ili', type: 'text' },
    { idx: 44, db: 'riziko_ilcesi', type: 'text' },
    { idx: 45, db: 'odenen', type: 'decimal' },
    { idx: 46, db: 'kalan', type: 'decimal' },
    { idx: 47, db: 'sirkete_borc', type: 'decimal' },
    { idx: 48, db: 'sirkete_kalan', type: 'decimal' },
    { idx: 49, db: 'sirkete_odenen', type: 'decimal' },
    { idx: 50, db: 'iptal_sebebi', type: 'text' },
    { idx: 53, db: 'sirkete_kartla_odeme_durumu', type: 'text' },
    { idx: 54, db: 'ara_brans', type: 'text' },
    { idx: 55, db: 'yenilenme_durumu', type: 'text' },
    { idx: 56, db: 'yenileme_durumu', type: 'text' },
    { idx: 57, db: 'tc_kimlik_no', type: 'text' },
    { idx: 58, db: 'vergi_kimlik_no', type: 'text' },
    { idx: 59, db: 'sube_adi', type: 'text' },
    { idx: 60, db: 'teknik_personel_adi', type: 'text' },
    { idx: 61, db: 'yenileme_donemi', type: 'text' },
    { idx: 62, db: 'yenileme_kodu', type: 'text' },
    { idx: 63, db: 'sehir', type: 'text' },
    { idx: 64, db: 'semt', type: 'text' },
    { idx: 65, db: 'tahsildar_adi', type: 'text' },
    { idx: 66, db: 'telefon_1', type: 'text' },
    { idx: 67, db: 'telefon_2', type: 'text' },
    { idx: 68, db: 'faks_no', type: 'text' },
    { idx: 69, db: 'gsm_no', type: 'text' },
    { idx: 70, db: 'e_posta', type: 'text' },
    { idx: 71, db: 'motor_no', type: 'text' },
    { idx: 72, db: 'sase_no', type: 'text' },
    { idx: 73, db: 'ruhsat_no', type: 'text' },
    { idx: 74, db: 'referans_grubu', type: 'text' },
    { idx: 75, db: 'ozel_kod_adi', type: 'text' },
    { idx: 76, db: 'meslek_grubu', type: 'text' },
    { idx: 77, db: 'model_yili', type: 'int' },
    { idx: 78, db: 'alternatif_hesap_kodu', type: 'text' },
    { idx: 79, db: 'musteri_tipi', type: 'text' },
    { idx: 80, db: 'adres_1', type: 'text' },
    { idx: 81, db: 'adres_2', type: 'text' },
    { idx: 82, db: 'normal_kayit_tipi', type: 'text' },
    { idx: 83, db: 'eski_police_brut_prim', type: 'decimal' },
    { idx: 84, db: 'eski_police_net_prim', type: 'decimal' },
    { idx: 85, db: 'eski_police_acente_komisyonu', type: 'decimal' },
    { idx: 86, db: 'eski_police_no', type: 'text' },
    { idx: 87, db: 'eski_police_turu', type: 'text' },
    { idx: 88, db: 'eski_police_sigorta_sirketi', type: 'text' },
    { idx: 89, db: 'eski_police_tanzim_tarihi', type: 'date' },
    { idx: 90, db: 'eski_police_ana_brans', type: 'text' },
    { idx: 91, db: 'eski_police_bitis_tarihi', type: 'date' },
    { idx: 92, db: 'yeni_police_brut_prim', type: 'decimal' },
    { idx: 93, db: 'yeni_police_net_prim', type: 'decimal' },
    { idx: 94, db: 'yeni_police_acente_komisyonu', type: 'decimal' },
    { idx: 95, db: 'yeni_police_no', type: 'text' },
    { idx: 96, db: 'yeni_police_turu', type: 'text' },
    { idx: 97, db: 'yeni_police_sigorta_sirketi', type: 'text' },
    { idx: 98, db: 'yeni_police_tanzim_tarihi', type: 'date' },
    { idx: 99, db: 'yeni_police_ana_brans', type: 'text' },
    { idx: 111, db: 'dogum_tarihi', type: 'date' },
    { idx: 116, db: 'cinsiyet', type: 'text' }
  ];

  // Parse date from DD-MM-YY to YYYY-MM-DD
  function parseDate(val) {
    if (!val || val.trim() === '') return null;
    const parts = val.split('-');
    if (parts.length !== 3) return null;
    let [day, month, year] = parts.map(p => p.trim());
    if (year.length === 2) {
      year = parseInt(year) > 50 ? '19' + year : '20' + year;
    }
    const d = parseInt(day), m = parseInt(month);
    if (d === 0 || m === 0 || isNaN(d) || isNaN(m)) return null;
    return `${year}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // Parse Turkish decimal
  function parseDecimal(val) {
    if (!val || val.trim() === '') return null;
    const cleaned = val.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  function parseInt2(val) {
    if (!val || val.trim() === '') return null;
    const num = parseInt(val);
    return isNaN(num) ? null : num;
  }

  const dbColumns = colMapping.map(c => c.db);
  let imported = 0;
  let errors = 0;
  const batchSize = 100;
  let batch = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseCSVLine(line);
    if (values.length < 100) continue;
    
    const row = {};
    for (const col of colMapping) {
      const val = values[col.idx];
      if (!val || val === '') {
        row[col.db] = null;
      } else if (col.type === 'date') {
        row[col.db] = parseDate(val);
      } else if (col.type === 'decimal') {
        row[col.db] = parseDecimal(val);
      } else if (col.type === 'int') {
        row[col.db] = parseInt2(val);
      } else {
        row[col.db] = val;
      }
    }
    
    batch.push(row);
    
    if (batch.length >= batchSize) {
      try {
        await insertBatch(pool, dbColumns, batch);
        imported += batch.length;
        if (imported % 500 === 0) console.log(`Imported ${imported}...`);
      } catch (err) {
        console.error(`Error at record ~${i}: ${err.message.slice(0, 100)}`);
        errors += batch.length;
      }
      batch = [];
    }
  }

  if (batch.length > 0) {
    try {
      await insertBatch(pool, dbColumns, batch);
      imported += batch.length;
    } catch (err) {
      console.error(`Final batch error: ${err.message.slice(0, 100)}`);
      errors += batch.length;
    }
  }

  console.log(`\n=== Complete ===`);
  console.log(`Imported: ${imported}`);
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
