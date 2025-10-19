#!/bin/bash

# Script to copy selected avatar to Amy App assets
AVATAR_SOURCE="2D_Avatar_Project/selected_avatar.png"
AVATAR_DEST="assets/amy.png"

if [ ! -f "$AVATAR_SOURCE" ]; then
    echo "Error: No avatar selected yet"
    exit 1
fi

cp "$AVATAR_SOURCE" "$AVATAR_DEST"
echo "Avatar updated successfully!"