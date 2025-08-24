 graph TB
      %% User Interface Layer
      User[👤 User] --> CLI[🖥️ Terminal CLI]
      User --> WebUI[🌐 Web Interface?]

      %% CLI Entry Points
      CLI --> Interactive[🔄 Interactive Mode]
      CLI --> SingleQuery[⚡ Single Query]
      CLI --> Resume[📂 Resume Session]

      %% Core Orchestration Engine
      Interactive --> Orchestrator[🧠 Prompt Orchestration Engine]
      SingleQuery --> Orchestrator
      Resume --> Orchestrator
      WebUI -.-> Orchestrator

      %% System Prompt Generation
      Orchestrator --> PromptEngine[📝 System Prompt Engine]

      %% Mode Detection
      PromptEngine --> DefaultMode[🎯 Default Mode]
      PromptEngine --> AgentMode[🤖 Agent Mode]
      PromptEngine --> PlanMode[📋 Plan Mode]

      %% AI Provider Integration
      DefaultMode --> AIProvider[🔗 AI Provider]
      AgentMode --> AIProvider
      PlanMode --> AIProvider

      %% AI Provider Options
      AIProvider --> AnthropicAPI[🏢 Anthropic API]
      AIProvider --> BedrockAPI[☁️ AWS Bedrock]
      AIProvider --> VertexAPI[🔵 Google Vertex AI]

      %% Tool System
      Orchestrator --> ToolSystem[🛠️ Tool Orchestration]

      %% File Operations Tools
      ToolSystem --> ReadTool[📖 Read Tool]
      ToolSystem --> WriteTool[✏️ Write Tool]
      ToolSystem --> EditTool[📝 Edit Tool]
      ToolSystem --> MultiEditTool[📝📝 MultiEdit Tool]

      %% System Operations Tools
      ToolSystem --> BashTool[⚡ Bash Tool]
      ToolSystem --> LSTools[📁 LS/Glob/Grep]

      %% Specialized Tools
      ToolSystem --> TaskTool[🎯 Task Tool]
      ToolSystem --> TodoTools[✅ Todo Tools]
      ToolSystem --> GitTools[🔄 Git Integration]
      ToolSystem --> WebTools[🌐 Web Tools]
      ToolSystem --> NotebookTools[📓 Notebook Tools]

      %% Image Processing Pipeline
      ReadTool --> ImageProcessor[🖼️ Sharp Image Processor]
      ImageProcessor --> VisualAnalysis[👁️ Claude Vision]

      %% Security Layer
      ToolSystem --> SecurityLayer[🔒 Security Layer]
      SecurityLayer --> PermissionSystem[🛡️ Permission System]
      SecurityLayer --> PathValidation[📍 Path Validation]
      SecurityLayer --> SafetyPolicies[⚠️ Safety Policies]

      %% Task Management System
      TodoTools --> TaskState[📊 Task State Management]
      TaskState --> Planning[📋 Planning Phase]
      TaskState --> Execution[⚙️ Execution Phase]
      TaskState --> Tracking[📈 Progress Tracking]

      %% Git Workflow Integration
      GitTools --> GitCommit[💾 Auto Commit]
      GitTools --> PRCreation[🔀 PR Creation]
      GitTools --> BranchMgmt[🌿 Branch Management]

      %% Session Management
      Orchestrator --> SessionMgmt[💾 Session Management]
      SessionMgmt --> ConversationHistory[📚 Conversation History]
      SessionMgmt --> ProjectContext[📁 Project Context]
      SessionMgmt --> ToolState[🔧 Tool State]

      %% Storage Layer
      SessionMgmt --> LocalStorage[💿 Local Storage]

      %% React Mystery
      WebUI -.->|Possible| ReactComponents[⚛️ React Components]

      %% Monitoring
      Orchestrator --> ErrorTracking[📊 Sentry Error Tracking]

      %% Response Processing
      AIProvider --> ResponseProcessor[📤 Response Processor]
      ResponseProcessor --> ToolExecution[🔄 Tool Execution Loop]
      ResponseProcessor --> UserOutput[📺 Terminal Output]

      %% Tool Execution Loop
      ToolExecution --> ToolSystem
      ToolExecution --> StatusUpdate[📊 Status Updates]

      %% Styling
      classDef userLayer fill:#e1f5fe
      classDef coreEngine fill:#f3e5f5
      classDef toolLayer fill:#e8f5e8
      classDef aiProvider fill:#fff3e0
      classDef security fill:#ffebee
      classDef storage fill:#f1f8e9
      classDef mystery fill:#fafafa,stroke-dasharray: 5 5

      class User,CLI,WebUI userLayer
      class Orchestrator,PromptEngine,DefaultMode,AgentMode,PlanMode coreEngine
      class ToolSystem,ReadTool,WriteTool,EditTool,BashTool,LSTools,TaskTool,TodoTools,GitTools,WebTools,NotebookTools toolLayer
      class AIProvider,AnthropicAPI,BedrockAPI,VertexAPI aiProvider
      class SecurityLayer,PermissionSystem,PathValidation,SafetyPolicies security
      class SessionMgmt,LocalStorage,ConversationHistory,ProjectContext storage
      class ReactComponents mystery