import {initializeBlock, useBase, useRecords, Button, Text, Box, Select, Loader, Alert} from '@airtable/blocks/ui';
import React, {useState, useCallback} from 'react';
import ExcelJS from 'exceljs';
import {saveAs} from 'file-saver';
import './style.css';

function ExportExtension() {
    const base = useBase();
    const table = base.getTableByName(base.tables[0].name); // Get first table
    const view = table.views[0]; // Get first view
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

            // Create workbook using ExcelJS
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet(view.name);
            
            // Add headers
            worksheet.addRow(headers);
            
            // Style the header row
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true };
            headerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE6E6FA' }
            };
            
            // Add data rows
            excelData.forEach(rowData => {
                worksheet.addRow(rowData);
            });
            
            // Set column widths
            worksheet.columns.forEach((column, index) => {
                const headerLength = headers[index].length;
                const maxDataLength = Math.max(
                    ...excelData.map(row => String(row[index] || '').length)
                );
                column.width = Math.min(Math.max(headerLength, maxDataLength) + 2, 50);
            });
            
            // Add borders to all cells
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };
                });
            });
            
            // Generate and download file
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
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
