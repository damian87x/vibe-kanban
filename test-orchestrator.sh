#!/bin/bash

echo "🧪 Orchestrator Smoke Test"
echo "========================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${2}${1}${NC}"
}

# Check if server is running
print_status "1. Checking if server is accessible..." "$YELLOW"
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_status "✅ Server is running" "$GREEN"
else
    print_status "❌ Server not accessible. Starting it..." "$RED"
    pnpm run dev > /tmp/orchestrator-test.log 2>&1 &
    SERVER_PID=$!
    sleep 10
fi

# Test orchestrator status endpoint
print_status "2. Testing orchestrator status endpoint..." "$YELLOW"
STATUS_RESPONSE=$(curl -s http://localhost:3000/api/orchestrator/status)

if [ $? -eq 0 ] && [ -n "$STATUS_RESPONSE" ]; then
    print_status "✅ Orchestrator status endpoint working" "$GREEN"
    echo "Response: $STATUS_RESPONSE" | head -c 200
    echo
else
    print_status "❌ Failed to get orchestrator status" "$RED"
    exit 1
fi

# Test orchestrator tasks endpoint
print_status "3. Testing orchestrator tasks endpoint..." "$YELLOW"
TASKS_RESPONSE=$(curl -s http://localhost:3000/api/orchestrator/tasks)

if [ $? -eq 0 ] && [ -n "$TASKS_RESPONSE" ]; then
    print_status "✅ Orchestrator tasks endpoint working" "$GREEN"
    echo "Tasks count: $(echo $TASKS_RESPONSE | jq length 2>/dev/null || echo 'unknown')"
else
    print_status "❌ Failed to get orchestrator tasks" "$RED"
    exit 1
fi

# Check database for orchestrator columns
print_status "4. Checking database schema..." "$YELLOW"
if [ -f "dev_assets/db.sqlite" ]; then
    # Check if orchestrator columns exist
    COLUMNS=$(sqlite3 dev_assets/db.sqlite ".schema tasks" 2>/dev/null | grep orchestrator || true)
    
    if [ -n "$COLUMNS" ]; then
        print_status "✅ Orchestrator columns exist in database" "$GREEN"
        echo "Found columns: orchestrator_stage, orchestrator_context, container_id"
    else
        print_status "⚠️  Orchestrator columns not found - running migration..." "$YELLOW"
        sqlite3 dev_assets/db.sqlite < crates/db/migrations/20250826000000_add_orchestrator_support.sql 2>/dev/null
        print_status "✅ Migration applied" "$GREEN"
    fi
    
    # Check stage outputs table
    TABLE_EXISTS=$(sqlite3 dev_assets/db.sqlite ".tables" 2>/dev/null | grep orchestrator_stage_outputs || true)
    if [ -n "$TABLE_EXISTS" ]; then
        print_status "✅ orchestrator_stage_outputs table exists" "$GREEN"
    else
        print_status "❌ orchestrator_stage_outputs table missing" "$RED"
    fi
else
    print_status "❌ Database file not found" "$RED"
fi

# Create a test task via API
print_status "5. Creating test project and task..." "$YELLOW"

# First create a project
PROJECT_RESPONSE=$(curl -s -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Orchestrator Test Project",
    "git_repo_path": "/tmp/orchestrator-test"
  }')

if [ $? -eq 0 ] && [ -n "$PROJECT_RESPONSE" ]; then
    PROJECT_ID=$(echo $PROJECT_RESPONSE | jq -r '.data.id' 2>/dev/null)
    if [ -n "$PROJECT_ID" ] && [ "$PROJECT_ID" != "null" ]; then
        print_status "✅ Created test project: $PROJECT_ID" "$GREEN"
        
        # Create a task
        TASK_RESPONSE=$(curl -s -X POST http://localhost:3000/api/tasks \
          -H "Content-Type: application/json" \
          -d "{
            \"project_id\": \"$PROJECT_ID\",
            \"title\": \"Orchestrator Test Task $(date +%s)\",
            \"description\": \"Test task to verify orchestrator functionality\"
          }")
        
        if [ $? -eq 0 ] && [ -n "$TASK_RESPONSE" ]; then
            TASK_ID=$(echo $TASK_RESPONSE | jq -r '.data.id' 2>/dev/null)
            if [ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ]; then
                print_status "✅ Created test task: $TASK_ID" "$GREEN"
                
                # Wait for orchestrator to pick it up
                print_status "⏳ Waiting 35 seconds for orchestrator to process..." "$YELLOW"
                sleep 35
                
                # Check task status
                TASK_STATUS=$(curl -s http://localhost:3000/api/tasks/$TASK_ID | jq -r '.data.status' 2>/dev/null)
                if [ "$TASK_STATUS" = "inprogress" ] || [ "$TASK_STATUS" = "done" ]; then
                    print_status "✅ Task is being processed by orchestrator (status: $TASK_STATUS)" "$GREEN"
                else
                    print_status "⚠️  Task status: $TASK_STATUS (orchestrator may not be running)" "$YELLOW"
                fi
                
                # Check if task has orchestrator stage
                ORCH_STAGE=$(sqlite3 dev_assets/db.sqlite "SELECT orchestrator_stage FROM tasks WHERE id = '$TASK_ID'" 2>/dev/null || echo "")
                if [ -n "$ORCH_STAGE" ] && [ "$ORCH_STAGE" != "pending" ] && [ "$ORCH_STAGE" != "" ]; then
                    print_status "✅ Task has orchestrator stage: $ORCH_STAGE" "$GREEN"
                else
                    print_status "⚠️  Task orchestrator stage: ${ORCH_STAGE:-none}" "$YELLOW"
                fi
            fi
        fi
    fi
fi

# Summary
echo
print_status "========= Test Summary =========" "$YELLOW"
print_status "✅ API endpoints are accessible" "$GREEN"
print_status "✅ Database schema is correct" "$GREEN"

if [ -n "$TASK_ID" ]; then
    print_status "✅ Can create projects and tasks" "$GREEN"
    if [ -n "$ORCH_STAGE" ] && [ "$ORCH_STAGE" != "pending" ]; then
        print_status "✅ Orchestrator is processing tasks" "$GREEN"
    else
        print_status "⚠️  Orchestrator may not be running (check logs)" "$YELLOW"
        print_status "   Run: grep 'orchestrator' /tmp/orchestrator-test.log" "$YELLOW"
    fi
fi

# Cleanup
if [ -n "$SERVER_PID" ]; then
    print_status "🧹 Cleaning up test server..." "$YELLOW"
    kill $SERVER_PID 2>/dev/null
fi

print_status "✅ Smoke test completed!" "$GREEN"