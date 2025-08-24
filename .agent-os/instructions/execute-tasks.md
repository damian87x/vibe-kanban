---
description: Task Execution Rules for Agent OS
globs:
alwaysApply: false
version: 1.0
encoding: UTF-8
---

# Task Execution Rules

<ai_meta>
  <parsing_rules>
    - Process XML blocks first for structured data
    - Execute instructions in sequential order
    - Use templates as exact patterns
    - Request missing data rather than assuming
  </parsing_rules>
  <file_conventions>
    - encoding: UTF-8
    - line_endings: LF
    - indent: 2 spaces
    - markdown_headers: no indentation
  </file_conventions>
</ai_meta>

## Overview

<purpose>
  - Execute spec tasks systematically
  - Follow TDD development workflow
  - Ensure quality through testing and review
</purpose>

<context>
  - Part of Agent OS framework
  - Executed after spec planning is complete
  - Follows tasks defined in spec tasks.md
</context>

<prerequisites>
  - Spec documentation exists in @.agent-os/specs/
  - Tasks defined in spec's tasks.md
  - Development environment configured
  - Git repository initialized
  - PostgreSQL database running
  - DATABASE_URL configured in .env file
</prerequisites>

<process_flow>

<step number="1" name="task_assignment">

### Step 1: Task Assignment

<step_metadata>
  <inputs>
    - spec_srd_reference: file path
    - specific_tasks: array[string] (optional)
  </inputs>
  <default>next uncompleted parent task</default>
</step_metadata>

<task_selection>
  <explicit>user specifies exact task(s)</explicit>
  <implicit>find next uncompleted task in tasks.md</implicit>
</task_selection>

<instructions>
  ACTION: Identify task(s) to execute
  DEFAULT: Select next uncompleted parent task if not specified
  CONFIRM: Task selection with user
</instructions>

</step>

<step number="2" name="existing_implementation_verification">

### Step 2: Verify Existing Implementation

<step_metadata>
  <critical>MANDATORY - NEVER SKIP THIS STEP</critical>
  <purpose>prevent duplication and overengineering</purpose>
  <applies_to>every task before implementation</applies_to>
</step_metadata>

<verification_requirements>
  <search_strategy>
    1. Extract keywords from task description
    2. Search for existing implementations
    3. Test current functionality
    4. Document what already works
    5. Identify actual gaps
  </search_strategy>

  <search_locations>
    - app/(tabs)/ - all tab files
    - components/ - reusable components
    - backend/trpc/routes/ - API endpoints
    - store/ - state management
    - Previous specs and tasks
  </search_locations>

  <verification_process>
    1. Use Grep/Glob for comprehensive search
    2. Read identified files thoroughly
    3. Start app and test existing features
    4. Take screenshots of current state
    5. Compare to task requirements
  </verification_process>
</verification_requirements>

<findings_template>
  ## Existing Implementation Analysis
  
  ### Task: [TASK_DESCRIPTION]
  
  ### Search Results:
  - **Keywords Searched:** [LIST]
  - **Related Files Found:**
    - [FILE]: [WHAT_IT_DOES]
    - [FILE]: [WHAT_IT_DOES]
  
  ### Current Implementation:
  - [FEATURE]: [STATUS_AND_FUNCTIONALITY]
  - [FEATURE]: [STATUS_AND_FUNCTIONALITY]
  
  ### Gap Analysis:
  - **Already Implemented:** [LIST]
  - **Partially Implemented:** [LIST]
  - **Not Implemented:** [LIST]
  
  ### Recommendation:
  [MINIMAL_CHANGES_NEEDED_TO_COMPLETE_TASK]
</findings_template>

<decision_flow>
  IF everything_already_implemented:
    INFORM user task is complete
    MARK task as done
    PROCEED to next task
  ELIF partial_implementation_exists:
    SHOW gap analysis
    FOCUS only on missing parts
    AVOID rewriting existing code
  ELSE:
    PROCEED with full implementation
</decision_flow>

<instructions>
  ACTION: Search exhaustively for existing implementations
  VERIFY: Test current functionality before claiming it doesn't exist
  DOCUMENT: Present clear findings to user
  MINIMIZE: Only implement what's actually missing
  NEVER: Skip this verification step
</instructions>

</step>

<step number="3" name="context_analysis">

### Step 3: Context Analysis

<step_metadata>
  <reads>
    - spec SRD file
- spec tasks.md
- all files in spec sub-specs/ folder
    - @.agent-os/product/mission.md
  </reads>
  <purpose>complete understanding of requirements</purpose>
</step_metadata>

<context_gathering>
  <spec_level>
    - requirements from SRD
    - technical specs
    - test specifications
  </spec_level>
  <product_level>
    - overall mission alignment
    - technical standards
    - best practices
  </product_level>
</context_gathering>

<instructions>
  ACTION: Read all spec documentation thoroughly
  ANALYZE: Requirements and specifications for current task
  UNDERSTAND: How task fits into overall spec goals
</instructions>

</step>

<step number="4" name="implementation_planning">

### Step 4: Implementation Planning

<step_metadata>
  <creates>execution plan</creates>
  <requires>user approval</requires>
  <uses>@.agent-os/instructions/use-mcp-servers.md</uses>
</step_metadata>

<plan_structure>
  <format>numbered list with sub-bullets</format>
  <includes>
    - all subtasks from tasks.md
    - implementation approach
    - dependencies to install
    - test strategy
    - MCP server usage plan
  </includes>
</plan_structure>

<plan_template>
  ## Implementation Plan for [TASK_NAME]

  1. **[MAJOR_STEP_1]**
     - [SPECIFIC_ACTION]
     - [SPECIFIC_ACTION]

  2. **[MAJOR_STEP_2]**
     - [SPECIFIC_ACTION]
     - [SPECIFIC_ACTION]

  **Dependencies to Install:**
  - [LIBRARY_NAME] - [PURPOSE]

  **Test Strategy:**
  - [TEST_APPROACH]

  **MCP Server Usage:**
  - Ref: [DOCUMENTATION_TO_SEARCH]
  - Playwright: [FEATURES_TO_TEST]
  - Semgrep: [SECURITY_SCANS]
  - Pieces: [MEMORIES_TO_SAVE]
</plan_template>

<approval_request>
  I've prepared the above implementation plan.
  Please review and confirm before I proceed with execution.
</approval_request>

<instructions>
  ACTION: Create detailed execution plan
  DISPLAY: Plan to user for review
  WAIT: For explicit approval before proceeding
  BLOCK: Do not proceed without affirmative permission
</instructions>

</step>

<step number="5" name="development_server_check">

### Step 5: Check for Development Server

<step_metadata>
  <checks>running development server</checks>
  <prevents>port conflicts</prevents>
</step_metadata>

<server_check_flow>
  <if_running>
    ASK user to shut down
    WAIT for response
  </if_running>
  <if_not_running>
    PROCEED immediately
  </if_not_running>
</server_check_flow>

<user_prompt>
  A development server is currently running.
  Should I shut it down before proceeding? (yes/no)
</user_prompt>

<instructions>
  ACTION: Check for running local development server
  CONDITIONAL: Ask permission only if server is running
  PROCEED: Immediately if no server detected
</instructions>

</step>

<step number="6" name="database_migration_check">

### Step 6: Database Migration Check

<step_metadata>
  <critical>MANDATORY - DO NOT SKIP</critical>
  <purpose>Ensure database schema is up to date</purpose>
  <prevents>Missing table errors during development</prevents>
</step_metadata>

<database_check_process>
  <automatic_check>
    1. Run: npm run db:migrate:ensure
    2. Script will check for missing tables
    3. Automatically run migrations if needed
    4. Verify all critical tables exist
  </automatic_check>

  <critical_tables>
    - users
    - user_workflows
    - workflow_templates
    - workflow_executions
    - user_agents
    - agent_templates_v2
    - integrations
    - knowledge_items
  </critical_tables>

  <error_handling>
    IF migration_fails:
      REPORT error to user
      SUGGEST checking PostgreSQL connection
      SUGGEST checking DATABASE_URL in .env
      STOP execution until resolved
  </error_handling>
</database_check_process>

<execution_output>
  🔄 Ensuring database migrations are up to date...
  ✓ Environment loaded
  ✓ Connected to PostgreSQL
  🔍 Checking critical tables...
  [LIST_OF_TABLE_STATUS]
  ✅ Database is ready for development!
</execution_output>

<instructions>
  ACTION: Run database migration check
  COMMAND: npm run db:migrate:ensure
  AUTOMATIC: Migrations run if tables missing
  VERIFY: All critical tables exist
  PROCEED: Only after successful completion
</instructions>

</step>

<step number="7" name="git_branch_management">

### Step 7: Git Branch Management

<step_metadata>
  <policy>STAY ON CURRENT BRANCH unless explicitly asked</policy>
  <priority>Respect user's branch choice</priority>
</step_metadata>

<branch_policy>
  <default_behavior>
    - STAY on current branch for all work
    - DO NOT create new branches automatically
    - DO NOT switch branches without permission
  </default_behavior>
  
  <when_to_ask>
    - If on main/master and need to make changes
    - If user's instructions conflict with current branch
    - If spec explicitly requires different branch
  </when_to_ask>
</branch_policy>

<branch_check_flow>
  <step_1>Check current branch</step_1>
  <step_2>
    IF current_branch == "main" OR current_branch == "master":
      ASK "You're on [BRANCH]. Should I create a new branch or continue here?"
    ELSE:
      PROCEED on current branch
  </step_2>
</branch_check_flow>

<ask_template>
  Current branch: [CURRENT_BRANCH]
  
  You're currently on the [CURRENT_BRANCH] branch. Would you like me to:
  1. Continue working on this branch
  2. Create a new branch for this task
  
  Please choose (1/2):
</ask_template>

<instructions>
  ACTION: Check current git branch
  DEFAULT: Stay on current branch
  ASK: Only if on main/master or if conflicts arise
  RESPECT: User's branch management preferences
  NEVER: Create branches without explicit permission
</instructions>

</step>

<step number="8" name="development_execution">

### Step 8: Development Execution

<step_metadata>
  <follows>approved implementation plan</follows>
  <adheres_to>all spec standards</adheres_to>
  <uses>@.agent-os/instructions/use-mcp-servers.md</uses>
</step_metadata>

<execution_standards>
  <follow_exactly>
    - approved implementation plan
    - spec specifications
    - @.agent-os/product/code-style.md
    - @.agent-os/product/dev-best-practices.md
    - @.agent-os/instructions/use-mcp-servers.md
  </follow_exactly>
  <approach>test-driven development (TDD)</approach>
</execution_standards>

<tdd_workflow>
  1. Research with Ref MCP for best practices
  2. Write failing tests first
  3. Implement minimal code to pass
  4. Run Semgrep security scan
  5. Refactor while keeping tests green
  6. Test with Playwright browser automation
  7. Save breakthrough solutions to Pieces
  8. Repeat for each feature
</tdd_workflow>

<mcp_integration>
  <research_phase>
    - Use Ref to find documentation
    - Query Pieces for existing solutions
  </research_phase>
  <implementation_phase>
    - Follow TDD workflow
    - Run Semgrep after each component
  </implementation_phase>
  <verification_phase>
    - Test with Playwright
    - Document in Pieces
  </verification_phase>
</mcp_integration>

<instructions>
  ACTION: Execute development plan systematically
  FOLLOW: All coding standards and specifications
  USE: MCP servers throughout development
  IMPLEMENT: TDD approach with security scanning
  MAINTAIN: Code quality at every step
</instructions>

</step>

<step number="9" name="browser_verification">

### Step 9: Browser Verification

<step_metadata>
  <verifies>implementation works correctly</verifies>
  <follows>@.agent-os/standards/verification-standards.md</follows>
</step_metadata>

<verification_requirements>
  <principle>ALWAYS VERIFY - NEVER ASSUME</principle>
  <methods>
    - Playwright MCP browser tools (primary)
    - Bypass auth mode if needed
    - Manual verification as fallback
  </methods>
</verification_requirements>

<verification_steps>
  1. Start application services
  2. Check backend logs for errors (npm logs, console output)
  3. Use Playwright browser_navigate to open app
  4. Use browser_snapshot to get page structure
  5. Test functionality with browser_click and browser_type
  6. Check console with browser_evaluate
  7. Take screenshots with browser_take_screenshot
  8. Document results in Pieces memory
</verification_steps>

<playwright_usage>
  <navigation>browser_navigate({ url: "http://localhost:8081" })</navigation>
  <interaction>browser_click({ element: "button", ref: "selector" })</interaction>
  <verification>browser_take_screenshot({ filename: "proof.png" })</verification>
</playwright_usage>

<if_unable_to_verify>
  <action>state clearly in documentation</action>
  <format>"I've implemented the changes but cannot verify due to [reason]"</format>
  <never>claim it works without proof</never>
</if_unable_to_verify>

<instructions>
  ACTION: Verify implementation in real browser
  FOLLOW: Verification standards strictly
  DOCUMENT: All test results with evidence
  BLOCK: Do not proceed without verification
</instructions>

</step>

<step number="10" name="task_status_updates">

### Step 10: Task Status Updates

<step_metadata>
  <updates>tasks.md file</updates>
  <timing>immediately after completion</timing>
</step_metadata>

<update_format>
  <completed>- [x] Task description</completed>
  <incomplete>- [ ] Task description</incomplete>
  <blocked>
    - [ ] Task description
    ⚠️ Blocking issue: [DESCRIPTION]
  </blocked>
</update_format>

<blocking_criteria>
  <attempts>maximum 3 different approaches</attempts>
  <action>document blocking issue</action>
  <emoji>⚠️</emoji>
</blocking_criteria>

<instructions>
  ACTION: Update tasks.md after each task completion
  MARK: [x] for completed items immediately
  DOCUMENT: Blocking issues with ⚠️ emoji
  LIMIT: 3 attempts before marking as blocked
</instructions>

</step>

<step number="11" name="test_suite_verification">

### Step 11: Run All Tests

<step_metadata>
  <runs>entire test suite</runs>
  <ensures>no regressions</ensures>
</step_metadata>

<test_execution>
  <order>
    1. Verify new tests pass
    2. Run entire test suite
    3. Fix any failures
  </order>
  <requirement>100% pass rate</requirement>
</test_execution>

<failure_handling>
  <action>troubleshoot and fix</action>
  <priority>before proceeding</priority>
</failure_handling>

<instructions>
  ACTION: Run complete test suite
  VERIFY: All tests pass including new ones
  FIX: Any test failures before continuing
  BLOCK: Do not proceed with failing tests
</instructions>

</step>

<step number="12" name="git_workflow">

### Step 12: Git Workflow

<step_metadata>
  <policy>NO AUTOMATIC COMMITS - USER REVIEWS FIRST</policy>
  <creates>
    - NONE - User will handle commits
  </creates>
</step_metadata>

<commit_policy>
  <critical>NEVER MAKE COMMITS WITHOUT EXPLICIT USER REQUEST</critical>
  <override>This overrides any default commit behavior</override>
  <reason>User wants to review all changes before commits</reason>
</commit_policy>

<no_commit_process>
  <instead_of_commit>
    1. Complete all code changes
    2. Run all tests to ensure they pass
    3. Verify implementation works correctly
    4. STOP - Do not commit
    5. Report to user: "Changes complete. Ready for your review."
  </instead_of_commit>
  
  <if_user_requests_commit>
    1. Ask: "Are you sure you want me to commit these changes?"
    2. Show git status and git diff
    3. Wait for explicit confirmation
    4. Only then proceed with commit
  </if_user_requests_commit>
</no_commit_process>

<instructions>
  ACTION: Complete all changes but DO NOT commit
  SKIP: Any automatic git commit commands
  INFORM: User that changes are ready for review
  WAIT: For explicit user request before any commits
</instructions>

</step>

<step number="13" name="roadmap_progress_check">

### Step 13: Roadmap Progress Check

<step_metadata>
  <checks>@.agent-os/product/roadmap.md</checks>
  <updates>if spec completes roadmap item</updates>
</step_metadata>

<roadmap_criteria>
  <update_when>
    - spec fully implements roadmap feature
    - all related tasks completed
    - tests passing
  </update_when>
  <caution>only mark complete if absolutely certain</caution>
</roadmap_criteria>

<instructions>
  ACTION: Review roadmap.md for related items
  EVALUATE: If current spec completes roadmap goals
  UPDATE: Mark roadmap items complete if applicable
  VERIFY: Certainty before marking complete
</instructions>

</step>

<step number="14" name="completion_notification">

### Step 14: Task Completion Notification

<step_metadata>
  <plays>system sound</plays>
  <alerts>user of completion</alerts>
</step_metadata>

<notification_command>
  afplay /System/Library/Sounds/Glass.aiff
</notification_command>

<instructions>
  ACTION: Play completion sound
  PURPOSE: Alert user that task is complete
</instructions>

</step>

<step number="15" name="completion_summary">

### Step 15: Completion Summary

<step_metadata>
  <creates>summary message</creates>
  <format>structured with emojis</format>
</step_metadata>

<summary_template>
  ## ✅ What's been done

  1. **[FEATURE_1]** - [ONE_SENTENCE_DESCRIPTION]
  2. **[FEATURE_2]** - [ONE_SENTENCE_DESCRIPTION]

  ## ⚠️ Issues encountered

  [ONLY_IF_APPLICABLE]
  - **[ISSUE_1]** - [DESCRIPTION_AND_REASON]

  ## 👀 Ready to test in browser

  [ONLY_IF_APPLICABLE]
  1. [STEP_1_TO_TEST]
  2. [STEP_2_TO_TEST]

  ## 📦 Next Steps

  All changes are complete and ready for your review.
  Run `git status` to see modified files.
  Run `git diff` to review changes.
</summary_template>

<summary_sections>
  <required>
    - functionality recap
    - next steps for user review
  </required>
  <conditional>
    - issues encountered (if any)
    - testing instructions (if testable in browser)
  </conditional>
</summary_sections>

<instructions>
  ACTION: Create comprehensive summary
  INCLUDE: All required sections
  ADD: Conditional sections if applicable
  FORMAT: Use emoji headers for scannability
</instructions>

</step>

</process_flow>

## Development Standards

<standards>
  <code_style>
    <follow>@.agent-os/product/code-style.md</follow>
    <enforce>strictly</enforce>
  </code_style>
  <best_practices>
    <follow>@.agent-os/product/dev-best-practices.md</follow>
    <apply>all directives</apply>
  </best_practices>
  <verification>
    <follow>@.agent-os/standards/verification-standards.md</follow>
    <principle>ALWAYS VERIFY - NEVER ASSUME</principle>
  </verification>
  <testing>
    <coverage>comprehensive</coverage>
    <approach>test-driven development</approach>
  </testing>
  <documentation>
    <commits>clear and descriptive</commits>
    <pull_requests>detailed descriptions</pull_requests>
  </documentation>
</standards>

## Error Handling

<error_protocols>
  <blocking_issues>
    - document in tasks.md
    - mark with ⚠️ emoji
    - include in summary
  </blocking_issues>
  <test_failures>
    - fix before proceeding
    - never commit broken tests
  </test_failures>
  <technical_roadblocks>
    - attempt 3 approaches
    - document if unresolved
    - seek user input
  </technical_roadblocks>
</error_protocols>

<final_checklist>
  <verify>
    - [ ] Task implementation complete
    - [ ] All tests passing
    - [ ] tasks.md updated
    - [ ] Code changes ready for review (NOT committed)
    - [ ] Roadmap checked/updated
    - [ ] Summary provided to user with "Ready for your review"
  </verify>
</final_checklist>
