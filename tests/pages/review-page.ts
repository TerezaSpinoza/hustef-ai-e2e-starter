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
    this.confirmButton = page.getByRole('button', { name: 'Confirm transfer' });
    this.paymentDialog = page.getByRole('dialog', { name: 'Confirm payment' });
    this.submittedHeading = page.getByRole('heading', { level: 1, name: 'Transfer submitted' });
    this.backToAccountsLink = page.getByRole('link', { name: 'Back to accounts' });
  }

  /** The PIN field sits in a closed shadow root: reach it with the keyboard from Confirm transfer. */
  async enterPin(pin: string): Promise<void> {
    await this.confirmButton.focus();
    await this.page.keyboard.press('Shift+Tab');
    await this.page.keyboard.type(pin);
  }

  async confirm(): Promise<void> {
    await this.confirmButton.click();
  }

  async approvePayment(): Promise<void> {
    await this.paymentDialog.getByTitle('Gremlin Secure').contentFrame().getByRole('button', { name: 'Approve payment' }).click();
  }
}
