import React, { useState } from 'react';
import { Container, Box, Typography, AppBar, Toolbar, Button } from '@mui/material';
import FileUpload from './components/FileUpload';
import TaskTable from './components/TaskTable';
import Analytics from './components/Analytics';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="App">
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            📋 Task Analytics Dashboard
          </Typography>
          <Button color="inherit" href="#upload">
            Upload
          </Button>
          <Button color="inherit" href="#analytics">
            Analytics
          </Button>
          <Button color="inherit" href="#tasks">
            Tasks
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome to Task Analytics
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload your task data in CSV format to analyze team performance, efficiency scores, and task delays.
          </Typography>
        </Box>

        <Box id="upload" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            📤 Upload Task Data
          </Typography>
          <FileUpload onUploadSuccess={handleUploadSuccess} />
        </Box>

        <Box id="analytics" sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            📊 Real-time Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            <strong>Custom Metrics:</strong> 
            <br/>1. <strong>Efficiency Score</strong>: (Estimated Hours / Actual Hours) × 100
            <br/>2. <strong>Delay Days</strong>: Actual completion days vs Estimated days
          </Typography>
          <Analytics key={`analytics-${refreshKey}`} />
        </Box>

        <Box id="tasks">
          <Typography variant="h5" gutterBottom>
            📋 Task List
          </Typography>
          <TaskTable key={`tasks-${refreshKey}`} />
        </Box>
      </Container>
    </div>
  );
}

export default App;