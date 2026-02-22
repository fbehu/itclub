# Chat API Integration Documentation

## Frontend to Backend API Requests

### Base URL
- **Frontend**: Uses `authFetch()` function
- **Base URL**: `http://127.0.0.1:8000/api` (from `config/api.ts`)
- **Authentication**: JWT Bearer token from `localStorage.getItem('access_token')`

### API Endpoints Used

#### 1. Load Conversations List
```
GET /message/conversations/
Full URL: http://127.0.0.1:8000/api/message/conversations/
```
**Response Expected:**
```json
[
  {
    "id": "uuid",
    "first_name": "Ism",
    "last_name": "Familya",
    "photo": "url/to/photo",
    "role": "admin|student",
    "unread_count": 0
  }
]
```

#### 2. Load Message History
```
GET /message/messages/?user_id={user_id}
Full URL: http://127.0.0.1:8000/api/message/messages/?user_id=uuid
```
**Response Expected:**
```json
[
  {
    "id": "uuid",
    "text": "Xabar matni",
    "sender": {
      "id": "uuid",
      "first_name": "Ism",
      "last_name": "Familya",
      "photo": "url",
      "username": "username"
    },
    "is_read": false,
    "created_at": "2026-02-03T12:00:00Z",
    "file": "url/to/file",
    "file_name": "filename.pdf"
  }
]
```

#### 3. Mark Conversation as Read
```
POST /message/mark-read/
Full URL: http://127.0.0.1:8000/api/message/mark-read/
Body: { "user_id": "uuid" }
```
**Response Expected:** 200 OK

#### 4. Send Message (REST API Fallback)
```
POST /message/add/
Full URL: http://127.0.0.1:8000/api/message/add/
Body: FormData {
  "text": "Xabar matni",
  "receiver_id": "uuid",
  "file": File (optional)
}
```
**Response Expected:**
```json
{
  "id": "uuid",
  "text": "Xabar matni",
  "sender": {...},
  "created_at": "2026-02-03T12:00:00Z",
  "file": "url/to/file",
  "file_name": "filename"
}
```

### WebSocket Endpoints

#### 1. Chat Messages WebSocket
```
wss://127.0.0.1:8000/ws/chat/{user_id}/?token=JWT_TOKEN
```

**Send Message:**
```json
{
  "type": "send_message",
  "receiver_id": "uuid",
  "text": "Xabar matni"
}
```

**Receive Message:**
```json
{
  "type": "new_message",
  "sender_id": "uuid",
  "message": {
    "id": "uuid",
    "text": "Xabar matni",
    "sender": {...},
    "created_at": "2026-02-03T12:00:00Z"
  }
}
```

**Confirmation:**
```json
{
  "type": "message_sent",
  "status": "success",
  "message": {...}
}
```

#### 2. Typing Indicator WebSocket
```
wss://127.0.0.1:8000/ws/typing/{user_id}/?token=JWT_TOKEN
```

**Send Typing Status:**
```json
{
  "receiver_id": "uuid",
  "is_typing": true
}
```

**Receive Typing Status:**
```json
{
  "type": "typing_indicator",
  "sender_id": "uuid",
  "is_typing": true
}
```

## Frontend Implementation Details

### Connection Flow
1. Page loads → Load conversations via REST API
2. User selects conversation → Load message history via REST API
3. Connect to WebSocket endpoints
4. If WebSocket fails → Fallback to REST API polling (every 3 seconds)
5. If WebSocket reconnects → Stop polling

### Error Handling
- **WebSocket Connection Timeout**: 5 seconds
- **WebSocket Reconnect Attempts**: Max 3 retries with 5-second delays
- **REST API Polling**: 3-second intervals (fallback)
- **Token Expired**: Auto logout and redirect to login

## Debugging

### Browser Console Logs
```
✅ Chat WebSocket connected
❌ Chat WebSocket error
⚠️  Chat WebSocket disconnected
🔄 Reconnecting WebSocket... (attempt 1/3)
📡 Starting message polling...
📤 Sending message via WebSocket
📤 Sending message via REST API
```

### Common Issues

#### 1. "WebSocket is closed before the connection is established"
- Backend WebSocket server not running
- Check: `wss://127.0.0.1:8000/ws/chat/...`
- Fallback: Will use REST API polling automatically

#### 2. "Xabarlarni yuklashda xato" (Error loading messages)
- Backend endpoint `/message/messages/?user_id=X` not responding
- Check: URL is correct in request
- Check: User has permission to view messages
- Check: Database has messages for this user

#### 3. "Suhbat ulanmagan" (Chat not connected)
- No WebSocket connection and no REST API fallback
- Check: Network connectivity
- Check: JWT token is valid
- Check: Backend is running

#### 4. Messages not sending
- Try WebSocket first
- If WebSocket down, uses REST API
- If both fail, shows error toast
- Check: `/message/add/` endpoint exists on backend

## Testing

### Test WebSocket Connection
```javascript
// Open browser DevTools Console
const token = localStorage.getItem('access_token');
const userId = 'your-user-id';
const ws = new WebSocket(`wss://127.0.0.1:8000/ws/chat/${userId}/?token=${token}`);
ws.onopen = () => console.log('✅ Connected');
ws.onerror = (e) => console.error('❌ Error', e);
```

### Test REST API Endpoints
```bash
# Load conversations
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://127.0.0.1:8000/api/message/conversations/

# Load messages
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://127.0.0.1:8000/api/message/messages/?user_id=USER_ID"

# Send message
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -F "text=Test message" \
  -F "receiver_id=RECEIVER_ID" \
  http://127.0.0.1:8000/api/message/add/
```

## Configuration

### Frontend Config (src/config/api.ts)
```typescript
export const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const API_ENDPOINTS = {
  // ...
  GET_CONVERSATIONS: '/message/conversations/',
  MESSAGES: '/message/',
  MARK_AS_READ: '/message/mark-read/',
  // ...
};
```

### Environment Variables (.env.local)
```
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

## Performance Notes

1. **Real-time Updates**: WebSocket (ideal case)
2. **Fallback Polling**: Every 3 seconds
3. **Message History**: Loaded once per conversation
4. **Typing Indicator**: Optional, doesn't affect messaging
5. **Auto-reconnect**: Max 3 attempts, then permanent polling

## Future Improvements

- [ ] Message pagination (load older messages)
- [ ] Typing indicator timeout (3 seconds)
- [ ] Unread message badge in header
- [ ] Message search functionality
- [ ] File upload progress indicator
- [ ] Message reactions/emojis
- [ ] Group chat support
- [ ] Message encryption
