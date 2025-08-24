#!/bin/bash

# Pre-execution hook for /execute-tasks command
# Updates work_log.md with task start information

# Read JSON input from stdin
JSON_INPUT=$(cat)

# Extract spec path from the command arguments or prompt
SPEC_PATH=$(echo "$JSON_INPUT" | jq -r '.prompt // .arguments // ""' | grep -o '[^[:space:]]*\.md' | head -n1)

# If no spec path found, try to extract from the full prompt
if [ -z "$SPEC_PATH" ] || [ "$SPEC_PATH" = "null" ]; then
    SPEC_PATH=$(echo "$JSON_INPUT" | jq -r '.prompt // ""' | sed -n 's/.*\/execute-tasks[[:space:]]*\([^[:space:]]*\.md\).*/\1/p')
fi

# Default if still no spec path found
if [ -z "$SPEC_PATH" ] || [ "$SPEC_PATH" = "null" ]; then
    SPEC_PATH="unknown-spec.md"
fi

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DATE_SECTION=$(date '+%Y-%m-%d')

# Extract task name from spec file name
TASK_NAME=$(basename "$SPEC_PATH" .md | sed 's/-/ /g' | sed 's/\b\w/\U&/g')

# Ensure specs directory exists
mkdir -p specs

# Initialize work log if it doesn't exist
if [ ! -f "specs/work_log.md" ]; then
    cat > specs/work_log.md << EOF
# Work Log

## $DATE_SECTION

---

*This work log is automatically maintained by the Claude Code hook system*
EOF
fi

# Check if date section exists, if not add it
if ! grep -q "## $DATE_SECTION" specs/work_log.md; then
    # Add new date section after the header
    sed -i '' "/# Work Log/a\\
\\
## $DATE_SECTION\\
" specs/work_log.md
fi

# Extract description from spec file if it exists
DESCRIPTION="Task execution from specification"
if [ -f "$SPEC_PATH" ]; then
    # Try to extract description from Problem Statement or first paragraph
    DESCRIPTION=$(grep -A 3 "## Problem Statement\|## Solution Overview" "$SPEC_PATH" | tail -n +2 | head -n 1 | sed 's/^[[:space:]]*//')
    if [ -z "$DESCRIPTION" ]; then
        DESCRIPTION="Task execution from $SPEC_PATH"
    fi
fi

# Add task entry
cat >> specs/work_log.md << EOF

### Task: $TASK_NAME
- **Started**: $TIMESTAMP
- **Spec**: $SPEC_PATH
- **Status**: In Progress
- **Description**: $DESCRIPTION

EOF

echo "✅ Work log updated: Task '$TASK_NAME' started at $TIMESTAMP"