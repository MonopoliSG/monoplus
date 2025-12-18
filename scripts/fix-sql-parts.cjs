const fs = require('fs');
const path = require('path');

const sqlDir = path.join(__dirname, '../sql_parts');
const files = fs.readdirSync(sqlDir).filter(f => f.endsWith('.sql')).sort();

for (const file of files) {
  const filePath = path.join(sqlDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // Add VALUES after INSERT statement if missing
  if (content.includes('INSERT INTO') && !content.includes('VALUES')) {
    content = content.replace(/\)\n  \(gen_random_uuid\(\)/, ')\nVALUES\n  (gen_random_uuid()');
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${file}`);
}

console.log('All files fixed!');
