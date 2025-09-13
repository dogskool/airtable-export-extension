import {initializeBlock, useTable, useView, useRecords, Button, Text, Box, Select, Loader, Alert} from '@airtable/blocks/ui';
import React, {useState, useCallback} from 'react';
import * as XLSX from 'xlsx';
import {saveAs} from 'file-saver';
import './style.css';

function ExportExtension() {
    const table = useTable();
    const view = useView();
    const records = useRecords(view);
    
    const [exportFormat, setExportFormat] = useState('csv');
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const exportToCSV = useCallback(async () => {
        try {
            if (!records || records.length === 0) {
                throw new Error('No records to export');
            }

            const fields = table.fields;
            const headers = fields.map(field => field.name);
            
            const csvData = records.map(record => {
                return fields.map(field => {
                    const cellValue = record.getCellValue(field);
                    if (cellValue === null || cellValue === undefined) {
                        return '';
                    }
                    
                    // Handle different field types
                    if (Array.isArray(cellValue)) {
                        return cellValue.map(item => {
                            if (typeof item === 'object' && item.name) {
                                return item.name;
                            }
                            return String(item);
                        }).join(', ');
                    }
                    
                    if (typeof cellValue === 'object' && cellValue.name) {
                        return cellValue.name;
                    }
                    
                    return String(cellValue);
                });
            });

            // Create CSV content
            const csvContent = [headers, ...csvData]
                .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
                .join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const fileName = `${table.name}_${view.name}_${new Date().toISOString().split('T')[0]}.csv`;
            saveAs(blob, fileName);
            
            setSuccess(`Successfully exported ${records.length} records to CSV`);
            setError(null);
        } catch (err) {
            setError(`CSV Export failed: ${err.message}`);
            setSuccess(null);
        }
    }, [records, table, view]);

    const exportToExcel = useCallback(async () => {
        try {
            if (!records || records.length === 0) {
                throw new Error('No records to export');
            }

            const fields = table.fields;
            const headers = fields.map(field => field.name);
            
            const excelData = records.map(record => {
                return fields.map(field => {
                    const cellValue = record.getCellValue(field);
                    if (cellValue === null || cellValue === undefined) {
                        return '';
                    }
                    
                    // Handle different field types
                    if (Array.isArray(cellValue)) {
                        return cellValue.map(item => {
                            if (typeof item === 'object' && item.name) {
                                return item.name;
                            }
                            return String(item);
                        }).join(', ');
                    }
                    
                    if (typeof cellValue === 'object' && cellValue.name) {
                        return cellValue.name;
                    }
                    
                    return String(cellValue);
                });
            });

            // Create workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet([headers, ...excelData]);
            
            // Set column widths
            const colWidths = headers.map((header, index) => {
                const maxLength = Math.max(
                    header.length,
                    ...excelData.map(row => String(row[index] || '').length)
                );
                return { wch: Math.min(maxLength + 2, 50) };
            });
            ws['!cols'] = colWidths;
            
            XLSX.utils.book_append_sheet(wb, ws, view.name);
            
            // Generate and download file
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const fileName = `${table.name}_${view.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
            saveAs(blob, fileName);
            
            setSuccess(`Successfully exported ${records.length} records to Excel`);
            setError(null);
        } catch (err) {
            setError(`Excel Export failed: ${err.message}`);
            setSuccess(null);
        }
    }, [records, table, view]);

    const handleExport = useCallback(async () => {
        setIsExporting(true);
        setError(null);
        setSuccess(null);
        
        try {
            if (exportFormat === 'csv') {
                await exportToCSV();
            } else {
                await exportToExcel();
            }
        } finally {
            setIsExporting(false);
        }
    }, [exportFormat, exportToCSV, exportToExcel]);

    if (!table || !view) {
        return (
            <Box padding={3}>
                <Text>Please select a table and view to export data.</Text>
            </Box>
        );
    }

    return (
        <Box padding={3} className="export-container">
            <Text size="large" marginBottom={2}>
                📊 Export View Data
            </Text>
            
            <Box marginBottom={3}>
                <Text size="small" marginBottom={1}>
                    Table: <strong>{table.name}</strong>
                </Text>
                <Text size="small" marginBottom={2}>
                    View: <strong>{view.name}</strong>
                </Text>
                <Text size="small" textColor="light">
                    {records ? `${records.length} records` : 'Loading records...'}
                </Text>
            </Box>

            <Box marginBottom={3}>
                <Text size="small" marginBottom={1}>
                    Export Format:
                </Text>
                <Select
                    value={exportFormat}
                    onChange={newValue => setExportFormat(newValue)}
                    options={[
                        { value: 'csv', label: 'CSV (Comma Separated Values)' },
                        { value: 'excel', label: 'Excel (.xlsx)' }
                    ]}
                    width="100%"
                />
            </Box>

            {error && (
                <Alert marginBottom={2} variant="error">
                    {error}
                </Alert>
            )}

            {success && (
                <Alert marginBottom={2} variant="success">
                    {success}
                </Alert>
            )}

            <Button
                onClick={handleExport}
                disabled={isExporting || !records || records.length === 0}
                width="100%"
                size="large"
                icon={isExporting ? <Loader /> : undefined}
            >
                {isExporting ? 'Exporting...' : `Export to ${exportFormat.toUpperCase()}`}
            </Button>

            <Box marginTop={2}>
                <Text size="small" textColor="light">
                    💡 Tip: The export will include all visible fields and records from the current view.
                </Text>
            </Box>
        </Box>
    );
}

initializeBlock(() => <ExportExtension />);
