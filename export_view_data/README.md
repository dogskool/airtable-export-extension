# Airtable Export Extension

A powerful Airtable Extension that allows you to export view data to Excel (.xlsx) and CSV formats with a single click. Perfect for data analysis, reporting, and sharing data outside of Airtable.

## Features

- 📊 **Export to Excel**: Create professional Excel files (.xlsx) with proper formatting
- 📄 **Export to CSV**: Generate CSV files for data analysis and import into other tools
- 🎯 **View-based Export**: Export data from any Airtable view
- 🔄 **All Field Types**: Handles all Airtable field types including attachments, linked records, and more
- 🎨 **Modern UI**: Clean, responsive interface that works in both light and dark modes
- ⚡ **Fast Performance**: Optimized for large datasets
- 🛡️ **Error Handling**: Comprehensive error handling with user-friendly messages

## Installation

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager
- Airtable account with extension development access

### Setup

1. **Install Dependencies**
   ```bash
   cd airtable_export_cpe
   npm install
   ```

2. **Development Server**
   ```bash
   npm run start
   ```

3. **Build for Production**
   ```bash
   npm run build
   ```

## Usage

1. **Add to Airtable**: Install the extension in your Airtable base
2. **Select View**: Choose the table and view you want to export
3. **Choose Format**: Select either Excel (.xlsx) or CSV format
4. **Export**: Click the export button to download your data

## Field Type Support

The extension handles all Airtable field types:

- ✅ **Text Fields**: Single line text, long text, rich text
- ✅ **Number Fields**: Integer, currency, percent, auto number
- ✅ **Date Fields**: Date, date and time
- ✅ **Select Fields**: Single select, multiple select
- ✅ **Linked Records**: Shows linked record names
- ✅ **Attachment Fields**: Lists attachment names
- ✅ **Checkbox Fields**: True/false values
- ✅ **Formula Fields**: Calculated values
- ✅ **Lookup Fields**: Looked up values
- ✅ **Rollup Fields**: Aggregated values

## File Naming

Exported files are automatically named using the following format:
- **Excel**: `{TableName}_{ViewName}_{YYYY-MM-DD}.xlsx`
- **CSV**: `{TableName}_{ViewName}_{YYYY-MM-DD}.csv`

## Technical Details

### Dependencies

- `@airtable/blocks`: Airtable's official SDK for building extensions
- `xlsx`: SheetJS library for Excel file generation
- `file-saver`: Client-side file saving utility
- `react`: UI framework
- `react-dom`: React DOM rendering

### Architecture

The extension is built using:
- **React 16.14.0**: For the user interface
- **Airtable Blocks SDK**: For accessing Airtable data
- **SheetJS**: For Excel file generation
- **FileSaver.js**: For client-side file downloads

### Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Development

### Project Structure

```
airtable_export_cpe/
├── frontend/
│   ├── index.js          # Main React component
│   └── style.css         # Styling and themes
├── block.json            # Extension metadata
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

### Key Components

- **ExportExtension**: Main React component
- **exportToCSV()**: CSV export functionality
- **exportToExcel()**: Excel export functionality
- **handleExport()**: Export orchestration

### Customization

You can customize the extension by modifying:

1. **Styling**: Edit `frontend/style.css`
2. **Field Handling**: Modify the field processing logic in `exportToCSV()` and `exportToExcel()`
3. **File Naming**: Change the filename generation logic
4. **UI Elements**: Update the React component in `frontend/index.js`

## Deployment

### Publishing to Airtable

1. **Build the Extension**
   ```bash
   npm run build
   ```

2. **Package the Extension**
   - Zip the entire `airtable_export_cpe` folder
   - Ensure all dependencies are included

3. **Upload to Airtable**
   - Go to your Airtable base
   - Navigate to Extensions
   - Click "Add an extension"
   - Upload your packaged extension

### Distribution

To share your extension with others:

1. **Create a Distribution Package**
   ```bash
   # Create a zip file excluding node_modules
   zip -r airtable-export-extension.zip airtable_export_cpe/ -x "*/node_modules/*"
   ```

2. **Share Instructions**
   - Provide the zip file
   - Include installation instructions
   - Share this README for reference

## Troubleshooting

### Common Issues

1. **"No records to export"**
   - Ensure the view has records
   - Check if the view has any filters applied

2. **Export fails with error**
   - Check browser console for detailed error messages
   - Ensure all required permissions are granted

3. **File doesn't download**
   - Check browser popup blockers
   - Ensure file-saver library is properly loaded

4. **Excel file appears corrupted**
   - Try opening with a different Excel version
   - Check if the data contains special characters

### Debug Mode

To enable debug logging, add this to your browser console:
```javascript
localStorage.setItem('airtable-export-debug', 'true');
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## Support

For support and questions:
- Create an issue in the repository
- Check the Airtable Extensions documentation
- Review the troubleshooting section above

## Changelog

### Version 1.0.0
- Initial release
- Excel (.xlsx) export support
- CSV export support
- All Airtable field types supported
- Modern UI with dark mode support
- Error handling and loading states
