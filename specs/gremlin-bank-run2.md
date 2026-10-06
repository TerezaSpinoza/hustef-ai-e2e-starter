# Gremlin Bank Test Plan (Release 1): sign in/out, dashboard, domestic transfer

## Application Overview

Gremlin Bank is a fictional demo bank (Release 1 observed). Scope: sign in/out, dashboard (accounts, recent transactions, 30-day spending chart data) and the domestic HUF transfer flow (/transfer, /transfer/review). Observed facts: sign-in at /login (Username, Password, Sign in); header shows "Signed in as demo" and a Sign out button. Dashboard has Everyday Account (1,250,000 HUF) and Savings Account (5,400,000 HUF) with IBANs, a "Show chart data" toggle with a 30-row Date/Amount table (2026-09-07 to 2026-10-06, includes 0 HUF days), and 5 recent transactions. Transfer form: From account, Beneficiary name, IBAN + Check IBAN, Amount (HUF), Reference, Continue; saved payees (Use buttons); limits 10,000,000 per transfer and 2,000,000 per day. Observed fee rule: fee = max(200 HUF, 0.3% of amount, rounded); total = amount + fee. Random values (tip of the day, EUR/HUF rate, session/check codes) must not be asserted, only their format. All scenarios assume a fresh state (new browser context, signed in as the demo user via the seed test unless the scenario is about signing in). The app content is rendered inside a frame in the MCP browser; use role/label locators.

## Test Scenarios

### 1. Sign in and sign out

**Seed:** `seed.spec.ts`

#### 1.1. Sign in with valid credentials

**File:** `tests/auth/sign-in.spec.ts`

**Steps:**
  1. Open /login in a fresh context, enter the valid demo username and password from the environment, click Sign in
    - expect: URL is /dashboard
    - expect: Heading Accounts is visible
    - expect: Header shows 'Signed in as demo' and a Sign out button

#### 1.2. Sign in rejects empty and wrong credentials

**File:** `tests/auth/sign-in-negative.spec.ts`

**Steps:**
  1. Click Sign in with both fields empty
    - expect: Message 'Wrong username or password.' shown, URL stays /login
  2. Enter username demo and a wrong password, click Sign in
    - expect: Message 'Wrong username or password.' shown, URL stays /login, no dashboard content
  3. Enter an unknown username with any password; also a valid username with the password in different case
    - expect: Same generic error, no hint about which field is wrong

#### 1.3. Sign out ends the session and protects pages

**File:** `tests/auth/sign-out.spec.ts`

**Steps:**
  1. Signed in, click Sign out
    - expect: URL is /login with heading 'Sign in to Gremlin Bank'
  2. Navigate directly to /dashboard, then /transfer, then use browser Back
    - expect: Each redirects to /login; no account data is visible after Back

### 2. Dashboard

**Seed:** `seed.spec.ts`

#### 2.1. Account cards show names, IBANs and balances

**File:** `tests/dashboard/accounts.spec.ts`

**Steps:**
  1. Open /dashboard after sign in and wait for 'Loading accounts...' to disappear
    - expect: Everyday Account: IBAN HU39 9992 0265 3141 5926 5358 9797, balance 1,250,000 HUF
    - expect: Savings Account: IBAN HU03 9992 0265 2718 2818 2845 9043, balance 5,400,000 HUF
    - expect: Balances are formatted with thousands separators and the HUF unit

#### 2.2. Recent transactions table content and signs

**File:** `tests/dashboard/recent-transactions.spec.ts`

**Steps:**
  1. Read the table 'Recent transactions'
    - expect: Columns Date, Description, Amount; exactly 5 rows, newest first
    - expect: 2026-09-30 Grocery store, Budapest -18,450 HUF; 2026-09-29 Salary, Gremlin Works Ltd. +685,000 HUF; 2026-09-27 Mobile phone bill -7,990 HUF; 2026-09-25 Card payment, bookshop -12,300 HUF; 2026-09-24 Transfer from Savings Account +50,000 HUF
    - expect: Debits carry '-', credits carry '+'

#### 2.3. Spending chart data table

**File:** `tests/dashboard/chart-data.spec.ts`

**Steps:**
  1. Click 'Show chart data'
    - expect: Button text changes to 'Hide chart data'; table of 30 daily rows from 2026-09-07 to 2026-10-06 appears
    - expect: Sample values: 2026-09-07 12,400 HUF; 2026-09-15 31,800 HUF (highest); 2026-09-08 0 HUF; 2026-10-06 13,500 HUF
    - expect: Dates are consecutive with no gaps; all amounts are non-negative HUF
  2. Click 'Hide chart data'
    - expect: The table is hidden again

#### 2.4. Dynamic widgets have the expected format

**File:** `tests/dashboard/dynamic-widgets.spec.ts`

**Steps:**
  1. Read Tip of the day, Exchange rate and footer
    - expect: Tip of the day is non-empty text (do not assert the text)
    - expect: EUR/HUF rate matches /^\d{3}\.\d{2}$/ and changes between loads (do not assert the value)
    - expect: Footer shows 'Release 1' (release depends on GREMLIN_RELEASE); session code matches /GRM-[A-Z0-9]+-[A-Z0-9]{4}/

### 3. Domestic transfer

**Seed:** `seed.spec.ts`

#### 3.1. Open transfer form from dashboard

**File:** `tests/transfer/form-initial.spec.ts`

**Steps:**
  1. Click 'New transfer' on the dashboard
    - expect: URL /transfer, heading 'New transfer', From account defaults to Everyday Account with 'Available: 1,250,000 HUF'
    - expect: Fields Beneficiary name, IBAN, Amount (HUF), Reference are empty
    - expect: Saved payees: Kiss Péter HU72 9990 1017 1618 0339 8874 9892, Nagy Eszter HU71 9990 2025 1414 2135 6237 3099, Tóth Bence HU03 9990 3033 1732 0508 0756 8879
    - expect: Limits text: 10,000,000 HUF per transfer and 2,000,000 HUF per day
  2. Switch From account to Savings Account
    - expect: Available changes to 5,400,000 HUF

#### 3.2. Required field validation on empty submit

**File:** `tests/transfer/validation-required.spec.ts`

**Steps:**
  1. Click Continue with an empty form
    - expect: 'Enter a beneficiary name.', 'Check the IBAN first.' and 'Enter an amount greater than 0.' are shown
    - expect: Beneficiary and Amount fields are marked invalid; URL stays /transfer; Reference is optional (no error)

#### 3.3. IBAN check: valid, invalid and format variants

**File:** `tests/transfer/iban-check.spec.ts`

**Steps:**
  1. Enter HU72 9990 1017 1618 0339 8874 9892, click Check IBAN
    - expect: Status 'IBAN verified: <code>' (code format GRM-XXXXX-XXXX, do not assert value)
  2. Check each: HU00 0000 0000 0000 0000 0000 0000; valid IBAN with last digit changed to 3; HU72; German IBAN DE89 3704 0044 0532 0130 00; empty
    - expect: Each shows 'Invalid IBAN'; Continue then still reports 'Check the IBAN first.'
  3. Check the valid IBAN in lower case without spaces (hu72999010171618033988749892)
    - expect: Accepted as verified
  4. Verify an IBAN, then edit it and click Continue without re-checking
    - expect: Observe and record whether verification is invalidated (expected: Check the IBAN first.)

#### 3.4. Saved payee Use button fills the form

**File:** `tests/transfer/saved-payee.spec.ts`

**Steps:**
  1. Click 'Use Nagy Eszter'
    - expect: Beneficiary name = Nagy Eszter and IBAN = HU71 9990 2025 1414 2135 6237 3099 are filled
  2. Enter amount 10000 and click Continue without Check IBAN
    - expect: Blocked with 'Check the IBAN first.' (Use does not verify the IBAN)
  3. Click Check IBAN, then Continue
    - expect: Review page opens for Nagy Eszter

#### 3.5. Amount validation: format and boundaries

**File:** `tests/transfer/amount-validation.spec.ts`

**Steps:**
  1. With valid payee, try amounts: abc, -5, 0, 1.5, 1e3, whitespace only
    - expect: Each shows 'Enter an amount greater than 0.' and does not continue
  2. Try 1,000 (with thousands separator)
    - expect: Record behaviour (observed: error cleared, input accepted); verify the review shows 1,000 HUF
  3. Try 1
    - expect: Accepted: review Amount 1 HUF, Fee 200 HUF, Total 201 HUF
  4. Try 10000001, then 9999999999999999
    - expect: 'The maximum single transfer is 10,000,000 HUF.'

#### 3.6. Fee calculation examples

**File:** `tests/transfer/fees.spec.ts`

**Steps:**
  1. For each amount open the review page from Everyday Account and read Amount / Fee / Total
    - expect: 1 -> 200 / 201; 500 -> 200 / 700; 1,000 -> 200 / 1,200; 50,000 -> 200 / 50,200; 60,000 -> 200 / 60,200 (minimum fee still applies)
    - expect: 75,000 -> 225 / 75,225 (0.3%)
    - expect: 99,999 -> 300 / 100,299 (rounded); 100,000 -> 300 / 100,300; 100,001 -> 300 / 100,301
    - expect: 1,000,000 -> 3,000 / 1,003,000
    - expect: 1,246,000 -> 3,738 / 1,249,738
    - expect: Rule: fee = max(200, round(0.3% of amount)); total = amount + fee. Expected values come from the rule, not from the page

#### 3.7. Balance and limit checks (insufficient funds, daily and single limits)

**File:** `tests/transfer/limits.spec.ts`

**Steps:**
  1. Everyday Account (1,250,000): amount 1,246,261
    - expect: Accepted: fee 3,739, total exactly 1,250,000 HUF (boundary: total equals balance)
  2. Amount 1,246,262, 1,250,000, 1,250,001, 2,000,000
    - expect: 'Insufficient funds.' because amount + fee exceeds balance (note 1,250,000 fails because of the fee)
  3. Switch to Savings Account (5,400,000); amount 2,000,000
    - expect: Accepted (daily limit boundary; check fee 6,000, total 2,006,000)
  4. Savings: amount 2,000,001 and 10,000,000
    - expect: 'Daily limit of 2,000,000 HUF exceeded.'
  5. Savings: amount 10,000,001
    - expect: 'The maximum single transfer is 10,000,000 HUF.' (takes priority over daily limit)
  6. After a confirmed transfer, attempt a second one that pushes the day total over 2,000,000
    - expect: Daily limit error based on cumulative amount (record observed behaviour)

#### 3.8. Review page shows correct details and Change details keeps data

**File:** `tests/transfer/review.spec.ts`

**Steps:**
  1. Fill Kiss Péter, verified IBAN, amount 1000, reference 'Rent', click Continue
    - expect: URL /transfer/review, heading 'Review transfer'
    - expect: Table: From Everyday Account, To Kiss Péter, IBAN HU72 9990 1017 1618 0339 8874 9892, Amount 1,000 HUF, Fee 200 HUF, Total 1,200 HUF
    - expect: Reference is not displayed on review (record as observation)
  2. Click 'Change details'
    - expect: URL /transfer?edit=1; name, amount and reference prefilled; IBAN requires Check IBAN again
  3. Change amount to 2000 and continue
    - expect: Review shows 2,000 HUF, fee 200, total 2,200
  4. Open /transfer/review directly in a new context with no transfer in progress
    - expect: Record behaviour (should redirect or show no data, not stale values)

#### 3.9. Confirm transfer with PIN: wrong and correct PIN

**File:** `tests/transfer/confirm.spec.ts`

**Steps:**
  1. On review page click Confirm transfer without supplying the correct PIN (observed: no visible PIN field, result 'Wrong PIN.')
    - expect: Alert 'Wrong PIN.' shown, stays on /transfer/review, repeated attempts keep the same message, no money moved (dashboard balance still 1,250,000)
  2. Complete the PIN step with the PIN from env GREMLIN_PIN (never hard-code) and confirm a 10,000 HUF transfer to Nagy Eszter
    - expect: Confirmation page shows success with transfer details and a generated reference (assert format only)
  3. Return to dashboard
    - expect: Everyday balance = 1,250,000 - 10,000 - 200 = 1,239,800 HUF; a new debit of 10,200 (or 10,000 plus fee) appears in recent transactions (record exact presentation)
  4. Click Confirm twice quickly / press browser Back after success and confirm again
    - expect: Transfer is executed only once; balance is debited once
