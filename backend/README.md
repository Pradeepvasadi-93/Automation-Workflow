# Workflow Backend API

This is the backend API for the Workflow application, built with Node.js, Express, and MongoDB. It handles sequences, leads, drafts, messages, and email automation.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=5000
   RELEVANCE_AI_URL=your_relevance_ai_endpoint
   API_KEY=your_relevance_ai_api_key
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Start the email worker (in a separate terminal):
   ```bash
   node src/workers/emailWorker.js
   ```

## API Endpoints

### Leads

#### Create Lead
- **Endpoint**: `POST /lead`
- **Description**: Creates a new lead and generates an AI draft response.
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": 1234567890,
    "query": "I need help with my project"
  }
  ```
- **Response**: Lead and draft objects.

#### Get All Leads
- **Endpoint**: `GET /lead/get`
- **Description**: Retrieves all leads.
- **Response**: Array of lead objects.

### Drafts

#### Get All Drafts
- **Endpoint**: `GET /draft/get`
- **Description**: Retrieves all drafts.
- **Response**: Array of draft objects.

#### Update Draft Status
- **Endpoint**: `POST /draft/:id`
- **Description**: Updates the status of a draft.
- **Request Body**:
  ```json
  {
    "status": "APPROVED",
    "approved_by": "admin"
  }
  ```
- **Response**: Updated draft object.

### Sequences

#### Create Sequence
- **Endpoint**: `POST /api/sequences`
- **Description**: Creates a new sequence in draft status.
- **Request Body**:
  ```json
  {
    "name": "Welcome Sequence",
    "description": "A sequence to welcome new leads",
    "steps": [
      {
        "order": 1,
        "channel": "email",
        "message": "Welcome to our service!",
        "trigger": {
          "type": "timeDelay",
          "delayMinutes": 0
        }
      }
    ]
  }
  ```
- **Response**: Created sequence object.

#### Get All Sequences
- **Endpoint**: `GET /api/sequences/get`
- **Description**: Retrieves all sequences.
- **Response**: Array of sequence objects.

#### Add Step to Sequence
- **Endpoint**: `POST /api/sequences/:id/steps`
- **Description**: Adds a new step to a sequence.
- **Request Body**:
  ```json
  {
    "channel": "email",
    "message": "Follow-up message",
    "trigger": {
      "type": "timeDelay",
      "delayMinutes": 1440
    },
    "order": 2
  }
  ```
- **Response**: Updated sequence and message log.

#### Update Step
- **Endpoint**: `PUT /api/sequences/:id/steps/:stepId`
- **Description**: Updates a specific step in a sequence.
- **Request Body**: Step object with updated fields.
- **Response**: Updated step and sequence.

#### Remove Step
- **Endpoint**: `DELETE /api/sequences/:id/steps/:stepId`
- **Description**: Removes a step from a sequence.
- **Response**: Updated sequence.

#### Start Sequence
- **Endpoint**: `POST /api/sequences/:id/start`
- **Description**: Starts a sequence for a specific lead, setting status to active.
- **Request Body**:
  ```json
  {
    "leadId": "lead_object_id"
  }
  ```
- **Response**: Started sequence and created message logs.

#### Pause Sequence
- **Endpoint**: `POST /api/sequences/:id/pause`
- **Description**: Pauses a sequence, setting status to paused and holding the queue.
- **Response**: Paused sequence.

#### Resume Sequence
- **Endpoint**: `POST /api/sequences/:id/resume`
- **Description**: Resumes a paused sequence, setting status to active and resuming the queue.
- **Response**: Resumed sequence.

#### Assign Lead to Sequence
- **Endpoint**: `POST /api/sequences/assign-lead`
- **Description**: Assigns a lead to a sequence.
- **Request Body**:
  ```json
  {
    "sequenceId": "sequence_object_id",
    "leadId": "lead_object_id"
  }
  ```
- **Response**: Updated sequence.

#### Override Message
- **Endpoint**: `POST /api/sequences/:id/override`
- **Description**: Applies a manual override to a sequence.
- **Request Body**:
  ```json
  {
    "userId": "user_object_id",
    "customMessage": "Custom message",
    "leadId": "lead_object_id"
  }
  ```
- **Response**: Updated sequence and override log.

### Approvals

#### List Approvals
- **Endpoint**: `GET /api/approvals`
- **Description**: Retrieves all pending approvals for sequence steps.
- **Response**: Array of pending step objects.

#### Approve Draft
- **Endpoint**: `POST /api/approvals/:id/approve`
- **Description**: Approves a draft step and sends the email if applicable.
- **Response**: Approved step, sequence, and message.

#### Reject Draft
- **Endpoint**: `POST /api/approvals/:id/reject`
- **Description**: Rejects a draft step.
- **Response**: Rejected step, sequence, and message.

### Messages

#### Log Message
- **Endpoint**: `POST /api/messages`
- **Description**: Logs a new message.
- **Request Body**: Message object.
- **Response**: Created message.

#### Get All Messages
- **Endpoint**: `GET /api/messages`
- **Description**: Retrieves all messages.
- **Response**: Array of message objects.

#### Get Messages by Sequence
- **Endpoint**: `GET /api/messages/sequence/:sequenceId`
- **Description**: Retrieves messages for a specific sequence.
- **Response**: Array of message objects.

#### Get Messages by Lead
- **Endpoint**: `GET /api/messages/:leadId`
- **Description**: Retrieves messages for a specific lead.
- **Response**: Array of message objects.

## Models

### Sequence
- `name`: String (required)
- `description`: String
- `leadId`: ObjectId (ref: Lead)
- `steps`: Array of Step objects
- `status`: Enum ["draft", "active", "paused", "completed"] (default: "draft")
- `assignedUsers`: Array of ObjectId (ref: Lead)
- `overrides`: Array of Override objects

### Step
- `order`: Number (required)
- `channel`: Enum ["whatsapp", "sms", "email"] (required)
- `message`: String (required)
- `aiDraft`: Boolean (default: true)
- `approved`: Boolean (default: false)
- `leadId`: ObjectId (ref: Lead)
- `deliveryStatus`: Enum ["pending", "queued", "sent", "delivered", "failed", "read"] (default: "pending")
- `sentAt`: Date
- `trigger`: Object with type, condition, delayMinutes

### Message
- `sequenceId`: ObjectId (ref: Sequence, required)
- `leadId`: ObjectId (ref: Lead)
- `stepId`: ObjectId (required)
- `stepOrder`: Number (required)
- `channel`: Enum ["email", "whatsapp", "sms"] (required)
- `content`: String (required)
- `approved`: Boolean (default: false)
- `status`: Enum ["DRAFT", "PENDING_APPROVAL", "PENDING", "SCHEDULED", "SENT", "DELIVERED", "FAILED", "READ"] (default: "DRAFT")
- `sentAt`: Date
- `deliveredAt`: Date
- `readAt`: Date
- `errorMessage`: String
- `draftStatus`: Enum ["WAITING_APPROVAL", "APPROVED", "REJECTED"]

### Lead
- `name`: String (required)
- `email`: String (required, unique)
- `phone`: Number (required)
- `query`: String (required)
- `status`: Enum ["PENDING", "COMPLETED"] (default: "PENDING")

### Draft
- `lead_id`: ObjectId (ref: Lead)
- `lead_name`: String
- `draft_response`: String
- `status`: Enum ["WAITING_APPROVAL", "APPROVED", "REJECTED"] (default: "WAITING_APPROVAL")
- `approved`: Boolean (default: false)
- `approved_by`: String

## Queue System

The application uses BullMQ for handling delayed email sequences. The email worker processes jobs from the queue.

## Email Service

Handles sending emails via an external service (configured in EmailService.js).

## Error Handling

All endpoints return appropriate HTTP status codes and error messages in JSON format.</content>
<filePath>backend\README.md