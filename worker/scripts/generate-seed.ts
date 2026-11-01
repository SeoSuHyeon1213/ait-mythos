import {URL as NodeURL} from 'node:url';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { seedStatements } from '../src/content/seed';
const data: unknown=JSON.parse(await readFile(new NodeURL('../content/entries.json',import.meta.url),'utf8'));
const sql=seedStatements(data).join('\n')+'\n';
await mkdir(new NodeURL('../.generated/',import.meta.url),{recursive:true});
await writeFile(new NodeURL('../.generated/seed.sql',import.meta.url),sql);
console.log('Validated seed SQL generated.');
