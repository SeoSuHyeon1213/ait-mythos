import {test,expect} from '@playwright/test';
test('Cloudflare static assets의 상세 직접 진입과 API 404 구분',async({page,request})=>{
 await page.goto('http://127.0.0.1:5080/entries/odin');
 await expect(page.getByRole('heading',{name:'오딘',exact:true})).toBeVisible();
 const response=await request.get('http://127.0.0.1:5080/api/unknown',{headers:{'Sec-Fetch-Mode':'navigate',Accept:'text/html'}});
 expect(response.status()).toBe(404);
 expect(response.headers()['content-type']).toContain('application/problem+json');
});
