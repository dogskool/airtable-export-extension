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

    // Build workbook from the active view
    async function buildWorkbook() {
        if (!table || !view) throw new Error('No table/view selected');
        const visibleFields = view.visibleFields?.length ? view.visibleFields : table.fields;
        const query = await view.selectRecordsAsync({ fields: visibleFields });

        const header = visibleFields.map(f => f.name);
        const rows = query.records.map(rec => visibleFields.map(f => rec.getCellValueAsString(f)));

        const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        return wb;
    }

    // ---- Quick Export (Downloads or browser default) ----
    const handleQuickExport = async () => {
        try {
            const wb = await buildWorkbook();
            const filename = resolvedFilename();
            XLSX.writeFile(wb, filename);
            alert(`Exported: ${filename}`);
        } catch (err) {
            console.error('Quick export error:', err);
            alert(`Export failed: ${err.message}`);
        }
    };

    // ---- Save As… (folder picker when supported) ----
    const supportsFSAccess = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

    const handleSaveAs = async () => {
        try {
            const wb = await buildWorkbook();
            const filename = resolvedFilename();

            // write to ArrayBuffer so we can stream it
            const data = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            const blob = new Blob(
                [data],
                { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
            );

            // Use the File System Access API (Chromium browsers)
            const handle = await window.showSaveFilePicker({
                suggestedName: filename,
                types: [
                    {
                        description: 'Excel Workbook',
                        accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
                    }
                ]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();

            alert(`Saved: ${handle.name}`);
        } catch (err) {
            // If user cancels, no need to show a scary error
            if (err && (err.name === 'AbortError' || err.message?.includes('aborted'))) return;
            console.error('Save As… error:', err);
            alert(`Save failed: ${err.message}`);
        }
    };

    if (!base) {
        return <Box padding={3}><Text>Loading...</Text></Box>;
    }

    return (
        <Box padding={3}>
            <Text size="large" weight="bold" marginBottom={2}>📊 Export Data</Text>
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
                    placeholder={defaultFilename}
                />
            </FormField>

            <Box marginTop={2} marginBottom={3}>
                <Text size="small" textColor="light">
                    Will save as: <strong>{resolvedFilename()}</strong>
                </Text>
            </Box>

            <Box display="flex" gap={2}>
                <Button
                    onClick={handleQuickExport}
                    disabled={!table || !view}
                    size="large"
                    flex="auto"
                >
                    Quick Export
                </Button>

                <Button
                    onClick={handleSaveAs}
                    disabled={!table || !view || !supportsFSAccess}
                    size="large"
                    flex="auto"
                >
                    {supportsFSAccess ? 'Save As…' : 'Save As… (Unavailable)'}
                </Button>
            </Box>

            {!supportsFSAccess && (
                <Box marginTop={2}>
                    <Text size="small" textColor="light">
                        Tip: To choose a folder without “Save As…”, enable your browser setting
                        “Ask where to save each file before downloading,” or use a Chromium-based
                        browser that supports the File System Access API.
                    </Text>
                </Box>
            )}
        </Box>
    );
}

initializeBlock(() => <ExportExtension />);