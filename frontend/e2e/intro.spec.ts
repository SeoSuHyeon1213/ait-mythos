import { test, expect } from '@playwright/test';
test('첫 방문 인트로에서 시작하면 홈으로 가고 다시 보이지 않음', async ({page}) => {
 await page.goto('/');
 await expect(page.getByRole('heading', {name: /이야기 여행/})).toBeVisible();
 await page.screenshot({path: 'test-results/intro-mobile.png', fullPage: true});
 await page.getByRole('button', {name: '시작하기'}).click();
 await expect(page.getByRole('heading', {name: '이름 하나에서 시작되는 신화 탐색'})).toBeVisible();
 await page.reload();
 await expect(page.getByRole('button', {name: '시작하기'})).toHaveCount(0);
});
test('공유된 상세 링크는 인트로 없이 바로 열림', async ({page}) => {
 await page.goto('/entries/odin');
 await expect(page.getByRole('heading', {name: '오딘', exact: true})).toBeVisible();
});
