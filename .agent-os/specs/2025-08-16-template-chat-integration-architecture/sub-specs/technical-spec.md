# Technical Specification: Template-Chat Integration Architecture

> Created: 2025-01-16  
> Version: 1.0.0  
> Status: Planning  
> Priority: P0 - Critical

## Executive Summary

This document outlines the technical strategy for implementing seamless integration between agent templates and chat conversations, enabling dynamic prompt generation and context-aware AI interactions.

## Problem Statement

### Current Gaps
1. **Template-Chat Bridge Gap**: No seamless transition from template selection to chat execution
2. **Dynamic Prompt Generation Gap**: Static system prompts don't adapt to template context
3. **Integration Context Gap**: Templates don't automatically provide integration context to chat
4. **Workflow Execution Gap**: Workflow execution is separate from chat conversation

### Impact
- Poor user experience with manual context setup
- Generic AI responses without template-specific knowledge
- Disconnected workflow and chat experiences
- Limited template reusability and customization

## Solution Architecture

### 1. Dynamic Prompt Generator Service

#### Core Interface
```typescript
interface PromptGenerationConfig {
  template: AgentTemplate;
  userContext: UserContext;
  integrations: Integration[];
  customParameters?: Record<string, any>;
  modelPreferences?: ModelConfig;
}

interface GeneratedPrompt {
  id: string;
  systemPrompt: string;
  initialMessage?: string;
  goal: string;
  context: {
    integrations: Integration[];
    capabilities: string[];
    workflow?: WorkflowConfig;
    tools: ToolDefinition[];
  };
  cacheKey?: string;
  expiresAt?: Date;
}

class DynamicPromptGenerator {
  async generate(config: PromptGenerationConfig): Promise<GeneratedPrompt> {
    // 1. Parse template structure
    const components = this.parseTemplate(config.template);
    
    // 2. Build base context
    const baseContext = this.buildBaseContext(components);
    
    // 3. Add integration capabilities
    const integrationContext = this.mapIntegrations(config.integrations);
    
    // 4. Apply user customizations
    const customizedContext = this.applyCustomizations(
      baseContext,
      config.customParameters
    );
    
    // 5. Optimize for target model
    return this.optimizeForModel(customizedContext, config.template.model);
  }
}
```

#### Prompt Generation Algorithm
```typescript
private parseTemplate(template: AgentTemplate): TemplateComponents {
  return {
    identity: {
      name: template.name,
      role: template.role,
      purpose: template.purpose,
      icon: template.icon
    },
    capabilities: template.capabilities,
    integrations: template.required_integrations,
    workflow: template.default_workflow,
    settings: template.settings
  };
}

private buildBaseContext(components: TemplateComponents): string {
  let prompt = `You are ${components.identity.name}, ${components.identity.role}.\n\n`;
  prompt += `Purpose: ${components.identity.purpose}\n\n`;
  
  if (components.capabilities.length > 0) {
    prompt += `Your capabilities include:\n`;
    components.capabilities.forEach(cap => {
      prompt += `- ${cap}\n`;
    });
    prompt += '\n';
  }
  
  if (components.workflow) {
    prompt += `Workflow Goal: ${components.workflow.goal}\n`;
    prompt += `Steps: ${components.workflow.steps.map(s => s.name).join(' → ')}\n\n`;
  }
  
  return prompt;
}

private mapIntegrations(integrations: Integration[]): string {
  let context = 'Available integrations and tools:\n';
  
  integrations.forEach(integration => {
    context += `\n${integration.service}:\n`;
    integration.tools.forEach(tool => {
      context += `- ${tool.name}: ${tool.description}\n`;
    });
  });
  
  return context;
}
```

### 2. Template-Chat Bridge Service

#### Core Interface
```typescript
interface ChatSessionConfig {
  userId: string;
  templateId: string;
  customParameters?: Record<string, any>;
  initialMessage?: string;
  workflowVariables?: Record<string, any>;
}

interface ChatSession {
  id: string;
  userId: string;
  templateId: string;
  systemPrompt: string;
  context: TemplateContext;
  workflow?: ActiveWorkflow;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

class TemplateChatBridge {
  async initializeChatFromTemplate(config: ChatSessionConfig): Promise<ChatSession> {
    // 1. Load template and user context
    const template = await this.loadTemplate(config.templateId);
    const userContext = await this.loadUserContext(config.userId);
    
    // 2. Validate integrations
    await this.validateRequiredIntegrations(template, userContext);
    
    // 3. Generate dynamic prompt
    const prompt = await this.promptGenerator.generateFromTemplate(
      template, userContext, userContext.integrations, config.customParameters
    );
    
    // 4. Create chat session with template context
    const session = await this.createChatSession({
      userId: config.userId,
      templateId: config.templateId,
      systemPrompt: prompt.systemPrompt,
      initialContext: prompt.context,
      customParameters: config.customParameters
    });
    
    // 5. Initialize workflow if template has one
    if (template.default_workflow) {
      await this.initializeWorkflow(session, template.default_workflow, config.workflowVariables);
    }
    
    // 6. Add initial message if provided
    if (config.initialMessage) {
      await this.addInitialMessage(session, config.initialMessage);
    }
    
    return session;
  }
}
```

### 3. Enhanced Chat Service Integration

#### Core Interface
```typescript
interface EnhancedChatContext extends ChatContext {
  templateId?: string;
  templateContext?: TemplateContext;
  activeWorkflow?: ActiveWorkflow;
  dynamicPrompt?: GeneratedPrompt;
}

class EnhancedChatService extends ChatService {
  async processMessage(messages: ChatMessage[], context: EnhancedChatContext): Promise<ChatResponse> {
    
    // 1. Check if this is a template-based conversation
    if (context.templateId && context.templateContext) {
      return await this.processWithTemplate(messages, context);
    }
    
    // 2. Fall back to generic processing
    return await super.processMessage(messages, context);
  }
  
  private async processWithTemplate(
    messages: ChatMessage[],
    context: EnhancedChatContext
  ): Promise<ChatResponse> {
    
    // 1. Get or refresh dynamic prompt
    const dynamicPrompt = await this.getOrRefreshPrompt(context);
    
    // 2. Build enhanced system prompt
    const systemPrompt = this.buildEnhancedSystemPrompt(dynamicPrompt, context);
    
    // 3. Process with template-aware AI routing
    const enhancedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages
    ];
    
    // 4. Route to appropriate AI model based on template requirements
    const modelSelection = await this.selectModelForTemplate(
      context.templateContext!,
      messages,
      context
    );
    
    // 5. Generate response with template context
    const response = await this.aiRouter.generateResponse(enhancedMessages, {
      template: context.templateContext,
      tools: context.templateContext.availableTools,
      workflow: context.activeWorkflow,
      model: modelSelection
    });
    
    // 6. Handle workflow execution if needed
    if (this.shouldExecuteWorkflow(response, context)) {
      await this.executeTemplateWorkflow(response, context);
    }
    
    return {
      success: true,
      response: response.content,
      toolCalls: response.toolCalls || [],
      workflowSuggestions: this.generateWorkflowSuggestions(context),
      costInfo: response.cost_info,
      metadata: {
        templateId: context.templateId,
        workflowStatus: context.activeWorkflow?.status,
        modelUsed: modelSelection.selected_model
      }
    };
  }
  
  private buildEnhancedSystemPrompt(
    dynamicPrompt: GeneratedPrompt,
    context: EnhancedChatContext
  ): string {
    let prompt = dynamicPrompt.systemPrompt;
    
    // Add active workflow context
    if (context.activeWorkflow) {
      prompt += `\n\nCurrent Workflow Status: ${context.activeWorkflow.status}`;
      prompt += `\nWorkflow Step: ${context.activeWorkflow.currentStep}`;
      prompt += `\nVariables: ${JSON.stringify(context.activeWorkflow.variables)}`;
    }
    
    // Add integration status
    prompt += `\n\nIntegration Status:`;
    context.templateContext?.integrations.forEach(integration => {
      prompt += `\n- ${integration.service}: ${integration.status}`;
    });
    
    // Add tool availability
    prompt += `\n\nAvailable Tools:`;
    context.templateContext?.availableTools.forEach(tool => {
      prompt += `\n- ${tool.name}: ${tool.description}`;
    });
    
    return prompt;
  }
}
```

## Implementation Strategy

### Phase 1: Core Dynamic Prompt Generation (Week 1-2)
1. **Create DynamicPromptGenerator Service**
   - Implement template parsing logic
   - Build base context generation
   - Add integration capability mapping
   - Create prompt optimization for different models

2. **Database Schema Updates**
   - Add prompt generation fields to agent_templates_v2
   - Create generated_prompts table for caching
   - Add prompt templates table for reusable patterns

3. **Unit Tests**
   - Test prompt generation with various template types
   - Validate integration context building
   - Test prompt optimization and caching

### Phase 2: Template-Chat Bridge (Week 3-4)
1. **Create TemplateChatBridge Service**
   - Implement template loading and validation
   - Add integration requirement checking
   - Create chat session initialization
   - Add workflow initialization logic

2. **Frontend Integration**
   - Update template selection components
   - Add "Run Agent" button with template context
   - Implement seamless navigation to chat
   - Add template context display in chat

3. **Integration Tests**
   - Test template-to-chat flow
   - Validate context preservation
   - Test workflow initialization

### Phase 3: Enhanced Chat Integration (Week 5-6)
1. **Update ChatService**
   - Extend with template-aware processing
   - Add dynamic prompt injection
   - Implement template-specific AI routing
   - Add workflow execution integration

2. **AI Router Updates**
   - Add template-aware model selection
   - Implement context-aware tool routing
   - Add workflow execution triggers

3. **End-to-End Testing**
   - Test complete template-to-execution flow
   - Validate prompt generation and injection
   - Test workflow integration with chat

### Phase 4: Advanced Features (Week 7-8)
1. **Prompt Customization**
   - Add user prompt editing interface
   - Implement prompt template saving
   - Add prompt versioning and history

2. **Performance Optimization**
   - Implement prompt caching
   - Add lazy loading for large templates
   - Optimize integration context building

3. **Analytics and Monitoring**
   - Add prompt generation metrics
   - Track template usage patterns
   - Monitor performance and user satisfaction

## Database Schema Updates

### 1. agent_templates_v2 Enhancements
```sql
ALTER TABLE agent_templates_v2
ADD COLUMN IF NOT EXISTS prompt_template TEXT,
ADD COLUMN IF NOT EXISTS prompt_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS context_requirements JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS execution_metrics JSONB DEFAULT '{}';
```

### 2. New Tables
```sql
-- Generated prompts for caching
CREATE TABLE generated_prompts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id VARCHAR(255) REFERENCES agent_templates_v2(id),
  user_id UUID REFERENCES users(id),
  prompt_hash VARCHAR(64) NOT NULL,
  system_prompt TEXT NOT NULL,
  context JSONB NOT NULL,
  cache_key VARCHAR(255),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt templates for reusability
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_string TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  agent_template_id VARCHAR(255) REFERENCES agent_templates_v2(id),
  is_public BOOLEAN DEFAULT false,
  version INTEGER DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Endpoints

### 1. Prompt Generation
```typescript
// POST /api/trpc/prompts.generate
POST /api/trpc/prompts.generate
Input: {
  templateId: string;
  customParameters?: Record<string, any>;
  useCache?: boolean;
}
Output: GeneratedPrompt

// GET /api/trpc/prompts.get
GET /api/trpc/prompts.get
Input: { promptId?: string; cacheKey?: string; }
Output: GeneratedPrompt
```

### 2. Template-Chat Bridge
```typescript
// POST /api/trpc/templates.initializeChat
POST /api/trpc/templates.initializeChat
Input: {
  templateId: string;
  customParameters?: Record<string, any>;
  initialMessage?: string;
  workflowVariables?: Record<string, any>;
}
Output: ChatSession

// GET /api/trpc/templates.getChatSession
GET /api/trpc/templates.getChatSession
Input: { sessionId: string; }
Output: ChatSession
```

### 3. Enhanced Chat
```typescript
// POST /api/trpc/chat.message (Enhanced)
POST /api/trpc/chat.message
Input: {
  messages: ChatMessage[];
  context: EnhancedChatContext;
}
Output: EnhancedChatResponse
```

## Testing Strategy

### 1. Unit Tests
- **DynamicPromptGenerator**: Test prompt generation logic
- **TemplateChatBridge**: Test session initialization
- **EnhancedChatService**: Test template-aware processing

### 2. Integration Tests
- **Template-to-Chat Flow**: Test complete user journey
- **Prompt Injection**: Test dynamic prompt usage
- **Workflow Integration**: Test workflow execution in chat

### 3. End-to-End Tests
- **User Scenarios**: Test real user workflows
- **Performance**: Test prompt generation speed
- **Error Handling**: Test failure scenarios

## Success Metrics

### 1. User Experience
- **Template Usage**: Increase in template execution rate
- **Chat Continuity**: Reduced context switching
- **User Satisfaction**: Improved chat response quality

### 2. Technical Performance
- **Prompt Generation**: < 100ms response time
- **Context Preservation**: 100% template context retention
- **Integration Success**: > 95% successful template executions

### 3. Business Impact
- **Template Adoption**: Increase in template usage
- **User Retention**: Higher user engagement
- **Feature Utilization**: Better use of existing integrations

## Risk Mitigation

### 1. Technical Risks
- **Prompt Complexity**: Implement prompt size limits and validation
- **Performance Impact**: Add caching and lazy loading
- **Integration Failures**: Implement fallback mechanisms

### 2. User Experience Risks
- **Context Loss**: Implement robust state management
- **Navigation Confusion**: Add clear visual indicators
- **Template Errors**: Provide helpful error messages

### 3. Scalability Risks
- **Database Growth**: Implement prompt cleanup and archiving
- **Memory Usage**: Add prompt size monitoring
- **API Load**: Implement rate limiting and caching

## Future Enhancements

### 1. Advanced Prompt Features
- **Multi-language Support**: Generate prompts in user's language
- **Personalization**: Adapt prompts based on user behavior
- **A/B Testing**: Test different prompt variations

### 2. Workflow Intelligence
- **Auto-completion**: Suggest workflow steps
- **Error Recovery**: Automatic workflow repair
- **Learning**: Improve prompts based on execution results

### 3. Integration Expansion
- **More Services**: Support additional integrations
- **Custom Tools**: Allow users to define custom tools
- **API Integration**: Connect with external AI services

## Conclusion

This technical specification provides a comprehensive roadmap for implementing seamless template-chat integration with dynamic prompt generation. The phased approach ensures incremental delivery while maintaining system stability and user experience quality.

The implementation will transform the current disconnected template and chat systems into a unified, context-aware AI assistant that provides personalized, template-specific interactions while maintaining the flexibility and power of the existing chat infrastructure.