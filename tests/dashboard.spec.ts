// spec: specs/gremlin-bank.md
// seed: seed.spec.ts

import { test, expect } from './fixtures';
import { DashboardPage } from './pages/dashboard-page';
import { LoginPage } from './pages/login-page';

test.describe('Dashboard', () => {
  test('Dashboard shows both accounts with IBAN and balance', async ({ page }) => {
    const dashboard = new DashboardPage(page);

    // 1. Sign in and wait for the 'Loading accounts...' status to disappear.
    await new LoginPage(page).signInAsTestUser();
    await expect(dashboard.loadingAccounts).toBeHidden();

    const everyday = dashboard.account('Everyday Account');
    await expect(everyday).toContainText('HU39 9992 0265 3141 5926 5358 9797');
    await expect(everyday).toContainText('1,250,000 HUF');

    const savings = dashboard.account('Savings Account');
    await expect(savings).toContainText('HU03 9992 0265 2718 2818 2845 9043');
    await expect(savings).toContainText('5,400,000 HUF');

    await expect(dashboard.newTransferLink).toHaveAttribute('href', '/transfer');
  });

  test('Recent transactions table lists five entries newest first', async ({ page }) => {
    const dashboard = new DashboardPage(page);

    // 1. Sign in and read table 'Recent transactions'.
    await new LoginPage(page).signInAsTestUser();
    const rows = dashboard.recentTransactionRows;
    await expect(rows).toHaveCount(6); // header + 5 entries
    await expect(rows.nth(1)).toContainText('2026-09-30Grocery store, Budapest-18,450 HUF');
    await expect(rows.nth(2)).toContainText('2026-09-29Salary, Gremlin Works Ltd.+685,000 HUF');
    await expect(rows.nth(3)).toContainText('2026-09-27Mobile phone bill-7,990 HUF');
    await expect(rows.nth(4)).toContainText('2026-09-25Card payment, bookshop-12,300 HUF');
    await expect(rows.nth(5)).toContainText('2026-09-24Transfer from Savings Account+50,000 HUF');
  });
});
