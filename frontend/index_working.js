import {initializeBlock, useBase, useCursor, Button, Text, Box, Select} from '@airtable/blocks/ui';
import React, {useState} from 'react';
import * as XLSX from 'xlsx';

function ExportExtension() {
    const base = useBase();
    const cursor = useCursor();
    const [exportFormat, setExportFormat] = useState('excel');

    if (!base) {
        return (
            <Box padding={3}>
                <Text>Loading...</Text>
            </Box>
        );
    }

    // Simple table/view detection without complex hooks
    const table = cursor?.activeTableId ? base.getTableByIdIfExists(cursor.activeTableId) : base.tables[0];
    const view = table && cursor?.activeViewId ? table.getViewByIdIfExists(cursor.activeViewId) : table?.views[0];

    const handleExport = async () => {
        try {
            if (!table || !view) {
                alert('No table/view selected');
                return;
            }

            console.log('Exporting from:', table.name, view.name);

            // Get fields
            let visibleFields = view.visibleFields;
            if (!visibleFields || visibleFields.length === 0) {
                visibleFields = table.fields;
            }

            // Query records
            const query = await view.selectRecordsAsync({ fields: visibleFields });

            // Build data
            const header = visibleFields.map(f => f.name);
            const data = query.records.map(rec =>
                visibleFields.map(f => rec.getCellValueAsString(f))
            );

            // Generate filename
            const filename = `${table.name} – ${view.name} – ${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xlsx' : 'csv'}`;

            if (exportFormat === 'excel') {
                // Excel export
                const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
                XLSX.writeFile(wb, filename);
            } else {
                // CSV export
                const csvContent = [header, ...data]
                    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
                    .join('\n');
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.click();
                URL.revokeObjectURL(url);
            }

            console.log('Export completed successfully');
        } catch (err) {
            console.error('Export error:', err);
            alert(`Export failed: ${err.message}`);
        }
    };

    return (
        <Box padding={3}>
            <Text size="large" weight="bold" marginBottom={3}>
                📊 Export Data
            </Text>
            
            <Text size="small" textColor="light" marginBottom={3}>
                Table: <strong>{table?.name ?? '—'}</strong><br/>
                View: <strong>{view?.name ?? '—'}</strong>
            </Text>

            <Box marginBottom={3}>
                <Text size="small" weight="bold" marginBottom={1}>
                    Export Format:
                </Text>
                <Select
                    value={exportFormat}
                    onChange={setExportFormat}
                    options={[
                        { value: 'excel', label: '📈 Excel (.xlsx)' },
                        { value: 'csv', label: '📄 CSV (.csv)' }
                    ]}
                />
            </Box>

            <Button
                onClick={handleExport}
                disabled={!table || !view}
                width="100%"
                size="large"
            >
                {!table || !view ? '⚠️ No Table/View Detected' : `Export to ${exportFormat.toUpperCase()}`}
            </Button>
        </Box>
    );
}

initializeBlock(() => <ExportExtension />);