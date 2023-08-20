/**
 * Formats an error object. If the error is of type Error, only the message and name properties are returned.
 * @param error The error object to format.
 * @returns The formatted error object. If the error is not of type Error, the error object is returned as is.
 */
export function formatError(error: any) {
  return typeof error == "object" && error instanceof Error
    ? { message: error.message, name: error.name }
    : error;
}

/**
 * Generates a random token used to identify requests.
 * @returns The generated token.
 */
export function generateToken() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
