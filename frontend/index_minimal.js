import {initializeBlock, useBase, useCursor, Button, Text, Box} from '@airtable/blocks/ui';
import React from 'react';

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

    return (
        <Box padding={3}>
            <Text size="large" weight="bold" marginBottom={3}>
                📊 Export Data
            </Text>
            
            <Text size="small" textColor="light" marginBottom={3}>
                Table: <strong>{base.tables[0]?.name ?? '—'}</strong><br/>
                View: <strong>{base.tables[0]?.views[0]?.name ?? '—'}</strong>
            </Text>

            <Button
                onClick={() => alert('Export clicked!')}
                width="100%"
                size="large"
            >
                Test Export
            </Button>
        </Box>
    );
}

initializeBlock(() => <ExportExtension />);
