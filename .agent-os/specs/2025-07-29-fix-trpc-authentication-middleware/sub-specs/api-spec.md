# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-07-29-fix-trpc-authentication-middleware/spec.md

> Created: 2025-07-29
> Version: 1.0.0

## Authentication Headers

All protected endpoints must include the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Error Response Format

All authentication errors will follow this standardized format:

```typescript
{
  code: 'UNAUTHORIZED',
  message: string,
  details?: {
    errorType: 'TOKEN_MISSING' | 'TOKEN_INVALID' | 'TOKEN_EXPIRED' | 'USER_NOT_FOUND',
    timestamp: string,
    path?: string
  }
}
```

## Updated Endpoints

### All Protected tRPC Procedures

All procedures using `protectedProcedure` will have enhanced authentication:

- Better error messages for authentication failures
- Consistent token validation
- Support for case-insensitive headers
- Proper handling of malformed tokens

### Auth Endpoints (No Changes to Interface)

#### POST /api/trpc/auth.login
- Returns: `{ user, tokens: { accessToken, refreshToken, expiresIn } }`
- Enhanced: Now includes accurate `expiresIn` value

#### POST /api/trpc/auth.register  
- Returns: `{ user, tokens: { accessToken, refreshToken, expiresIn } }`
- Enhanced: Now includes accurate `expiresIn` value

#### POST /api/trpc/auth.refresh
- Input: `{ refreshToken: string }`
- Returns: `{ accessToken, refreshToken, expiresIn }`
- Enhanced: Implements token rotation for security

## Authentication Flow

1. **Initial Authentication**
   - Client calls `auth.login` or `auth.register`
   - Receives access token (7 days) and refresh token (30 days)
   - Stores tokens securely (AsyncStorage on mobile)

2. **Making Authenticated Requests**
   - Include `Authorization: Bearer <accessToken>` header
   - Handle 401 responses by attempting token refresh
   - Retry request with new token if refresh succeeds

3. **Token Refresh**
   - Call `auth.refresh` with refresh token before access token expires
   - Receive new access and refresh tokens
   - Update stored tokens

4. **Error Handling**
   ```typescript
   try {
     const result = await trpc.protectedEndpoint.query();
   } catch (error) {
     if (error.code === 'UNAUTHORIZED') {
       if (error.details?.errorType === 'TOKEN_EXPIRED') {
         // Attempt refresh
         const newTokens = await trpc.auth.refresh.mutate({ refreshToken });
         // Retry with new token
       } else {
         // Re-authenticate user
       }
     }
   }
   ```

## Integration with OAuth

OAuth flows will maintain authentication context:

1. **Initiate OAuth**
   - Include current JWT token in state parameter
   - Validate token before starting OAuth flow

2. **OAuth Callback**
   - Extract and validate JWT from state
   - Associate OAuth tokens with authenticated user
   - Return success with maintained auth context

## Testing Authentication

### Bypass Auth Mode (Development Only)
When `EXPO_PUBLIC_BYPASS_AUTH=true`:
- Auto-creates test user: `test-bypass@example.com`
- No authorization header required
- All protected endpoints accessible
- Shows red banner in UI

### E2E Test Mode
When `NODE_ENV=test` and `TEST_MODE=true`:
- Uses test user: `test@example.com`
- Bypasses JWT verification
- Maintains consistent test user context

## Rate Limiting

Authentication endpoints have rate limits:
- Login: 5 attempts per minute per IP
- Register: 3 attempts per minute per IP  
- Refresh: 10 attempts per minute per token

Exceeded limits return:
```json
{
  "code": "TOO_MANY_REQUESTS",
  "message": "Rate limit exceeded. Try again in X seconds."
}