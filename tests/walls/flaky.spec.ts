import { test, expect, env } from '../fixtures';
import { signIn, skipCookieDialog } from './support';

// Lab 5, wall 4: non-determinism. This test passes sometimes. Prove it:
//
//   npx playwright test tests/walls/flaky.spec.ts --repeat-each=10 --reporter=list,./reporters/steady.ts
//
// Then fix it: wait with web-first assertions instead of a fixed timeout, and stop asserting random
// values (assert the format of the rate, not the number). The dashboard shows a "Loading accounts..."
// spinner for a random 0.3-2.5 s, a random tip of the day and a random EUR/HUF rate on every load.

test('dashboard shows the balance and the exchange rate', async ({ page, context, baseURL }) => {
  await skipCookieDialog(context, baseURL!);
  await signIn(page, env('GREMLIN_USER'), env('GREMLIN_PASSWORD'));

  // The spinner takes a random 0.3-2.5 s: a web-first assertion waits for the balance instead of a fixed timeout.
  await expect(page.getByText('1,250,000 HUF')).toBeVisible();

  // The rate is random on every load: assert its format, not its value.
  await expect(page.getByText(/^EUR\/HUF \d+\.\d{2}$/)).toBeVisible();
});
