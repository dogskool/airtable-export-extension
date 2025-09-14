# Deployment Guide

This guide will walk you through deploying your Airtable Export Extension to the Airtable Extension Library.

## Prerequisites

1. **Airtable Account**: You need an Airtable account with extension development access
2. **Extension Developer Access**: Contact Airtable support to enable extension development
3. **Node.js**: Version 14 or higher installed
4. **Git**: For version control (recommended)

## Step 1: Prepare Your Extension

### 1.1 Update Metadata

Edit `block.json` to include your information:

```json
{
    "version": "1.0",
    "frontendEntry": "./frontend/index.js",
    "name": "Export View Data",
    "description": "Export your Airtable view data to Excel (.xlsx) or CSV format with a single click.",
    "author": "Your Name",
    "authorEmail": "your.email@example.com",
    "icon": "📊",
    "tags": ["export", "excel", "csv", "data", "view"],
    "permissions": {
        "read": true,
        "write": false
    }
}
```

### 1.2 Test Locally

```bash
# Install dependencies
npm install

# Start development server
npm run start

# Test in Airtable
# 1. Open your Airtable base
# 2. Go to Extensions
# 3. Add extension from local development
# 4. Test the export functionality
```

## Step 2: Build for Production

### 2.1 Build the Extension

```bash
# Build the extension
npm run build

# This creates a dist/ folder with the compiled extension
```

### 2.2 Package for Distribution

```bash
# Create a distribution package
npm run package

# This creates airtable-export-extension.zip
```

## Step 3: Deploy to Airtable

### 3.1 Upload to Airtable

1. **Go to Airtable Extensions**
   - Open your Airtable base
   - Click on "Extensions" in the left sidebar
   - Click "Add an extension"

2. **Upload Your Extension**
   - Select "Upload an extension"
   - Upload the `airtable-export-extension.zip` file
   - Wait for the upload to complete

3. **Configure Permissions**
   - The extension will request read permissions
   - Grant the necessary permissions
   - The extension only needs read access

### 3.2 Test in Production

1. **Install the Extension**
   - The extension should appear in your extensions list
   - Click to install it

2. **Test Export Functionality**
   - Select a table and view
   - Choose export format (CSV or Excel)
   - Click export and verify the file downloads

## Step 4: Publish to Extension Library (Optional)

### 4.1 Prepare for Public Release

1. **Create a GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial release of Airtable Export Extension"
   git remote add origin https://github.com/yourusername/airtable-export-extension.git
   git push -u origin main
   ```

2. **Create Release Notes**
   - Document new features
   - Include installation instructions
   - Provide support information

### 4.2 Submit to Airtable

1. **Contact Airtable Support**
   - Email: support@airtable.com
   - Subject: "Extension Library Submission - Export View Data"

2. **Include in Your Email**
   - Extension description
   - GitHub repository link
   - Screenshots of the extension
   - Use cases and benefits

## Step 5: Maintenance and Updates

### 5.1 Version Management

Update the version in `block.json` for each release:

```json
{
    "version": "1.1.0",
    // ... rest of config
}
```

### 5.2 Testing Updates

1. **Test Locally**
   ```bash
   npm run start
   # Test in Airtable development mode
   ```

2. **Build and Deploy**
   ```bash
   npm run build
   npm run package
   # Upload new version to Airtable
   ```

### 5.3 User Support

- **Documentation**: Keep README.md updated
- **Issues**: Monitor for user feedback
- **Updates**: Regular maintenance and feature updates

## Troubleshooting

### Common Deployment Issues

1. **Extension Won't Load**
   - Check browser console for errors
   - Verify all dependencies are included
   - Ensure block.json is valid JSON

2. **Export Fails**
   - Check file-saver library is loaded
   - Verify XLSX library is working
   - Test with different data types

3. **Permission Errors**
   - Ensure extension has read permissions
   - Check if user has access to the base
   - Verify view permissions

### Debug Mode

Enable debug logging:

```javascript
// Add to browser console
localStorage.setItem('airtable-export-debug', 'true');
```

## Best Practices

### 1. Code Quality
- Use ESLint for code linting
- Write clear, documented code
- Handle errors gracefully

### 2. User Experience
- Provide clear feedback
- Handle loading states
- Show helpful error messages

### 3. Performance
- Optimize for large datasets
- Use efficient data processing
- Minimize memory usage

### 4. Security
- Only request necessary permissions
- Validate user input
- Don't store sensitive data

## Support

For deployment issues:

1. **Check Documentation**: Review this guide and README.md
2. **Airtable Support**: Contact support@airtable.com
3. **Community**: Airtable Community Forum
4. **GitHub Issues**: Create an issue in your repository

## Next Steps

After successful deployment:

1. **Monitor Usage**: Track how users interact with your extension
2. **Gather Feedback**: Collect user feedback for improvements
3. **Plan Updates**: Plan future features and enhancements
4. **Documentation**: Keep documentation up to date
5. **Community**: Engage with the Airtable developer community
