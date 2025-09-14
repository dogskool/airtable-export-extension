import {initializeBlock, useBase, useRecords, Button, Text, Box, Select, Loader, Alert} from '@airtable/blocks/ui';
import React, {useState, useCallback, useEffect} from 'react';
import ExcelJS from 'exceljs';
// import {saveAs} from 'file-saver'; // Commented out due to Airtable compatibility issues
import './style.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error Boundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box padding={3} className="export-container">
                    <Text size="large" marginBottom={2}>
                        ⚠️ Something went wrong
                    </Text>
                    <Text marginBottom={2}>
                        The extension encountered an error. Please refresh the page and try again.
                    </Text>
                    <Button 
                        onClick={() => window.location.reload()} 
                        size="large"
                    >
                        Refresh Extension
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
}

// Custom download function that works in Airtable environment
const downloadFile = (blob, fileName, onComplete) => {
    try {
        // Create a temporary URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        
        // Add event listeners for download completion
        const handleDownloadComplete = () => {
            try {
                // Clean up the URL
                URL.revokeObjectURL(url);
                
                // Call completion callback after a short delay
                if (onComplete) {
                    setTimeout(() => {
                        onComplete(true);
                    }, 50);
                }
            } catch (err) {
                console.error('Download completion error:', err);
                if (onComplete) {
                    onComplete(false);
                }
            }
        };
        
        // Listen for download events
        link.addEventListener('click', () => {
            // Use a longer timeout to ensure download starts
            setTimeout(handleDownloadComplete, 200);
        });
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        return true;
    } catch (error) {
        console.error('Download error:', error);
        if (onComplete) {
            onComplete(false);
        }
        return false;
    }
};

function ExportExtension() {
    try {
        const base = useBase();
        
        // State for table and view selection
        const [selectedTableId, setSelectedTableId] = useState(null);
        const [selectedViewId, setSelectedViewId] = useState(null);
        const [exportFormat, setExportFormat] = useState('excel');
        const [isExporting, setIsExporting] = useState(false);
        const [error, setError] = useState(null);
        const [success, setSuccess] = useState(null);
        const [isInitialized, setIsInitialized] = useState(false);
        const [isMounted, setIsMounted] = useState(true);
    
    // Get available tables and views with safety checks
    const tables = base?.tables || [];
    const selectedTable = selectedTableId && base ? base.getTableById(selectedTableId) : null;
    const views = selectedTable?.views || [];
    const selectedView = selectedViewId && selectedTable ? selectedTable.getViewById(selectedViewId) : null;
    
    // Always call useRecords hook with a valid view
    const fallbackView = tables.length > 0 && tables[0].views.length > 0 ? tables[0].views[0] : null;
    const records = useRecords(selectedView || fallbackView);
    
    // Safe state update function with debouncing
    const safeSetState = useCallback((setter, value, delay = 0) => {
        if (isMounted) {
            try {
                if (delay > 0) {
                    setTimeout(() => {
                        if (isMounted) {
                            setter(value);
                        }
                    }, delay);
                } else {
                    setter(value);
                }
            } catch (err) {
                console.error('State update error:', err);
            }
        }
    }, [isMounted]);

    // Debounced state update function
    const debouncedSetState = useCallback((setter, value, delay = 100) => {
        if (isMounted) {
            try {
                setTimeout(() => {
                    if (isMounted) {
                        setter(value);
                    }
                }, delay);
            } catch (err) {
                console.error('Debounced state update error:', err);
            }
        }
    }, [isMounted]);

    // Cleanup effect
    React.useEffect(() => {
        return () => {
            setIsMounted(false);
        };
    }, []);

    // Initialize component safely
    React.useEffect(() => {
        try {
            if (base && tables && tables.length > 0) {
                safeSetState(setIsInitialized, true);
                if (!selectedTableId) {
                    safeSetState(setSelectedTableId, tables[0].id);
                }
            }
        } catch (err) {
            console.error('Initialization error:', err);
            safeSetState(setError, 'Failed to initialize extension. Please refresh and try again.');
        }
    }, [base, tables, selectedTableId, safeSetState]);
    
    // Set default view when table changes
    React.useEffect(() => {
        try {
            if (views && views.length > 0 && !selectedViewId) {
                safeSetState(setSelectedViewId, views[0].id);
            }
        } catch (err) {
            console.error('View selection error:', err);
            safeSetState(setError, 'Failed to load views. Please try selecting a different table.');
        }
    }, [views, selectedViewId, safeSetState]);

    const exportToCSV = useCallback(async () => {
        try {
            console.log('CSV export function called');
            console.log('selectedTable:', selectedTable);
            console.log('selectedView:', selectedView);
            console.log('records:', records);
            
            safeSetState(setIsExporting, true);
            safeSetState(setError, null);
            safeSetState(setSuccess, null);

            if (!selectedTable || !selectedView) {
                throw new Error('Please select a table and view');
            }
            
            if (!records || records.length === 0) {
                throw new Error('No records to export');
            }
            
            console.log('CSV export validation passed, processing data...');

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
            
            // Use the new download function with completion callback
            downloadFile(blob, fileName, (success) => {
                if (success) {
                    debouncedSetState(setSuccess, `Successfully exported ${records ? records.length : 0} records to CSV`, 100);
                    debouncedSetState(setError, null, 100);
                } else {
                    debouncedSetState(setError, 'Failed to download file. Please try again.', 100);
                    debouncedSetState(setSuccess, null, 100);
                }
                // Always reset exporting state after download attempt
                debouncedSetState(setIsExporting, false, 150);
            });
        } catch (err) {
            console.error('CSV Export error:', err);
            debouncedSetState(setError, `CSV Export failed: ${err.message}`, 100);
            debouncedSetState(setSuccess, null, 100);
            debouncedSetState(setIsExporting, false, 150);
        }
    }, [records, selectedTable, selectedView, debouncedSetState]);

    const exportToExcel = useCallback(async () => {
        try {
            console.log('Excel export function called');
            console.log('selectedTable:', selectedTable);
            console.log('selectedView:', selectedView);
            console.log('records:', records);
            
            safeSetState(setIsExporting, true);
            safeSetState(setError, null);
            safeSetState(setSuccess, null);

            if (!selectedTable || !selectedView) {
                throw new Error('Please select a table and view');
            }
            
            if (!records || records.length === 0) {
                throw new Error('No records to export');
            }
            
            console.log('Excel export validation passed, processing data...');

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
            
            // Use the new download function with completion callback
            downloadFile(blob, fileName, (success) => {
                if (success) {
                    debouncedSetState(setSuccess, `Successfully exported ${records ? records.length : 0} records to Excel`, 100);
                    debouncedSetState(setError, null, 100);
                } else {
                    debouncedSetState(setError, 'Failed to download file. Please try again.', 100);
                    debouncedSetState(setSuccess, null, 100);
                }
                // Always reset exporting state after download attempt
                debouncedSetState(setIsExporting, false, 150);
            });
        } catch (err) {
            console.error('Excel Export error:', err);
            debouncedSetState(setError, `Excel Export failed: ${err.message}`, 100);
            debouncedSetState(setSuccess, null, 100);
            debouncedSetState(setIsExporting, false, 150);
        }
    }, [records, selectedTable, selectedView, debouncedSetState]);

    const handleExport = useCallback(async () => {
        try {
            console.log('Export started, format:', exportFormat);
            console.log('Selected table:', selectedTable?.name);
            console.log('Selected view:', selectedView?.name);
            console.log('Records count:', records?.length);
            
            safeSetState(setIsExporting, true);
            safeSetState(setError, null);
            safeSetState(setSuccess, null);
            
            // Add a small delay to ensure state updates are processed
            await new Promise(resolve => setTimeout(resolve, 50));
            
            if (exportFormat === 'csv') {
                console.log('Starting CSV export...');
                await exportToCSV();
            } else {
                console.log('Starting Excel export...');
                await exportToExcel();
            }
            
            console.log('Export completed successfully');
        } catch (err) {
            console.error('Export error in handleExport:', err);
            debouncedSetState(setError, `Export failed: ${err.message}`, 100);
            debouncedSetState(setSuccess, null, 100);
        } finally {
            // Use setTimeout to ensure state update happens after export
            setTimeout(() => {
                safeSetState(setIsExporting, false);
            }, 100);
        }
    }, [exportFormat, exportToCSV, exportToExcel, safeSetState, debouncedSetState, selectedTable, selectedView, records]);

    // Show loading state if base is not ready or not initialized
    if (!base || !isInitialized) {
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
    } catch (err) {
        console.error('ExportExtension render error:', err);
        return (
            <Box padding={3} className="export-container">
                <Text size="large" marginBottom={2}>
                    ⚠️ Something went wrong
                </Text>
                <Text marginBottom={2}>
                    The extension encountered an error during rendering. Please refresh the page and try again.
                </Text>
                <Text size="small" textColor="light">
                    Error: {err.message}
                </Text>
                <Button onClick={() => window.location.reload()} size="large" marginTop={2}>
                    Refresh Extension
                </Button>
            </Box>
        );
    }
}

initializeBlock(() => (
    <ErrorBoundary>
        <ExportExtension />
    </ErrorBoundary>
));
