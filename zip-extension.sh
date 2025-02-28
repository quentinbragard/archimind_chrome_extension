#!/bin/bash

# Name of the ZIP file
ZIP_FILE="archimind-chrome-extension.zip"

# Remove old ZIP if exists
rm -f $ZIP_FILE

# List of files and directories to include
INCLUDE=(
    manifest.json
    background.js
    src/popup.html
    popup.js
    welcome.html
    welcome.js
    icons
    dist
)

# Create the ZIP file
zip -r $ZIP_FILE "${INCLUDE[@]}"

# Done message
echo "✅ Chrome extension zipped successfully as $ZIP_FILE"
