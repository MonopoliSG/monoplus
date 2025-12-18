const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../supabase_import.sql');
const outputDir = path.join(__dirname, '../sql_parts');

// Clean output directory
fs.readdirSync(outputDir).forEach(f => fs.unlinkSync(path.join(outputDir, f)));

const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split('\n');

// Find INSERT line and modify to exclude id column
let insertLine = '';
let valuesStart = -1;
const records = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.startsWith('INSERT INTO')) {
    // Remove 'id, ' from the column list
    insertLine = line.replace('(id, ', '(');
  } else if (line === 'VALUES') {
    valuesStart = i + 1;
  } else if (valuesStart > 0 && line.trim().startsWith('(gen_random_uuid()')) {
    // Remove 'gen_random_uuid(), ' from each record
    let fixedLine = line.replace(/\(gen_random_uuid\(\), /, '(');
    // Fix invalid dates
    fixedLine = fixedLine.replace(/'(\d{4})-(\d{2})-00'/g, "NULL");
    records.push(fixedLine);
  }
}

console.log(`Found ${records.length} records`);

const recordsPerFile = 200;
const totalParts = Math.ceil(records.length / recordsPerFile);

for (let part = 0; part < totalParts; part++) {
  const start = part * recordsPerFile;
  const end = Math.min(start + recordsPerFile, records.length);
  const partRecords = records.slice(start, end);
  
  // Fix last record
  let lastRecord = partRecords[partRecords.length - 1];
  if (lastRecord.endsWith(',')) {
    partRecords[partRecords.length - 1] = lastRecord.slice(0, -1) + ';';
  } else if (!lastRecord.endsWith(';')) {
    partRecords[partRecords.length - 1] = lastRecord + ';';
  }
  
  const sql = `${insertLine}\nVALUES\n${partRecords.join('\n')}`;
  const filename = path.join(outputDir, `part_${String(part + 1).padStart(2, '0')}.sql`);
  fs.writeFileSync(filename, sql);
}

console.log(`Created ${totalParts} files (without id column)`);
