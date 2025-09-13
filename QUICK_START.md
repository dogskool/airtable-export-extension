# 🚀 Quick Start Guide - Airtable Export Extension

## ✅ Installation Complete!

Your Airtable Export Extension is ready to use! Here's everything you need to know:

## 📦 What You Have

- **Complete Extension**: Ready-to-deploy Airtable extension
- **Excel Export**: Professional .xlsx files with proper formatting
- **CSV Export**: Standard CSV files for data analysis
- **Modern UI**: Clean, responsive interface with dark mode support
- **All Field Types**: Handles every Airtable field type automatically

## 🎯 How to Deploy

### Step 1: Upload to Airtable
1. Open your Airtable base
2. Go to **Extensions** in the left sidebar
3. Click **"Add an extension"**
4. Select **"Upload an extension"**
5. Upload the file: `airtable-export-extension.zip`

### Step 2: Install the Extension
1. The extension will appear in your extensions list
2. Click to install it
3. Grant read permissions when prompted

### Step 3: Start Exporting!
1. Select any table and view in your base
2. Open the Export extension
3. Choose your format (Excel or CSV)
4. Click export and download your data!

## 🔧 Development Commands

If you want to modify the extension:

```bash
# Install dependencies
npm install

# Run linter
npm run lint

# Create new package
npm run package
```

## 📁 File Structure

```
airtable_export_cpe/
├── frontend/
│   ├── index.js          # Main extension code
│   └── style.css         # Styling and themes
├── block.json            # Extension metadata
├── package.json          # Dependencies
├── README.md            # Full documentation
├── DEPLOYMENT.md        # Detailed deployment guide
└── airtable-export-extension.zip  # Ready to upload!
```

## 🎨 Features

- **Smart Field Handling**: Automatically processes all Airtable field types
- **Professional Excel Files**: Includes proper column widths and formatting
- **CSV Compatibility**: Standard CSV format for maximum compatibility
- **Automatic File Naming**: Files named as `TableName_ViewName_YYYY-MM-DD.ext`
- **Error Handling**: Graceful error handling with helpful messages
- **Loading States**: Visual feedback during export process
- **Responsive Design**: Works on all screen sizes

## 🛠️ Supported Field Types

✅ Text Fields (Single line, Long text, Rich text)  
✅ Number Fields (Integer, Currency, Percent, Auto number)  
✅ Date Fields (Date, Date and time)  
✅ Select Fields (Single select, Multiple select)  
✅ Linked Records (Shows linked record names)  
✅ Attachment Fields (Lists attachment names)  
✅ Checkbox Fields (True/false values)  
✅ Formula Fields (Calculated values)  
✅ Lookup Fields (Looked up values)  
✅ Rollup Fields (Aggregated values)  

## 🚨 Troubleshooting

### Extension Won't Load
- Check browser console for errors
- Ensure all dependencies are included
- Verify block.json is valid JSON

### Export Fails
- Check file-saver library is loaded
- Verify XLSX library is working
- Test with different data types

### File Doesn't Download
- Check browser popup blockers
- Ensure file-saver library is properly loaded

## 📞 Support

- **Documentation**: See README.md for full details
- **Deployment**: See DEPLOYMENT.md for step-by-step instructions
- **Issues**: Check browser console for error messages

## 🎉 You're All Set!

Your Airtable Export Extension is ready to use. Simply upload the `airtable-export-extension.zip` file to Airtable and start exporting your data to Excel and CSV formats!

---

**Need help?** Check the full documentation in README.md or DEPLOYMENT.md
