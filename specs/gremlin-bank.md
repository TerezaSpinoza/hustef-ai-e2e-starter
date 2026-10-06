# Gremlin Bank test plan

## Application Overview

Gremlin Bank (https://gremlin.shiwa.io, observed on Release 1) is a fictional demo bank. Covered: sign in/out, the dashboard (accounts, recent transactions, chart data) and the domestic transfer flow (form, fees, limits, review, PIN, confirmation). Every scenario starts from a fresh browser context (bank state lives in a cookie), signed out unless stated. "Signed in" means signed in as GREMLIN_USER (demo) using GREMLIN_PASSWORD from .env. Starting data: Everyday Account 1,250,000 HUF (IBAN HU39 9992 0265 3141 5926 5358 9797), Savings Account 5,400,000 HUF (IBAN HU03 9992 0265 2718 2818 2845 9043). Saved payees: Kiss Péter HU72 9990 1017 1618 0339 8874 9892, Nagy Eszter HU71 9990 2025 1414 2135 6237 3099, Tóth Bence HU03 9990 3033 1732 0508 0756 8879. Business rules (the oracle for expected values): limits 10,000,000 HUF per single transfer and 2,000,000 HUF per day (cumulative); fee = 0.3% of the amount, at least 200 HUF, at most 6,000 HUF; the sending account must cover amount + fee. Fee examples use amounts where 0.3% is a whole number, so the expected fee does not depend on a rounding rule. Because the daily limit (2,000,000) is reached before the fee cap would apply, the 6,000 HUF maximum is reached exactly at 2,000,000. Risk tags: [high] = money movement, balances or access control; [medium] = validation and layout that guard a transfer; [low] = cosmetic or informational. Random values (tip of the day, EUR/HUF rate, transfer reference) must be asserted by format only. Notes for automation: the Transaction PIN field on the review page sits in a closed shadow root (not in the snapshot; focus Confirm transfer, press Shift+Tab, type env GREMLIN_PIN); after Confirm transfer an iframe dialog "Confirm payment" (Gremlin Secure) needs "Approve payment". The "Change details" element is a link, not a button. The accounts load asynchronously ("Loading accounts..."), so use web-first assertions.

## Test Scenarios

### 1. Sign in and sign out

**Seed:** `seed.spec.ts`

#### 1.1. Sign in with valid credentials [high]

**File:** `tests/auth/sign-in.spec.ts`

**Steps:**
  1. Open /login. Enter GREMLIN_USER and GREMLIN_PASSWORD, select Sign in.
    - expect: URL is /dashboard
    - expect: Heading level 1 'Accounts' is visible
    - expect: Header shows 'Signed in as demo' and a 'Sign out' button

#### 1.2. Sign in rejects wrong or empty credentials [high]

**File:** `tests/auth/sign-in-negative.spec.ts`

**Steps:**
  1. On /login select Sign in with both fields empty.
    - expect: Alert 'Wrong username or password.' is shown
    - expect: User stays on /login
  2. Enter username demo and password 'wrongpass', select Sign in.
    - expect: Alert 'Wrong username or password.' is shown
    - expect: User stays on /login and no dashboard content is visible
  3. Enter a wrong username with the correct password; then the correct username with an empty password.
    - expect: Same generic error in both cases (message does not reveal which field is wrong)

#### 1.3. Sign out ends the session and protects pages [high]

**File:** `tests/auth/sign-out.spec.ts`

**Steps:**
  1. Sign in, then select 'Sign out' in the header.
    - expect: URL becomes /login
  2. Navigate directly to /dashboard, then to /transfer.
    - expect: Both redirect to /login; no account data is shown
  3. Use browser Back after signing out.
    - expect: URL is /login; no account balances are visible

### 2. Dashboard

**Seed:** `seed.spec.ts`

#### 2.1. Dashboard shows both accounts with IBAN and balance [high]

**File:** `tests/dashboard/accounts.spec.ts`

**Steps:**
  1. Sign in and wait for the 'Loading accounts...' status to disappear.
    - expect: Region 'Everyday Account': IBAN HU39 9992 0265 3141 5926 5358 9797, balance 1,250,000 HUF
    - expect: Region 'Savings Account': IBAN HU03 9992 0265 2718 2818 2845 9043, balance 5,400,000 HUF
    - expect: 'New transfer' link points to /transfer

#### 2.2. Recent transactions table lists five entries newest first [medium]

**File:** `tests/dashboard/recent-transactions.spec.ts`

**Steps:**
  1. Sign in and read table 'Recent transactions' (columns Date, Description, Amount).
    - expect: Rows in order: 2026-09-30 Grocery store, Budapest -18,450 HUF; 2026-09-29 Salary, Gremlin Works Ltd. +685,000 HUF; 2026-09-27 Mobile phone bill -7,990 HUF; 2026-09-25 Card payment, bookshop -12,300 HUF; 2026-09-24 Transfer from Savings Account +50,000 HUF
    - expect: Debits carry '-' and credits '+'; dates descending

#### 2.3. Spending chart data table can be shown and hidden [low]

**File:** `tests/dashboard/chart-data.spec.ts`

**Steps:**
  1. Under 'Spending in the last 30 days' select 'Show chart data'.
    - expect: Button changes to 'Hide chart data'
    - expect: Table with 30 daily rows (Date, Amount) is shown, dates consecutive and ascending, last row is today
    - expect: Amounts are non-negative HUF values, days without spending show 0 HUF (for example 2026-09-08 0 HUF)
  2. Select 'Hide chart data'.
    - expect: Data table is hidden and button reads 'Show chart data' again

#### 2.4. Random dashboard widgets have the right format [low]

**File:** `tests/dashboard/widgets.spec.ts`

**Steps:**
  1. Sign in; inspect 'Tip of the day' and 'Exchange rate'. Reload twice.
    - expect: Tip is a non-empty sentence (do not assert text)
    - expect: Rate is labelled EUR/HUF and matches /^\d+\.\d{2}$/; value may change on each load
    - expect: Text 'Indicative rate. Updated on every page load.' is shown

### 3. Domestic transfer

**Seed:** `seed.spec.ts`

#### 3.1. Transfer form shows its fields, saved payees and limits [medium]

**File:** `tests/transfer/form-layout.spec.ts`

**Steps:**
  1. Signed in, select 'New transfer'.
    - expect: Heading 'New transfer'; fields From account (Everyday Account preselected, Savings Account available), Beneficiary name, IBAN with 'Check IBAN', Amount (HUF), Reference, 'Continue'
    - expect: 'Available: 1,250,000 HUF' for Everyday; switching to Savings shows 'Available: 5,400,000 HUF'
    - expect: Saved payees Kiss Péter, Nagy Eszter, Tóth Bence with their IBANs; text 'up to 10,000,000 HUF per transfer and 2,000,000 HUF per day'
  2. Select 'Use Kiss Péter' (then Nagy Eszter, Tóth Bence).
    - expect: IBAN field is filled with the payee IBAN each time

#### 3.2. Required-field validation on empty form [medium]

**File:** `tests/transfer/validation-required.spec.ts`

**Steps:**
  1. Open /transfer and select Continue with all fields empty.
    - expect: 'Enter a beneficiary name.'
    - expect: 'Check the IBAN first.'
    - expect: 'Enter an amount greater than 0.'
    - expect: No error for Reference (optional); URL stays /transfer
  2. Fill only the amount 1000 and a valid payee IBAN but no beneficiary name; Continue.
    - expect: Only the beneficiary name error remains; no navigation to review

#### 3.3. IBAN must be checked and valid [high]

**File:** `tests/transfer/validation-iban.spec.ts`

**Steps:**
  1. Type an invalid IBAN ('HU00 1234'), select 'Check IBAN'.
    - expect: An error message is shown next to the IBAN field (assert it is visible and mentions the IBAN; exact wording not specified)
    - expect: After filling name and amount, Continue keeps the URL on /transfer; the review page is not reached
  2. Type a valid IBAN (Kiss Péter) but do not select Check IBAN; fill other fields and Continue.
    - expect: 'Check the IBAN first.' appears and the URL stays /transfer
  3. Enter a valid IBAN, check it, then edit one character.
    - expect: Continue shows 'Check the IBAN first.' again; the review page is not reached
  4. Check an IBAN with a wrong checksum (Kiss Péter's IBAN with the last digit changed: HU72 9990 1017 1618 0339 8874 9893).
    - expect: IBAN error shown; Continue does not reach the review page

#### 3.4. Amount validation and boundary values [high]

**File:** `tests/transfer/validation-amount.spec.ts`

**Steps:**
  1. With a valid payee, enter each amount and select Continue: 0, -5, abc, 1.5, empty.
    - expect: 'Enter an amount greater than 0.' for each; stays on /transfer
  2. Enter 1 (minimum valid).
    - expect: Review page, fee 200 HUF, total 201 HUF
  3. From Everyday Account enter 1,250,000 then 1,250,001 (equal to and above the 1,250,000 balance).
    - expect: 'Insufficient funds.' for both (the fee must also be covered, so exactly the balance is rejected)
  4. From Everyday Account enter 1,246,000 (fee 0.3% = 3,738, total 1,249,738 <= balance 1,250,000).
    - expect: Review page opens with Fee 3,738 HUF and Total 1,249,738 HUF

#### 3.5. Fee calculation examples on the review page [high]

**File:** `tests/transfer/fees.spec.ts`

**Steps:**
  1. From Everyday Account, for each amount continue to review and read Fee and Total (fee = 0.3%, min 200, max 6,000):
    - expect: 1 -> Fee 200 HUF, Total 201 HUF (minimum applies)
    - expect: 10,000 -> Fee 200 HUF, Total 10,200 HUF (0.3% = 30, minimum applies)
    - expect: 60,000 -> Fee 200 HUF, Total 60,200 HUF (0.3% = 180, minimum applies)
    - expect: 70,000 -> Fee 210 HUF, Total 70,210 HUF (just above the minimum)
    - expect: 100,000 -> Fee 300 HUF, Total 100,300 HUF
    - expect: 500,000 -> Fee 1,500 HUF, Total 501,500 HUF
    - expect: 1,000,000 -> Fee 3,000 HUF, Total 1,003,000 HUF
  2. From Savings Account enter 2,000,000.
    - expect: Fee 6,000 HUF, Total 2,006,000 HUF (maximum fee reached)
    - expect: Amounts are shown with comma thousands separators and the suffix HUF

#### 3.6. Per-transfer and daily limits [high]

**File:** `tests/transfer/limits.spec.ts`

**Steps:**
  1. From Savings Account enter 2,000,000 and Continue.
    - expect: Review page opens (at the daily limit)
  2. Enter 2,000,001.
    - expect: 'Daily limit of 2,000,000 HUF exceeded.'; URL stays /transfer
  3. Enter 10,000,000 (at the single-transfer limit, above the daily limit).
    - expect: 'Daily limit of 2,000,000 HUF exceeded.' (not the single-transfer message); URL stays /transfer
  4. Enter 10,000,001.
    - expect: 'The maximum single transfer is 10,000,000 HUF.'; URL stays /transfer
  5. From Savings Account confirm a 1,500,000 transfer (PIN, Approve payment), then start a second transfer of 500,001 the same day.
    - expect: 'Daily limit of 2,000,000 HUF exceeded.' (1,500,000 + 500,001 > 2,000,000)
  6. Change the second amount to 500,000.
    - expect: Review page opens (1,500,000 + 500,000 = 2,000,000, at the limit)

#### 3.7. Review page shows the entered details and Change details keeps them [high]

**File:** `tests/transfer/review.spec.ts`

**Steps:**
  1. Fill Everyday Account, Kiss Péter, saved IBAN, amount 66,667, reference 'Rent'; Continue.
    - expect: Heading 'Review transfer'; table 'Transfer details' lists From Everyday Account, To Kiss Péter, IBAN HU72 9990 1017 1618 0339 8874 9892, Amount 66,667 HUF, Fee 200 HUF, Total 66,867 HUF
    - expect: 'Confirm transfer' button and 'Change details' link are present
  2. Select 'Change details'.
    - expect: URL /transfer?edit=1 with name, IBAN and amount prefilled; editing the amount to 100,000 shows fee 300 HUF on a new review
  3. Signed in, in a new context open /transfer/review directly without filling the form.
    - expect: No 'Transfer details' table and no 'Confirm transfer' button are shown

#### 3.8. Wrong or missing Transaction PIN blocks the transfer [high]

**File:** `tests/transfer/pin-negative.spec.ts`

**Steps:**
  1. Reach the review page for 100,000 HUF and select 'Confirm transfer' without typing a PIN.
    - expect: Alert 'Wrong PIN.' is shown; URL stays /transfer/review
    - expect: Balance unchanged on the dashboard and no new transaction
  2. Type an incorrect PIN (for example 0000) in the PIN field (closed shadow root: focus Confirm transfer, Shift+Tab) and confirm.
    - expect: 'Wrong PIN.' and no payment dialog; balance still 1,250,000 HUF

#### 3.9. Successful transfer updates confirmation, balance and transactions [high]

**File:** `tests/transfer/confirm.spec.ts`

**Steps:**
  1. Transfer 15,000 HUF from Everyday Account to Kiss Péter with reference 'Plan probe'; on the review page (fee 200, total 15,200) enter env GREMLIN_PIN, select Confirm transfer.
    - expect: Dialog 'Confirm payment' (iframe, Gremlin Secure) says 'Approve this payment of 15,200 HUF' To Kiss Péter and the IBAN
  2. Select 'Approve payment'.
    - expect: URL /transfer/done, 'Transfer submitted'; reference matches /^GB-[A-Z0-9]{6}$/ (do not assert value)
    - expect: Paid to Kiss Péter, IBAN HU72 9990 1017 1618 0339 8874 9892, Amount 15,000 HUF, Fee 200 HUF, Total 15,200 HUF
    - expect: New balance, Everyday Account 1,234,800 HUF
  3. Select 'Back to accounts'.
    - expect: Everyday balance 1,234,800 HUF, Savings still 5,400,000 HUF
    - expect: First recent transaction is today's 'Transfer to Kiss Péter' -15,200 HUF; table still shows the older entries after it
  4. Repeat but select Cancel in the Confirm payment dialog.
    - expect: Dialog closes, no transfer made, balance unchanged
