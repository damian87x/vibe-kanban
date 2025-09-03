#!/bin/bash

echo "🚀 Vibe Kanban Orchestrator E2E Test Runner"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

# Check prerequisites
print_status "📋 Checking prerequisites..." "$YELLOW"

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    print_status "❌ Node.js version 18+ required (found: $(node --version))" "$RED"
    exit 1
fi
print_status "✅ Node.js $(node --version)" "$GREEN"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    print_status "❌ pnpm is not installed" "$RED"
    exit 1
fi
print_status "✅ pnpm $(pnpm --version)" "$GREEN"

# Check Rust version
RUST_VERSION=$(rustc --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
RUST_MAJOR=$(echo $RUST_VERSION | cut -d'.' -f1)
RUST_MINOR=$(echo $RUST_VERSION | cut -d'.' -f2)

if [ "$RUST_MAJOR" -eq 1 ] && [ "$RUST_MINOR" -lt 85 ]; then
    print_status "⚠️  Rust 1.85+ recommended for all dependencies (found: $RUST_VERSION)" "$YELLOW"
    print_status "   Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh" "$YELLOW"
    print_status "   Then: rustup update stable" "$YELLOW"
else
    print_status "✅ Rust $RUST_VERSION" "$GREEN"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "📦 Installing dependencies..." "$YELLOW"
    pnpm install
fi

# Install Playwright browsers if needed
if [ ! -d "$HOME/.cache/ms-playwright" ]; then
    print_status "🌐 Installing Playwright browsers..." "$YELLOW"
    pnpm run test:install
fi

# Setup dev environment
print_status "🔧 Setting up development environment..." "$YELLOW"

# Copy dev assets if not exists
if [ ! -d "dev_assets" ]; then
    cp -r dev_assets_seed dev_assets
    print_status "✅ Created dev_assets from seed" "$GREEN"
fi

# Apply migrations manually using SQLite
if command -v sqlite3 &> /dev/null; then
    print_status "🗄️  Applying database migrations..." "$YELLOW"
    
    # Apply the orchestrator migration
    if [ -f "crates/db/migrations/20250826000000_add_orchestrator_support.sql" ]; then
        sqlite3 dev_assets/db.sqlite < crates/db/migrations/20250826000000_add_orchestrator_support.sql 2>/dev/null || true
        print_status "✅ Applied orchestrator migration" "$GREEN"
    fi
else
    print_status "⚠️  sqlite3 not found - skipping migrations" "$YELLOW"
fi

# Generate TypeScript types
print_status "🔨 Generating TypeScript types..." "$YELLOW"
if cargo run --bin generate_types 2>/dev/null; then
    print_status "✅ Generated TypeScript types" "$GREEN"
else
    print_status "⚠️  Could not generate types (Rust version issue)" "$YELLOW"
fi

# Start the dev server in background
print_status "🚀 Starting development server..." "$YELLOW"
pnpm run dev > /tmp/vibe-kanban-test.log 2>&1 &
DEV_PID=$!

# Wait for server to be ready
print_status "⏳ Waiting for server to start..." "$YELLOW"
sleep 10

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    print_status "❌ Server failed to start. Check logs at /tmp/vibe-kanban-test.log" "$RED"
    cat /tmp/vibe-kanban-test.log
    kill $DEV_PID 2>/dev/null
    exit 1
fi

print_status "✅ Server is running on http://localhost:3000" "$GREEN"

# Run tests based on argument
TEST_COMMAND="pnpm run test:e2e"
if [ "$1" = "ui" ]; then
    TEST_COMMAND="pnpm run test:e2e:ui"
    print_status "🎭 Running tests in UI mode..." "$YELLOW"
elif [ "$1" = "debug" ]; then
    TEST_COMMAND="pnpm run test:e2e:debug"
    print_status "🐛 Running tests in debug mode..." "$YELLOW"
elif [ "$1" = "orchestrator" ]; then
    TEST_COMMAND="pnpm run test:e2e:orchestrator"
    print_status "🎭 Running orchestrator tests only..." "$YELLOW"
elif [ "$1" = "db" ]; then
    TEST_COMMAND="pnpm run test:e2e:db"
    print_status "🗄️  Running database tests only..." "$YELLOW"
else
    print_status "🎭 Running all E2E tests..." "$YELLOW"
fi

# Run the tests
$TEST_COMMAND
TEST_RESULT=$?

# Cleanup
print_status "🧹 Cleaning up..." "$YELLOW"
kill $DEV_PID 2>/dev/null

# Show results
if [ $TEST_RESULT -eq 0 ]; then
    print_status "✅ All tests passed!" "$GREEN"
    print_status "📊 View test report: npx playwright show-report" "$YELLOW"
else
    print_status "❌ Some tests failed" "$RED"
    print_status "📊 View test report: npx playwright show-report" "$YELLOW"
    print_status "📝 Check server logs: /tmp/vibe-kanban-test.log" "$YELLOW"
fi

exit $TEST_RESULT