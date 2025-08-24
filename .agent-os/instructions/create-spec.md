---
description: Spec Creation Rules for Agent OS
globs:
alwaysApply: false
version: 1.1
encoding: UTF-8
---

# Spec Creation Rules

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
  - Create detailed spec plans for specific features
  - Generate structured documentation for implementation
  - Ensure alignment with product roadmap and mission
</purpose>

<context>
  - Part of Agent OS framework
  - Executed when implementing roadmap items
  - Creates spec-specific documentation
</context>

<prerequisites>
  - Product documentation exists in .agent-os/product/
  - Access to:
    - @.agent-os/product/mission.md,
    - @.agent-os/product/roadmap.md,
    - @.agent-os/product/tech-stack.md
  - User has spec idea or roadmap reference
</prerequisites>

<git_branch_policy>
  <important>STAY ON CURRENT BRANCH</important>
  <note>Creating a spec does NOT require a new branch</note>
  <rule>Only create branches when explicitly asked by user</rule>
</git_branch_policy>

<process_flow>

<step number="1" name="spec_initiation">

### Step 1: Spec Initiation

<step_metadata>
  <trigger_options>
    - option_a: user_asks_whats_next
    - option_b: user_provides_specific_spec
  </trigger_options>
</step_metadata>

<option_a_flow>
  <trigger_phrases>
    - "what's next?"
    - "what should we work on next?"
  </trigger_phrases>
  <actions>
    1. CHECK @.agent-os/product/roadmap.md
    2. FIND next uncompleted item
    3. SUGGEST item to user
    4. WAIT for approval
  </actions>
</option_a_flow>

<option_b_flow>
  <trigger>user describes specific spec idea</trigger>
  <accept>any format, length, or detail level</accept>
  <proceed>to existing implementation check</proceed>
</option_b_flow>

<instructions>
  ACTION: Identify spec initiation method
  ROUTE: Follow appropriate flow based on trigger
  WAIT: Ensure user agreement before proceeding
  RESEARCH: Use MCP servers for planning
    - Ref: Search for similar feature implementations
    - Pieces: Query for past spec decisions
</instructions>

</step>

<step number="2" name="existing_implementation_check">

### Step 2: Check for Existing Implementation

<step_metadata>
  <critical>MANDATORY - NEVER SKIP THIS STEP</critical>
  <purpose>prevent overengineering and duplication</purpose>
  <blocks>proceeding until verification complete</blocks>
</step_metadata>

<verification_process>
  <search_codebase>
    1. Use Grep/Glob to search for feature keywords
    2. Check all app/(tabs)/ files for similar features
    3. Search backend routes for related endpoints
    4. Review existing specs in .agent-os/specs/
  </search_codebase>
  
  <analyze_findings>
    1. List all potentially related implementations
    2. Test existing features if found
    3. Document current functionality
    4. Identify gaps vs requested feature
  </analyze_findings>
  
  <user_confirmation>
    1. Present findings to user
    2. Ask if they want to:
       - Enhance existing feature
       - Create new feature
       - Skip spec creation
    3. Wait for explicit decision
  </user_confirmation>
</verification_process>

<search_template>
  ## Existing Implementation Check
  
  I need to verify if this feature already exists before creating a spec.
  
  ### Search Results:
  - **Feature Keywords:** [KEYWORDS_SEARCHED]
  - **Files Found:** 
    - [FILE_PATH]: [BRIEF_DESCRIPTION]
    - [FILE_PATH]: [BRIEF_DESCRIPTION]
  
  ### Current Functionality:
  - [EXISTING_FEATURE_1]
  - [EXISTING_FEATURE_2]
  
  ### Analysis:
  [COMPARISON_TO_REQUESTED_FEATURE]
  
  **Question:** Based on these findings, would you like to:
  1. Enhance the existing implementation
  2. Create a completely new feature
  3. Skip this spec (feature already exists)
  
  Please choose (1/2/3):
</search_template>

<instructions>
  ACTION: Search thoroughly for existing implementations
  USE: Grep, Glob, and Read tools extensively
  DOCUMENT: All findings clearly
  BLOCK: Do not proceed without user decision
  NEVER: Skip this verification step
</instructions>

</step>

<step number="3" name="context_gathering">

### Step 3: Context Gathering

<step_metadata>
  <reads>
    - @.agent-os/product/mission.md
    - @.agent-os/product/roadmap.md
    - @.agent-os/product/tech-stack.md
  </reads>
  <purpose>understand spec alignment</purpose>
</step_metadata>

<context_analysis>
  <mission>overall product vision</mission>
  <roadmap>current progress and plans</roadmap>
  <tech_stack>technical requirements</tech_stack>
</context_analysis>

<instructions>
  ACTION: Read all three product documents
  ANALYZE: Spec alignment with each document
  NOTE: Consider implications for implementation
</instructions>

</step>

<step number="4" name="requirements_clarification">

### Step 4: Requirements Clarification

<step_metadata>
  <required_clarifications>
    - scope_boundaries: string
    - technical_considerations: array[string]
  </required_clarifications>
</step_metadata>

<clarification_areas>
  <scope>
    - in_scope: what is included
    - out_of_scope: what is excluded (optional)
  </scope>
  <technical>
    - functionality specifics
    - UI/UX requirements
    - integration points
  </technical>
</clarification_areas>

<decision_tree>
  IF clarification_needed:
    ASK numbered_questions
    WAIT for_user_response
  ELSE:
    PROCEED to_existing_implementation_check
</decision_tree>

<question_template>
  Based on the spec description, I need clarification on:

  1. [SPECIFIC_QUESTION_ABOUT_SCOPE]
  2. [SPECIFIC_QUESTION_ABOUT_TECHNICAL_APPROACH]
  3. [SPECIFIC_QUESTION_ABOUT_USER_EXPERIENCE]
</question_template>

<instructions>
  ACTION: Evaluate need for clarification
  ASK: Numbered questions if needed
  PROCEED: Only with clear requirements
</instructions>

</step>

<step number="5" name="date_determination">

### Step 5: Date Determination

<step_metadata>
  <purpose>Ensure accurate date for folder naming</purpose>
  <priority>high</priority>
  <creates>temporary file for timestamp</creates>
</step_metadata>

<date_determination_process>
  <primary_method>
    <name>File System Timestamp</name>
    <process>
      1. CREATE directory if not exists: .agent-os/specs/
      2. CREATE temporary file: .agent-os/specs/.date-check
      3. READ file creation timestamp from filesystem
      4. EXTRACT date in YYYY-MM-DD format
      5. DELETE temporary file
      6. STORE date in variable for folder naming
    </process>
  </primary_method>

  <fallback_method>
    <trigger>if file system method fails</trigger>
    <name>User Confirmation</name>
    <process>
      1. STATE: "I need to confirm today's date for the spec folder"
      2. ASK: "What is today's date? (YYYY-MM-DD format)"
      3. WAIT for user response
      4. VALIDATE format matches YYYY-MM-DD
      5. STORE date for folder naming
    </process>
  </fallback_method>
</date_determination_process>

<validation>
  <format_check>^\d{4}-\d{2}-\d{2}$</format_check>
  <reasonableness_check>
    - year: 2024-2030
    - month: 01-12
    - day: 01-31
  </reasonableness_check>
</validation>

<error_handling>
  IF date_invalid:
    USE fallback_method
  IF both_methods_fail:
    ERROR "Unable to determine current date"
</error_handling>

<instructions>
  ACTION: Determine accurate date using file system
  FALLBACK: Ask user if file system method fails
  VALIDATE: Ensure YYYY-MM-DD format
  STORE: Date for immediate use in next step
</instructions>

</step>

<step number="6" name="spec_folder_creation">

### Step 6: Spec Folder Creation

<step_metadata>
  <creates>
    - directory: .agent-os/specs/YYYY-MM-DD-spec-name/
  </creates>
  <uses>date from step 5</uses>
</step_metadata>

<folder_naming>
  <format>YYYY-MM-DD-spec-name</format>
  <date>use stored date from step 5</date>
  <name_constraints>
    - max_words: 5
    - style: kebab-case
    - descriptive: true
  </name_constraints>
</folder_naming>

<example_names>
  - 2025-03-15-password-reset-flow
  - 2025-03-16-user-profile-dashboard
  - 2025-03-17-api-rate-limiting
</example_names>

<instructions>
  ACTION: Create spec folder using stored date
  FORMAT: Use kebab-case for spec name
  LIMIT: Maximum 5 words in name
  VERIFY: Folder created successfully
</instructions>

</step>

<step number="7" name="create_spec_md">

### Step 7: Create spec.md

<step_metadata>
  <creates>
    - file: .agent-os/specs/YYYY-MM-DD-spec-name/spec.md
  </creates>
</step_metadata>

<file_template>
  <header>
    # Spec Requirements Document

    > Spec: [SPEC_NAME]
    > Created: [CURRENT_DATE]
    > Status: Planning
  </header>
  <required_sections>
    - Overview
    - User Stories
    - Spec Scope
    - Out of Scope
    - Expected Deliverable
  </required_sections>
</file_template>

<section name="overview">
  <template>
    ## Overview

    [1-2_SENTENCE_GOAL_AND_OBJECTIVE]
  </template>
  <constraints>
    - length: 1-2 sentences
    - content: goal and objective
  </constraints>
  <example>
    Implement a secure password reset functionality that allows users to regain account access through email verification. This feature will reduce support ticket volume and improve user experience by providing self-service account recovery.
  </example>
</section>

<section name="user_stories">
  <template>
    ## User Stories

    ### [STORY_TITLE]

    As a [USER_TYPE], I want to [ACTION], so that [BENEFIT].

    [DETAILED_WORKFLOW_DESCRIPTION]
  </template>
  <constraints>
    - count: 1-3 stories
    - include: workflow and problem solved
    - format: title + story + details
  </constraints>
</section>

<section name="spec_scope">
  <template>
    ## Spec Scope

    1. **[FEATURE_NAME]** - [ONE_SENTENCE_DESCRIPTION]
    2. **[FEATURE_NAME]** - [ONE_SENTENCE_DESCRIPTION]
  </template>
  <constraints>
    - count: 1-5 features
    - format: numbered list
    - description: one sentence each
  </constraints>
</section>

<section name="out_of_scope">
  <template>
    ## Out of Scope

    - [EXCLUDED_FUNCTIONALITY_1]
    - [EXCLUDED_FUNCTIONALITY_2]
  </template>
  <purpose>explicitly exclude functionalities</purpose>
</section>

<section name="expected_deliverable">
  <template>
    ## Expected Deliverable

    1. [TESTABLE_OUTCOME_1]
    2. [TESTABLE_OUTCOME_2]
  </template>
  <constraints>
    - count: 1-3 expectations
    - focus: browser-testable outcomes
  </constraints>
</section>

<instructions>
  ACTION: Create spec.md with all sections
  FILL: Use spec details from steps 1-4
  MAINTAIN: Clear, concise descriptions
</instructions>

</step>

<step number="8" name="create_technical_spec">

### Step 8: Create Technical Specification

<step_metadata>
  <creates>
    - directory: sub-specs/
    - file: sub-specs/technical-spec.md
  </creates>
</step_metadata>

<file_template>
  <header>
    # Technical Specification

    This is the technical specification for the spec detailed in @.agent-os/specs/YYYY-MM-DD-spec-name/spec.md

    > Created: [CURRENT_DATE]
    > Version: 1.0.0
  </header>
</file_template>

<spec_sections>
  <technical_requirements>
    - functionality details
    - UI/UX specifications
    - integration requirements
    - performance criteria
  </technical_requirements>
  <approach_options>
    - multiple approaches (if applicable)
    - selected approach
    - rationale for selection
  </approach_options>
  <external_dependencies>
    - new libraries/packages
    - justification for each
    - version requirements
  </external_dependencies>
</spec_sections>

<example_template>
  ## Technical Requirements

  - [SPECIFIC_TECHNICAL_REQUIREMENT]
  - [SPECIFIC_TECHNICAL_REQUIREMENT]

  ## Approach Options

  **Option A:** [DESCRIPTION]
  - Pros: [LIST]
  - Cons: [LIST]

  **Option B:** [DESCRIPTION] (Selected)
  - Pros: [LIST]
  - Cons: [LIST]

  **Rationale:** [EXPLANATION]

  ## External Dependencies

  - **[LIBRARY_NAME]** - [PURPOSE]
  - **Justification:** [REASON_FOR_INCLUSION]
</example_template>

<instructions>
  ACTION: Create sub-specs folder and technical-spec.md
  DOCUMENT: All technical decisions and requirements
  JUSTIFY: Any new dependencies
</instructions>

</step>

<step number="9" name="create_database_schema">

### Step 9: Create Database Schema (Conditional)

<step_metadata>
  <creates>
    - file: sub-specs/database-schema.md
  </creates>
  <condition>only if database changes needed</condition>
</step_metadata>

<decision_tree>
  IF spec_requires_database_changes:
    CREATE sub-specs/database-schema.md
  ELSE:
    SKIP this_step
</decision_tree>

<file_template>
  <header>
    # Database Schema

    This is the database schema implementation for the spec detailed in @.agent-os/specs/YYYY-MM-DD-spec-name/spec.md

    > Created: [CURRENT_DATE]
    > Version: 1.0.0
  </header>
</file_template>

<schema_sections>
  <changes>
    - new tables
    - new columns
    - modifications
    - migrations
  </changes>
  <specifications>
    - exact SQL or migration syntax
    - indexes and constraints
    - foreign key relationships
  </specifications>
  <rationale>
    - reason for each change
    - performance considerations
    - data integrity rules
  </rationale>
</schema_sections>

<instructions>
  ACTION: Check if database changes needed
  CREATE: database-schema.md only if required
  INCLUDE: Complete SQL/migration specifications
</instructions>

</step>

<step number="10" name="create_api_spec">

### Step 10: Create API Specification (Conditional)

<step_metadata>
  <creates>
    - file: sub-specs/api-spec.md
  </creates>
  <condition>only if API changes needed</condition>
</step_metadata>

<decision_tree>
  IF spec_requires_api_changes:
    CREATE sub-specs/api-spec.md
  ELSE:
    SKIP this_step
</decision_tree>

<file_template>
  <header>
    # API Specification

    This is the API specification for the spec detailed in @.agent-os/specs/YYYY-MM-DD-spec-name/spec.md

    > Created: [CURRENT_DATE]
    > Version: 1.0.0
  </header>
</file_template>

<api_sections>
  <routes>
    - HTTP method
    - endpoint path
    - parameters
    - response format
  </routes>
  <controllers>
    - action names
    - business logic
    - error handling
  </controllers>
  <purpose>
    - endpoint rationale
    - integration with features
  </purpose>
</api_sections>

<endpoint_template>
  ## Endpoints

  ### [HTTP_METHOD] [ENDPOINT_PATH]

  **Purpose:** [DESCRIPTION]
  **Parameters:** [LIST]
  **Response:** [FORMAT]
  **Errors:** [POSSIBLE_ERRORS]
</endpoint_template>

<instructions>
  ACTION: Check if API changes needed
  CREATE: api-spec.md only if required
  DOCUMENT: All endpoints and controllers
</instructions>

</step>

<step number="11" name="create_tests_spec">

### Step 11: Create Tests Specification

<step_metadata>
  <creates>
    - file: sub-specs/tests.md
  </creates>
</step_metadata>

<file_template>
  <header>
    # Tests Specification

    This is the tests coverage details for the spec detailed in @.agent-os/specs/YYYY-MM-DD-spec-name/spec.md

    > Created: [CURRENT_DATE]
    > Version: 1.0.0
  </header>
</file_template>

<test_categories>
  <unit_tests>
    - model tests
    - service tests
    - helper tests
  </unit_tests>
  <integration_tests>
    - controller tests
    - API tests
    - workflow tests
  </integration_tests>
  <feature_tests>
    - end-to-end scenarios
    - user workflows
  </feature_tests>
  <mocking_requirements>
    - external services
    - API responses
    - time-based tests
  </mocking_requirements>
</test_categories>

<test_template>
  ## Test Coverage

  ### Unit Tests

  **[CLASS_NAME]**
  - [TEST_DESCRIPTION]
  - [TEST_DESCRIPTION]

  ### Integration Tests

  **[FEATURE_NAME]**
  - [SCENARIO_DESCRIPTION]
  - [SCENARIO_DESCRIPTION]

  ### Mocking Requirements

  - **[SERVICE_NAME]:** [MOCK_STRATEGY]
</test_template>

<instructions>
  ACTION: Create comprehensive test specification
  ENSURE: All new functionality has test coverage
  SPECIFY: Mock requirements for external services
</instructions>

</step>

<step number="12" name="user_review">

### Step 12: User Review

<step_metadata>
  <action>request user review</action>
  <reviews>
    - spec.md
    - all sub-specs files
  </reviews>
</step_metadata>

<review_request>
  I've created the spec documentation:

  - Spec Requirements: @.agent-os/specs/YYYY-MM-DD-spec-name/spec.md
  - Technical Spec: @.agent-os/specs/YYYY-MM-DD-spec-name/sub-specs/technical-spec.md
  [LIST_OTHER_CREATED_SPECS]

  Please review and let me know if any changes are needed before I create the task breakdown.
</review_request>

<instructions>
  ACTION: Request user review of all documents
  WAIT: For approval or revision requests
  REVISE: Make requested changes if any
</instructions>

</step>

<step number="13" name="create_tasks">

### Step 13: Create tasks.md

<step_metadata>
  <creates>
    - file: tasks.md
  </creates>
  <depends_on>user approval from step 12</depends_on>
</step_metadata>

<file_template>
  <header>
    # Spec Tasks

    These are the tasks to be completed for the spec detailed in @.agent-os/specs/YYYY-MM-DD-spec-name/spec.md

    > Created: [CURRENT_DATE]
    > Status: Ready for Implementation
  </header>
</file_template>

<task_structure>
  <major_tasks>
    - count: 1-5
    - format: numbered checklist
    - grouping: by feature or component
  </major_tasks>
  <subtasks>
    - count: up to 8 per major task
    - format: decimal notation (1.1, 1.2)
    - first_subtask: typically write tests
    - penultimate_subtask: verify implementation with MCP browser tools or E2E tests
    - last_subtask: verify all tests pass and feature works
  </subtasks>
  <verification_subtasks>
    - MANDATORY: Each major task must include verification subtask
    - FORMAT: "Verify [feature] works using MCP browser tools"
    - ALTERNATIVE: "Run E2E test to verify [feature] functionality"
  </verification_subtasks>
</task_structure>

<task_template>
  ## Tasks

  - [ ] 1. [MAJOR_TASK_DESCRIPTION]
    - [ ] 1.1 Write tests for [COMPONENT]
    - [ ] 1.2 [IMPLEMENTATION_STEP]
    - [ ] 1.3 [IMPLEMENTATION_STEP]
    - [ ] 1.4 Verify [FEATURE] works using MCP browser tools (navigate, interact, screenshot)
    - [ ] 1.5 Verify all tests pass

  - [ ] 2. [MAJOR_TASK_DESCRIPTION]
    - [ ] 2.1 Write tests for [COMPONENT]
    - [ ] 2.2 [IMPLEMENTATION_STEP]
    - [ ] 2.3 Run E2E test to verify [FEATURE] functionality
    - [ ] 2.4 Verify all tests pass
</task_template>

<ordering_principles>
  - Consider technical dependencies
  - Follow TDD approach
  - Group related functionality
  - Build incrementally
</ordering_principles>

<instructions>
  ACTION: Create task breakdown following TDD
  STRUCTURE: Major tasks with subtasks
  ORDER: Consider dependencies
</instructions>

</step>

<step number="14" name="update_cross_references">

### Step 14: Documentation Cross-References

<step_metadata>
  <updates>
    - file: spec.md
  </updates>
  <adds>references to all spec files</adds>
</step_metadata>

<reference_template>
  ## Spec Documentation

  - Tasks: @.agent-os/specs/YYYY-MM-DD-spec-name/tasks.md
  - Technical Specification: @.agent-os/specs/YYYY-MM-DD-spec-name/sub-specs/technical-spec.md
  - API Specification: @.agent-os/specs/YYYY-MM-DD-spec-name/sub-specs/api-spec.md
  - Database Schema: @.agent-os/specs/YYYY-MM-DD-spec-name/sub-specs/database-schema.md
  - Tests Specification: @.agent-os/specs/YYYY-MM-DD-spec-name/sub-specs/tests.md
</reference_template>

<reference_format>
  - Use @ prefix for clickable paths
  - Include full path from project root
  - Only list files that were created
</reference_format>

<instructions>
  ACTION: Update spec.md with references
  FORMAT: Use @ prefix for all paths
  INCLUDE: Only files actually created
</instructions>

</step>

<step number="15" name="decision_documentation">

### Step 15: Decision Documentation

<step_metadata>
  <evaluates>strategic impact</evaluates>
  <updates>decisions.md if needed</updates>
</step_metadata>

<decision_analysis>
  <review_against>
    - @.agent-os/product/mission.md
    - @.agent-os/product/decisions.md
  </review_against>
  <criteria>
    - changes product direction
    - impacts roadmap priorities
    - introduces new technical patterns
    - affects user experience significantly
  </criteria>
</decision_analysis>

<decision_tree>
  IF spec_impacts_mission_or_roadmap:
    IDENTIFY key_decisions (max 3)
    DOCUMENT decision_details
    ASK user_for_approval
    IF approved:
      UPDATE decisions.md
  ELSE:
    STATE "This spec is inline with the current mission and roadmap, so no need to post anything to our decisions log at this time."
</decision_tree>

<decision_template>
  ## [CURRENT_DATE]: [DECISION_TITLE]

  **ID:** DEC-[NEXT_NUMBER]
  **Status:** Accepted
  **Category:** [technical/product/business/process]
  **Related Spec:** @.agent-os/specs/YYYY-MM-DD-spec-name/

  ### Decision

  [DECISION_SUMMARY]

  ### Context

  [WHY_THIS_DECISION_WAS_NEEDED]

  ### Consequences

  **Positive:**
  - [EXPECTED_BENEFITS]

  **Negative:**
  - [KNOWN_TRADEOFFS]
</decision_template>

<instructions>
  ACTION: Analyze spec for strategic decisions
  IDENTIFY: Up to 3 key decisions if any
  REQUEST: User approval before updating
  UPDATE: Add to decisions.md if approved
</instructions>

</step>

<step number="16" name="cleanup_and_review">

### Step 16: Cleanup and Review

<step_metadata>
  <purpose>Ensure clean repository state before implementation</purpose>
  <actions>
    - Remove temporary files
    - Organize test scripts
    - Clean up duplicates
    - Create documentation
  </actions>
</step_metadata>

<cleanup_process>
  <temporary_files>
    <identify>
      1. CHECK for temporary test files created during spec planning
      2. LOOK for debug scripts or one-off tests
      3. FIND duplicate or obsolete scripts
    </identify>
    <organize>
      1. MOVE test scripts to appropriate subdirectories
      2. GROUP by functionality (integration, auth, database, etc.)
      3. REMOVE clear duplicates
    </organize>
  </temporary_files>

  <script_organization>
    <structure>
      scripts/
      ├── test-integration/    # OAuth, API, external service tests
      ├── test-auth/          # Authentication and authorization tests
      ├── test-database/      # Database and migration tests
      ├── test-workflows/     # Workflow functionality tests
      ├── test-agents/        # Agent-related tests
      ├── build-scripts/      # Build and compilation scripts
      ├── deployment/         # Deployment and infrastructure
      ├── utilities/          # Development utilities
      └── [feature-specific]/ # Create new folders as needed
    </structure>
  </script_organization>

  <cleanup_criteria>
    <remove_if>
      - File is clearly a duplicate (older version exists)
      - Temporary debug script no longer needed
      - One-off test that's been superseded
      - Documentation that's outdated
    </remove_if>
    <keep_if>
      - Actively used in development
      - Part of CI/CD pipeline
      - Useful utility or helper
      - Current test coverage
    </keep_if>
  </cleanup_criteria>
</cleanup_process>

<review_checklist>
  <repository_state>
    - [ ] All test scripts organized into appropriate folders
    - [ ] Duplicate scripts removed
    - [ ] Temporary files cleaned up
    - [ ] README updated if script structure changed
  </repository_state>
  
  <documentation_check>
    - [ ] Scripts have clear, descriptive names
    - [ ] Complex scripts have inline documentation
    - [ ] README reflects current organization
  </documentation_check>
</review_checklist>

<git_commit_if_needed>
  IF cleanup_performed:
    CREATE descriptive commit:
      - Message: "chore: Cleanup and organize scripts after [spec-name] planning"
      - Include: List of major changes in commit body
      - Tag: Co-authored by Claude
</git_commit_if_needed>

<instructions>
  ACTION: Review repository for cleanup needs
  ORGANIZE: Move scripts to appropriate folders
  REMOVE: Clear duplicates and temporary files
  DOCUMENT: Update README if structure changed
  COMMIT: Create git commit if cleanup performed
</instructions>

</step>

<step number="17" name="execution_readiness">

### Step 17: Execution Readiness Check

<step_metadata>
  <evaluates>readiness to begin implementation</evaluates>
  <depends_on>completion of all previous steps including cleanup</depends_on>
</step_metadata>

<readiness_summary>
  <present_to_user>
    - Spec name and description
    - First task summary from tasks.md
    - Estimated complexity/scope
    - Key deliverables for task 1
  </present_to_user>
</readiness_summary>

<execution_prompt>
  PROMPT: "The spec planning is complete. The first task is:

  **Task 1:** [FIRST_TASK_TITLE]
  [BRIEF_DESCRIPTION_OF_TASK_1_AND_SUBTASKS]

  Would you like me to proceed with implementing Task 1? I will follow the execution guidelines in @~/.agent-os/instructions/execute-tasks.md and focus only on this first task and its subtasks unless you specify otherwise.

  Type 'yes' to proceed with Task 1, or let me know if you'd like to review or modify the plan first."
</execution_prompt>

<execution_flow>
  IF user_confirms_yes:
    REFERENCE: @~/.agent-os/instructions/execute-tasks.md
    FOCUS: Only Task 1 and its subtasks
    CONSTRAINT: Do not proceed to additional tasks without explicit user request
    VERIFICATION: Must verify implementation works before marking complete
  ELSE:
    WAIT: For user clarification or modifications
</execution_flow>

<verification_requirements>
  <mandatory>CANNOT mark any task as done without verification</mandatory>
  <methods>
    <primary_method>
      <name>MCP Browser Automation</name>
      <tools>MCP Puppeteer or Playwright</tools>
      <process>
        1. Navigate to implemented feature
        2. Perform user actions (click, fill forms, etc.)
        3. Verify expected results appear
        4. Take screenshots as proof
        5. Check console for errors
      </process>
    </primary_method>
    <fallback_method>
      <name>E2E External Tests</name>
      <trigger>If MCP browser tools unavailable or failing</trigger>
      <process>
        1. Create/run E2E test for the feature
        2. Ensure test passes completely
        3. Document test results
        4. Include test output as proof
      </process>
    </fallback_method>
  </methods>
  <proof_requirements>
    - Screenshots of working feature
    - Console log showing no errors
    - Test results showing all passing
    - Actual navigation and interaction proof
  </proof_requirements>
</verification_requirements>

<instructions>
  ACTION: Summarize first task and request user confirmation
  REFERENCE: Use execute-tasks.md for implementation
  SCOPE: Limit to Task 1 only unless user specifies otherwise
  VERIFY: Implementation must be proven to work before completion
</instructions>

</step>

</process_flow>

## Execution Standards

<standards>
  <follow>
    - @.agent-os/product/code-style.md
    - @.agent-os/product/dev-best-practices.md
    - @.agent-os/product/tech-stack.md
  </follow>
  <maintain>
    - Consistency with product mission
    - Alignment with roadmap
    - Technical coherence
  </maintain>
  <create>
    - Comprehensive documentation
    - Clear implementation path
    - Testable outcomes
  </create>
  <verification>
    - MANDATORY: All implementations must be verified before marking complete
    - PRIMARY: Use MCP browser automation tools (Puppeteer/Playwright)
    - FALLBACK: Run E2E tests if browser tools unavailable
    - PROOF: Screenshots, console logs, or test results required
    - NEVER: Mark tasks done without verification proof
  </verification>
</standards>

<final_checklist>
  <verify>
    - [ ] Accurate date determined via file system
    - [ ] Spec folder created with correct date prefix
    - [ ] spec.md contains all required sections
    - [ ] All applicable sub-specs created
    - [ ] User approved documentation
    - [ ] tasks.md created with TDD approach
    - [ ] Cross-references added to spec.md
    - [ ] Strategic decisions evaluated
    - [ ] Verification method established (MCP browser tools or E2E tests)
    - [ ] Implementation verification requirements documented
  </verify>
</final_checklist>
