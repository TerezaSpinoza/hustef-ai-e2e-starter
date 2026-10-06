// spec: specs/gremlin-bank.md
// seed: seed.spec.ts

import { test, expect, env } from './fixtures';
import { DashboardPage } from './pages/dashboard-page';
import { LoginPage } from './pages/login-page';

test.describe('Sign in and sign out', () => {
  test('Sign in with valid credentials', async ({ page }) => {
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    // 1. Open /login. Enter GREMLIN_USER and GREMLIN_PASSWORD, select Sign in.
    await login.goto();
    await login.signIn(env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(dashboard.heading).toBeVisible();
    await expect(dashboard.signedInAs).toContainText('demo');
    await expect(dashboard.signOutButton).toBeVisible();
  });

  test('Sign in rejects wrong or empty credentials', async ({ page }) => {
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);
    await login.goto();
    const alert = login.alert.filter({ hasText: 'Wrong username or password.' });

    // 1. On /login select Sign in with both fields empty.
    await login.signInButton.click();
    await expect(alert).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    // 2. Enter username demo and a wrong password, select Sign in.
    await login.signIn(env('GREMLIN_USER'), 'not-the-password');
    await expect(alert).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
    await expect(dashboard.heading).toHaveCount(0);

    // 3. Wrong username with the correct password gives the same generic error.
    await login.signIn('nobody', env('GREMLIN_PASSWORD'));
    await expect(alert).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
