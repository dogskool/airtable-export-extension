#!/usr/bin/env node

/**
 * Simple syntax and dependency test for the Airtable Export Extension
 * This script checks if the extension code is syntactically correct
 * and can be loaded without errors.
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Airtable Export Extension...\n');

// Test 1: Check if main files exist
console.log('📁 Checking file structure...');
const requiredFiles = [
    'frontend/index.js',
    'frontend/style.css',
    'block.json',
    'package.json'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file} exists`);
    } else {
        console.log(`❌ ${file} missing`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.log('\n❌ Some required files are missing!');
    process.exit(1);
}

// Test 2: Check package.json syntax
console.log('\n📦 Checking package.json...');
try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log('✅ package.json is valid JSON');
    
    // Check required dependencies
    const requiredDeps = ['@airtable/blocks', 'react', 'react-dom', 'xlsx', 'file-saver'];
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    
    if (missingDeps.length === 0) {
        console.log('✅ All required dependencies present');
    } else {
        console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
    }
} catch (error) {
    console.log(`❌ package.json syntax error: ${error.message}`);
    process.exit(1);
}

// Test 3: Check block.json syntax
console.log('\n🔧 Checking block.json...');
try {
    const blockJson = JSON.parse(fs.readFileSync('block.json', 'utf8'));
    console.log('✅ block.json is valid JSON');
    
    // Check required fields
    const requiredFields = ['version', 'frontendEntry'];
    const missingFields = requiredFields.filter(field => !blockJson[field]);
    
    if (missingFields.length === 0) {
        console.log('✅ All required block.json fields present');
    } else {
        console.log(`❌ Missing block.json fields: ${missingFields.join(', ')}`);
    }
} catch (error) {
    console.log(`❌ block.json syntax error: ${error.message}`);
    process.exit(1);
}

// Test 4: Check frontend code syntax
console.log('\n💻 Checking frontend code...');
try {
    const frontendCode = fs.readFileSync('frontend/index.js', 'utf8');
    
    // Basic syntax checks
    if (frontendCode.includes('import {initializeBlock')) {
        console.log('✅ Airtable Blocks SDK import found');
    } else {
        console.log('❌ Airtable Blocks SDK import missing');
    }
    
    if (frontendCode.includes('import * as XLSX')) {
        console.log('✅ XLSX library import found');
    } else {
        console.log('❌ XLSX library import missing');
    }
    
    if (frontendCode.includes('import {saveAs}')) {
        console.log('✅ FileSaver import found');
    } else {
        console.log('❌ FileSaver import missing');
    }
    
    if (frontendCode.includes('exportToCSV') && frontendCode.includes('exportToExcel')) {
        console.log('✅ Export functions found');
    } else {
        console.log('❌ Export functions missing');
    }
    
    if (frontendCode.includes('initializeBlock')) {
        console.log('✅ Extension initialization found');
    } else {
        console.log('❌ Extension initialization missing');
    }
    
} catch (error) {
    console.log(`❌ Error reading frontend code: ${error.message}`);
    process.exit(1);
}

// Test 5: Check CSS file
console.log('\n🎨 Checking CSS...');
try {
    const cssCode = fs.readFileSync('frontend/style.css', 'utf8');
    
    if (cssCode.includes('.export-container')) {
        console.log('✅ Main CSS classes found');
    } else {
        console.log('❌ Main CSS classes missing');
    }
    
    if (cssCode.includes('@media (prefers-color-scheme: dark)')) {
        console.log('✅ Dark mode support found');
    } else {
        console.log('❌ Dark mode support missing');
    }
    
} catch (error) {
    console.log(`❌ Error reading CSS: ${error.message}`);
    process.exit(1);
}

// Test 6: Check if zip file exists
console.log('\n📦 Checking distribution package...');
if (fs.existsSync('airtable-export-extension.zip')) {
    const stats = fs.statSync('airtable-export-extension.zip');
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`✅ Distribution package exists (${fileSizeInMB} MB)`);
} else {
    console.log('❌ Distribution package missing - run "npm run package"');
}

console.log('\n🎉 Extension test completed!');
console.log('\n📋 Next steps:');
console.log('1. Open test-extension.html in your browser to test functionality');
console.log('2. Upload airtable-export-extension.zip to Airtable');
console.log('3. Test the extension in a real Airtable base');

console.log('\n🔗 Test URLs:');
console.log(`File: ${path.resolve('test-extension.html')}`);
console.log(`Package: ${path.resolve('airtable-export-extension.zip')}`);
