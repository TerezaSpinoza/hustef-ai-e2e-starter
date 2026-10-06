import type { Locator, Page } from '@playwright/test';
import { expect } from '../fixtures';

export const KISS_PETER_IBAN = 'HU72 9990 1017 1618 0339 8874 9892';

export type AccountName = 'Everyday Account' | 'Savings Account';

export interface TransferInput {
  from?: AccountName;
  name?: string;
  iban?: string;
  amount: string;
  reference?: string;
}

export class TransferPage {
  readonly heading: Locator;
  readonly fromAccount: Locator;
  readonly beneficiaryName: Locator;
  readonly iban: Locator;
  readonly checkIbanButton: Locator;
  readonly amount: Locator;
  readonly reference: Locator;
  readonly continueButton: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'New transfer' });
    this.fromAccount = page.getByRole('combobox', { name: 'From account' });
    this.beneficiaryName = page.getByRole('textbox', { name: 'Beneficiary name' });
    this.iban = page.getByRole('textbox', { name: 'IBAN' });
    this.checkIbanButton = page.getByRole('button', { name: 'Check IBAN' });
    this.amount = page.getByRole('textbox', { name: 'Amount (HUF)' });
    this.reference = page.getByRole('textbox', { name: 'Reference' });
    this.continueButton = page.getByRole('button', { name: 'Continue' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/transfer');
  }

  async checkIban(iban: string): Promise<void> {
    await this.iban.fill(iban);
    await this.checkIbanButton.click();
  }

  /** Opens the New transfer form, fills it (the IBAN is checked) and selects Continue. */
  async submit(input: TransferInput): Promise<void> {
    await this.goto();
    await expect(this.heading).toBeVisible();
    await this.fromAccount.selectOption({ label: input.from ?? 'Everyday Account' });
    await this.beneficiaryName.fill(input.name ?? 'Kiss Péter');
    await this.checkIban(input.iban ?? KISS_PETER_IBAN);
    await this.amount.fill(input.amount);
    if (input.reference) {
      await this.reference.fill(input.reference);
    }
    await this.continueButton.click();
  }
}
