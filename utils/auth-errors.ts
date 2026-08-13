/**
 * Maps Supabase error messages and codes to user-friendly strings.
 */
export function getAuthErrorMessage(error: any): string {
  if (!error) return "An unknown error occurred";
  
  const message = error.message || "";
  const code = error.code || "";

  // Common Supabase Auth errors
  if (message.includes("Invalid login credentials") || message.includes("Email not confirmed")) {
    return "Invalid email or password. Please try again.";
  }

  if (message.includes("Database error querying schema") || code === "PGRST301" || code === "42501") {
    return "We're having trouble accessing your account profile. This might be a temporary database issue. Please try again in a moment.";
  }

  if (message.includes("rate limit") || code === "too_many_requests") {
    return "Too many login attempts. Please wait a while before trying again.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "Connection error. Please check your internet and try again.";
  }

  // Fallback to a generic but polite message for other database errors
  if (code.startsWith("PGRST") || code.startsWith("23") || code.startsWith("42")) {
    return "A database error occurred while processing your request. Our team has been notified.";
  }

  return message || "An unexpected error occurred. Please try again.";
}
