# BDD Tests for Integration System

## Feature: Viewing Available Integrations

```gherkin
Feature: Viewing Available Integrations
  As a user of the application
  I want to see all available integrations
  So that I can choose which services to connect

  Background:
    Given I am logged in as a valid user
    And the following integrations are available:
      | provider | displayName      | description                                      |
      | gmail    | Gmail           | Connect your Gmail account to send and receive emails |
      | calendar | Google Calendar | Connect your Google Calendar to manage events    |
      | slack    | Slack           | Connect your Slack workspace to send messages    |
      | notion   | Notion          | Connect your Notion workspace to create pages    |
      | github   | GitHub          | Connect your GitHub account to manage repos      |

  Scenario: User sees all available integrations
    When I navigate to the integrations page
    Then I should see 5 integration cards
    And each card should display:
      | element     | visible |
      | icon        | yes     |
      | name        | yes     |
      | description | yes     |
      | status      | yes     |
      | action      | yes     |

  Scenario: User sees disconnected integration status
    Given I have no connected integrations
    When I navigate to the integrations page
    Then all integrations should show status "Not connected"
    And all integrations should show a "Connect" button

  Scenario: User sees connected integration status
    Given I have connected the following integrations:
      | provider | connectedAt        |
      | gmail    | 2025-01-07T10:00:00Z |
      | slack    | 2025-01-06T15:00:00Z |
    When I navigate to the integrations page
    Then the "Gmail" integration should show status "Connected"
    And the "Gmail" integration should show "Connected on Jan 7, 2025"
    And the "Gmail" integration should show a "Disconnect" button
    And the "Slack" integration should show status "Connected"
    And the "Calendar" integration should show status "Not connected"
```

## Feature: Connecting an Integration

```gherkin
Feature: Connecting an Integration
  As a user
  I want to connect my external services
  So that the app can access them on my behalf

  Background:
    Given I am logged in as a valid user
    And I am on the integrations page
    And I have not connected any integrations

  Scenario: Successfully connecting Gmail
    When I click the "Connect" button for "Gmail"
    Then I should see a loading indicator on the Gmail card
    And an OAuth popup window should open
    And the popup should navigate to Google's OAuth consent page
    
    When I approve the OAuth request in the popup
    And the popup window closes
    Then the Gmail card should show "Verifying connection..."
    And after a moment, the Gmail card should show status "Connected"
    And the "Connect" button should change to "Disconnect"
    And I should see a success toast "Gmail connected successfully"

  Scenario: User cancels OAuth connection
    When I click the "Connect" button for "Slack"
    And an OAuth popup window opens
    But I close the popup without authorizing
    Then the Slack card should return to "Not connected" status
    And the "Connect" button should be visible again
    And no error message should be shown

  Scenario: OAuth connection fails due to invalid permissions
    When I click the "Connect" button for "GitHub"
    And an OAuth popup window opens
    And I deny some required permissions
    Then the GitHub card should show an error state
    And I should see an error message "GitHub connection failed: Missing required permissions"
    And the "Connect" button should show "Retry"

  Scenario: OAuth popup is blocked by browser
    Given my browser blocks popups
    When I click the "Connect" button for "Notion"
    Then I should see an error message "Please allow popups to connect integrations"
    And the Notion card should remain in "Not connected" status
    And I should see a help link "Learn how to enable popups"

  Scenario: Network error during connection
    Given the backend API is experiencing issues
    When I click the "Connect" button for "Calendar"
    Then I should see an error message "Connection failed. Please try again."
    And the Calendar card should show an error state
    And the "Connect" button should show "Retry"
```

## Feature: OAuth Callback Handling

```gherkin
Feature: OAuth Callback Handling
  As a user who has authorized an integration
  I want the app to properly handle the OAuth callback
  So that my connection is established successfully

  Background:
    Given I am in the process of connecting an integration
    And I have authorized the OAuth request

  Scenario: Successful OAuth callback processing
    Given I authorized Gmail access with state "abc123"
    When the OAuth provider redirects to "/oauth/callback?state=abc123&code=xyz789"
    Then the app should:
      | action                          | result                    |
      | Validate the state parameter    | State matches stored state |
      | Exchange code for access token  | Token received            |
      | Store connection in database    | Connection saved          |
      | Update UI to show connected     | UI shows "Connected"      |
      | Close any open popups          | Popup closed              |

  Scenario: Invalid state parameter in callback
    Given I authorized Slack access with state "abc123"
    When the OAuth provider redirects to "/oauth/callback?state=invalid&code=xyz789"
    Then the app should show error "Invalid authorization state"
    And the connection should not be saved
    And the integration should remain disconnected

  Scenario: Expired OAuth state
    Given I started connecting GitHub 15 minutes ago
    When I finally authorize and get redirected to the callback
    Then the app should show error "Authorization expired. Please try again."
    And I should be redirected to the integrations page
    And GitHub should show as "Not connected"

  Scenario: OAuth callback with error parameter
    When the OAuth provider redirects to "/oauth/callback?error=access_denied"
    Then the app should show error "Authorization was denied"
    And no connection should be created
    And the integration should remain disconnected
```

## Feature: Disconnecting an Integration

```gherkin
Feature: Disconnecting an Integration
  As a user
  I want to disconnect integrations I no longer need
  So that the app no longer has access to those services

  Background:
    Given I am logged in as a valid user
    And I have the following connected integrations:
      | provider | connectedAt        |
      | gmail    | 2025-01-07T10:00:00Z |
      | slack    | 2025-01-06T15:00:00Z |

  Scenario: Successfully disconnecting an integration
    When I click the "Disconnect" button for "Gmail"
    Then I should see a confirmation dialog asking "Disconnect Gmail?"
    And the dialog should warn "You'll need to reconnect to use Gmail features"
    
    When I click "Confirm" in the dialog
    Then the Gmail card should show a loading state
    And after a moment, the Gmail card should show status "Not connected"
    And the "Disconnect" button should change to "Connect"
    And I should see a success toast "Gmail disconnected"

  Scenario: Canceling disconnection
    When I click the "Disconnect" button for "Slack"
    And I see the confirmation dialog
    But I click "Cancel"
    Then the dialog should close
    And Slack should remain connected
    And no changes should be made

  Scenario: Disconnection fails due to server error
    Given the backend API is experiencing issues
    When I click the "Disconnect" button for "Gmail"
    And I confirm the disconnection
    Then I should see an error message "Failed to disconnect. Please try again."
    And Gmail should remain in connected state
    And the "Disconnect" button should still be visible
```

## Feature: Integration Connection Persistence

```gherkin
Feature: Integration Connection Persistence
  As a user
  I want my integration connections to persist
  So that I don't have to reconnect every time

  Scenario: Connections persist after page refresh
    Given I have connected Gmail and Slack
    When I refresh the page
    Then Gmail should still show as "Connected"
    And Slack should still show as "Connected"
    And I should be able to use both integrations immediately

  Scenario: Connections persist across sessions
    Given I have connected Calendar yesterday
    When I log out and log back in today
    Then Calendar should show as "Connected"
    And the connection date should show "Connected yesterday"

  Scenario: Expired connections are detected
    Given I connected GitHub 6 months ago
    And the OAuth token has expired
    When I navigate to the integrations page
    Then GitHub should show as "Connection expired"
    And the action button should show "Reconnect"
    And I should see a warning "GitHub access has expired. Please reconnect."

  Scenario: Server validates connection status
    Given I have a Gmail connection in my local storage
    But the server has no record of this connection
    When I navigate to the integrations page
    Then the app should query the server for connection status
    And Gmail should show as "Not connected"
    And my local storage should be updated to match
```

## Feature: Multiple User Support

```gherkin
Feature: Multiple User Support
  As a multi-user application
  I want each user to have their own integrations
  So that connections are properly isolated

  Scenario: User A's connections don't affect User B
    Given User A has connected Gmail and Slack
    And User B has connected only Calendar
    When User A logs in
    Then they should see Gmail and Slack as connected
    And they should see Calendar as not connected
    
    When User B logs in
    Then they should see Calendar as connected
    And they should see Gmail and Slack as not connected

  Scenario: Switching accounts updates integration status
    Given I am logged in as User A with Gmail connected
    When I switch to User B's account
    Then the integrations page should refresh
    And show User B's connection status
    And Gmail should show as "Not connected" for User B
```

## Feature: Error Recovery

```gherkin
Feature: Error Recovery
  As a user
  I want the app to gracefully handle errors
  So that I can still use the app when things go wrong

  Scenario: Recovering from failed integration list load
    Given the API call to list integrations fails
    When I navigate to the integrations page
    Then I should see an error message "Failed to load integrations"
    And I should see a "Retry" button
    
    When the API is working again
    And I click "Retry"
    Then the integrations should load successfully
    And the error message should disappear

  Scenario: Partial integration data
    Given the server returns incomplete data for Notion
    When I view the integrations page
    Then Notion should show with available information
    And missing fields should show defaults:
      | field       | default           |
      | icon        | default icon      |
      | description | No description    |
    And the Connect button should still work

  Scenario: OAuth window monitoring failure
    Given I'm connecting Slack
    And the popup monitoring fails
    When I complete the OAuth flow
    Then the app should fall back to polling
    And eventually detect the successful connection
    And update the UI to show Slack as connected
```

## Feature: Integration Usage

```gherkin
Feature: Integration Usage
  As a user with connected integrations
  I want to use them within the app
  So that I can leverage their functionality

  Background:
    Given I have connected Gmail

  Scenario: Using a connected integration
    When I navigate to the chat interface
    And I type "@gmail send email to john@example.com"
    Then the app should recognize the Gmail integration is available
    And execute the email sending through Gmail
    And show a success message when complete

  Scenario: Attempting to use a disconnected integration
    Given I have not connected Slack
    When I try to use a Slack feature
    Then I should see a prompt "Connect Slack to use this feature"
    And clicking the prompt should navigate to integrations page
    And highlight the Slack integration card

  Scenario: Integration becomes disconnected during use
    Given I'm using Gmail features
    When my Gmail token is revoked externally
    And I try to send another email
    Then I should see an error "Gmail connection lost"
    And be prompted to "Reconnect Gmail"
    And clicking should initiate the connection flow
```

These BDD tests comprehensively cover the expected behavior of the integration system, including:

1. **Viewing integrations** - How users see and understand integration status
2. **Connecting integrations** - The complete OAuth flow with various scenarios
3. **OAuth callback handling** - Security and error cases
4. **Disconnecting integrations** - User control over their connections
5. **Persistence** - How connections are maintained across sessions
6. **Multi-user support** - Proper isolation between users
7. **Error recovery** - Graceful handling of failures
8. **Integration usage** - How connected integrations are actually used

Each test is written to be implementation-agnostic and focuses on user-visible behavior, making them perfect for guiding development and ensuring the system works as expected from the user's perspective.