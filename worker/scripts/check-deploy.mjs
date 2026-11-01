import {readFile} from 'node:fs/promises';
const config=JSON.parse(await readFile(new URL('../wrangler.jsonc',import.meta.url),'utf8'));
const db=config.d1_databases?.find(x=>x.binding==='DB');
if(!db || db.database_id==='00000000-0000-0000-0000-000000000000' || !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(db.database_id)) {
 console.error('Cloudflare D1을 생성하고 worker/wrangler.jsonc의 database_id를 실제 값으로 설정하세요.');process.exit(1);
}
