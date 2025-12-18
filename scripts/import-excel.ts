import ExcelJS from 'exceljs';
import { db } from '../server/db';
import { customers } from '../shared/schema';
import { eq } from 'drizzle-orm';

const csvColumnMapping: Record<string, string> = {
  "Tanzim Tarihi": "tanzimTarihi",
  "Ünvan": "musteriIsmi",
  "Sigorta Ettiren": "musteriIsmi",
  "Hesap Kodu": "hesapKodu",
  "Sigorta Şirketi Adı": "sigortaSirketiAdi",
  "Araç Plakası": "aracPlakasi",
  "Ana Branş": "anaBrans",
  "Poliçe Kodu": "policeKodu",
  "Poliçe Türü": "policeTuru",
  "Dönem": "donem",
  "Poliçe No": "policeNumarasi",
  "Poliçe Numarası": "policeNumarasi",
  "Zeyl No": "zeylNumarasi",
  "Zeyl Numarası": "zeylNumarasi",
  "Prodüktör Tali Kodu": "produktorTaliKodu",
  "Prodüktör / Tali Kodu": "produktorTaliKodu",
  "Prodüktör Tali Adı": "produktorTaliAdi",
  "Prodüktör/ Tali Adı": "produktorTaliAdi",
  "Poliçe Kayıt Tipi": "policeKayitTipi",
  "Poliçe Başlangıç Tarihi": "baslangicTarihi",
  "Başlangıç Tarihi": "baslangicTarihi",
  "Poliçe Bitiş Tarihi": "bitisTarihi",
  "Bitiş Tarihi": "bitisTarihi",
  "Sigorta Şirketi Kodu": "sigortaSirketiKodu",
  "Para Birimi": "paraBirimi",
  "Brüt": "brut",
  "Net": "net",
  "Komisyon": "komisyon",
  "Tali Komisyonu": "taliKomisyonu",
  "Acente Komisyonu %": "acenteKomisyonuYuzde",
  "Tali Komisyonu %": "taliKomisyonuYuzde",
  "Temsilci Adı": "temsilciAdi",
  "Hesap Oluşturma Tarihi": "hesapOlusturmaTarihi",
  "Poliçe Açıklaması": "policeAciklamasi",
  "Özel Kod": "ozelKod",
  "Peşin/Vadeli": "pesinVadeli",
  "Peşinat": "pesinat",
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
  "Riziko Adresi 1": "rizikoAdresi1",
  "Riziko Adresi 2": "rizikoAdresi2",
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
  "Telefon 1": "telefon1",
  "Telefon 2": "telefon2",
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
  "Adres 1": "adres1",
  "Adres 2": "adres2",
  "Normal Kayıt Tipi": "normalKayitTipi",
  "Eski Poliçe Brüt Prim": "eskiPoliceBrutPrim",
  "Eski Poliçe Net Prim": "eskiPoliceNetPrim",
  "Eski Poliçe Acente Komisyonu": "eskiPoliceAcenteKomisyonu",
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
  "Hesap Adı 2": "hesapAdi2",
  "Portföy Hakkı": "portfoyHakki",
  "Özel Saha 1": "ozelSaha1",
  "Özel Saha 2": "ozelSaha2",
  "Ortaklık Katkı Payı": "ortaklikKatkiPayi",
  "Müşteri Kartı Tipi": "musteriKartiTipi",
  "Düzenleme Nedeni": "duzenlemeNedeni",
  "DASK Poliçe No": "daskPoliceNo",
  "Doğum Tarihi": "dogumTarihi",
  "İzinli Pazarlama": "izinliPazarlama",
  "KVKK": "kvkk",
  "Hesap Temsilci Adı": "hesapTemsilciAdi",
  "Cinsiyet": "cinsiyet",
  "Özel Saha 3": "ozelSaha3",
  "Poliçe ID": "policeId",
  "Firma Tipi": "firmaTipi",
  "Kur Farkı Zeyli": "kurFarkiZeyli",
  "Kazanılmış Net Prim": "kazanilmisNetPrim",
  "Kazanılmış Brüt Prim": "kazanilmisBrutPrim",
  "Kazanılmış Net Prim (Dvz)": "kazanilmisNetPrimDvz",
  "Hasar Karlılık (TL)": "hasarKarlilikTl",
  "Hasar Karlılık (Dvz)": "hasarKarlilikDvz",
  "Hasar Karlılık Oranı (%)": "hasarKarlilikOraniYuzde",
  "Sigortalı TCKN": "sigortaliTckn",
  "Riziko UAVT Kodu": "rizikoUavtKodu",
  "Araç Bedeli": "aracBedeli",
};

const dateFields = new Set([
  "tanzimTarihi", "baslangicTarihi", "bitisTarihi", "hesapOlusturmaTarihi",
  "eskiPoliceTanzimTarihi", "eskiPoliceBitisTarihi", "yeniPoliceTanzimTarihi", "dogumTarihi"
]);

const decimalFields = new Set([
  "brut", "net", "komisyon", "taliKomisyonu", "acenteKomisyonuYuzde", "taliKomisyonuYuzde",
  "pesinat", "kur", "odenen", "kalan", "sirketeBorc", "sirketeKalan", "sirketeOdenen",
  "eskiPoliceBrutPrim", "eskiPoliceNetPrim", "eskiPoliceAcenteKomisyonu",
  "yeniPoliceBrutPrim", "yeniPoliceNetPrim", "yeniPoliceAcenteKomisyonu",
  "ortaklikKatkiPayi", "kazanilmisNetPrim", "kazanilmisBrutPrim", "kazanilmisNetPrimDvz",
  "hasarKarlilikTl", "hasarKarlilikDvz", "hasarKarlilikOraniYuzde", "aracBedeli"
]);

const integerFields = new Set(["taksitSayisi", "modelYili"]);

function parseRow(row: Record<string, string>): Record<string, any> {
  const customer: Record<string, any> = {};
  
  for (const [csvHeader, fieldName] of Object.entries(csvColumnMapping)) {
    const value = row[csvHeader];
    if (value === undefined || value === null || value === "") continue;
    
    if (dateFields.has(fieldName)) {
      const dateStr = value.trim();
      if (dateStr) {
        customer[fieldName] = dateStr;
      }
    } else if (decimalFields.has(fieldName)) {
      const numStr = value.replace(/\./g, "").replace(",", ".");
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        customer[fieldName] = num.toString();
      }
    } else if (integerFields.has(fieldName)) {
      const num = parseInt(value, 10);
      if (!isNaN(num)) {
        customer[fieldName] = num;
      }
    } else {
      customer[fieldName] = value.trim();
    }
  }
  
  return customer;
}

async function importExcel() {
  const filePath = 'attached_assets/data_1766061962324.xlsx';
  
  console.log('Loading Excel file...');
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  
  const worksheet = workbook.getWorksheet(1);
  if (!worksheet) {
    throw new Error('No worksheet found');
  }

  console.log('Clearing existing customers...');
  await db.delete(customers);
  console.log('Existing customers cleared');

  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value?.toString() || '';
  });

  console.log(`Found ${headers.filter(h => h).length} columns`);
  console.log('Sample headers:', headers.slice(1, 10).join(', '));

  let created = 0;
  let errors = 0;
  const totalRows = worksheet.rowCount - 1;

  console.log(`Processing ${totalRows} rows...`);

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
    const row = worksheet.getRow(rowNumber);
    const rowData: Record<string, string> = {};
    
    row.eachCell((cell, colNumber) => {
      const header = headers[colNumber];
      if (header) {
        let value = '';
        if (cell.value instanceof Date) {
          value = cell.value.toISOString().split('T')[0];
        } else if (typeof cell.value === 'object' && cell.value !== null) {
          value = (cell.value as any).text || (cell.value as any).result?.toString() || '';
        } else {
          value = cell.value?.toString() || '';
        }
        rowData[header] = value;
      }
    });

    if (Object.keys(rowData).length === 0) continue;

    try {
      const customerData = parseRow(rowData);
      
      if (!customerData.tcKimlikNo && !customerData.vergiKimlikNo) {
        continue;
      }

      await db.insert(customers).values(customerData as any);
      created++;
      
      if (created % 500 === 0) {
        console.log(`Progress: ${created} / ${totalRows} rows imported...`);
      }
    } catch (err: any) {
      errors++;
      if (errors <= 5) {
        console.error(`Row ${rowNumber} error:`, err.message);
      }
    }
  }

  console.log('\n=== Import Complete ===');
  console.log(`Created: ${created}`);
  console.log(`Errors: ${errors}`);
  console.log(`Total rows processed: ${totalRows}`);

  process.exit(0);
}

importExcel().catch(err => {
  console.error('Import failed:', err);
  process.exit(1);
});
