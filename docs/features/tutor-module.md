# Tutor Module

The Tutor Module provides comprehensive tools for educators, including live interactive classrooms and deep analytics to track student performance and skill gaps across the platform.

---

## 1. System Architecture & Component Interactions

### Live Classroom WebRTC & Socket Workflow

The Live Classroom system uses WebRTC (via `simple-peer`) for peer-to-peer audio/video streaming, backed by a Node.js Socket.IO server for signaling and real-time state synchronization (chat, whiteboard, code).

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant FE as React Frontend
    participant IO as Socket.IO Server
    participant State as In-Memory State
    participant DB as MongoDB
    actor Tutor

    Tutor->>FE: Creates Session (POST /api/classrooms/create)
    FE->>DB: Saves new ClassroomSession (generates UUID)
    
    Student->>FE: Joins Room (UUID)
    FE->>IO: emit 'join-room'
    
    IO->>State: Creates/Updates roomStates Map
    IO-->>FE: Returns 'room-participants' (Socket IDs)
    
    Note over Student,Tutor: WebRTC Signaling Phase
    Student->>IO: emit 'webrtc-offer' (to Tutor's Socket ID)
    IO->>Tutor: forward 'webrtc-offer'
    Tutor->>IO: emit 'webrtc-answer'
    IO->>Student: forward 'webrtc-answer'
    
    Student<-->>Tutor: Establish P2P Media Stream (ICE Candidates)
    
    Note over Student,Tutor: Real-Time Collaboration Phase
    Student->>IO: emit 'draw-stroke' / 'code-change'
    IO->>State: Update in-memory state
    IO->>Tutor: broadcast 'draw-stroke' / 'code-change'
    
    Tutor->>FE: Ends Session
    FE->>IO: emit 'end-session'
    IO->>State: Extract final chat & code
    IO->>DB: Persist chatHistory and codeSnapshot to ClassroomSession
    IO->>State: Clear room UUID from Map
```

---

## 2. End-to-End Workflows

### A. Live Interactive Classrooms
1. **Session Setup**: The tutor creates a session, which generates a unique UUID `roomId`. Participants join via this UUID.
2. **WebRTC Implementation**: 
   - Each peer connects using `simple-peer` with `trickle: false`.
   - Media streams are acquired via browser APIs: `getUserMedia` for camera/mic and `getDisplayMedia` for screen sharing.
   - Screen sharing is implemented by dynamically calling `replaceTrack()` on existing WebRTC connections.
3. **Collaboration Tools**:
   - **Whiteboard**: Uses HTML5 Canvas. Coordinates are normalized to a `0-1` range so strokes render correctly regardless of individual screen resolutions.
   - **Shared Code Editor**: Integrated Monaco Editor. It tracks cursor positions and detects remote changes (`isRemoteChangeRef`) to prevent infinite echo loops.
4. **State Management**:
   - During the session, chat messages, whiteboard strokes, and code are stored in an in-memory `Map` (`roomStates`) on the Node server to ensure low-latency syncing.
   - When the tutor ends the session, the final `chatHistory` and `codeSnapshot` are written to MongoDB.
5. **Security**: All Socket.IO events validate that the sender's `socket.data.roomId` matches the target room, preventing cross-room injection attacks.

### B. Tutor Analytics & Session Management
1. **Data Aggregation**: Tutors have access to a dashboard that aggregates data from the `Resume`, `LearningProgress`, and `InterviewSession` collections.
2. **Skill Gap Analysis**:
   - A MongoDB aggregation pipeline scans all student resumes, groups them by lowercase skill names, and counts occurrences.
   - **Gap Score Formula**: The backend computes a `gapScore` for each skill using `max(1, 100 - (count * 10))`.
   - Example: A skill appearing in 10 student resumes yields a gapScore of 0 (well-covered). A skill appearing in 1 student resume yields a gapScore of 90 (high gap, needs tutor attention).
3. **Dashboard Visualizations**:
   - **Treemap Heatmap**: Uses Recharts to render a colored heatmap based on the skill frequency.
   - **Horizontal Bar Chart**: Displays the top 10 skills with the highest `gapScore`, visually flagging areas where tutors should focus their curriculum.

---

## 3. Database Models

### ClassroomSession (`server/src/database/models/ClassroomSession.js`)
Tracks the metadata and final snapshots of live classrooms.
- `roomId`: UUID string, uniquely identifying the room.
- `title` & `subject`: Session metadata.
- `host`: Reference to the Tutor (`User` model).
- `status`: `active` or `ended`.
- `chatHistory`: Array of `{sender, message, timestamp}` objects, persisted only upon session end.
- `codeSnapshot`: Final string of the collaborative Monaco Editor content.

---

## 4. API Endpoints & Socket Events

### REST API Endpoints
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/classrooms/create` | Create a new session (generates UUID) | Tutor |
| `GET` | `/api/classrooms/my-sessions` | List tutor's created sessions | Tutor |
| `GET` | `/api/classrooms/active` | List all active sessions on the platform | Any |
| `GET` | `/api/classrooms/:roomId` | Get specific session details | Any |
| `PATCH`| `/api/classrooms/:roomId/end` | End session, persist state to MongoDB | Tutor |
| `GET` | `/api/analytics/skill-gaps` | Fetch skill distribution heatmap data | Tutor |
| `GET` | `/api/analytics/dashboard` | Fetch platform-wide tutor metrics | Tutor |

### Socket.IO Events
| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `join-room` | Client → Server | `{ roomId, user }` | Joins a socket room |
| `webrtc-offer` / `answer` | Bi-directional | `{ signal, callerId }` | WebRTC P2P signaling |
| `room-participants` | Server → Client | `[socketIds]` | Sent upon joining room |
| `draw-stroke` | Bi-directional | `{ roomId, strokeData }` | Sync whiteboard drawing |
| `code-change` | Bi-directional | `{ roomId, code }` | Sync Monaco Editor |
| `code-cursor` | Bi-directional | `{ roomId, position }` | Sync remote cursors |
| `chat-message` | Bi-directional | `{ roomId, message }` | Live chat broadcasting |

---

## 5. Key Files Reference

**Frontend Components (`client/src/modules/`)**
- `classrooms/pages/ClassroomRoom.jsx` - Main WebRTC & Socket orchestrator.
- `classrooms/components/Whiteboard.jsx` - HTML5 Canvas logic.
- `classrooms/components/SharedCodeEditor.jsx` - Monaco Editor integration.
- `analytics/TutorAnalyticsDashboard.jsx` - Recharts dashboards for skill gaps.

**Backend Services (`server/src/modules/`)**
- `classrooms/socket.js` - In-memory state and WebRTC signaling router.
- `classrooms/controller.js` - REST API for session creation and termination.
- `analytics/controller.js` - MongoDB aggregation pipelines for the gapScore.
