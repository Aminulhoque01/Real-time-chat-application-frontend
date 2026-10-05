# Real-Time Chat Application- study case

**Full-Stack Real-Time Messaging Platform**

### Project Overview

Developed a full-stack real-time chat application designed for fast, secure, and scalable communication between users. The application supports one-to-one and group conversations with real-time messaging, typing indicators, message delivery/read status, reactions, replies, message editing/deletion, media sharing, voice messages, notifications, and user management.

The system was built with a modular frontend/backend architecture using **Next.js, TypeScript, Redux Toolkit, Express.js, MongoDB, Redis, Socket.IO, and Cloudinary**.

---

## Key Features

### Authentication & User Management

* Implemented JWT-based authentication for secure API access.
* Phone-number-based login and automatic user registration.
* Protected REST API routes using Bearer token authentication.
* Socket.IO authentication using the same JWT authentication flow.
* User profile management including avatar and bio.
* User search and user discovery functionality.

### One-to-One Messaging

* Real-time private messaging using Socket.IO.
* Instant message delivery without page refresh.
* Message delivery and read status.
* Typing indicators.
* Message editing and deletion.
* Reply-to-message functionality.
* Message reactions.
* Real-time unread message notifications.
* Conversation-level blocking/unblocking.

### Group Chat System

* Dynamic group conversation creation.
* Multiple users can be selected while creating a group.
* Group name management.
* Participant management.
* Add/remove group participants.
* Group admin management and promotion.
* Group-level permissions and administration.
* Group conversation deletion/management.

### Media & File Sharing

* Image, video, audio, PDF and document sharing.
* Multiple file attachments per message.
* Cloudinary-based media storage.
* Multer-based file processing on the backend.
* File previews before sending.
* Voice message recording directly from the browser.
* Audio preview before sending.
* Voice message upload through the existing messaging pipeline.

### Real-Time Communication

Implemented Socket.IO events for:

* New messages
* Message delivery
* Message read status
* Typing start/stop
* Message reactions
* Message updates
* Message deletion
* User online/offline status
* Conversation notifications
* Unread message updates
* Group conversation events

### Performance & Caching

Integrated **Redis** to improve performance and support real-time application workflows.

The application uses:

* Redis-based caching
* Socket.IO for low-latency communication
* RTK Query caching on the frontend
* Optimistic/cache updates for real-time UI changes
* API cache invalidation and synchronization

This reduces unnecessary API requests and keeps conversation/message state synchronized across the application.

---

## Frontend Architecture

The frontend was developed using **Next.js and TypeScript** with a component-based architecture.

### Technologies

* Next.js
* TypeScript
* React
* Redux Toolkit
* RTK Query
* Tailwind CSS
* Socket.IO Client
* Lucide Icons
* Emoji Picker

### Frontend Structure

The application separates responsibilities across:

* Authentication
* Conversations
* Messages
* Chat UI
* Socket communication
* Redux state management
* API services
* Reusable UI components

RTK Query is used for API communication and server-state caching, while Redux manages application-level chat state such as:

* Selected conversation
* Mobile chat/sidebar state
* Theme
* Typing users
* Unread counts
* Real-time conversation updates

---

## Backend Architecture

The backend was built with **Node.js, Express.js, TypeScript and MongoDB** following a modular REST API architecture.

Main backend modules include:

* Authentication
* Users
* Conversations
* Messages
* Socket communication
* Redis
* Cloudinary
* File uploads

The backend follows a separation-of-concerns approach using controllers, services, models and routes.

### Backend Technologies

* Node.js
* Express.js
* TypeScript
* MongoDB
* Mongoose
* Redis
* Socket.IO
* JWT
* Cloudinary
* Multer
* bcrypt

---

## Message Lifecycle

A typical message follows this flow:

**User → Next.js UI → RTK Query/API → Express Backend → MongoDB → Socket.IO → Recipient**

For media messages:

**File → Multer → Cloudinary → Message Database → Socket.IO → Recipient**

This architecture allows normal REST APIs to handle persistent data while Socket.IO handles real-time communication.

---

## Database Design

MongoDB was used for flexible conversation and message data.

Core collections include:

### User

Stores:

* Phone number
* Name
* Avatar
* Bio
* Account information

### Conversation

Stores:

* Direct/group conversation type
* Participants
* Group name
* Group administrators
* Latest message
* Conversation metadata

### Message

Stores:

* Sender
* Conversation
* Text
* Attachments
* Reply reference
* Reactions
* Read status
* Delivery status
* Edit/delete information
* Message type
* Timestamps

The data model was designed to support both direct and group conversations while keeping message history associated with conversations.

---

## Security

Implemented several security mechanisms including:

* JWT authentication
* Protected REST APIs
* Authenticated Socket.IO connections
* Password hashing with bcrypt where applicable
* User authorization for conversation operations
* Group admin authorization
* Participant validation
* Protected message operations
* File upload validation
* Conversation membership verification

---

## Responsive Chat Interface

The chat interface was designed to work across desktop and mobile devices.

Special attention was given to:

* Mobile sidebar navigation
* Dynamic viewport height
* Message list scrolling
* Composer responsiveness
* Attachment previews
* Emoji picker positioning
* Voice recording controls
* Group creation UI
* Small-screen overflow handling

The UI uses Tailwind CSS with responsive layouts to maintain usability on both desktop and low-resolution mobile devices.

---

## Technical Challenges Solved

### 1. Synchronizing REST API and WebSocket State

One of the major challenges was keeping REST API data and real-time Socket.IO events synchronized.

This was solved by combining:

**Socket.IO + Redux Toolkit + RTK Query cache updates**

instead of relying on page reloads or unnecessary API refetches.

### 2. Real-Time Conversation Updates

When a message, reaction, read status or typing event occurs, the application updates the appropriate conversation/message state immediately.

This keeps the sidebar and active chat synchronized in real time.

### 3. Large Media/File Handling

The application supports different media types while avoiding storing large binary files directly in MongoDB.

Instead:

**Multer → Cloudinary → Message metadata in MongoDB**

was used.

### 4. Voice Messaging

Implemented browser-based voice recording using the MediaRecorder API.

The recorded audio is converted into a Blob/File and processed through the same attachment pipeline used by other media messages.

### 5. Mobile Chat Responsiveness

The chat layout required careful handling of:

* `100dvh`
* flex containers
* nested scrolling
* `min-h-0`
* `min-w-0`
* mobile keyboard behavior
* composer height
* sidebar transitions

This helped prevent message-list and composer overflow issues on smaller devices.

---

## Development Outcome

The project demonstrates the implementation of a production-style real-time communication system rather than a basic CRUD chat application.

It covers:

**Authentication → REST APIs → Database → Redis → WebSockets → Real-Time State Management → Media Storage → Group Management → Notifications → Responsive UI**

The project strengthened practical experience in designing full-stack applications where multiple systems must work together consistently in real time.

---

## Technology Stack

**Frontend:**
Next.js · React · TypeScript · Redux Toolkit · RTK Query · Tailwind CSS · Socket.IO Client

**Backend:**
Node.js · Express.js · TypeScript · MongoDB · Mongoose · Redis · Socket.IO

**Authentication & Security:**
JWT · bcrypt · Authorization Middleware

**Media & Storage:**
Cloudinary · Multer · MediaRecorder API

**Development:**
Git · GitHub · Postman · Docker

---

## Key Engineering Highlights

* Built a complete full-stack real-time messaging system.
* Designed REST APIs alongside WebSocket-based real-time communication.
* Implemented JWT authentication for both HTTP and Socket.IO connections.
* Built direct and group conversation systems.
* Implemented real-time delivery/read status and typing indicators.
* Added message editing, deletion, replies and reactions.
* Integrated Cloudinary for scalable media storage.
* Implemented browser-based voice messaging.
* Used Redis for caching and real-time application workflows.
* Used RTK Query for server-state management and API caching.
* Built responsive mobile and desktop chat interfaces.
* Designed modular and maintainable frontend/backend architecture.
