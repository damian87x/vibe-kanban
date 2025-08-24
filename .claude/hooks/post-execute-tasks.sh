#!/bin/bash

# Post-execution hook for /execute-tasks command
# Updates work_log.md with task completion information

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

# Try to extract results from response or use default
RESULTS=$(echo "$JSON_INPUT" | jq -r '.response // ""' | head -c 200)
if [ -z "$RESULTS" ] || [ "$RESULTS" = "null" ]; then
    RESULTS="Task completed successfully"
fi

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Extract task name from spec file name
TASK_NAME=$(basename "$SPEC_PATH" .md | sed 's/-/ /g' | sed 's/\b\w/\U&/g')

# Default results if not provided
if [ -z "$RESULTS" ]; then
    RESULTS="Task completed successfully"
fi

# Find the last "In Progress" task and update it
if [ -f "specs/work_log.md" ]; then
    # Create a temporary file for processing
    TEMP_FILE=$(mktemp)
    
    # Process the file line by line
    IN_TASK=false
    TASK_FOUND=false
    
    while IFS= read -r line; do
        if [[ $line == "### Task: $TASK_NAME" ]]; then
            IN_TASK=true
            TASK_FOUND=true
            echo "$line" >> "$TEMP_FILE"
        elif [[ $line == "### Task:"* ]] && [ "$IN_TASK" = true ]; then
            IN_TASK=false
            echo "$line" >> "$TEMP_FILE"
        elif [[ $line == "- **Status**: In Progress" ]] && [ "$IN_TASK" = true ]; then
            echo "- **Completed**: $TIMESTAMP" >> "$TEMP_FILE"
            echo "- **Status**: ✅ Completed" >> "$TEMP_FILE"
        else
            echo "$line" >> "$TEMP_FILE"
        fi
    done < specs/work_log.md
    
    # Add results section if task was found
    if [ "$TASK_FOUND" = true ]; then
        echo "- **Results**: $RESULTS" >> "$TEMP_FILE"
        echo "" >> "$TEMP_FILE"
    fi
    
    # Replace the original file
    mv "$TEMP_FILE" specs/work_log.md
    
    echo "✅ Work log updated: Task '$TASK_NAME' completed at $TIMESTAMP"
else
    echo "❌ Work log not found at specs/work_log.md"
fi