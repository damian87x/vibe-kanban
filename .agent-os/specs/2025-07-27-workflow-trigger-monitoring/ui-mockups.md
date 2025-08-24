# Workflow Trigger Monitoring System - UI Mockups

## Overview
This document provides detailed UI mockups and component specifications for the workflow trigger monitoring system.

## 1. Workflow Detail Page - Trigger Section

### Location
Added to existing workflow detail page (`/workflow/[id]`)

### Mockup
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Workflows                                         │
│                                                             │
│ Email Automation Workflow                                   │
│ Automatically process customer inquiries                    │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Workflow Steps                                          │ │
│ │ [1] → [2] → [3] → [4]                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🔔 Workflow Trigger                          [Configure] │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Status: ● Active                                        │ │
│ │ Type: Email Monitor                                     │ │
│ │ Last Triggered: 2 hours ago                             │ │
│ │ Next Check: in 3 minutes                                │ │
│ │                                                         │ │
│ │ Trigger Conditions:                                     │ │
│ │ • From contains "@important-client.com"                 │ │
│ │ • Subject contains "urgent" OR "priority"               │ │
│ │ • Has attachments                                       │ │
│ │                                                         │ │
│ │ [View History] [Test Trigger] [Pause]                   │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [▶ Run Manually]                                            │
└─────────────────────────────────────────────────────────────┘
```

## 2. Trigger Configuration Modal

### Trigger Type Selection
```
┌─────────────────────────────────────────────────────────────┐
│ Configure Workflow Trigger                              [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Select Trigger Type:                                        │
│                                                             │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│ │   Webhook   │ │  Schedule   │ │    Email    │           │
│ │      🔗     │ │      📅     │ │      📧     │           │
│ │   Receive   │ │   Run on    │ │  Monitor    │           │
│ │  HTTP calls │ │  schedule   │ │   inbox     │           │
│ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│ ┌─────────────┐ ┌─────────────┐                           │
│ │ Integration │ │   Custom    │                           │
│ │      🔌     │ │      ⚡     │                           │
│ │ Slack, etc  │ │   Coming    │                           │
│ │   events    │ │    Soon     │                           │
│ └─────────────┘ └─────────────┘                           │
│                                                             │
│ [Cancel]                                                    │
└─────────────────────────────────────────────────────────────┘
```

### Webhook Configuration
```
┌─────────────────────────────────────────────────────────────┐
│ Configure Webhook Trigger                               [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Webhook URL (click to copy):                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ https://api.app.com/webhooks/workflow/trg_abc123   📋  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Security Settings:                                          │
│ ☑ Require signature verification                            │
│ │                                                           │
│ │ Secret Key:                                              │
│ │ ┌───────────────────────────────────────────────────┐   │
│ │ │ whsec_1234567890abcdef...                    👁 🔄 │   │
│ │ └───────────────────────────────────────────────────┘   │
│ │                                                           │
│ │ Signature Header: X-Webhook-Signature                    │
│ │                                                           │
│ ☐ Restrict to IP addresses                                 │
│                                                             │
│ Payload Filters (optional):                                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Add conditions to filter incoming webhooks...           │ │
│ │ [+ Add Condition]                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Rate Limiting:                                              │
│ Maximum [100] webhooks per [hour ▼]                        │
│                                                             │
│ [Test Webhook] [Save Configuration] [Cancel]                │
└─────────────────────────────────────────────────────────────┘
```

### Schedule Configuration
```
┌─────────────────────────────────────────────────────────────┐
│ Configure Schedule Trigger                              [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Schedule Pattern:                                           │
│                                                             │
│ ○ Simple Schedule                                           │
│   Run every [1 ▼] [day ▼] at [09:00 ▼]                    │
│                                                             │
│ ● Advanced (Cron Expression)                                │
│   ┌───────────────────────────────────────────────────┐   │
│   │ 0 9 * * MON-FRI                                   │   │
│   └───────────────────────────────────────────────────┘   │
│   "At 09:00 on every weekday"                             │
│                                                             │
│ Timezone: [America/New_York ▼]                             │
│                                                             │
│ Schedule Window:                                            │
│ ☐ Set start date: [Select date...]                         │
│ ☐ Set end date:   [Select date...]                         │
│                                                             │
│ Execution Options:                                          │
│ ☑ Skip if previous execution is still running              │
│ ☐ Retry on failure (up to [3] times)                       │
│                                                             │
│ Next 5 runs:                                                │
│ • Mon, Jul 28, 2025 at 9:00 AM                            │
│ • Tue, Jul 29, 2025 at 9:00 AM                            │
│ • Wed, Jul 30, 2025 at 9:00 AM                            │
│ • Thu, Jul 31, 2025 at 9:00 AM                            │
│ • Fri, Aug 1, 2025 at 9:00 AM                             │
│                                                             │
│ [Save Schedule] [Cancel]                                    │
└─────────────────────────────────────────────────────────────┘
```

### Email Monitor Configuration
```
┌─────────────────────────────────────────────────────────────┐
│ Configure Email Trigger                                 [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Email Account: test@example.com (Gmail)                     │
│                                                             │
│ Monitor Settings:                                           │
│ Check for new emails every [5 ▼] [minutes ▼]              │
│ Process maximum [10] emails per check                       │
│                                                             │
│ Email Filters:                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ From Addresses (comma-separated):                       │ │
│ │ ┌───────────────────────────────────────────────────┐   │ │
│ │ │ @client.com, important@partner.com               │   │ │
│ │ └───────────────────────────────────────────────────┘   │ │
│ │                                                         │ │
│ │ Subject Contains:                                       │ │
│ │ ┌───────────────────────────────────────────────────┐   │ │
│ │ │ urgent, priority, action required                │   │ │
│ │ └───────────────────────────────────────────────────┘   │ │
│ │                                                         │ │
│ │ Body Contains (any of these words):                     │ │
│ │ ┌───────────────────────────────────────────────────┐   │ │
│ │ │ invoice, payment, contract                       │   │ │
│ │ └───────────────────────────────────────────────────┘   │ │
│ │                                                         │ │
│ │ ☑ Must have attachments                                │ │
│ │ ☐ Only unread emails                                   │ │
│ │                                                         │ │
│ │ Gmail Labels:                                           │ │
│ │ [INBOX ▼] [+ Add Label]                                │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ After Processing:                                           │
│ ☑ Mark emails as read                                      │
│ ☐ Add label: [Processed ▼]                                 │
│                                                             │
│ [Test Filter] [Save Configuration] [Cancel]                 │
└─────────────────────────────────────────────────────────────┘
```

## 3. Trigger Monitoring Dashboard

### Main Dashboard View
```
┌─────────────────────────────────────────────────────────────┐
│ Workflow Triggers                                    [+ New] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Overview                                                    │
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐   │
│ │   Active  │ │  Today's  │ │ Success   │ │  Failed   │   │
│ │    15     │ │    127    │ │   95%     │ │     6     │   │
│ │ triggers  │ │executions │ │   rate    │ │executions │   │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘   │
│                                                             │
│ Active Triggers                              [List] [Grid]  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 📧 Customer Support Email Monitor              ● Active │ │
│ │ Workflow: Email to Ticket Automation                   │ │
│ │ Last triggered: 5 min ago | Next: in 10 min           │ │
│ │ Today: 45 executions (100% success)                   │ │
│ │ [View] [History] [Test] [⚙️]                          │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 🔗 Order Webhook                               ● Active │ │
│ │ Workflow: Process New Orders                           │ │
│ │ Last triggered: 1 hour ago                            │ │
│ │ Today: 23 executions (91% success)                    │ │
│ │ ⚠️ 2 failed executions                                │ │
│ │ [View] [History] [Test] [⚙️]                          │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 📅 Daily Report Schedule                     ⏸️ Paused │ │
│ │ Workflow: Generate Daily Sales Report                  │ │
│ │ Schedule: Every day at 9:00 AM EST                    │ │
│ │ Next run: Tomorrow at 9:00 AM                         │ │
│ │ This week: 6 executions (100% success)                │ │
│ │ [View] [History] [Resume] [⚙️]                        │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Load More...]                                              │
└─────────────────────────────────────────────────────────────┘
```

### Trigger Detail View
```
┌─────────────────────────────────────────────────────────────┐
│ ← Back to Triggers                                         │
│                                                             │
│ Customer Support Email Monitor                              │
│ Status: ● Active | Type: Email | Created: Jul 1, 2025      │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Performance (Last 7 Days)                              │ │
│ │                                                         │ │
│ │ Executions  ▁▃▅▇▅▃▁  Success Rate  ████████████ 98%   │ │
│ │     312              Avg Duration  ████░░░░░ 1.2s     │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Configuration                                    [Edit]     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Email Account: support@company.com                      │ │
│ │ Check Interval: Every 5 minutes                         │ │
│ │ Filters:                                                │ │
│ │ • From: *@customer.com                                  │ │
│ │ • Subject contains: support, help, issue                │ │
│ │ • Has attachments: Yes                                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Recent Executions                           [Export CSV]    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Time         Status    Duration  Trigger Data          │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 2:45 PM     ✓ Success    1.1s   From: john@client... │ │
│ │ 2:40 PM     ✓ Success    0.9s   From: mary@client... │ │
│ │ 2:35 PM     ✗ Failed     3.0s   Timeout error        │ │
│ │ 2:30 PM     ✓ Success    1.2s   From: support@...    │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ [Test Trigger] [View Logs] [Pause Trigger] [Delete]        │
└─────────────────────────────────────────────────────────────┘
```

## 4. Trigger Testing Interface

### Test Modal
```
┌─────────────────────────────────────────────────────────────┐
│ Test Trigger: Customer Support Email Monitor            [X] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Test Mode: ○ Dry Run (recommended)  ● Execute Workflow     │
│                                                             │
│ Sample Email Data:                                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ From: test@customer.com                                 │ │
│ │ To: support@company.com                                 │ │
│ │ Subject: Urgent: Need help with order #12345           │ │
│ │                                                         │ │
│ │ Body:                                                   │ │
│ │ ┌───────────────────────────────────────────────────┐   │ │
│ │ │ Hello,                                             │   │ │
│ │ │                                                    │   │ │
│ │ │ I'm having an issue with my recent order...       │   │ │
│ │ │                                                    │   │ │
│ │ └───────────────────────────────────────────────────┘   │ │
│ │                                                         │ │
│ │ ☑ Include attachment                                    │ │
│ │   Attachment: invoice.pdf (52 KB)                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Condition Check:                                            │
│ ✓ From matches: *@customer.com                             │
│ ✓ Subject contains: urgent                                 │
│ ✓ Has attachment: Yes                                      │
│                                                             │
│ Result: This email WOULD trigger the workflow ✓            │
│                                                             │
│ [Use Different Data] [Run Test] [Close]                    │
└─────────────────────────────────────────────────────────────┘
```

## 5. Execution History View

### History Table
```
┌─────────────────────────────────────────────────────────────┐
│ Execution History: Customer Support Email Monitor           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Filters: [All Statuses ▼] [Last 7 Days ▼] [Search...]     │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ □ Triggered At ↓  Status    Duration  Workflow Run      │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ □ Jul 27 2:45 PM ✓Success    1.1s    View | Logs      │ │
│ │   Email from john@client.com                           │ │
│ │   Subject: "Help with integration setup"               │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ □ Jul 27 2:40 PM ✓Success    0.9s    View | Logs      │ │
│ │   Email from mary@client.com                           │ │
│ │   Subject: "Urgent: Payment issue"                     │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ □ Jul 27 2:35 PM ✗Failed     3.0s    View | Logs      │ │
│ │   ⚠️ Workflow timeout - exceeded 3 second limit        │ │
│ │   [Retry] [View Error Details]                         │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ □ Jul 27 2:30 PM ⏭️Skipped    -      View | Logs      │ │
│ │   Rate limit exceeded (100/hour)                       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│ Showing 1-20 of 312 | [Previous] Page 1 of 16 [Next]      │
│                                                             │
│ [□ Select All] [Export Selected] [Retry Failed]            │
└─────────────────────────────────────────────────────────────┘
```

## 6. Mobile Responsive Views

### Mobile Dashboard
```
┌─────────────────────┐
│ ≡  Triggers    [+] │
├─────────────────────┤
│ Today: 127 runs    │
│ Success: 95%       │
├─────────────────────┤
│ 📧 Email Monitor   │
│ ● Active           │
│ 5 min ago          │
│ [▶] [📊] [⚙️]     │
├─────────────────────┤
│ 🔗 Order Webhook   │
│ ● Active ⚠️2       │
│ 1 hour ago         │
│ [▶] [📊] [⚙️]     │
├─────────────────────┤
│ 📅 Daily Report    │
│ ⏸️ Paused          │
│ Tomorrow 9AM       │
│ [▶] [📊] [⚙️]     │
└─────────────────────┘
```

## 7. Component Specifications

### TriggerStatusBadge
```typescript
interface TriggerStatusBadgeProps {
  status: 'active' | 'paused' | 'error' | 'disabled';
  size?: 'small' | 'medium' | 'large';
}

// Visual states:
// active: Green dot with "Active" text
// paused: Yellow pause icon with "Paused" text
// error: Red exclamation with "Error" text
// disabled: Gray circle with "Disabled" text
```

### TriggerMetricsCard
```typescript
interface TriggerMetricsCardProps {
  metrics: {
    total: number;
    success: number;
    failed: number;
    averageDuration: number;
  };
  period: 'today' | 'week' | 'month';
}

// Displays:
// - Execution count with trend
// - Success rate with progress bar
// - Average duration with comparison
// - Failed count with warning if > 0
```

### CronExpressionBuilder
```typescript
interface CronExpressionBuilderProps {
  value: string;
  onChange: (expression: string) => void;
  mode: 'simple' | 'advanced';
}

// Features:
// - Toggle between simple and advanced modes
// - Visual builder for common patterns
// - Live preview of next executions
// - Validation with error messages
```

### ConditionBuilder
```typescript
interface ConditionBuilderProps {
  conditions: TriggerCondition[];
  onChange: (conditions: TriggerCondition[]) => void;
  availableFields: Field[];
}

// Features:
// - Drag and drop condition ordering
// - AND/OR logic groups
// - Field autocomplete
// - Value type validation
// - Test with sample data
```

## 8. Interaction Patterns

### Creating a Trigger
1. User clicks "Configure Trigger" on workflow page
2. Modal opens with trigger type selection
3. User selects type and sees configuration form
4. User fills configuration and adds conditions
5. User tests configuration with sample data
6. User saves and sees confirmation
7. Trigger appears in active state on workflow page

### Testing a Trigger
1. User clicks "Test Trigger" button
2. Test modal opens with sample data
3. User can modify sample data or use defaults
4. User chooses dry run or full execution
5. System shows condition evaluation results
6. If executing, shows link to workflow run

### Monitoring Triggers
1. Dashboard shows real-time status
2. Click trigger card for detailed view
3. View execution history with filtering
4. Click failed execution for error details
5. Export data for external analysis

## 9. Accessibility Considerations

- All interactive elements have keyboard navigation
- Status indicators use both color and icons/text
- Form inputs have clear labels and help text
- Error messages are announced to screen readers
- Charts have text alternatives
- Mobile views maintain all functionality

## 10. Visual Design System

### Colors
- Active/Success: #10B981 (green)
- Warning/Paused: #F59E0B (amber)
- Error/Failed: #EF4444 (red)
- Disabled: #6B7280 (gray)
- Primary Action: #3B82F6 (blue)

### Typography
- Headers: Inter 600 (semibold)
- Body: Inter 400 (regular)
- Monospace: JetBrains Mono (for code/expressions)

### Spacing
- Card padding: 20px
- Element spacing: 16px
- Inline spacing: 8px
- Mobile padding: 16px

### Icons
- Webhook: 🔗 or Link icon
- Schedule: 📅 or Calendar icon
- Email: 📧 or Mail icon
- Integration: 🔌 or Plug icon
- Success: ✓ or Check circle
- Error: ✗ or X circle
- Warning: ⚠️ or Alert triangle

These mockups provide a comprehensive view of the trigger monitoring system UI, ensuring a consistent and intuitive user experience across all touchpoints.