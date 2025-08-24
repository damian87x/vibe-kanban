# MCP Mandatory Workflow

> THESE STEPS ARE NOT OPTIONAL - THEY ARE REQUIRED FOR EVERY TASK

## 🔴 BEFORE YOU START CODING

```typescript
// 1. MANDATORY: Search documentation
await ref_search_documentation({ 
  query: "[your feature] implementation best practices" 
});

// 2. MANDATORY: Check existing knowledge
await ask_pieces_ltm({
  question: "Have we implemented [feature] before? What were the challenges?",
  chat_llm: "claude-3-opus"
});

// 3. MANDATORY: Find recent examples
await web_search_exa({
  query: "[your feature] 2025 implementation tutorial",
  numResults: 10
});
```

## 🟡 WHILE CODING

```typescript
// After each major change
await bash({ 
  command: "semgrep --config=auto [changed-directory]/",
  description: "Security scan for vulnerabilities"
});
```

## 🟢 AFTER IMPLEMENTATION

```typescript
// 1. MANDATORY: Test with browser
await browser_navigate({ url: "http://localhost:8081/[your-feature]" });
await browser_snapshot();
await browser_take_screenshot({ filename: "feature-working.png" });

// 2. MANDATORY: Full security scan
await bash({ 
  command: "semgrep --config=auto .",
  description: "Full codebase security scan"
});

// 3. MANDATORY: Save to memory (for significant features)
await create_pieces_memory({
  summary_description: "[Feature] implementation",
  summary: "Detailed notes about implementation...",
  files: ["list", "of", "changed", "files"]
});
```

## ⛔ NEVER

- Start coding without searching docs (Ref)
- Commit without security scan (Semgrep)
- Claim it works without testing (Playwright)
- Forget breakthroughs (Pieces)
- Skip research for complex topics (Exa)

## 📋 Quick Commands

```bash
# Quick security check
semgrep --config=auto .

# Start app for testing
npm run dev

# Check what we know
# Use Pieces to query: "What do we know about [topic]?"
```

## 🚨 ENFORCEMENT

If you skip these steps:
1. Your code review will be rejected
2. You're not following standards
3. You're creating technical debt
4. You're missing security vulnerabilities
5. You're duplicating work

**USE THE MCP SERVERS. ALWAYS.**