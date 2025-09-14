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

// Simple download function that works in Airtable environment
const downloadFile = (blob, fileName) => {
    try {
        // Create a temporary URL for the blob
        const url = URL.createObjectURL(blob);
        
        // Create a temporary anchor element
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL after a short delay
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
        
        return true;
    } catch (error) {
        console.error('Download error:', error);
        return false;
    }
};

function ExportExtension() {
    const base = useBase();
    
    // State for table and view selection
    const [selectedTableId, setSelectedTableId] = useState(null);
    const [selectedViewId, setSelectedViewId] = useState(null);
    const [exportFormat, setExportFormat] = useState('excel');
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [customFilename, setCustomFilename] = useState('');
    const [showFilenameInput, setShowFilenameInput] = useState(false);
    const [isMounted, setIsMounted] = useState(true);
    
    // Get available tables and views with safety checks
    const tables = base?.tables || [];
    const selectedTable = selectedTableId && base ? base.getTableById(selectedTableId) : null;
    const views = selectedTable?.views || [];
    const selectedView = selectedViewId && selectedTable ? selectedTable.getViewById(selectedViewId) : null;
    
    // Always call useRecords hook with a valid view
    const fallbackView = tables.length > 0 && tables[0].views.length > 0 ? tables[0].views[0] : null;
    const records = useRecords(selectedView || fallbackView);

    // Generate default filename
    const generateDefaultFilename = () => {
        if (!selectedTable || !selectedView) return '';
        const date = new Date().toISOString().split('T')[0];
        const extension = exportFormat === 'excel' ? 'xlsx' : 'csv';
        return `${selectedTable.name}_${selectedView.name}_${date}.${extension}`;
    };

    // Get the filename to use for export
    const getExportFilename = () => {
        if (customFilename.trim()) {
            const extension = exportFormat === 'excel' ? 'xlsx' : 'csv';
            return customFilename.endsWith(`.${extension}`) ? customFilename : `${customFilename}.${extension}`;
        }
        return generateDefaultFilename();
    };
    
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
                setIsInitialized(true);
                if (!selectedTableId) {
                    // Try to get the current table and view from the Airtable context
                    try {
                        console.log('Attempting to detect current context...');
                        console.log('Available base methods:', Object.getOwnPropertyNames(base));
                        
                        // Try different approaches to get current context
                        let currentTableId = null;
                        let currentViewId = null;
                        
                        // Method 1: Try base.getTableId() and base.getViewId()
                        if (typeof base.getTableId === 'function') {
                            currentTableId = base.getTableId();
                            console.log('Got current table ID:', currentTableId);
                        }
                        
                        if (typeof base.getViewId === 'function') {
                            currentViewId = base.getViewId();
                            console.log('Got current view ID:', currentViewId);
                        }
                        
                        // Method 2: Try accessing from base properties
                        if (!currentTableId && base.activeTableId) {
                            currentTableId = base.activeTableId;
                            console.log('Got active table ID from property:', currentTableId);
                        }
                        
                        if (!currentViewId && base.activeViewId) {
                            currentViewId = base.activeViewId;
                            console.log('Got active view ID from property:', currentViewId);
                        }
                        
                        // Method 3: Try to get from the first table's active view
                        if (!currentTableId && tables.length > 0) {
                            currentTableId = tables[0].id;
                            console.log('Using first table as fallback:', currentTableId);
                        }
                        
                        if (currentTableId) {
                            const currentTable = base.getTableById(currentTableId);
                            if (currentTable) {
                                console.log('Found current table:', currentTable.name);
                                
                                // Try to get the current view for this table
                                if (!currentViewId && typeof currentTable.getViewId === 'function') {
                                    currentViewId = currentTable.getViewId();
                                    console.log('Got current view ID from table:', currentViewId);
                                }
                                
                                // If still no view ID, use the first view
                                if (!currentViewId && currentTable.views && currentTable.views.length > 0) {
                                    currentViewId = currentTable.views[0].id;
                                    console.log('Using first view as fallback:', currentViewId);
                                }
                                
                                if (currentViewId) {
                                    const currentView = currentTable.getViewById(currentViewId);
                                    if (currentView) {
                                        console.log('Found current view:', currentView.name);
                                        setSelectedTableId(currentTable.id);
                                        setSelectedViewId(currentView.id);
                                        console.log('Successfully set table and view selections');
                                    } else {
                                        console.log('Could not find view, using first table');
                                        setSelectedTableId(tables[0].id);
                                    }
                                } else {
                                    console.log('No view ID found, using first table');
                                    setSelectedTableId(tables[0].id);
                                }
                            } else {
                                console.log('Could not find table, using first table');
                                setSelectedTableId(tables[0].id);
                            }
                        } else {
                            console.log('No table ID found, using first table');
                            setSelectedTableId(tables[0].id);
                        }
                    } catch (contextError) {
                        console.log('Could not detect current context, using defaults:', contextError);
                        // Fallback to first table and view
                        setSelectedTableId(tables[0].id);
                    }
                }
            }
        } catch (err) {
            console.error('Initialization error:', err);
            setError('Failed to initialize extension. Please refresh and try again.');
        }
    }, [base, tables, selectedTableId]);
    
    // Set default view when table changes
    React.useEffect(() => {
        try {
            if (views && views.length > 0 && !selectedViewId) {
                // Try to get the current view from the selected table
                try {
                    const currentViewId = selectedTable ? selectedTable.getViewId() : null;
                    const currentView = currentViewId && selectedTable ? selectedTable.getViewById(currentViewId) : null;
                    
                    if (currentView) {
                        console.log('Auto-detected current view for table:', currentView.name);
                        setSelectedViewId(currentView.id);
                    } else {
                        // Fallback to first view
                        setSelectedViewId(views[0].id);
                    }
                } catch (contextError) {
                    console.log('Could not detect current view, using first view:', contextError);
                    // Fallback to first view
                    setSelectedViewId(views[0].id);
                }
            }
        } catch (err) {
            console.error('View selection error:', err);
            setError('Failed to load views. Please try selecting a different table.');
        }
    }, [views, selectedViewId, selectedTable]);

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
            const fileName = getExportFilename();
            
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
            const fileName = getExportFilename();
            
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

            {/* Filename Customization */}
            <Box marginBottom={3}>
                <Text size="small" marginBottom={1}>
                    Filename:
                </Text>
                <Box display="flex" alignItems="center" gap={2}>
                    <Text size="small" textColor="light" style={{ flex: 1 }}>
                        {generateDefaultFilename()}
                    </Text>
                    <Button
                        size="small"
                        variant="secondary"
                        onClick={() => setShowFilenameInput(!showFilenameInput)}
                        disabled={isExporting}
                    >
                        {showFilenameInput ? 'Use Default' : 'Customize'}
                    </Button>
                </Box>
                
                {showFilenameInput && (
                    <Box marginTop={2}>
                        <Text size="small" marginBottom={1}>
                            Custom filename (without extension):
                        </Text>
                        <input
                            type="text"
                            value={customFilename}
                            onChange={(e) => setCustomFilename(e.target.value)}
                            placeholder={`${selectedTable?.name || 'table'}_${selectedView?.name || 'view'}_${new Date().toISOString().split('T')[0]}`}
                            disabled={isExporting}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        />
                        <Text size="small" textColor="light" marginTop={1}>
                            Extension (.{exportFormat === 'excel' ? 'xlsx' : 'csv'}) will be added automatically
                        </Text>
                    </Box>
                )}
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

initializeBlock(() => (
    <ErrorBoundary>
        <ExportExtension />
    </ErrorBoundary>
));
