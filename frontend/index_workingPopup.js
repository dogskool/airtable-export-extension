import {initializeBlock, useBase, useCursor, Button, Text, Box} from '@airtable/blocks/ui';
import * as XLSX from 'xlsx';

function ExportExtension() {
    const base = useBase();
    const cursor = useCursor();

    if (!base) {
        return (
            <Box padding={3}>
                <Text>Loading...</Text>
            </Box>
        );
    }

    // Try to get active table/view with better error handling
    let table = null;
    let view = null;
    let tableName = 'Unknown';
    let viewName = 'Unknown';

    try {
        // First try to get from cursor (active table/view)
        if (cursor?.activeTableId) {
            table = base.getTableByIdIfExists(cursor.activeTableId);
            if (table && cursor?.activeViewId) {
                view = table.getViewByIdIfExists(cursor.activeViewId);
            }
        }
        
        // Fallback to first table/view if cursor method fails
        if (!table) {
            table = base.tables[0];
            tableName = table?.name || 'First Table';
        } else {
            tableName = table.name;
        }
        
        if (!view && table) {
            view = table.views[0];
            viewName = view?.name || 'First View';
        } else if (view) {
            viewName = view.name;
        }
    } catch (error) {
        console.error('Error detecting table/view:', error);
        // Ultimate fallback
        table = base.tables[0];
        view = table?.views[0];
        tableName = table?.name || 'Unknown Table';
        viewName = view?.name || 'Unknown View';
    }

    const handleExport = async () => {
        try {
            if (!table || !view) {
                alert('No table/view available for export');
                return;
            }

            console.log('Starting export from:', tableName, viewName);

            // Get fields - use all fields for simplicity
            const fields = table.fields;
            console.log('Fields available:', fields.length);

            // Query records
            const query = await view.selectRecordsAsync({ fields: fields });
            console.log('Records found:', query.records.length);

            if (query.records.length === 0) {
                alert('No records found to export');
                return;
            }

            // Build data
            const header = fields.map(f => f.name);
            const data = query.records.map(rec =>
                fields.map(f => rec.getCellValueAsString(f))
            );

            // Generate filename
            const filename = `${tableName}_${viewName}_${new Date().toISOString().split('T')[0]}.xlsx`;

            console.log('Exporting as:', filename);

            // Excel export
            const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
            XLSX.writeFile(wb, filename);

            console.log('Export completed successfully');
            alert(`Export completed successfully!\n\nExported ${query.records.length} records from:\nTable: ${tableName}\nView: ${viewName}`);
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
                Table: <strong>{tableName}</strong><br/>
                View: <strong>{viewName}</strong>
            </Text>

            <Text size="small" textColor="light" marginBottom={3}>
                This will export all fields from the detected table/view.
            </Text>

            <Button
                onClick={handleExport}
                disabled={!table || !view}
                width="100%"
                size="large"
            >
                {!table || !view ? '⚠️ No Table/View Available' : `Export ${tableName} → ${viewName}`}
            </Button>
        </Box>
    );
}

initializeBlock(() => <ExportExtension />);