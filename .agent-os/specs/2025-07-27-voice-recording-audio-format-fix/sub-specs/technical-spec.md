# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-07-27-voice-recording-audio-format-fix/spec.md

> Created: 2025-07-27
> Version: 1.0.0

## Technical Requirements

- Update the audio format validation to accept 'webm' format in the backend transcribe endpoint
- Modify the frontend audio manager to properly handle webm format for transcription
- Ensure the audio buffer validation includes webm signature checking
- Update the format enum in the tRPC input schema to include 'webm'
- Maintain backward compatibility with existing supported formats (wav, mp3, ogg, m4a)
- Add proper error handling for webm format processing

## Approach Options

**Option A:** Client-side conversion from webm to supported format
- Pros: No backend changes needed, maintains current API contract
- Cons: Performance overhead on client, increased complexity, potential quality loss

**Option B:** Update backend to accept webm format (Selected)
- Pros: Direct support for browser's native recording format, better performance, simpler implementation
- Cons: Requires backend changes, needs webm signature validation

**Rationale:** Option B is selected because webm is the native format for browser recording, avoiding unnecessary conversion overhead and maintaining audio quality. The backend changes are minimal and straightforward.

## Implementation Details

### Backend Changes

1. **Update tRPC transcribe endpoint** (`backend/trpc/routes/voice/transcribe.ts`):
   - Add 'webm' to the format enum in the input schema
   - Default format should remain 'wav' for backward compatibility

2. **Update voice service validation** (`backend/services/voice-service.ts`):
   - Add webm signature to the `validateAudioFormat` method
   - WebM signature: `[0x1A, 0x45, 0xDF, 0xA3]` (EBML header)

3. **Update Deepgram API call**:
   - Ensure Content-Type header is set correctly based on the format
   - Deepgram supports webm format natively

### Frontend Changes

1. **Update audio manager** (`services/audio-manager.ts`):
   - Ensure the format is properly passed when sending to backend
   - The audio manager already records in webm format (line 104: `mimeType: 'audio/webm;codecs=opus'`)

2. **Update chat store** (`store/chat-store.ts`):
   - Pass the correct format ('webm') when calling the transcribe endpoint
   - Handle the webm format in the transcription request

### Error Handling

1. Add specific error messages for webm format issues
2. Log format validation failures for debugging
3. Provide user-friendly error messages when transcription fails

## External Dependencies

No new external dependencies are required. The existing Deepgram API already supports webm format.