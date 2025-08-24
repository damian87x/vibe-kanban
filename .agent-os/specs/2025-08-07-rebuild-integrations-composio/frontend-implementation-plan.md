# Frontend Integration Implementation Plan

## Overview
This plan implements the clean architecture designed by the tech lead, following the BDD tests to ensure correct behavior.

## Phase 1: Core Types and Interfaces (Day 1 Morning)

### 1.1 Create Type Definitions
```typescript
// types/integrations.ts
export interface Integration {
  id: string;
  provider: IntegrationProvider;
  displayName: string;
  description: string;
  icon?: string;
  connected: boolean;
  connectionId?: string;
  connectedAt?: Date;
  lastUsedAt?: Date;
}

export interface IntegrationConnection {
  id: string;
  provider: IntegrationProvider;
  userId: string;
  status: ConnectionStatus;
  connectedAt: Date;
  lastUsedAt?: Date;
  metadata?: Record<string, any>;
}

export interface OAuthFlow {
  authUrl: string;
  state: string;
  needsAuth: boolean;
  connected: boolean;
}

export type IntegrationProvider = 'gmail' | 'calendar' | 'slack' | 'notion' | 'github';
export type ConnectionStatus = 'connected' | 'disconnected' | 'pending' | 'expired' | 'error';
```

### 1.2 Update tRPC Types
```typescript
// types/trpc.ts
// Add integration router types (safe imports only)
```

## Phase 2: Service Layer (Day 1 Afternoon)

### 2.1 Platform Service for OAuth
```typescript
// services/platform/platform.service.ts
export class PlatformService {
  async openOAuthWindow(url: string): Promise<void> {
    if (Platform.OS === 'web') {
      return this.openWebOAuth(url);
    }
    return this.openNativeOAuth(url);
  }

  private async openWebOAuth(url: string): Promise<void> {
    const popup = window.open(url, 'oauth', 'width=600,height=700');
    if (!popup) throw new Error('Popup blocked');
    return popup;
  }

  private async openNativeOAuth(url: string): Promise<void> {
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) throw new Error('Cannot open URL');
    await Linking.openURL(url);
  }
}
```

### 2.2 OAuth Service
```typescript
// services/integrations/oauth.service.ts
export class OAuthService {
  constructor(
    private platformService: PlatformService,
    private storageService: StorageService
  ) {}

  async initiateOAuth(flow: OAuthFlow): Promise<void> {
    // Store state for verification
    await this.storageService.setItem(`oauth_state_${flow.state}`, {
      state: flow.state,
      timestamp: Date.now()
    });

    if (Platform.OS === 'web') {
      return this.handleWebOAuth(flow);
    }
    return this.handleNativeOAuth(flow);
  }

  private async handleWebOAuth(flow: OAuthFlow): Promise<void> {
    const popup = await this.platformService.openOAuthWindow(flow.authUrl);
    return this.monitorWebPopup(popup, flow);
  }

  private monitorWebPopup(popup: Window, flow: OAuthFlow): Promise<void> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);

      // Listen for postMessage from callback page
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        
        if (event.data.type === 'OAUTH_CALLBACK') {
          clearInterval(checkInterval);
          window.removeEventListener('message', messageHandler);
          popup.close();
          
          if (event.data.success) {
            resolve();
          } else {
            reject(new Error(event.data.error));
          }
        }
      };

      window.addEventListener('message', messageHandler);
    });
  }
}
```

### 2.3 Integration Service Wrapper
```typescript
// services/integrations/integration.service.ts
export class IntegrationServiceWrapper {
  async listIntegrations(): Promise<Integration[]> {
    return await trpc.integrations.list.query();
  }

  async connect(provider: IntegrationProvider): Promise<OAuthFlow> {
    return await trpc.integrations.connect.mutate({ provider });
  }

  async disconnect(provider: IntegrationProvider): Promise<void> {
    await trpc.integrations.disconnect.mutate({ provider });
  }

  async checkStatus(provider: IntegrationProvider): Promise<ConnectionStatus> {
    const result = await trpc.integrations.status.query({ provider });
    return result.status;
  }
}
```

## Phase 3: State Management (Day 2 Morning)

### 3.1 Integrations Store
```typescript
// store/integrations-store.ts
interface IntegrationsState {
  integrations: Integration[];
  loading: boolean;
  error: string | null;
  connectingProvider: IntegrationProvider | null;
  
  // Actions
  setIntegrations: (integrations: Integration[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setConnectingProvider: (provider: IntegrationProvider | null) => void;
  updateIntegrationStatus: (provider: IntegrationProvider, connected: boolean) => void;
  reset: () => void;
}

export const useIntegrationsStore = create<IntegrationsState>()(
  persist(
    (set) => ({
      integrations: [],
      loading: false,
      error: null,
      connectingProvider: null,

      setIntegrations: (integrations) => set({ integrations }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setConnectingProvider: (provider) => set({ connectingProvider: provider }),
      
      updateIntegrationStatus: (provider, connected) =>
        set((state) => ({
          integrations: state.integrations.map(int =>
            int.provider === provider ? { ...int, connected } : int
          )
        })),
        
      reset: () => set({
        integrations: [],
        loading: false,
        error: null,
        connectingProvider: null
      })
    }),
    {
      name: 'integrations-storage',
      partialize: (state) => ({ integrations: state.integrations })
    }
  )
);
```

## Phase 4: UI Components (Day 2 Afternoon)

### 4.1 Integration Card Component
```typescript
// components/integrations/IntegrationCard.tsx
interface IntegrationCardProps {
  integration: Integration;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting: boolean;
}

export function IntegrationCard({
  integration,
  onConnect,
  onDisconnect,
  isConnecting
}: IntegrationCardProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleAction = () => {
    if (integration.connected) {
      setShowConfirmDialog(true);
    } else {
      onConnect();
    }
  };

  const confirmDisconnect = () => {
    setShowConfirmDialog(false);
    onDisconnect();
  };

  return (
    <Card className="p-4">
      <View className="flex-row items-center">
        <IntegrationIcon provider={integration.provider} />
        
        <View className="flex-1 ml-3">
          <Text className="font-semibold">{integration.displayName}</Text>
          <Text className="text-sm text-gray-600">{integration.description}</Text>
          
          {integration.connected && integration.connectedAt && (
            <Text className="text-xs text-green-600 mt-1">
              Connected {formatRelativeTime(integration.connectedAt)}
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={handleAction}
          disabled={isConnecting}
          className={`px-4 py-2 rounded ${
            integration.connected 
              ? 'bg-red-100' 
              : 'bg-blue-500'
          }`}
        >
          {isConnecting ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text className={integration.connected ? 'text-red-600' : 'text-white'}>
              {integration.connected ? 'Disconnect' : 'Connect'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ConfirmDialog
        visible={showConfirmDialog}
        title={`Disconnect ${integration.displayName}?`}
        message="You'll need to reconnect to use this integration's features."
        onConfirm={confirmDisconnect}
        onCancel={() => setShowConfirmDialog(false)}
      />
    </Card>
  );
}
```

### 4.2 Main Integrations Screen
```typescript
// app/integrations.tsx
export default function IntegrationsScreen() {
  const store = useIntegrationsStore();
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  
  const integrationService = useMemo(() => new IntegrationServiceWrapper(), []);
  const oauthService = useMemo(() => new OAuthService(
    new PlatformService(),
    new StorageService()
  ), []);

  // Load integrations
  const loadIntegrations = useCallback(async () => {
    try {
      store.setLoading(true);
      const integrations = await integrationService.listIntegrations();
      store.setIntegrations(integrations);
    } catch (error) {
      store.setError('Failed to load integrations');
    } finally {
      store.setLoading(false);
    }
  }, [integrationService, store]);

  useEffect(() => {
    loadIntegrations();
  }, [loadIntegrations]);

  // Handle connect
  const handleConnect = useCallback(async (provider: IntegrationProvider) => {
    try {
      store.setConnectingProvider(provider);
      store.setError(null);
      
      const flow = await integrationService.connect(provider);
      
      if (flow.needsAuth) {
        await oauthService.initiateOAuth(flow);
        // Wait a moment for the connection to complete
        setTimeout(() => {
          loadIntegrations();
        }, 2000);
      } else {
        // Already connected
        store.updateIntegrationStatus(provider, true);
      }
    } catch (error) {
      store.setError(error.message);
    } finally {
      store.setConnectingProvider(null);
    }
  }, [integrationService, oauthService, store, loadIntegrations]);

  // Handle disconnect
  const handleDisconnect = useCallback(async (provider: IntegrationProvider) => {
    try {
      store.setConnectingProvider(provider);
      await integrationService.disconnect(provider);
      store.updateIntegrationStatus(provider, false);
    } catch (error) {
      store.setError('Failed to disconnect integration');
    } finally {
      store.setConnectingProvider(null);
    }
  }, [integrationService, store]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadIntegrations();
    setRefreshing(false);
  }, [loadIntegrations]);

  if (store.loading && store.integrations.length === 0) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        <HeaderBase title="Integrations" />
        
        {store.error && (
          <ErrorBanner 
            message={store.error} 
            onDismiss={() => store.setError(null)}
          />
        )}

        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          className="flex-1 px-4"
        >
          <Text className="text-gray-600 mb-4">
            Connect your favorite services to enhance your experience
          </Text>

          {store.integrations.map(integration => (
            <IntegrationCard
              key={integration.provider}
              integration={integration}
              onConnect={() => handleConnect(integration.provider)}
              onDisconnect={() => handleDisconnect(integration.provider)}
              isConnecting={store.connectingProvider === integration.provider}
            />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
```

### 4.3 OAuth Callback Handler
```typescript
// app/oauth/callback.tsx
export default function OAuthCallbackScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const integrationService = useMemo(() => new IntegrationServiceWrapper(), []);

  useEffect(() => {
    const handleCallback = async () => {
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      
      if (error) {
        // Post message to opener if web
        if (Platform.OS === 'web' && window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_CALLBACK',
            success: false,
            error: error
          }, window.location.origin);
          window.close();
        } else {
          router.replace('/integrations?error=' + error);
        }
        return;
      }

      if (!state) {
        router.replace('/integrations?error=missing_state');
        return;
      }

      try {
        // Get provider from state storage
        const stateData = await AsyncStorage.getItem(`oauth_state_${state}`);
        if (!stateData) {
          throw new Error('Invalid state');
        }

        const { provider } = JSON.parse(stateData);
        
        // Complete the connection
        await trpc.integrations.complete.mutate({ provider, state });
        
        // Clean up state
        await AsyncStorage.removeItem(`oauth_state_${state}`);
        
        // Notify opener or redirect
        if (Platform.OS === 'web' && window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_CALLBACK',
            success: true
          }, window.location.origin);
          window.close();
        } else {
          router.replace('/integrations?success=true');
        }
      } catch (error) {
        if (Platform.OS === 'web' && window.opener) {
          window.opener.postMessage({
            type: 'OAUTH_CALLBACK',
            success: false,
            error: error.message
          }, window.location.origin);
          window.close();
        } else {
          router.replace('/integrations?error=' + encodeURIComponent(error.message));
        }
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" />
      <Text className="mt-4">Completing connection...</Text>
    </View>
  );
}
```

## Phase 5: Testing (Day 3)

### 5.1 Unit Tests
- Test each service method in isolation
- Test store actions and state updates
- Test component rendering with different props

### 5.2 Integration Tests
- Test full OAuth flow with mocked APIs
- Test error scenarios
- Test persistence across sessions

### 5.3 E2E Tests
- Implement BDD scenarios using Playwright
- Test actual OAuth flow with test accounts
- Test multi-user scenarios

## Implementation Order

1. **Day 1 Morning**: Types and interfaces
2. **Day 1 Afternoon**: Service layer (Platform, OAuth, Integration wrapper)
3. **Day 2 Morning**: State management (Zustand stores)
4. **Day 2 Afternoon**: UI Components (Card, Screen, Callback)
5. **Day 3**: Testing and bug fixes

## Key Considerations

1. **Error Handling**: Every async operation must have try-catch
2. **Loading States**: Show appropriate feedback during operations
3. **Platform Differences**: Handle web vs native OAuth differently
4. **Security**: Validate OAuth state parameter
5. **Persistence**: Store minimal data, validate with server
6. **User Feedback**: Clear messages for all states and errors