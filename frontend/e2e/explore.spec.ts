import { test, expect } from '@playwright/test';
test('모바일 홈에서 별칭 검색 후 상세와 출처 확인', async ({page}) => {
 await page.goto('/');
 await expect(page.getByRole('heading', {name: '이름 하나에서 시작되는 신화 탐색'})).toBeVisible();
 await page.getByRole('searchbox').fill('Woden');
 await page.getByRole('button', {name: '검색', exact: true}).click();
 await expect(page).toHaveURL(/q=Woden/);
 await expect(page.locator('.entry-card')).toHaveCount(1);
 await page.locator('.entry-card').click();
 await expect(page).toHaveURL(/entries\/odin/);
 await expect(page.getByRole('heading', {name: '오딘',exact:true})).toBeVisible();
 await expect(page.locator('.source a')).toHaveAttribute('href','https://www.gutenberg.org/ebooks/18947');
 await expect(page.getByText('아직 연결된 항목이 없어요.')).toBeVisible();
 await page.screenshot({path: 'test-results/detail-mobile.png',fullPage:true});
 const sizes = await page.locator('main *').evaluateAll(nodes => nodes.filter(n=>n.textContent?.trim()).map(n=>parseFloat(getComputedStyle(n).fontSize)));
 expect(Math.min(...sizes)).toBeGreaterThan(11);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('필터 URL 공유·새로고침 복원과 빈 결과 초기화',async ({page})=>{
 await page.goto('/search?q=Odin&culture=norse&category=god&tag=wisdom');
 await expect(page.locator('.entry-card')).toHaveCount(1);
 await page.reload();
 await expect(page.getByLabel('문화권',{exact:true})).toHaveValue('norse');
 await expect(page.getByLabel('존재 유형',{exact:true})).toHaveValue('god');
 await expect(page.getByLabel('주제',{exact:true})).toHaveValue('wisdom');
 await page.getByRole('searchbox').fill('없는이름');await page.getByRole('button',{name:'검색',exact:true}).click();
 await expect(page.getByRole('heading',{name:'검색 결과가 없어요'})).toBeVisible();
 await page.getByRole('link',{name:'조건 초기화'}).click();await expect(page.locator('.entry-card')).toHaveCount(1);
});
test('조회 실패·재시도와 없는 항목의 탐색 경로',async ({page})=>{
 await page.route('**/api/v1/entries?*',route=>route.fulfill({status:503,body:'{}'}));
 await page.goto('/');await expect(page.getByRole('button',{name:'다시 시도'})).toBeVisible();
 await page.unroute('**/api/v1/entries?*');await page.getByRole('button',{name:'다시 시도'}).click();await expect(page.locator('.entry-card')).toHaveCount(1);
 await page.screenshot({path:'test-results/home-mobile.png',fullPage:true});
 await page.goto('/entries/missing');await expect(page.getByText('항목을 찾을 수 없어요.')).toBeVisible();await expect(page.getByRole('link',{name:'사전 탐색하기'})).toBeVisible();
});
