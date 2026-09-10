import fs from 'node:fs/promises';
import {FileBlob, SpreadsheetFile} from '@oai/artifact-tool';
const out=new URL('.',import.meta.url);
const w=await SpreadsheetFile.importXlsx(await FileBlob.load('/Users/joaomvalente/Downloads/Campanha_EA_2026_REV-006.xlsx'));
const result=await w.inspect({kind:'workbook,sheet,table',maxChars:6000,tableMaxRows:3,tableMaxCols:4});
await fs.writeFile(new URL('artifact_inspect.ndjson',out),result.ndjson);
for(const [sheetName,range,file] of [['>>RIO DE JANEIRO<<','A1:D30','indice.png'],['Barra Mansa','A1:I8','territorio.png'],['Dani Cunha','A1:I8','dobrada.png']]) {
  const blob=await w.render({sheetName,range,scale:1,format:'png'});
  await fs.writeFile(new URL(file,out),new Uint8Array(await blob.arrayBuffer()));
  console.log('Visualizado: '+sheetName+' '+range);
}
