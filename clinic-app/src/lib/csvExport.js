export function exportToCSV(data, filename) {
    // Convert data to CSV format
    if (!data || data.length === 0) {
        alert('אין נתונים לייצוא');
        return;
    }
    // Get headers from first object
    const headers = Object.keys(data[0]);
    // Create CSV content with BOM for Hebrew support
    const BOM = '\uFEFF';
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => headers.map(header => {
        const value = row[header] ?? '';
        // Escape values containing commas, quotes, or newlines
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    }).join(','));
    const csvContent = BOM + csvHeaders + '\n' + csvRows.join('\n');
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}
//# sourceMappingURL=csvExport.js.map