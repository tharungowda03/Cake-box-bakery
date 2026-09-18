import xlsx from 'xlsx';
import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';

async function parse() {
  console.log('--- EXCEL ---');
  const excelPath = path.join('..', 'data', 'Cake_Box_Kakinada_Menu.xlsx');
  const workbook = xlsx.readFile(excelPath);
  for (const sheetName of workbook.SheetNames) {
    console.log(`\nSheet: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    console.log(`Row count: ${data.length}`);
    console.log(JSON.stringify(data.slice(0, 5), null, 2)); // Preview first 5 rows
    // Dump all data to a file for detailed inspection
    fs.writeFileSync(`excel_data_${sheetName}.json`, JSON.stringify(data, null, 2));
  }

  console.log('\n--- DOCX ---');
  const docxPath = path.join('..', 'data', 'Cake_Box_Kakinada_Ecommerce_Master_Information.docx');
  const result = await mammoth.extractRawText({ path: docxPath });
  fs.writeFileSync('docx_data.txt', result.value);
  console.log('Parsed docx');
}

parse().catch(console.error);
