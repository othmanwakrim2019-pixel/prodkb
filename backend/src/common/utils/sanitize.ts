/**
 * Input Sanitizer — Prevents Stored XSS
 * Strips all HTML tags and dangerous attributes from user-supplied text.
 * Applied to all user-editable string fields before persisting to DB.
 * @module common/utils/sanitize
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Strip ALL HTML tags — outputs plain text only.
 * Use this for fields like title, summary, rootCause, etc.
 */
export function sanitizeText(input: string): string {
    return sanitizeHtml(input, {
        allowedTags: [],         // No HTML tags allowed
        allowedAttributes: {},   // No attributes allowed
        disallowedTagsMode: 'recursiveEscape', // Escape nested tags
    }).trim();
}

/**
 * Allow safe formatting tags but strip dangerous ones (script, iframe, etc.)
 * Use this for description/resolutionSteps where basic formatting is acceptable.
 */
export function sanitizeRichText(input: string): string {
    return sanitizeHtml(input, {
        allowedTags: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote', 'h1', 'h2', 'h3', 'h4'],
        allowedAttributes: {
            'a': ['href', 'title'],
        },
        allowedSchemes: ['http', 'https', 'mailto'],
        disallowedTagsMode: 'recursiveEscape',
    }).trim();
}

/**
 * Sanitize all string values in a plain object (shallow, one level deep).
 * Useful for sanitizing request bodies before passing to services.
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T, richTextFields: string[] = []): T {
    const result = { ...obj };
    for (const key of Object.keys(result)) {
        const value = result[key];
        if (typeof value === 'string') {
            (result as Record<string, unknown>)[key] = richTextFields.includes(key)
                ? sanitizeRichText(value)
                : sanitizeText(value);
        }
    }
    return result;
}
