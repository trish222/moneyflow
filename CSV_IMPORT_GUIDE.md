# CSV Import & Balance Adjustment Guide

## Overview

MoneyFlow now supports importing transactions from CSV files and setting opening balances for accounts.

## CSV Import

### Access the Feature
1. Navigate to the **Transactions** page
2. Click the **📥 Import CSV** button
3. Select an account and CSV file
4. Click "Import Transactions"

### CSV Format Support

The CSV parser is flexible and supports multiple formats:

#### 1. **Minimal Format** (2 columns)
```csv
2026-09-15,45.99
2026-09-16,100.00
```
- Date, Amount (type defaults to "expense", category to "uncategorized")

#### 2. **Positional Format** (5 columns)
```csv
2026-09-15,45.99,expense,food,Grocery shopping
2026-09-16,100.00,income,salary,Monthly paycheck
```
- Date, Amount, Type, Category, Description

#### 3. **With Headers** (auto-detected)
```csv
Date,Amount,Type,Category,Description
2026-09-15,45.99,expense,food,Grocery shopping
2026-09-16,100.00,income,salary,Monthly paycheck
```
- Headers are auto-detected if row contains keywords (date, amount, type, category, description, memo, debit, credit, balance)
- Columns can be in any order when headers are present

#### 4. **Bank Export** (mixed)
```csv
Transaction Date,Amount,Description
2026-09-15,45.99,Whole Foods
2026-09-16,100.00,Employer Direct Deposit
```
- Even if headers don't match exactly, the parser tries to find date and amount columns

### Data Validation

- **Date**: Must be valid date format (YYYY-MM-DD, MM/DD/YYYY, etc.)
- **Amount**: Must be a number (positive or negative)
- **Type**: Auto-detected as "income" or "expense" based on keywords
- **Category**: Converted to lowercase with underscores (e.g., "Grocery Store" → "grocery_store")
- **Description**: Optional, preserved as-is

### Error Handling

The import shows detailed errors for each row:
- Invalid dates are reported with the exact format that failed
- Amounts that can't be parsed are flagged
- Zero amounts are rejected
- The import continues for valid rows even if some fail

### Example: Importing Bank Statement

Export your bank statement as CSV (most banks support this), paste into a file:

```csv
Transaction Date,Debit,Credit,Balance
09/15/2026,45.99,,1234.01
09/16/2026,,2000.00,3234.01
09/17/2026,89.50,,3144.51
```

Import with minimal parsing - the system recognizes:
- Debit/Credit columns as transaction amounts
- Correctly categorizes as expense/income based on column name

---

## Opening Balance

### Access the Feature
1. Navigate to the **Transactions** page
2. Click the **⚖️ Set Balance** button
3. Select an account
4. Enter the opening balance and date
5. Click "Set Opening Balance"

### What It Does

- **Creates a transaction**: An "Opening Balance" transaction appears in your transaction history
- **Sets account balance**: The account balance is updated to the exact amount you specify
- **Audit trail**: The transaction is dated and visible in your history

### Use Cases

1. **Starting a new account**: Set the initial balance when you first add an account
2. **Account reconciliation**: Adjust the balance to match your bank statement
3. **Historical data**: Set balance as of a specific date in the past

### Example

- You have a checking account with $1,500
- Click "Set Balance", select the account
- Enter balance: `1500.00`
- Enter date: `2026-09-01` (when you started tracking)
- Result: Account now shows $1,500 with an "Opening Balance" transaction dated 2026-09-01

---

## Technical Details

### Backend Endpoints

**CSV Import:**
```
POST /api/transactions/import-csv
Content-Type: multipart/form-data

Parameters:
- file: CSV file
- accountId: Account ID to import to

Response: 
{
  "message": "Transactions imported successfully",
  "imported": 5,
  "errors": [...],
  "transactions": [...]
}
```

**Opening Balance:**
```
PUT /api/accounts/:id/set-balance
Content-Type: application/json

{
  "balance": 10000.00,
  "date": "2026-09-01"
}

Response:
{
  "message": "Opening balance set successfully",
  "account": {...}
}
```

### CSV Parser Features

- **Flexible format detection**: Auto-detects headers or assumes positional columns
- **Case-insensitive**: "DATE", "date", "Date" all recognized
- **Keyword matching**: Looks for common column names (amount, total, debit, credit, memo, description)
- **Error reporting**: Returns row numbers and specific error messages for debugging
- **Batch processing**: Imports all valid rows even if some fail

### Limits

- Maximum file size: 10 MB
- No limit on number of transactions per file
- Date range: Any valid date (past or future)
- Amount precision: 2 decimal places

---

## Troubleshooting

### Common Issues

1. **"Invalid date format" on all rows**
   - Ensure dates are in a standard format (YYYY-MM-DD, MM/DD/YYYY)
   - Check for extra whitespace

2. **"No valid transactions found"**
   - Verify first two columns are date and amount
   - Check that amounts are numeric (no currency symbols)

3. **Imported amounts are incorrect**
   - CSV parser uses absolute value of amount
   - Transaction type (expense/income) is inferred separately
   - If you need negative amounts for expenses, the parser will make them positive

4. **Categories not showing correctly**
   - Categories are lowercased and spaces become underscores
   - "Food & Dining" becomes "food_&_dining"
   - Check the category list after import

### Validation Errors

- `Date is required` — First column appears to be empty
- `Invalid amount: X` — Second column contains non-numeric data
- `Amount cannot be zero` — A transaction has amount = 0
- `Date and amount columns not found` — Columns don't match expected format

---

## Tips & Tricks

### Bulk Import from Multiple Accounts

Import one account at a time:
1. Filter/export transactions for Account A from your bank
2. Import to Account A in MoneyFlow
3. Repeat for other accounts

### De-Duplicating Transactions

If you import the same CSV twice:
1. Check the transaction list for duplicates
2. Delete duplicate entries manually
3. No need to re-import — the system doesn't prevent duplicates

### Merging Bank Exports

Combine exports from multiple banks:
1. Export from Bank A (check format)
2. Export from Bank B (in same format)
3. Merge rows in Excel or text editor
4. Import combined file to appropriate account

---

## Supported Date Formats

The parser recognizes these date formats:
- ISO: `2026-09-15`
- US: `09/15/2026`, `09-15-2026`
- International: `15/09/2026`, `15-09-2026`
- Text: `September 15, 2026`, `Sep 15, 2026`

---

## Future Enhancements

Phase 2 planned features:
- Bank API integration (Plaid) for automatic sync
- CSV column mapping UI (manual selection of columns)
- Duplicate detection and deduplication
- Category auto-tagging based on description
- Scheduled recurring imports
