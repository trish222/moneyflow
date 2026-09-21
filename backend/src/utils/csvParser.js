// CSV Parser for flexible transaction imports
// Handles: headerless CSVs, minimal data (date + amount), and data with categories
/**
 * Parse CSV content with flexible column detection
 *
 * Supported formats:
 * 1. With headers: date,amount,type,category,description
 * 2. Without headers (positional): date, amount, [type], [category], [description]
 * 3. Minimal: date, amount (type defaults to "expense", category to "uncategorized")
 */
export function parseCSV(csvContent) {
    const lines = csvContent.trim().split("\n");
    if (lines.length === 0) {
        return {
            transactions: [],
            errors: [{ row: 0, error: "Empty CSV file" }],
            stats: { total: 0, valid: 0, invalid: 0 },
        };
    }
    const transactions = [];
    const errors = [];
    // Detect if first row is header
    const firstRowRaw = lines[0];
    if (!firstRowRaw) {
        return {
            transactions: [],
            errors: [{ row: 1, error: "First line is empty" }],
            stats: { total: 0, valid: 0, invalid: 0 },
        };
    }
    const firstRow = firstRowRaw.split(",").map((v) => v.trim().toLowerCase());
    const hasHeader = isHeaderRow(firstRow);
    // Start from row 1 if header detected, else row 0
    const startRow = hasHeader ? 1 : 0;
    const headerIndexes = hasHeader ? detectHeaderIndexes(firstRow) : null;
    for (let i = startRow; i < lines.length; i++) {
        const row = i + 1; // 1-indexed for user-facing errors
        const lineRaw = lines[i];
        if (!lineRaw)
            continue;
        const line = lineRaw.trim();
        if (!line)
            continue; // Skip empty lines
        try {
            const parsed = parseRow(line, headerIndexes);
            if (parsed) {
                transactions.push(parsed);
            }
        }
        catch (error) {
            errors.push({
                row,
                error: error instanceof Error ? error.message : "Unknown error",
            });
        }
    }
    return {
        transactions,
        errors,
        stats: {
            total: lines.length - startRow,
            valid: transactions.length,
            invalid: errors.length,
        },
    };
}
/**
 * Detect if row looks like a header row
 */
function isHeaderRow(row) {
    const headerKeywords = [
        "date",
        "time",
        "amount",
        "type",
        "category",
        "description",
        "memo",
        "debit",
        "credit",
        "balance",
    ];
    const lowerRow = row.map((v) => v.toLowerCase());
    const matches = lowerRow.filter((cell) => headerKeywords.some((keyword) => cell.includes(keyword)));
    // If 2+ cells contain header keywords, likely a header row
    return matches.length >= 2;
}
function detectHeaderIndexes(headers) {
    const indexes = {};
    headers.forEach((header, idx) => {
        const h = header.toLowerCase();
        if (h.includes("date") || h.includes("time"))
            indexes.dateIdx = idx;
        else if (h.includes("amount") || h.includes("total"))
            indexes.amountIdx = idx;
        else if (h.includes("type") || h.includes("transaction"))
            indexes.typeIdx = idx;
        else if (h.includes("category") || h.includes("class"))
            indexes.categoryIdx = idx;
        else if (h.includes("description") ||
            h.includes("memo") ||
            h.includes("note"))
            indexes.descriptionIdx = idx;
    });
    return indexes;
}
/**
 * Parse a single CSV row
 * Format: date,amount,[type],[category],[description]
 * Minimal format: date,amount
 */
function parseRow(line, headerIndexes) {
    const cells = line.split(",").map((v) => v.trim());
    if (cells.length === 0)
        return null;
    let date = "";
    let amount = 0;
    let type = "expense";
    let category = "uncategorized";
    let description = null;
    if (headerIndexes) {
        // Using detected header indexes
        if (headerIndexes.dateIdx !== undefined && headerIndexes.amountIdx !== undefined) {
            const dateCell = cells[headerIndexes.dateIdx];
            const amountCell = cells[headerIndexes.amountIdx];
            if (dateCell)
                date = dateCell;
            if (amountCell)
                amount = parseFloat(amountCell);
        }
        else {
            throw new Error("Date and amount columns not found");
        }
        if (headerIndexes.typeIdx !== undefined) {
            const typeCell = cells[headerIndexes.typeIdx];
            if (typeCell) {
                const t = typeCell.toLowerCase();
                type = t.includes("income") || t.includes("credit") ? "income" : "expense";
            }
        }
        if (headerIndexes.categoryIdx !== undefined) {
            const catCell = cells[headerIndexes.categoryIdx];
            if (catCell)
                category = catCell;
        }
        if (headerIndexes.descriptionIdx !== undefined) {
            const descCell = cells[headerIndexes.descriptionIdx];
            if (descCell)
                description = descCell;
        }
    }
    else {
        // Positional format: date,amount,[type],[category],[description]
        if (cells.length < 2) {
            throw new Error("Minimum 2 columns required (date, amount)");
        }
        date = cells[0] || "";
        amount = parseFloat(cells[1] || "0");
        if (cells.length > 2 && cells[2]) {
            const t = cells[2].toLowerCase();
            type = t.includes("income") || t.includes("credit") ? "income" : "expense";
        }
        if (cells.length > 3 && cells[3]) {
            category = cells[3];
        }
        if (cells.length > 4 && cells[4]) {
            description = cells[4];
        }
    }
    // Validate
    if (!date)
        throw new Error("Date is required");
    if (!isValidDate(date))
        throw new Error(`Invalid date format: ${date}`);
    if (isNaN(amount))
        throw new Error(`Invalid amount: ${cells[1]}`);
    if (amount === 0)
        throw new Error("Amount cannot be zero");
    const dateStr = new Date(date).toISOString().split("T")[0];
    if (!dateStr)
        throw new Error("Invalid date format");
    return {
        date: dateStr,
        amount: Math.abs(amount),
        type,
        category: category.toLowerCase().replace(/\s+/g, "_"),
        description,
    };
}
/**
 * Check if string is a valid date
 */
function isValidDate(dateStr) {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
}
/**
 * Create an opening balance transaction
 */
export function createOpeningBalanceTransaction(accountId, balance, date) {
    return {
        date,
        amount: Math.abs(balance),
        type: balance >= 0 ? "income" : "expense",
        category: "opening_balance",
        description: "Opening Balance",
    };
}
//# sourceMappingURL=csvParser.js.map