# Tests Specification

This is the tests coverage details for the spec detailed in @.agent-os/specs/2025-07-27-voice-recording-audio-format-fix/spec.md

> Created: 2025-07-27
> Version: 1.0.0

## Test Coverage

### Unit Tests

**VoiceService**
- Test webm format validation with valid webm audio buffer
- Test webm format validation with invalid/corrupted webm data
- Test that all existing formats still validate correctly
- Test transcribeAudio with webm format buffer
- Test error handling for unsupported formats

**Transcribe tRPC Route**
- Test input validation accepts 'webm' in format enum
- Test successful transcription with webm format
- Test backward compatibility with existing formats
- Test proper error response for invalid audio data

### Integration Tests

**Voice Recording Flow**
- Test recording audio in browser and sending to backend
- Test transcription response is received correctly
- Test error handling when transcription fails
- Test that existing recording flows still work

### E2E Tests

**AI Assistant Voice Input**
- Navigate to assistant page
- Click microphone button to start recording
- Speak test phrase
- Stop recording and verify transcription appears
- Verify no console errors during the process
- Test error message display when permission denied

### Mocking Requirements

- **Deepgram API:** Mock successful transcription responses for webm format
- **MediaRecorder API:** Mock for unit tests to simulate webm recording
- **Audio Permissions:** Mock permission states for testing denied/granted scenarios