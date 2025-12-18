const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const inputFile = path.join(__dirname, '../attached_assets/MERKEZ_MUTABAKATdata18112026_1766055466162.csv');
const outputFile = path.join(__dirname, '../supabase_import.sql');

const csvColumnToDbColumn = {
  'Tanzim Tarihi': 'tanzim_tarihi',
  'Sigorta Ettiren': 'musteri_ismi',
  'Hesap Kodu': 'hesap_kodu',
  'Sigorta ?irketi Ad?': 'sigorta_sirketi_adi',
  'Araç Plakas?': 'arac_plakasi',
  'Ana Bran?': 'ana_brans',
  'Poliçe Kodu': 'police_kodu',
  'Poliçe Türü': 'police_turu',
  'Dönem': 'donem',
  'Poliçe Numaras?': 'police_numarasi',
  'Zeyl Numaras?': 'zeyl_numarasi',
  'Prodüktör / Tali Kodu': 'produktor_tali_kodu',
  'Prodüktör/ Tali Ad?': 'produktor_tali_adi',
  'Poliçe Kay?t Tipi': 'police_kayit_tipi',
  'Ba?lang?ç Tarihi': 'baslangic_tarihi',
  'Biti? Tarihi': 'bitis_tarihi',
  'Sigorta ?irketi Kodu': 'sigorta_sirketi_kodu',
  'Para Birimi': 'para_birimi',
  'Brüt': 'brut',
  'Net': 'net',
  'Komisyon': 'komisyon',
  'Tali Komsiyonu': 'tali_komisyonu',
  'Acente Komisyonu (%)': 'acente_komisyonu_yuzde',
  'Tali Komisyonu (%)': 'tali_komisyonu_yuzde',
  'Temsilci Ad?': 'temsilci_adi',
  'Hesap Olu?turma Tarihi': 'hesap_olusturma_tarihi',
  'Poliçe Aç?klamas?': 'police_aciklamasi',
  'Özel Kod': 'ozel_kod',
  'Pe?in / Vadeli': 'pesin_vadeli',
  'Pe?inat (TL)': 'pesinat',
  'Taksit Say?s?': 'taksit_sayisi',
  'Kur': 'kur',
  'Bran? Kodu': 'brans_kodu',
  'Ruhsat Sahibi': 'ruhsat_sahibi',
  'Yenileme No': 'yenileme_no',
  'Evrak No': 'evrak_no',
  'Bran? Ad?': 'brans_adi',
  'Araç Markas?': 'arac_markasi',
  'Araç Modeli': 'arac_modeli',
  'Araç Kullan?m Tarz?': 'arac_kullanim_tarzi',
  'Riziko Adresi-1': 'riziko_adresi_1',
  'Riziko Adresi-2': 'riziko_adresi_2',
  'Riziko ?li': 'riziko_ili',
  'Riziko ?lçesi': 'riziko_ilcesi',
  'Ödenen': 'odenen',
  'Kalan': 'kalan',
  '?irkete Borç': 'sirkete_borc',
  '?irkete Kalan': 'sirkete_kalan',
  '?irkete Ödenen': 'sirkete_odenen',
  '?ptal Sebebi': 'iptal_sebebi',
  '?irkete Kartla Ödeme Durumu': 'sirkete_kartla_odeme_durumu',
  'Ara Bran?': 'ara_brans',
  'Yenilenme Durumu': 'yenilenme_durumu',
  'Yenileme Durumu': 'yenileme_durumu',
  'TC Kimlik No': 'tc_kimlik_no',
  'Vergi Kimlik No': 'vergi_kimlik_no',
  '?ube Ad?': 'sube_adi',
  'Teknik Personel Ad?': 'teknik_personel_adi',
  'Yenileme Dönemi': 'yenileme_donemi',
  'Yenileme Kodu': 'yenileme_kodu',
  '?ehir': 'sehir',
  'Semt': 'semt',
  'Tahsildar Ad?': 'tahsildar_adi',
  'Telefon-1': 'telefon_1',
  'Telefon-2': 'telefon_2',
  'Faks No': 'faks_no',
  'GSM No': 'gsm_no',
  'E-Posta': 'e_posta',
  'Motor No': 'motor_no',
  '?ase No': 'sase_no',
  'Ruhsat No': 'ruhsat_no',
  'Referans Grubu': 'referans_grubu',
  'Özel Kod Ad?': 'ozel_kod_adi',
  'Meslek Grubu': 'meslek_grubu',
  'Model Y?l?': 'model_yili',
  'Alternatif Hesap Kodu': 'alternatif_hesap_kodu',
  'Mü?teri Tipi': 'musteri_tipi',
  'Adres-1': 'adres_1',
  'Adres-2': 'adres_2',
  'Normal Kay?t Tipi': 'normal_kayit_tipi',
  'Eski Poliçe Brüt Prim': 'eski_police_brut_prim',
  'Eski Poliçe Net Prim': 'eski_police_net_prim',
  'Eski Poliçe Acente Komsiyonu': 'eski_police_acente_komisyonu',
  'Eski Poliçe No': 'eski_police_no',
  'Eski Poliçe Türü': 'eski_police_turu',
  'Eski Poliçe Sigorta ?irketi': 'eski_police_sigorta_sirketi',
  'Eski Poliçe Tanzim Tarihi': 'eski_police_tanzim_tarihi',
  'Eski Poliçe Ana Bran?': 'eski_police_ana_brans',
  'Eski Poliçe Biti? Tarihi': 'eski_police_bitis_tarihi',
  'Yeni Poliçe Brüt Prim': 'yeni_police_brut_prim',
  'Yeni Poliçe Net Prim': 'yeni_police_net_prim',
  'Yeni Poliçe Acente Komisyonu': 'yeni_police_acente_komisyonu',
  'Yeni Poliçe No': 'yeni_police_no',
  'Yeni Poliçe Türü': 'yeni_police_turu',
  'Yeni Poliçe Sigorta ?irketi': 'yeni_police_sigorta_sirketi',
  'Yeni Poliçe Tanzim Tarihi': 'yeni_police_tanzim_tarihi',
  'Yeni Poliçe Ana Bran?': 'yeni_police_ana_brans',
  'Do?um Tarihi': 'dogum_tarihi',
  'Cinsiyet': 'cinsiyet',
};

const dateColumns = [
  'tanzim_tarihi', 'baslangic_tarihi', 'bitis_tarihi', 'hesap_olusturma_tarihi',
  'eski_police_tanzim_tarihi', 'eski_police_bitis_tarihi',
  'yeni_police_tanzim_tarihi', 'dogum_tarihi'
];

const numericColumns = [
  'brut', 'net', 'komisyon', 'tali_komisyonu', 'acente_komisyonu_yuzde',
  'tali_komisyonu_yuzde', 'pesinat', 'kur', 'odenen', 'kalan',
  'sirkete_borc', 'sirkete_kalan', 'sirkete_odenen',
  'eski_police_brut_prim', 'eski_police_net_prim', 'eski_police_acente_komisyonu',
  'yeni_police_brut_prim', 'yeni_police_net_prim', 'yeni_police_acente_komisyonu'
];

const integerColumns = ['taksit_sayisi', 'model_yili'];

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

function parseDate(dateStr) {
  if (!dateStr || dateStr.trim() === '') return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts;
  const fullYear = year.length === 2 ? (parseInt(year) > 50 ? '19' + year : '20' + year) : year;
  return fullYear + '-' + month.padStart(2, '0') + '-' + day.padStart(2, '0');
}

function parseNumber(numStr) {
  if (!numStr || numStr.trim() === '' || numStr === '.00') return null;
  let cleaned = numStr.replace(/"/g, '').trim();
  const isNegative = cleaned.startsWith('-');
  if (isNegative) cleaned = cleaned.substring(1);
  cleaned = cleaned.replace(/,/g, '');
  if (cleaned === '' || cleaned === '.00') return null;
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return isNegative ? -num : num;
}

function escapeSQL(str) {
  if (str === null || str === undefined || str === '') return 'NULL';
  return "'" + str.replace(/'/g, "''") + "'";
}

try {
  execSync('iconv -f cp1254 -t utf-8 "' + inputFile + '" > /tmp/customers_converted.csv');
} catch (e) {
  console.log('iconv failed, copying raw file');
  fs.copyFileSync(inputFile, '/tmp/customers_converted.csv');
}

const csvContent = fs.readFileSync('/tmp/customers_converted.csv', 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());
const headers = parseCSVLine(lines[0]);

console.log('Found', lines.length - 1, 'records');
console.log('Headers:', headers.length, 'columns');

const validDbColumns = [];
const headerIndexMap = {};

headers.forEach((header, idx) => {
  const dbCol = csvColumnToDbColumn[header];
  if (dbCol) {
    validDbColumns.push(dbCol);
    headerIndexMap[dbCol] = idx;
  }
});

console.log('Mapped columns:', validDbColumns.length);

let sql = '-- Customer Import SQL for Supabase\n';
sql += '-- Generated from MERKEZ_MUTABAKATdata18112026.csv\n';
sql += '-- Total records: ' + (lines.length - 1) + '\n\n';

let insertCount = 0;
const batchSize = 50;

for (let i = 1; i < lines.length; i++) {
  const values = parseCSVLine(lines[i]);
  if (values.length < 5) continue;
  
  const sqlValues = validDbColumns.map(col => {
    const idx = headerIndexMap[col];
    let val = values[idx] || '';
    
    if (dateColumns.includes(col)) {
      const parsed = parseDate(val);
      return parsed ? "'" + parsed + "'" : 'NULL';
    }
    
    if (numericColumns.includes(col)) {
      const parsed = parseNumber(val);
      return parsed !== null ? parsed.toString() : 'NULL';
    }
    
    if (integerColumns.includes(col)) {
      const num = parseInt(val);
      return isNaN(num) ? 'NULL' : num.toString();
    }
    
    return escapeSQL(val === '' ? null : val);
  });
  
  if (insertCount % batchSize === 0) {
    if (insertCount > 0) sql += ';\n\n';
    sql += 'INSERT INTO customers (id, ' + validDbColumns.join(', ') + ')\nVALUES\n';
  } else {
    sql += ',\n';
  }
  
  sql += '  (gen_random_uuid(), ' + sqlValues.join(', ') + ')';
  insertCount++;
}

sql += ';\n\n-- Summary: Total rows inserted: ' + insertCount + '\n';

fs.writeFileSync(outputFile, sql);
console.log('SQL file generated: ' + outputFile);
console.log('Total records: ' + insertCount);
