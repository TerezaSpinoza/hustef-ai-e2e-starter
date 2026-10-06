import type { Locator, Page } from '@playwright/test';
import type { AccountName } from './transfer-page';

export class DashboardPage {
  readonly heading: Locator;
  readonly loadingAccounts: Locator;
  readonly signedInAs: Locator;
  readonly signOutButton: Locator;
  readonly newTransferLink: Locator;
  readonly recentTransactionRows: Locator;

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1, name: 'Accounts' });
    this.loadingAccounts = page.getByText('Loading accounts...');
    this.signedInAs = page.getByText('Signed in as');
    this.signOutButton = page.getByRole('button', { name: 'Sign out' });
    this.newTransferLink = page.getByRole('menuitem', { name: 'New transfer' });
    // The first row is the header row.
    this.recentTransactionRows = page.getByRole('table', { name: 'Recent transactions' }).getByRole('row');
  }

  /** The New transfer link moved into the Payments menu: open the menu first. */
  async openPaymentsMenu(): Promise<void> {
    await this.page.getByRole('button', { name: 'Payments' }).click();
  }

  /** The row of the "Your accounts" table with the given account name. */
  account(name: AccountName): Locator {
    return this.page
      .getByRole('table', { name: 'Your accounts' })
      .getByRole('row')
      .filter({ has: this.page.getByRole('rowheader', { name, exact: true }) });
  }
}
