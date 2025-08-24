# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-07-29-fix-trpc-authentication-middleware/spec.md

> Created: 2025-07-29
> Version: 1.0.0

## Technical Requirements

### JWT Token Verification
- Fix JWT verification in `backend/services/auth-service.ts` to handle all token formats properly
- Add proper error handling for malformed tokens
- Validate token structure before attempting verification
- Handle token expiration gracefully with specific error codes

### Authorization Header Processing
- Update `backend/trpc/create-context.ts` to consistently extract Bearer tokens
- Add validation for authorization header format
- Handle case-insensitive header names
- Support both "Bearer" and "bearer" prefixes

### Token Expiration and Refresh
- Implement token expiration buffer (5 minutes before actual expiry)
- Add automatic refresh token rotation
- Ensure refresh tokens have longer expiration (30 days)
- Return remaining token lifetime in auth responses

### Error Response Standardization
- Create consistent error response format for auth failures
- Include specific error codes: `TOKEN_MISSING`, `TOKEN_INVALID`, `TOKEN_EXPIRED`, `USER_NOT_FOUND`
- Add helpful error messages for debugging
- Log authentication failures with appropriate context

### Integration with OAuth Flows
- Ensure JWT tokens work with OAuth callback flows
- Maintain authentication context during OAuth redirects
- Handle bypass auth mode for testing scenarios
- Support both Klavis and Composio OAuth providers

## Approach Options

**Option A: Minimal Fix**
- Fix immediate JWT verification issues
- Add basic error handling
- Pros: Quick to implement, low risk
- Cons: Doesn't address all edge cases

**Option B: Comprehensive Authentication Overhaul** (Selected)
- Complete review and fix of authentication middleware
- Add robust error handling and logging
- Implement token refresh mechanism
- Add comprehensive test coverage
- Pros: Addresses all known issues, future-proof
- Cons: More complex, requires thorough testing

**Rationale:** Option B is selected to ensure a robust authentication system that handles all edge cases and provides a better developer experience with clear error messages.

## Implementation Details

### 1. Update JWT Secret Validation
```typescript
// backend/services/auth-service.ts
constructor() {
  this.jwtSecret = process.env.JWT_SECRET;
  if (!this.jwtSecret || this.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  // Add secret validation
  this.validateJwtSecret();
}
```

### 2. Enhanced Token Verification
```typescript
// backend/services/auth-service.ts
async verifyToken(token: string): Promise<JWTPayload> {
  try {
    // Validate token format
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid token format');
    }
    
    // Verify with proper options
    const decoded = jwt.verify(token, this.jwtSecret, {
      algorithms: ['HS256'],
      ignoreExpiration: false
    }) as JWTPayload;
    
    // Additional validation
    if (!decoded.userId || !decoded.type) {
      throw new Error('Invalid token payload');
    }
    
    return decoded;
  } catch (error) {
    // Specific error handling
    if (error.name === 'TokenExpiredError') {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid token' });
    }
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Token verification failed' });
  }
}
```

### 3. Improved Authorization Middleware
```typescript
// backend/trpc/create-context.ts
export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
  // Check for bypass auth in development
  if (process.env.EXPO_PUBLIC_BYPASS_AUTH === 'true' && process.env.NODE_ENV === 'development') {
    // Use bypass user
    const bypassUser = await getOrCreateBypassUser();
    return next({ ctx: { ...ctx, user: bypassUser } });
  }
  
  // Extract authorization header (case-insensitive)
  const authHeader = Object.entries(ctx.req.headers)
    .find(([key]) => key.toLowerCase() === 'authorization')?.[1];
  
  if (!authHeader) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'Authorization header missing'
    });
  }
  
  // Validate Bearer format
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!bearerMatch) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'Invalid authorization header format. Expected: Bearer <token>'
    });
  }
  
  const token = bearerMatch[1];
  
  try {
    const jwtPayload = await authService.verifyToken(token);
    const user = await authService.getUserById(jwtPayload.userId);
    
    if (!user) {
      throw new TRPCError({ 
        code: 'UNAUTHORIZED',
        message: 'User not found'
      });
    }
    
    return next({ ctx: { ...ctx, user } });
  } catch (error) {
    // Re-throw with consistent format
    if (error instanceof TRPCError) {
      throw error;
    }
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: error.message || 'Authentication failed'
    });
  }
});
```

## External Dependencies

No new external dependencies required. Uses existing packages:
- `jsonwebtoken` - Already installed for JWT handling
- `bcryptjs` - Already installed for password hashing
- `@trpc/server` - Already installed for tRPC middleware

## Migration Steps

1. Deploy authentication fixes to staging environment
2. Run comprehensive E2E tests
3. Monitor error logs for any new authentication issues
4. Deploy to production with feature flag if needed
5. Remove old authentication code after verification

## Security Considerations

- Never log JWT tokens or secrets
- Use constant-time comparison for token validation
- Implement rate limiting for authentication attempts
- Add security headers for auth endpoints
- Regular rotation of JWT secrets (quarterly)