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
    this.newTransferLink = page.getByRole('link', { name: 'New transfer' });
    // The first row is the header row.
    this.recentTransactionRows = page.getByRole('table', { name: 'Recent transactions' }).getByRole('row');
  }

  /** The account card (region) with the given account name as its heading. */
  account(name: AccountName): Locator {
    return this.page.getByRole('region').filter({ has: this.page.getByRole('heading', { name }) });
  }
}
