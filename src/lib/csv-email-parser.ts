/**
 * CSV Email Parser Utility
 * Extracts and validates email addresses from CSV files
 */

export interface CSVParseResult {
  emails: string[];
  totalRows: number;
  validEmails: number;
  invalidEmails: number;
  duplicates: number;
  errors: string[];
}

/**
 * Validates if a string is a valid email address
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Extracts email addresses from CSV content
 * @param csvContent - Raw CSV content as string
 * @param options - Parsing options
 * @returns Parsed result with email addresses and statistics
 */
export function parseCSVEmails(
  csvContent: string,
  options: {
    columnIndex?: number; // Default: 0 (first column)
    hasHeader?: boolean; // Default: true
    delimiter?: string; // Default: ','
    maxEmails?: number; // Default: 10000
  } = {}
): CSVParseResult {
  const {
    columnIndex = 0,
    hasHeader = true,
    delimiter = ',',
    maxEmails = 10000
  } = options;

  const result: CSVParseResult = {
    emails: [],
    totalRows: 0,
    validEmails: 0,
    invalidEmails: 0,
    duplicates: 0,
    errors: []
  };

  try {
    // Split content into lines
    const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      result.errors.push('CSV file is empty');
      return result;
    }

    // Skip header if specified
    const dataLines = hasHeader ? lines.slice(1) : lines;
    result.totalRows = dataLines.length;

    // Track unique emails and duplicates
    const emailSet = new Set<string>();
    const duplicateSet = new Set<string>();

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) continue;

      // Parse CSV line (handles quoted values)
      const columns = parseCSVLine(line, delimiter);
      
      if (columnIndex >= columns.length) {
        result.errors.push(`Row ${i + 1}: Column ${columnIndex} not found`);
        continue;
      }

      const email = columns[columnIndex].trim();
      
      if (!email) {
        result.invalidEmails++;
        continue;
      }

      // Check if email is valid
      if (!isValidEmail(email)) {
        result.invalidEmails++;
        continue;
      }

      // Check for duplicates
      const normalizedEmail = email.toLowerCase();
      if (emailSet.has(normalizedEmail)) {
        duplicateSet.add(normalizedEmail);
        result.duplicates++;
      } else {
        emailSet.add(normalizedEmail);
      }

      // Check max emails limit
      if (emailSet.size > maxEmails) {
        result.errors.push(`Maximum number of emails (${maxEmails}) exceeded`);
        break;
      }
    }

    // Convert set to array and count valid emails
    result.emails = Array.from(emailSet);
    result.validEmails = result.emails.length;

  } catch (error) {
    result.errors.push(`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Parses a single CSV line, handling quoted values
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const columns: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of column
      columns.push(current);
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  // Add the last column
  columns.push(current);

  return columns;
}

/**
 * Validates a CSV file before processing
 */
export function validateCSVFile(file: File): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (10MB)`);
  }

  // Check file type
  const allowedTypes = [
    'text/csv',
    'application/csv',
    'text/plain',
    'application/vnd.ms-excel'
  ];
  
  if (!allowedTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
    errors.push('File must be a CSV file');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Reads a file and returns its content as a string
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Generates a sample CSV with email addresses for testing
 */
export function generateSampleCSV(emails: string[]): string {
  const header = 'Email Address,Name,Company\n';
  const rows = emails.map(email => `${email},Test User,Test Company`);
  return header + rows.join('\n');
} 