# Use MCP

**MANDATORY**: Leverage MCP servers for documentation search, security analysis, browser automation, and long-term memory

## Required MCP Servers:
1. **Ref (ref-tools/ref-tools-mcp)** - ALWAYS search docs before coding
2. **Semgrep (semgrep/mcp)** - ALWAYS scan before committing
3. **Playwright (microsoft/playwright-mcp)** - ALWAYS test implementations
4. **Pieces (pieces/pieces-mcp)** - ALWAYS check/save knowledge
5. **Exa (exa-labs/exa-mcp-server)** - USE for research

## Quick Workflow:
```bash
# Before coding: Search docs
ref_search_documentation({ query: "your feature" })

# Before commit: Security scan
semgrep --config=auto .

# After coding: Test
browser_navigate({ url: "http://localhost:8081" })
browser_take_screenshot({ filename: "proof.png" })
```

**DETAILED GUIDE**: .agent-os/instructions/use-mcp-servers.md
**MANDATORY WORKFLOW**: .agent-os/instructions/mcp-mandatory-workflow.md