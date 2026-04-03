# Workflow Project

This project consists of a backend and frontend application for managing workflows, sequences, leads, messages, and approvals.

## Project Structure

### Backend
The backend is built with Node.js and Express, providing RESTful APIs for the application.

```
backend/
├── package.json          # Dependencies and scripts
├── server.js             # Main server entry point
└── src/
    ├── controller/       # API controllers
    │   ├── DraftController.js
    │   ├── LeadController.js
    │   ├── MessageController.js
    │   └── SequencesController.js
    ├── db/
    │   ├── db.js         # Database connection
    │   └── models/       # Mongoose models
    │       ├── ApprovalsModel.js
    │       ├── DraftsModel.js
    │       ├── LeadsModel.js
    │       ├── MessagesModel.js
    │       └── SequencesModel.js
    ├── routes/           # API route definitions
    │   ├── DraftRoutes.js
    │   ├── LeadRoutes.js
    │   └── SequencesRoutes.js
    └── service/
        └── EmailService.js  # Email handling service
```

### Frontend
The frontend is built with React and Vite, providing a user interface for the workflow management.

```
frontend/
├── eslint.config.js      # ESLint configuration
├── index.html            # Main HTML file
├── package.json          # Dependencies and scripts
├── README.md             # Frontend-specific documentation
├── vite.config.js        # Vite configuration
├── public/
│   └── Form.html         # Static form file
└── src/
    ├── App.css           # Main application styles
    ├── App.jsx           # Root React component
    ├── index.css         # Global styles
    ├── main.jsx          # React entry point
    ├── assets/           # Static assets
    ├── components/       # Reusable React components
    │   └── Sidebar.jsx
    ├── context/          # React context providers
    │   └── FlowContext.jsx
    ├── pages/            # Page components
    │   ├── Approval.jsx
    │   ├── Drafts.jsx
    │   ├── Leads.jsx
    │   ├── Login.jsx
    │   ├── Messages.jsx
    │   ├── Overview.jsx
    │   └── Sequences.jsx
    └── utils/            # Utility functions
        ├── api.jsx       # API client utilities
        └── modeldata.jsx # Data modeling utilities
```