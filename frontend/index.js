import React, {useState, useMemo} from 'react';
import {initializeBlock, useBase, useCursor, Button, Text, Box, Input, FormField} from '@airtable/blocks/ui';
import * as XLSX from 'xlsx';

function ExportExtension() {
    const base   = useBase();
    const cursor = useCursor();

    // ---- Resolve active table & view (with safe fallbacks) ----
    let table = null, view = null, tableName = 'Unknown', viewName = 'Unknown';
    if (base) {
        try {
            if (cursor?.activeTableId) {
                table = base.getTableByIdIfExists(cursor.activeTableId);
                if (table && cursor?.activeViewId) view = table.getViewByIdIfExists(cursor.activeViewId);
            }
            if (!table) table = base.tables[0];
            if (!view && table) view = table.views[0];
            tableName = table?.name || 'Unknown';
            viewName  = view?.name  || 'Unknown';
        } catch (e) {
            table = base.tables[0];
            view  = table?.views[0];
            tableName = table?.name || 'Unknown';
            viewName  = view?.name  || 'Unknown';
        }
    }

    // ---- Filename UI state ----
    const [customName, setCustomName] = useState('');

    // helper: YYYY-MM-DD
    const ymd = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    };

    // default filename (shown as placeholder)
    const defaultFilename = useMemo(() => {
        return `${tableName}_${viewName}_${ymd()}.xlsx`;
    }, [tableName, viewName]);

    // sanitize and ensure .xlsx
    function toSafeFilename(name) {
        const sanitized = String(name).trim().replace(/[/\\?%*:|"<>]+/g, '-');
        return sanitized.toLowerCase().endsWith('.xlsx') ? sanitized : `${sanitized}.xlsx`;
    }

    const resolvedFilename = () => {
        if (!customName || !customName.trim()) return defaultFilename;
        return toSafeFilename(customName);
    };

    // ---- Export ----
    const handleExport = async () => {
        try {
            if (!table || !view) {
                alert('No table/view selected');
                return;
            }

            // fields: prefer view’s visible fields
            let visibleFields = view.visibleFields?.length ? view.visibleFields : table.fields;

            // query
            const query = await view.selectRecordsAsync({ fields: visibleFields });

            // data
            const header = visibleFields.map(f => f.name);
            const rows = query.records.map(rec => visibleFields.map(f => rec.getCellValueAsString(f)));

            // workbook
            const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

            const filename = resolvedFilename();
            XLSX.writeFile(wb, filename);

            // alert(`Exported: ${filename}`);
        } catch (err) {
            console.error('Export error:', err);
            alert(`Export failed: ${err.message}`);
        }
    };

    if (!base) {
        return (
            <Box padding={3}><Text>Loading...</Text></Box>
        );
    }

    return (
        <Box padding={3}>
            <Text size="large" weight="bold" marginBottom={2}>📊 Export View Data</Text>
            <Text size="small" textColor="light" marginBottom={3}>
                Table: <strong>{tableName}</strong><br/>
                View:&nbsp; <strong>{viewName}</strong>
            </Text>

            <FormField
                label="Custom file name (optional)"
                description="Leave blank to use the default. Illegal characters will be replaced."
            >
                <Input
                    value={customName}
                    onChange={e => setCustomName(e.target.value)}
                    placeholder={defaultFilename}   // greyed default
                />
            </FormField>

            <Box marginTop={2} marginBottom={3}>
                <Text size="small" textColor="light">
                    Will save as: <strong>{resolvedFilename()}</strong>
                </Text>
            </Box>

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