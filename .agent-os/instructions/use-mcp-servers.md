# Use MCP Servers

> Version: 1.1.0
> Last Updated: 2025-01-26

## Overview

This guide explains how to effectively use MCP (Model Context Protocol) servers in your development workflow. MCP servers provide powerful capabilities for documentation search, security analysis, browser automation, and long-term memory.

**IMPORTANT**: These MCP servers should be used proactively and extensively throughout development. They are not optional tools - they are core to our development workflow.

**Quick Access**: 
- Type `/use-mcp` for this comprehensive guide
- See `mcp-mandatory-workflow.md` for the required workflow checklist

## Mandatory MCP Usage

**YOU MUST USE THESE MCP SERVERS FOR:**
1. **Before ANY implementation** - Search docs with Ref
2. **After EVERY feature** - Test with Playwright
3. **Before EVERY commit** - Run Semgrep security scan
4. **After EVERY breakthrough** - Save to Pieces memory
5. **For ANY research need** - Use Exa for recent content

## Available MCP Servers

### 1. Ref - Documentation Search (ref-tools/ref-tools-mcp)

**Purpose**: Search and read documentation from the web, GitHub, and private resources like repos and PDFs.

**Key Tools**:
- `ref_search_documentation` - Search for documentation with queries
- `ref_read_url` - Read content from documentation URLs

**Usage Examples**:
```typescript
// Search for React Native navigation documentation
await ref_search_documentation({ 
  query: "React Native Expo Router navigation typescript" 
});

// Search private documentation
await ref_search_documentation({ 
  query: "authentication flow ref_src=private" 
});

// Read a specific documentation page
await ref_read_url({ 
  url: "https://docs.expo.dev/router/introduction/" 
});
```

**Best Practices**:
- Include programming language and framework names in queries
- Add `ref_src=private` to search user's private documentation
- Always use `ref_read_url` with exact URLs from search results
- Search before implementing to find best practices and examples

### 2. Semgrep - Security Analysis (semgrep/mcp)

**Purpose**: Perform static code analysis for security vulnerabilities and code quality issues.

**Key Features**:
- Detect security vulnerabilities
- Find code quality issues
- Enforce coding standards
- Support for multiple languages

**Usage Examples**:
```bash
# Run security scan on entire codebase
semgrep --config=auto .

# Scan specific directory
semgrep --config=auto backend/

# Use specific rulesets
semgrep --config=p/security backend/services/

# Check for OWASP Top 10 vulnerabilities
semgrep --config=p/owasp-top-ten .
```

**Best Practices**:
- Run security scans before deploying to production
- Include in CI/CD pipeline for automated checks
- Review and fix high-severity findings first
- Use custom rules for project-specific patterns

### 3. Playwright - Browser Automation (microsoft/playwright-mcp)

**Purpose**: Automate browser interactions for testing and verification.

**Key Tools**:
- `browser_navigate` - Navigate to URLs
- `browser_snapshot` - Capture page accessibility tree
- `browser_click` - Click elements
- `browser_type` - Type text into fields
- `browser_take_screenshot` - Capture screenshots
- `browser_evaluate` - Execute JavaScript

**Usage Examples**:
```typescript
// Navigate and verify page loads
await browser_navigate({ url: "http://localhost:8081/workflows" });
await browser_snapshot(); // Get page structure

// Test form submission
await browser_type({ 
  element: "Email input field",
  ref: "input[name='email']",
  text: "test@example.com"
});
await browser_click({
  element: "Submit button",
  ref: "button[type='submit']"
});

// Verify results
await browser_take_screenshot({ 
  filename: "form-submission-result.png" 
});
```

**Best Practices**:
- Always use `browser_snapshot` before interacting with elements
- Provide both human-readable descriptions and exact selectors
- Take screenshots to document test results
- Use for E2E testing and visual verification
- Handle dialogs and popups appropriately

### 4. Pieces - Long-Term Memory (pieces/pieces-mcp)

**Purpose**: Create and retrieve contextual memories about the project, preserving important breakthroughs and decisions.

**Key Tools**:
- `ask_pieces_ltm` - Query historical/contextual information
- `create_pieces_memory` - Save important memories

**Usage Examples**:
```typescript
// Query past work
await ask_pieces_ltm({
  question: "What OAuth providers have we integrated?",
  chat_llm: "claude-3-opus",
  topics: ["oauth", "authentication", "integrations"],
  application_sources: ["Code"]
});

// Save important breakthrough
await create_pieces_memory({
  connected_client: "Claude",
  summary_description: "Fixed OAuth abstraction layer for provider switching",
  summary: `## OAuth Provider Abstraction Fix
  
  ### Problem
  Direct imports of provider-specific code were causing tight coupling...
  
  ### Solution
  Implemented factory pattern with normalized interfaces...
  
  ### Key Files
  - backend/services/provider-factory.ts
  - backend/services/oauth-provider-interface.ts`,
  files: [
    "/Users/username/project/backend/services/provider-factory.ts",
    "/Users/username/project/backend/services/oauth-provider-interface.ts"
  ],
  project: "/Users/username/project",
  externalLinks: ["https://github.com/project/pull/123"]
});
```

**Best Practices**:
- Create memories for major breakthroughs or complex solutions
- Include absolute file paths for easy reference
- Document both the problem and solution
- Add external links to PRs, issues, or documentation
- Query before implementing to check for existing solutions

### 5. Exa Search - Advanced Web Search (exa-labs/exa-mcp-server)

**Purpose**: Perform neural web searches with advanced filtering and content retrieval. Exa uses neural search to find semantically relevant content, not just keyword matches.

**Key Tools**:
- `web_search_exa` - General web search with neural understanding
- `research_paper_search_exa` - Find academic papers and research
- `company_research_exa` - Research companies and organizations
- `crawling_exa` - Extract content from specific URLs
- `competitor_finder_exa` - Find competitor analysis
- `linkedin_search_exa` - Search LinkedIn profiles and companies
- `wikipedia_search_exa` - Search Wikipedia articles
- `github_search_exa` - Search GitHub repos and code
- `deep_researcher_start` - Start AI-powered deep research
- `deep_researcher_check` - Check research progress

**Usage Examples**:
```typescript
// Search for recent React Native tutorials
await web_search_exa({
  query: "React Native Expo SDK 52 tutorial 2025",
  numResults: 10
});

// Find academic papers on OAuth security
await research_paper_search_exa({
  query: "OAuth 2.0 security vulnerabilities mobile applications",
  numResults: 5
});

// Research a company's tech stack
await company_research_exa({
  companyName: "Vercel",
  numResults: 5
});

// Extract content from a specific article
await crawling_exa({
  url: "https://blog.example.com/react-native-performance",
  maxCharacters: 5000
});

// Find competitors for analysis
await competitor_finder_exa({
  companyName: "Linear",
  industry: "Project Management Software",
  numResults: 10
});

// Search GitHub for implementation examples
await github_search_exa({
  query: "React Native OAuth integration TypeScript",
  searchType: "code",
  numResults: 10
});

// Start deep research for complex topics
const { taskId } = await deep_researcher_start({
  instructions: "Research best practices for implementing OAuth 2.0 in React Native apps with focus on security, token storage, and refresh mechanisms",
  model: "exa-research-pro"
});

// Check research progress (poll until completed)
const result = await deep_researcher_check({ taskId });
```

**Best Practices**:
- Use semantic queries that describe what you're looking for conceptually
- Leverage deep research for complex topics requiring synthesis
- Use date filters by including years in queries (e.g., "2024", "2025")
- Combine multiple search types for comprehensive research
- Use `exa-research-pro` model for complex research needs
- Always poll `deep_researcher_check` until status is 'completed'

## Integration Workflow

### 1. Research Phase (MANDATORY)
```typescript
// 1. Search documentation with Ref
const docs = await ref_search_documentation({ 
  query: "React Native Expo OAuth integration TypeScript" 
});
await ref_read_url({ url: docs[0].url }); // Read best result

// 2. Check existing knowledge with Pieces
const history = await ask_pieces_ltm({
  question: "How did we implement OAuth before? What were the challenges?",
  chat_llm: "claude-3-opus",
  topics: ["oauth", "authentication", "provider-abstraction"]
});

// 3. Search for recent examples with Exa
const examples = await github_search_exa({
  query: "React Native OAuth 2025 implementation secure",
  searchType: "code",
  numResults: 10
});

// 4. Deep research for complex topics
const research = await deep_researcher_start({
  instructions: "Find the latest best practices for OAuth in React Native with focus on security and token management",
  model: "exa-research-pro"
});
// Poll for results
const researchResult = await deep_researcher_check({ taskId: research.taskId });
```

### 2. Implementation Phase
```typescript
// Implement based on research findings
// ... code implementation ...

// Run security scan with Semgrep BEFORE committing
await bash({ 
  command: "semgrep --config=auto backend/services/oauth/",
  description: "Security scan OAuth implementation"
});

// Fix any vulnerabilities found
// ... apply security fixes ...
```

### 3. Testing Phase (MANDATORY)
```typescript
// Start the application
await bash({ 
  command: "npm run dev",
  description: "Start application for testing"
});

// Test with Playwright browser automation
await browser_navigate({ url: "http://localhost:8081/login" });
await browser_snapshot(); // Get page structure

// Test OAuth flow
await browser_click({
  element: "Login with Google button",
  ref: "button[data-provider='google']"
});

// Verify success
await browser_wait_for({ text: "Successfully logged in" });
await browser_take_screenshot({ 
  filename: "oauth-success.png",
  fullPage: true
});

// Check for console errors
await browser_evaluate({
  function: "() => { return window.__errors || [] }"
});
```

### 4. Documentation Phase (MANDATORY)
```typescript
// Save implementation details to Pieces
await create_pieces_memory({
  connected_client: "Claude",
  summary_description: "Implemented secure OAuth with provider abstraction",
  summary: `## OAuth Implementation
  
  ### Key Decisions
  - Used factory pattern for provider abstraction
  - Tokens stored in secure storage
  - Implemented automatic refresh mechanism
  
  ### Security Measures
  - PKCE flow for mobile
  - Encrypted token storage
  - Session timeout handling
  
  ### Files Modified
  - backend/services/oauth-factory.ts
  - app/hooks/useAuth.ts
  - store/auth-store.ts`,
  files: [
    "/path/to/backend/services/oauth-factory.ts",
    "/path/to/app/hooks/useAuth.ts",
    "/path/to/store/auth-store.ts"
  ],
  project: "/Users/username/workspace/project",
  externalLinks: ["https://github.com/project/pull/oauth-implementation"]
});
```

## Best Practices Summary

1. **Always Research First**
   - Use Ref and Pieces to find existing solutions
   - Check documentation before implementing

2. **Verify Everything**
   - Use Playwright to test implementations
   - Take screenshots as proof
   - Never claim something works without testing

3. **Maintain Security**
   - Run Semgrep scans regularly
   - Fix security issues immediately
   - Include in CI/CD pipeline

4. **Document Breakthroughs**
   - Use Pieces to save important discoveries
   - Include file paths and external links
   - Help future development

5. **Combine Tools**
   - Use multiple MCP servers together
   - Research → Implement → Test → Document
   - Create comprehensive solutions

## Common Patterns

### Feature Implementation
1. Search docs with Ref
2. Check memory with Pieces
3. Implement feature
4. Test with Playwright
5. Scan with Semgrep
6. Save to Pieces memory

### Bug Fixing
1. Query Pieces for similar issues
2. Research solution with Ref
3. Implement fix
4. Verify with Playwright
5. Document fix in Pieces

### Security Audit
1. Run Semgrep scan
2. Research vulnerabilities with Ref
3. Implement fixes
4. Test with Playwright
5. Document security improvements

## MANDATORY MCP CHECKLIST

**Before Starting ANY Task:**
- [ ] Search documentation with Ref
- [ ] Check Pieces memory for past solutions
- [ ] Use Exa for recent examples/tutorials
- [ ] Research best practices with deep_researcher if complex

**During Implementation:**
- [ ] Run Semgrep after each major change
- [ ] Test features with Playwright as you build
- [ ] Take screenshots for verification

**Before Committing:**
- [ ] Run full Semgrep security scan
- [ ] Test all changes with Playwright
- [ ] Verify no console errors
- [ ] Document in Pieces if significant

**After Completion:**
- [ ] Save breakthrough/solution to Pieces
- [ ] Include all file paths and links
- [ ] Document decisions and rationale

## MCP Server Priority

**HIGH PRIORITY (Use Always):**
1. **Ref** - Before ANY implementation
2. **Playwright** - For ALL testing/verification
3. **Semgrep** - Before EVERY commit
4. **Pieces** - For important decisions/breakthroughs

**MEDIUM PRIORITY (Use Frequently):**
5. **Exa** - For research and recent content

## Remember

**These are NOT optional tools.** They are MANDATORY parts of our development workflow. Using them ensures:
- Higher code quality
- Better security
- Comprehensive testing
- Knowledge preservation
- Faster future development

**If you skip these tools, you are not following our development standards.**

---

*MCP servers are MANDATORY. Use them proactively and extensively throughout development.*