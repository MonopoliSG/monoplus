const fs = require('fs');
const path = require('path');

const inputFile = 'supabase_import.sql';
const outputDir = 'sql_parts';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split('\n');

const recordsPerFile = 200;
let currentPart = 1;
let currentLines = [];
let recordCount = 0;
let inInsert = false;
let insertHeader = '';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.startsWith('INSERT INTO')) {
    insertHeader = line;
    inInsert = true;
    currentLines = [insertHeader];
    continue;
  }
  
  if (inInsert && line.trim().startsWith('(gen_random_uuid()')) {
    currentLines.push(line);
    recordCount++;
    
    if (recordCount >= recordsPerFile) {
      let lastLine = currentLines[currentLines.length - 1];
      if (lastLine.endsWith(',')) {
        currentLines[currentLines.length - 1] = lastLine.slice(0, -1) + ';';
      } else if (!lastLine.endsWith(';')) {
        currentLines[currentLines.length - 1] = lastLine + ';';
      }
      
      const filename = path.join(outputDir, `part_${String(currentPart).padStart(2, '0')}.sql`);
      fs.writeFileSync(filename, currentLines.join('\n'));
      console.log(`Created ${filename} with ${recordCount} records`);
      
      currentPart++;
      recordCount = 0;
      currentLines = [insertHeader];
    }
  }
}

if (recordCount > 0) {
  let lastLine = currentLines[currentLines.length - 1];
  if (lastLine.endsWith(',')) {
    currentLines[currentLines.length - 1] = lastLine.slice(0, -1) + ';';
  } else if (!lastLine.endsWith(';')) {
    currentLines[currentLines.length - 1] = lastLine + ';';
  }
  
  const filename = path.join(outputDir, `part_${String(currentPart).padStart(2, '0')}.sql`);
  fs.writeFileSync(filename, currentLines.join('\n'));
  console.log(`Created ${filename} with ${recordCount} records`);
}

console.log(`\nTotal: ${currentPart} files created in ${outputDir}/`);
