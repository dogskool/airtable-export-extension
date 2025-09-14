import {initializeBlock, useBase, useCursor, Button, Text, Box, Select, Loader, Alert} from '@airtable/blocks/ui';
import React, {useState, useCallback, useMemo, useEffect} from 'react';
import * as XLSX from 'xlsx';
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
                    <Alert intent="danger">
                        <Text>Something went wrong. Please refresh the extension.</Text>
                        <Text size="small" textColor="light">
                            Error: {this.state.error?.message || 'Unknown error'}
                        </Text>
                    </Alert>
                </Box>
            );
        }

        return this.props.children;
    }
}

// Utility functions
function sanitizeSheetName(name) {
    return (name || 'Sheet1').replace(/[:\\/?*\[\]]/g, ' ').slice(0, 31).trim() || 'Sheet1';
}

function ymd(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${da}`;
}

function downloadFile(content, filename, mimeType = 'application/octet-stream') {
    try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return true;
    } catch (error) {
        console.error('Download error:', error);
        return false;
    }
}

function ExportExtension() {
    const base = useBase();
    const cursor = useCursor();
    
    // State management
    const [exportFormat, setExportFormat] = useState('excel');
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [tick, setTick] = useState(0);
    
    // Watch cursor changes
    useEffect(() => {
        if (!cursor) return;
        const unsub = cursor.watch(['activeTableId', 'activeViewId'], () => setTick(t => t + 1));
        return () => unsub && unsub();
    }, [cursor]);

    // Resolve the active table + view safely with fallbacks
    const {table, view} = useMemo(() => {
        try {
            const t = cursor?.activeTableId ? base.getTableByIdIfExists(cursor.activeTableId) : null;
            const v = t && cursor?.activeViewId ? t.getViewByIdIfExists(cursor.activeViewId) : null;
            // Fallbacks if needed
            return {
                table: t || base.tables[0] || null,
                view: (t && (v || t.views[0])) || null,
            };
        } catch (error) {
            console.error('Error resolving table/view:', error);
            return {table: null, view: null};
        }
    }, [base, cursor, tick]);

    // Initialize component safely
    useEffect(() => {
        try {
            if (base && base.tables && base.tables.length > 0) {
                setIsInitialized(true);
                setError(null);
                setSuccess(null);
                console.log('Extension initialized with cursor-based detection');
            }
        } catch (err) {
            console.error('Initialization error:', err);
            setError('Failed to initialize extension. Please refresh and try again.');
        }
    }, [base]);

    const exportToExcel = useCallback(async () => {
        try {
            console.log('Excel export function called');
            console.log('Table:', table?.name || 'null');
            console.log('View:', view?.name || 'null');
            
            setIsExporting(true);
            setError(null);
            setSuccess(null);

            if (!table || !view) {
                throw new Error('Open a table/view first.');
            }

            // Get visible fields in the view, in the same order the user sees
            const visibleFields = view.visibleFields;
            console.log('Visible fields:', visibleFields?.length || 0);

            // Query only those fields, respecting filters/sorts in the view
            console.log('Querying records...');
            const query = await view.selectRecordsAsync({ fields: visibleFields });
            console.log('Records found:', query.records.length);

            // Build rows (first row = headers)
            const header = visibleFields.map(f => f.name);
            const data = query.records.map(rec =>
                visibleFields.map(f => rec.getCellValueAsString(f))
            );

            // Free memory early
            await query.unloadAsync();

            // Build workbook
            const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sanitizeSheetName(view.name || 'Sheet1'));

            // Trigger file download
            const filename = `${table.name} – ${view.name} – ${ymd()}.xlsx`;
            XLSX.writeFile(wb, filename);
            
            setSuccess(`Excel exported successfully! (${query.records.length} records)`);
        } catch (err) {
            console.error('Excel Export error:', err);
            setError(`Excel Export failed: ${err.message}`);
            setSuccess(null);
        } finally {
            setIsExporting(false);
        }
    }, [table, view]);

    const exportToCSV = useCallback(async () => {
        try {
            console.log('CSV export function called');
            console.log('Table:', table?.name || 'null');
            console.log('View:', view?.name || 'null');
            
            setIsExporting(true);
            setError(null);
            setSuccess(null);

            if (!table || !view) {
                throw new Error('Open a table/view first.');
            }

            // Get visible fields in the view, in the same order the user sees
            const visibleFields = view.visibleFields;
            console.log('Visible fields:', visibleFields?.length || 0);

            // Query only those fields, respecting filters/sorts in the view
            console.log('Querying records...');
            const query = await view.selectRecordsAsync({ fields: visibleFields });
            console.log('Records found:', query.records.length);

            // Build rows (first row = headers)
            const header = visibleFields.map(f => f.name);
            const data = query.records.map(rec =>
                visibleFields.map(f => rec.getCellValueAsString(f))
            );

            // Free memory early
            await query.unloadAsync();

            // Build CSV content
            const csvContent = [header, ...data]
                .map(row => row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(','))
                .join('\n');

            const filename = `${table.name} – ${view.name} – ${ymd()}.csv`;
            const success = downloadFile(csvContent, filename, 'text/csv');
            
            if (success) {
                setSuccess(`CSV exported successfully! (${query.records.length} records)`);
            } else {
                setError('Failed to download file. Please try again.');
            }
        } catch (err) {
            console.error('CSV Export error:', err);
            setError(`CSV Export failed: ${err.message}`);
            setSuccess(null);
        } finally {
            setIsExporting(false);
        }
    }, [table, view]);

    const handleExport = useCallback(async () => {
        try {
            console.log('Export started, format:', exportFormat);
            console.log('Selected table:', table?.name);
            console.log('Selected view:', view?.name);
            
            setIsExporting(true);
            setError(null);
            setSuccess(null);
            
            if (exportFormat === 'csv') {
                await exportToCSV();
            } else {
                await exportToExcel();
            }
            
            console.log('Export completed successfully');
        } catch (err) {
            console.error('Export error in handleExport:', err);
            setError(`Export failed: ${err.message}`);
            setSuccess(null);
        } finally {
            setIsExporting(false);
        }
    }, [exportFormat, exportToCSV, exportToExcel, table, view]);

    // Show loading state if base is not ready or not initialized
    if (!base || !isInitialized) {
        return (
            <Box padding={3} className="export-container">
                <Box display="flex" alignItems="center" justifyContent="center" padding={3}>
                    <Loader size="large" />
                    <Text marginLeft={2}>Loading extension...</Text>
                </Box>
            </Box>
        );
    }

    return (
        <ErrorBoundary>
            <Box padding={3} className="export-container">
                <Text size="large" weight="bold" marginBottom={3}>
                    📊 Export Active View
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
                        disabled={isExporting}
                    />
                </Box>

                <Button
                    onClick={handleExport}
                    disabled={isExporting || !table || !view}
                    width="100%"
                    size="large"
                    icon={isExporting ? <Loader /> : undefined}
                >
                    {isExporting ? 'Exporting...' : (!table || !view ? '⚠️ No Table/View Detected' : `Export to ${exportFormat.toUpperCase()}`)}
                </Button>

                <Box marginTop={2}>
                    <Text size="small" textColor="light">
                        Exports only the columns visible in this view, in the same order.
                    </Text>
                </Box>

                {error && (
                    <Alert intent="danger" marginTop={2}>
                        <Text>{error}</Text>
                    </Alert>
                )}

                {success && (
                    <Alert intent="success" marginTop={2}>
                        <Text>{success}</Text>
                    </Alert>
                )}
            </Box>
        </ErrorBoundary>
    );
}

initializeBlock(() => <ExportExtension />);
