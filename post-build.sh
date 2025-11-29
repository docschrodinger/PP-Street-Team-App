#!/bin/bash

# Post-build script for Capacitor iOS
# This script converts absolute paths to relative paths in index.html
# for compatibility with iOS file:// protocol

BUILD_DIR="./build"
PUBLIC_DIR="./ios/App/App/public"

echo "🔧 Post-build: Copying build to iOS..."

# Copy build to iOS public folder
rm -rf "$PUBLIC_DIR/assets"
cp -r "$BUILD_DIR/assets" "$PUBLIC_DIR/"
cp "$BUILD_DIR/index.html" "$PUBLIC_DIR/"

# Fix absolute paths to relative paths for iOS
echo "🔧 Post-build: Fixing asset paths for iOS..."
sed -i '' 's|src="/assets|src="./assets|g' "$PUBLIC_DIR/index.html"
sed -i '' 's|href="/assets|href="./assets|g' "$PUBLIC_DIR/index.html"

echo "✅ Post-build complete! Ready for iOS build."
