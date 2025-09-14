#!/bin/bash

# Airtable Export Extension Installation Script
echo "🚀 Installing Airtable Export Extension..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 14 ]; then
    echo "❌ Node.js version 14+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Create build directory
echo "🔨 Setting up build environment..."
mkdir -p dist

echo "✅ Installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run 'npm run start' to start the development server"
echo "2. Run 'npm run build' to build for production"
echo "3. Upload the extension to Airtable"
echo ""
echo "📖 For detailed instructions, see README.md"
