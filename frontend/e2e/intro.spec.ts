import { test, expect } from '@playwright/test';
test('접속할 때마다 인트로가 나오고 시작하면 홈으로 이동', async ({page}) => {
 await page.goto('/');
 await expect(page.getByRole('heading', {name: /이야기 여행/})).toBeVisible();
 await page.screenshot({path: 'test-results/intro-mobile.png', fullPage: true});
 await page.getByRole('button', {name: '시작하기'}).click();
 await expect(page.getByRole('heading', {name: '이름 하나에서 시작되는 신화 탐색'})).toBeVisible();
 await page.getByRole('link', {name: '전체 보기'}).click();
 await page.getByRole('link', {name: '홈으로'}).click();
 await expect(page.getByRole('button', {name: '시작하기'})).toHaveCount(0);
 await page.reload();
 await expect(page.getByRole('button', {name: '시작하기'})).toBeVisible();
});
test('공유된 상세 링크는 인트로 없이 바로 열림', async ({page}) => {
 await page.goto('/entries/odin');
 await expect(page.getByRole('heading', {name: '오딘', exact: true})).toBeVisible();
});
