import { sanitizeObject, sanitizeRichText, sanitizeText } from '../src/common/utils/sanitize';

describe('sanitize utilities', () => {
    it('strips all markup from plain text fields', () => {
        expect(sanitizeText('  Hello <script>alert(1)</script><b>world</b>  '))
            .toBe('Hello &lt;script&gt;alert(1)&lt;/script&gt;&lt;b&gt;world&lt;/b&gt;');
    });

    it('keeps safe rich text and removes dangerous links', () => {
        expect(sanitizeRichText('<p>Hello <strong>world</strong> <a href="javascript:alert(1)">bad</a></p>'))
            .toBe('<p>Hello <strong>world</strong> <a>bad</a></p>');
    });

    it('sanitizes object string values and preserves non-string values', () => {
        const result = sanitizeObject({
            title: '<img src=x onerror=alert(1)>Incident',
            description: '<p><em>Details</em></p>',
            priority: 2,
        }, ['description']);

        expect(result).toEqual({
            title: '&lt;img /&gt;Incident',
            description: '<p><em>Details</em></p>',
            priority: 2,
        });
    });
});
