# Task Analytics Dashboard

A full-stack web application for uploading, processing, and analyzing task data from CSV files.

## Features

### Backend (Node.js/Express)
- CSV file upload with validation
- Data processing with custom business metrics
- RESTful APIs for data retrieval
- Error handling and data persistence

### Frontend (HTML/CSS/JS)
- CSV upload interface
- Real-time analytics dashboard
- Task table with search and filtering
- Custom metrics visualization
- Notes/remarks feature

### Custom Metrics
1. **Efficiency Score**: (Estimated Hours / Actual Hours) × 100
2. **Delay Days**: Actual completion days vs Estimated days

## Quick Start

### Prerequisites
- Node.js (v14+)
- Python 3 (for frontend server)

### Installation

1. Clone repository:
   
git clone https://github.com/YOUR_USERNAME/task-analytics-dashboard.git
cd task-analytics-dashboard

2. Install backend dependeccies
  - cd backend
  - npm install

## Running the Application

**Start backend server:

   - cd backend
   - npm run dev
   # Server runs on http://localhost:5000
   
**Start frontend:

  - cd frontend
  # Open index.html directly or use:
  - python -m http.server 3000
  # Frontend runs on http://localhost:3000


 ##  API Endpoints
GET / - API documentation

POST /api/upload - Upload CSV file

GET /api/tasks - Get all tasks

GET /api/analytics - Get analytics data

PUT /api/tasks/:id/notes - Add/update notes

 ## Project Structure

task-analytics-dashboard/
├── backend/           # Node.js server
│   ├── src/          # Source code
│   ├── uploads/      # Uploaded CSV files
│   └── processed/    # Processed JSON data
├── frontend/         # Web interface
│   └── index.html    # Main application
└── sample_tasks.csv  # Sample data

  ## Technologies Used

Backend: Node.js, Express, Multer, CSV-parser

Frontend: HTML5, CSS3, JavaScript (ES6+)

Storage: File-based JSON storage

Tools: Git, VS Code, Postman
