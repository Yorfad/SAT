
import * as fs from 'fs';
import * as path from 'path';
import * as xlsx from 'xlsx';

const EXCEL_FILES = [
    'Base_general_clientes.xlsx',
    'segunda_base_clientes.xlsx',
    'varios_clientes.xlsx'
];

function main() {
    console.log('--- EXCEL ANALYSIS ---');
    for (const fileName of EXCEL_FILES) {
        const filePath = path.join(__dirname, '../../', fileName);
        if (!fs.existsSync(filePath)) {
            console.warn(`File not found: ${filePath}`);
            continue;
        }

        console.log(`\n📄 FILE: ${fileName} (${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB)`);
        const workbook = xlsx.readFile(filePath);

        let totalRows = 0;
        for (const sheetName of workbook.SheetNames) {
            const sheet = workbook.Sheets[sheetName];
            // Get range
            const range = xlsx.utils.decode_range(sheet['!ref'] || 'A1:A1');
            const rowCount = range.e.r + 1;

            // Count non-empty rows roughly
            const data = xlsx.utils.sheet_to_json(sheet);

            console.log(`  - Sheet: "${sheetName}"`);
            console.log(`    - Dimensions: ${rowCount} rows`);
            console.log(`    - Data Rows (JSON): ${data.length}`);
            totalRows += data.length;
        }
        console.log(`  TOTAL DATA ROWS: ${totalRows}`);
    }
}
// Add grand total tracking if needed, but per-file is fine for now. 
// Let's verify duplication within Excel itself? 
// No, let's just count accurately first.
main();
