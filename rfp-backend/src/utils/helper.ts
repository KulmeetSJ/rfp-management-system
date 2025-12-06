
export function formatValue(value: any): string {
    if (value === null || value === undefined) return "Not specified";
  
    // Number stays number
    if (typeof value === "number") return value.toString();
  
    // String stays string
    if (typeof value === "string") return value;
  
    // Array → comma separated or pretty JSON
    if (Array.isArray(value)) {
      try {
        return JSON.stringify(value);
      } catch {
        return value.toString();
      }
    }
  
    // Object → try to make readable
    if (typeof value === "object") {
      // Special case: amount + currency (commonly returned by AI)
      if ("amount" in value && "currency" in value) {
        return `${value.amount} ${value.currency}`;
      }
  
      // Otherwise fallback to clean JSON
      try {
        return JSON.stringify(value);
      } catch {
        return "Not specified";
      }
    }
  
    // Fallback
    return String(value);
  }