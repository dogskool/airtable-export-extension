import {initializeBlock, useBase, useRecords, Button, Text, Box, Select, Loader, Alert} from '@airtable/blocks/ui';
import React, {useState, useCallback, useMemo} from 'react';
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
    // const session = useSession();
    // const globalConfig = useGlobalConfig();
    
    // Debug session and base active context (commented out for production)
    // React.useEffect(() => {
    //     console.log('=== SESSION DEBUG ===');
    //     console.log('Session object:', session);
    //     console.log('Session activeTableId:', session?.activeTableId);
    //     console.log('Session activeViewId:', session?.activeViewId);
    //     console.log('Base activeTableId (if available):', base?.activeTableId);
    //     console.log('Base activeViewId (if available):', base?.activeViewId);
    //     
    //     // Check if base has any other context properties
    //     console.log('Base object keys:', Object.keys(base || {}));
    //     console.log('Base prototype keys:', Object.getOwnPropertyNames(Object.getPrototypeOf(base || {})));
    //     
    //     // Check if there are any methods on base that might give us context
    //     if (base) {
    //         console.log('Base methods:', Object.getOwnPropertyNames(base).filter(key => typeof base[key] === 'function'));
    //     }
    //     
    //     // Check global config
    //     console.log('Global config:', globalConfig);
    // }, [session, base, globalConfig]);
    
    // State for table and view selection - using empty strings for dropdowns
    const [selectedTableId, setSelectedTableId] = useState('');
    const [selectedViewId, setSelectedViewId] = useState('');
    const [exportFormat, setExportFormat] = useState('excel');
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [customFilename, setCustomFilename] = useState('');
    const [showFilenameInput, setShowFilenameInput] = useState(false);
    
    // Ref to track if component is mounted
    const isMountedRef = React.useRef(true);
    
    // Get available tables and views with safety checks
    const tables = useMemo(() => base?.tables || [], [base]);
    const selectedTable = selectedTableId && base ? base.getTableById(selectedTableId) : null;
    const views = selectedTable?.views || [];
    const selectedView = selectedViewId && selectedTable ? selectedTable.getViewById(selectedViewId) : null;
    
    // Debug logging (commented out for production)
    // console.log('🔧 STATE DEBUG:', {
    //     selectedTableId,
    //     selectedViewId,
    //     selectedTable: selectedTable?.name,
    //     selectedView: selectedView?.name
    // });
    
    // Always call useRecords hook with a valid view
    const fallbackView = tables.length > 0 && tables[0].views.length > 0 ? tables[0].views[0] : null;
    const records = useRecords(selectedView || fallbackView);
    
    // Debug records loading (commented out for production)
    // React.useEffect(() => {
    //     if (selectedView) {
    //         console.log('Records for selected view:', records?.length || 0);
    //         console.log('Selected view:', selectedView.name);
    //         console.log('Records data:', records);
    //     }
    // }, [selectedView, records]);
    
    // Handle Promise-based hooks that might not resolve due to CORS
    const [resolvedRecords, setResolvedRecords] = useState(null);
    
    React.useEffect(() => {
        // Try to resolve records if it's a Promise
        if (records && typeof records.then === 'function') {
            records.then(resolved => {
                // console.log('Records resolved:', resolved);
                setResolvedRecords(resolved);
            }).catch(() => {
                // console.log('Records failed to resolve:', err);
                setResolvedRecords([]);
            });
        } else {
            setResolvedRecords(records);
        }
    }, [records]);

    // Generate default filename
    const generateDefaultFilename = useCallback(() => {
        if (!selectedTable || !selectedView) return '';
        const date = new Date().toISOString().split('T')[0];
        const extension = exportFormat === 'excel' ? 'xlsx' : 'csv';
        return `${selectedTable.name}_${selectedView.name}_${date}.${extension}`;
    }, [selectedTable, selectedView, exportFormat]);

    // Get the filename to use for export
    const getExportFilename = useCallback(() => {
        if (customFilename.trim()) {
            const extension = exportFormat === 'excel' ? 'xlsx' : 'csv';
            return customFilename.endsWith(`.${extension}`) ? customFilename : `${customFilename}.${extension}`;
        }
        return generateDefaultFilename();
    }, [customFilename, exportFormat, generateDefaultFilename]);

    // Simple selection handlers - no complex logic
    const handleTableChange = (value) => {
        console.log('Table selected:', value);
        setSelectedTableId(value);
        setSelectedViewId('');
        setError(null);
        setSuccess(null);
    };

    const handleViewChange = (value) => {
        console.log('View selected:', value);
        setSelectedViewId(value);
        setError(null);
        setSuccess(null);
    };

    // Simple options arrays
    const tableOptions = [
        { value: '', label: '-- Select a table --' },
        ...tables.map(table => ({
            value: table.id,
            label: table.name
        }))
    ];

    const viewOptions = [
        { value: '', label: '-- Select a view --' },
        ...views.map(view => ({
            value: view.id,
            label: view.name
        }))
    ];

    // Initialize component safely
    React.useEffect(() => {
        try {
            if (base && tables && tables.length > 0) {
                setIsInitialized(true);
                // console.log('=== EXTENSION INITIALIZED ===');
                // console.log('Available tables:', tables.map(t => t.name));
                // console.log('User must select table and view manually');
                
                // Always start with blank dropdowns - no auto-selection
                // console.log('🔧 INITIALIZATION: Setting selectedTableId and selectedViewId to empty strings');
                setSelectedTableId('');
                setSelectedViewId('');
                // console.log('🔧 INITIALIZATION: Values set to empty strings');
                setError(null);
                setSuccess(null);
            }
        } catch (err) {
            console.error('Initialization error:', err);
            setError('Failed to initialize extension. Please refresh and try again.');
        }
    }, [base, tables]);
    
    // Cleanup effect to prevent state updates on unmounted component
    React.useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);
    
    // No additional auto-detection - user must select manually
    
    // No auto-selection - user must select manually

    const exportToCSV = useCallback(async () => {
        try {
            // console.log('CSV export function called');
            // console.log('selectedTable:', selectedTable);
            // console.log('selectedView:', selectedView);
            // console.log('records:', records);
            
            setIsExporting(true);
            setError(null);
            setSuccess(null);

            if (!selectedTable || !selectedView) {
                alert('Please select both a table and view before exporting.');
                setIsExporting(false);
                return;
            }
            
            const recordsToExport = resolvedRecords || records;
            if (!recordsToExport || recordsToExport.length === 0) {
                throw new Error('No records to export. Please check if the view has data or try refreshing the extension.');
            }
            
            // console.log('CSV export validation passed, processing data...');

            const fields = selectedTable.fields;
            const headers = fields.map(field => field.name);
            
            const csvData = recordsToExport.map(record => {
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
            
            // Use the simplified download function
            const success = downloadFile(blob, fileName);
            
            if (success) {
                setSuccess(`Successfully exported ${recordsToExport ? recordsToExport.length : 0} records to CSV`);
                setError(null);
            } else {
                setError('Failed to download file. Please try again.');
                setSuccess(null);
            }
        } catch (err) {
            console.error('CSV Export error:', err);
            setError(`CSV Export failed: ${err.message}`);
            setSuccess(null);
        } finally {
            setIsExporting(false);
        }
    }, [records, selectedTable, selectedView, getExportFilename, resolvedRecords]);

    const exportToExcel = useCallback(async () => {
        try {
            // console.log('Excel export function called');
            // console.log('selectedTable:', selectedTable);
            // console.log('selectedView:', selectedView);
            // console.log('records:', records);
            
            setIsExporting(true);
            setError(null);
            setSuccess(null);

            if (!selectedTable || !selectedView) {
                alert('Please select both a table and view before exporting.');
                setIsExporting(false);
                return;
            }
            
            const recordsToExport = resolvedRecords || records;
            if (!recordsToExport || recordsToExport.length === 0) {
                throw new Error('No records to export. Please check if the view has data or try refreshing the extension.');
            }
            
            // console.log('Excel export validation passed, processing data...');

            const fields = selectedTable.fields;
            const headers = fields.map(field => field.name);
            
            const excelData = recordsToExport.map(record => {
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
            
            // Use the simplified download function
            const success = downloadFile(blob, fileName);
            
            if (success) {
                setSuccess(`Successfully exported ${recordsToExport ? recordsToExport.length : 0} records to Excel`);
                setError(null);
            } else {
                setError('Failed to download file. Please try again.');
                setSuccess(null);
            }
        } catch (err) {
            console.error('Excel Export error:', err);
            setError(`Excel Export failed: ${err.message}`);
            setSuccess(null);
        } finally {
            setIsExporting(false);
        }
    }, [records, selectedTable, selectedView, getExportFilename, resolvedRecords]);

    const handleExport = useCallback(async () => {
        try {
            // console.log('Export started, format:', exportFormat);
            // console.log('Selected table:', selectedTable?.name);
            // console.log('Selected view:', selectedView?.name);
            // console.log('Records count:', records?.length);
            
            setIsExporting(true);
            setError(null);
            setSuccess(null);
            
            if (exportFormat === 'csv') {
                // console.log('Starting CSV export...');
                await exportToCSV();
            } else {
                // console.log('Starting Excel export...');
                await exportToExcel();
            }
            
            // console.log('Export completed successfully');
        } catch (err) {
            console.error('Export error in handleExport:', err);
            setError(`Export failed: ${err.message}`);
            setSuccess(null);
        } finally {
            setIsExporting(false);
        }
    }, [exportFormat, exportToCSV, exportToExcel]);

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
                📊 Data Export Tool - Manual Selection
            </Text>
            <Text size="small" textColor="light" marginBottom={3}>
                Build: {new Date().toISOString().slice(0, 19).replace('T', ' ')} - Manual Version
            </Text>
            
            {/* Table Selection */}
            <Box marginBottom={3}>
                <Text size="small" fontWeight="bold" marginBottom={1}>
                    Select Table:
                </Text>
                <Select
                    value={selectedTableId}
                    onChange={handleTableChange}
                    options={tableOptions}
                    disabled={isExporting}
                    width="100%"
                />
            </Box>
            
            {/* View Selection */}
            <Box marginBottom={3}>
                <Text size="small" fontWeight="bold" marginBottom={1}>
                    Select View:
                </Text>
                <Select
                    value={selectedViewId}
                    onChange={handleViewChange}
                    options={viewOptions}
                    disabled={isExporting || !selectedTableId || selectedTableId === ''}
                    width="100%"
                />
            </Box>
            
            {/* Selected Table/View Info */}
            {selectedTable && selectedView ? (
                <Box marginBottom={3}>
                    <Text size="small" fontWeight="bold" marginBottom={1}>
                        Selected:
                    </Text>
                    <Text size="small" marginBottom={1}>
                        Table: <strong>{selectedTable.name}</strong>
                    </Text>
                    <Text size="small" marginBottom={2}>
                        View: <strong>{selectedView.name}</strong>
                    </Text>
                    <Text size="small" textColor="light">
                        {resolvedRecords ? `${resolvedRecords.length} records` : (records && records.length !== undefined ? `${records.length} records` : 'Loading records...')}
                    </Text>
                </Box>
            ) : (
                <Box marginBottom={3} padding={2} backgroundColor="yellowLight2" borderRadius="default" border="yellow">
                    <Text size="small" textColor="dark" fontWeight="bold">
                        ⚠️ Please select a table and view before exporting
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
                disabled={isExporting || !selectedTable || !selectedView}
                width="100%"
                size="large"
                icon={isExporting ? <Loader /> : undefined}
            >
                {isExporting ? 'Exporting...' : (!selectedTable || !selectedView ? '⚠️ Select Table & View First' : `Export to ${exportFormat.toUpperCase()}`)}
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
