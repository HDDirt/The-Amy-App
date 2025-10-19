#!/usr/bin/env bash
set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "🔍 Starting Amy App Debug Suite..."

# Check dependencies
echo -n "Checking dependencies... "
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓${NC}"

# Run tests
echo -n "Running test suite... "
if npm test; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}❌ Tests failed${NC}"
    exit 1
fi

# Check build
echo -n "Verifying build... "
if npm run build; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi

# iOS checks (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "Running iOS checks..."
    
    echo -n "Checking Xcode... "
    if ! command -v xcodebuild &> /dev/null; then
        echo -e "${RED}❌ Xcode not found${NC}"
    else
        echo -e "${GREEN}✓${NC}"
    fi
    
    echo -n "Checking iOS setup... "
    if [ -d "ios" ]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}❌ iOS folder not found. Run: npm run ios:init${NC}"
    fi
fi

# URL scheme tests
echo "Testing URL schemes..."
TEST_URLS=(
    "https://www.google.com"
    "twitter://"
    "fb://"
    "prefs:root=General"
)

for url in "${TEST_URLS[@]}"; do
    echo -n "Testing $url... "
    # Simulate URL open (just checking format here)
    if [[ $url =~ ^[a-zA-Z]+:// ]] || [[ $url =~ ^https?:// ]] || [[ $url =~ ^prefs: ]]; then
        echo -e "${GREEN}✓${NC}"
    else
        echo -e "${RED}❌ Invalid format${NC}"
    fi
done

echo "
Debug Summary:
-------------
✓ Dependencies verified
✓ Tests completed
✓ Build verified
✓ URL schemes checked

Next Steps:
1. Start local dev server: npm run start:web
2. For iOS testing: npm run ios:sync && npm run ios:open
3. For remote testing: npm run start:remote

For more debug logs, check the browser console or enable debug panel in the UI."