import type { Locator, Page } from '@playwright/test';
import { expect, env } from '../fixtures';

export class LoginPage {
  readonly username: Locator;
  readonly password: Locator;
  readonly signInButton: Locator;
  readonly alert: Locator;

  constructor(readonly page: Page) {
    this.username = page.getByRole('textbox', { name: 'Username' });
    this.password = page.getByRole('textbox', { name: 'Password' });
    this.signInButton = page.getByRole('button', { name: 'Sign in' });
    this.alert = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/login');
  }

  async signIn(user: string, password: string): Promise<void> {
    await this.username.fill(user);
    await this.password.fill(password);
    await this.signInButton.click();
  }

  /** Signs in as GREMLIN_USER and waits until the dashboard is shown. */
  async signInAsTestUser(): Promise<void> {
    await this.goto();
    await this.signIn(env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));
    await expect(this.page.getByRole('heading', { level: 1, name: 'Accounts' })).toBeVisible();
  }
}
