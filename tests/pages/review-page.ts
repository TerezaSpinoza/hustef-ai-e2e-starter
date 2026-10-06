import type { Locator, Page } from '@playwright/test';

/** The Review transfer page, its Confirm payment dialog and the confirmation page it leads to. */
export class ReviewPage {
  readonly heading: Locator;
  readonly details: Locator;
  readonly feeRow: Locator;
  readonly totalRow: Locator;
  readonly confirmButton: Locator;
  readonly paymentDialog: Locator;
  readonly submittedHeading: Locator;
  readonly backToAccountsLink: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Review transfer' });
    this.details = page.getByRole('table', { name: 'Transfer details' });
    this.feeRow = this.details.getByRole('row', { name: /^Fee/ });
    this.totalRow = this.details.getByRole('row', { name: /^Total/ });
    this.confirmButton = page.getByRole('button', { name: 'Send money' });
    this.paymentDialog = page.getByRole('dialog', { name: 'Payment approval' });
    this.submittedHeading = page.getByRole('heading', { level: 1, name: 'Money sent' });
    this.backToAccountsLink = page.getByRole('link', { name: 'Back to accounts' });
  }

  /** The PIN field sits in a closed shadow root: reach it with the keyboard from the Send money button. */
  async enterPin(pin: string): Promise<void> {
    await this.confirmButton.focus();
    await this.page.keyboard.press('Shift+Tab');
    await this.page.keyboard.type(pin);
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async approvePayment(): Promise<void> {
    await this.paymentDialog.getByTitle(/secure|approv|payment/i).contentFrame().getByRole('button', { name: 'Approve', exact: true }).click();
  }
}
