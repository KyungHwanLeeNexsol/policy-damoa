import { test, expect } from '@playwright/test';

test('홈페이지가 정상적으로 로드된다', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/정책다모아/);
});
