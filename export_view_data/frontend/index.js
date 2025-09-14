import {initializeBlock, useBase, useRecords, Button, Text, Box, Select, Loader, Alert} from '@airtable/blocks/ui';
import React, {useState, useCallback} from 'react';
import ExcelJS from 'exceljs';
import {saveAs} from 'file-saver';
import './style.css';

function ExportExtension() {
    const base = useBase();
    
    // State for table and view selection
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [selectedViewId, setSelectedViewId] = useState(null);
    const [exportFormat, setExportFormat] = useState('excel');
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // Get available tables and views with safety checks
    const tables = base?.tables || [];
    const selectedTable = selectedTableId && base ? base.getTableById(selectedTableId) : null;
    const views = selectedTable?.views || [];
    const selectedView = selectedViewId && selectedTable ? selectedTable.getViewById(selectedViewId) : null;
    
    // Always call useRecords hook with a valid view
    const fallbackView = tables.length > 0 && tables[0].views.length > 0 ? tables[0].views[0] : null;
    const records = useRecords(selectedView || fallbackView);
    
    // Set default selections when tables are available
    React.useEffect(() => {
        if (tables && tables.length > 0 && !selectedTableId) {
            setSelectedTableId(tables[0].id);
        }
    }, [tables, selectedTableId]);
    
    React.useEffect(() => {
        if (views && views.length > 0 && !selectedViewId) {
            setSelectedViewId(views[0].id);
        }
    }, [views, selectedViewId]);

    const exportToCSV = useCallback(async () => {
        try {
            if (!selectedTable || !selectedView) {
                throw new Error('Please select a table and view');
            }
            
            if (!records || records.length === 0) {
                throw new Error('No records to export');
            }

            const fields = selectedTable.fields;
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
            const fileName = `${selectedTable.name}_${selectedView.name}_${new Date().toISOString().split('T')[0]}.csv`;
            saveAs(blob, fileName);
            
            setSuccess(`Successfully exported ${records.length} records to CSV`);
            setError(null);
        } catch (err) {
            setError(`CSV Export failed: ${err.message}`);
            setSuccess(null);
        }
    }, [records, selectedTable, selectedView]);

    const exportToExcel = useCallback(async () => {
        try {
            if (!selectedTable || !selectedView) {
                throw new Error('Please select a table and view');
            }
            
            if (!records || records.length === 0) {
                throw new Error('No records to export');
            }

            const fields = selectedTable.fields;
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
            const worksheet = workbook.addWorksheet(selectedView.name);
            
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
            const fileName = `${selectedTable.name}_${selectedView.name}_${new Date().toISOString().split('T')[0]}.xlsx`;
            saveAs(blob, fileName);
            
            setSuccess(`Successfully exported ${records.length} records to Excel`);
            setError(null);
        } catch (err) {
            setError(`Excel Export failed: ${err.message}`);
            setSuccess(null);
        }
    }, [records, selectedTable, selectedView]);

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

    // Show loading state if base is not ready
    if (!base) {
        return (
            <Box padding={3} className="export-container">
                <Text size="large" marginBottom={2}>
                    📊 Export View Data
                </Text>
                <Text>Loading...</Text>
            </Box>
        );
    }

    return (
        <Box padding={3} className="export-container">
            <Text size="large" marginBottom={2}>
                📊 Export View Data
            </Text>
            
            {/* Table Selection */}
            <Box marginBottom={3}>
                <Text size="small" fontWeight="bold" marginBottom={1}>
                    Select Table:
                </Text>
                <Select
                    value={selectedTableId || ''}
                    onChange={value => {
                        setSelectedTableId(value);
                        setSelectedViewId(null); // Reset view when table changes
                    }}
                    options={tables.map(table => ({
                        value: table.id,
                        label: table.name
                    }))}
                    disabled={isExporting}
                />
            </Box>
            
            {/* View Selection */}
            <Box marginBottom={3}>
                <Text size="small" fontWeight="bold" marginBottom={1}>
                    Select View:
                </Text>
                <Select
                    value={selectedViewId || ''}
                    onChange={value => setSelectedViewId(value)}
                    options={views.map(view => ({
                        value: view.id,
                        label: view.name
                    }))}
                    disabled={isExporting || !selectedTable}
                />
            </Box>
            
            {/* Selected Table/View Info */}
            {selectedTable && selectedView && (
                <Box marginBottom={3}>
                    <Text size="small" marginBottom={1}>
                        Table: <strong>{selectedTable.name}</strong>
                    </Text>
                    <Text size="small" marginBottom={2}>
                        View: <strong>{selectedView.name}</strong>
                    </Text>
                    <Text size="small" textColor="light">
                        {records && records.length !== undefined ? `${records.length} records` : 'Loading records...'}
                    </Text>
                </Box>
            )}

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
                disabled={isExporting || !selectedTable || !selectedView || !records || records.length === 0}
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
