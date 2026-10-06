// spec: specs/gremlin-bank.md
// seed: seed.spec.ts

import { test, expect, env } from './fixtures';
import { DashboardPage } from './pages/dashboard-page';
import { LoginPage } from './pages/login-page';
import { ReviewPage } from './pages/review-page';
import { TransferPage } from './pages/transfer-page';

test.describe('Domestic transfer', () => {
  test.beforeEach(async ({ page }) => {
    await new LoginPage(page).signInAsTestUser();
  });

  test('Successful transfer shows confirmation and updates the balance', async ({ page }) => {
    const review = new ReviewPage(page);
    const dashboard = new DashboardPage(page);

    // 1. Transfer 15,000 HUF from Everyday Account to Kiss Péter; enter the PIN and confirm.
    await new TransferPage(page).submit({ amount: '15000', reference: 'Plan probe' });
    await expect(review.heading).toBeVisible();
    await review.enterPin(env('GREMLIN_PIN'));
    await review.confirm();
    await expect(review.paymentDialog).toBeVisible();

    // 2. Select 'Approve payment'.
    await review.approvePayment();
    await expect(page).toHaveURL(/\/transfer\/done$/);
    await expect(review.submittedHeading).toBeVisible();
    await expect(page.getByText(/GB-[A-Z0-9]{6}/)).toBeVisible();
    await expect(page.getByText('1,234,800 HUF')).toBeVisible(); // 1,250,000 - 15,000 - 200

    // 3. Select 'Back to accounts'.
    await review.backToAccountsLink.click();
    await expect(dashboard.account('Everyday Account')).toContainText('1,234,800 HUF');
    await expect(dashboard.account('Savings Account')).toContainText('5,400,000 HUF');
    await expect(dashboard.recentTransactionRows.nth(1)).toContainText('Transfer to Kiss Péter-15,200 HUF');
  });

  test('Empty form shows required-field errors', async ({ page }) => {
    const transfer = new TransferPage(page);

    // 1. Open /transfer and select Continue with all fields empty.
    await transfer.goto();
    await transfer.continueButton.click();
    await expect(page.getByText('Enter a beneficiary name.')).toBeVisible();
    await expect(page.getByText('Check the IBAN first.')).toBeVisible();
    await expect(page.getByText('Enter an amount greater than 0.')).toBeVisible();
    await expect(page).toHaveURL(/\/transfer$/);
  });

  test('Invalid IBAN is rejected and blocks the transfer', async ({ page }) => {
    const transfer = new TransferPage(page);

    // 1. Type an invalid IBAN, select 'Check IBAN'.
    await transfer.goto();
    await transfer.checkIban('HU00 1234');
    await expect(page.getByText('Invalid IBAN')).toBeVisible();
    await transfer.beneficiaryName.fill('Kiss Péter');
    await transfer.amount.fill('1000');
    await transfer.continueButton.click();
    await expect(page).toHaveURL(/\/transfer$/);
    await expect(new ReviewPage(page).heading).toHaveCount(0);
  });

  test('Amount equal to the balance is rejected because the fee must be covered', async ({ page }) => {
    // 3. From Everyday Account enter 1,250,000 (equal to the balance).
    await new TransferPage(page).submit({ amount: '1250000' });
    await expect(page.getByText('Insufficient funds.')).toBeVisible();
    await expect(page).toHaveURL(/\/transfer$/);
  });

  // Fee = 0.3% of the amount, at least 200 HUF, at most 6,000 HUF.
  const feeExamples = [
    { from: 'Everyday Account', amount: '60000', fee: '200 HUF', total: '60,200 HUF' }, // 0.3% = 180, minimum applies
    { from: 'Everyday Account', amount: '70000', fee: '210 HUF', total: '70,210 HUF' }, // just above the minimum
    { from: 'Everyday Account', amount: '100000', fee: '300 HUF', total: '100,300 HUF' },
    { from: 'Savings Account', amount: '2000000', fee: '6,000 HUF', total: '2,006,000 HUF' }, // maximum fee
  ] as const;

  for (const { from, amount, fee, total } of feeExamples) {
    test(`Fee for ${amount} HUF from ${from} is ${fee}`, async ({ page }) => {
      const review = new ReviewPage(page);
      await new TransferPage(page).submit({ from, amount });
      await expect(review.heading).toBeVisible();
      await expect(review.feeRow).toContainText(fee);
      await expect(review.totalRow).toContainText(total);
    });
  }
});
