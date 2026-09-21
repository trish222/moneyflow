export interface ParsedTransaction {
    date: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    description: string | null;
}
export interface CSVParseResult {
    transactions: ParsedTransaction[];
    errors: Array<{
        row: number;
        error: string;
    }>;
    stats: {
        total: number;
        valid: number;
        invalid: number;
    };
}
/**
 * Parse CSV content with flexible column detection
 *
 * Supported formats:
 * 1. With headers: date,amount,type,category,description
 * 2. Without headers (positional): date, amount, [type], [category], [description]
 * 3. Minimal: date, amount (type defaults to "expense", category to "uncategorized")
 */
export declare function parseCSV(csvContent: string): CSVParseResult;
/**
 * Create an opening balance transaction
 */
export declare function createOpeningBalanceTransaction(accountId: number, balance: number, date: string): ParsedTransaction;
//# sourceMappingURL=csvParser.d.ts.map