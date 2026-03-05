/**
 * Generic CSV export utility
 * Converts an array of objects to CSV and triggers browser download
 */
export function exportToCSV<T extends object>(
    data: T[],
    filename: string,
    columns?: { key: keyof T; label: string }[]
) {
    if (data.length === 0) return;

    const cols = columns || Object.keys(data[0]).map(key => ({ key: key as keyof T, label: String(key) }));

    // Header row
    const header = cols.map(c => `"${c.label}"`).join(',');

    // Data rows
    const rows = data.map(row =>
        cols.map(c => {
            const val = row[c.key];
            if (val === null || val === undefined) return '""';
            const str = String(val).replace(/"/g, '""');
            return `"${str}"`;
        }).join(',')
    );

    const csv = [header, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
