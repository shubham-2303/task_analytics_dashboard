import React, { useState } from 'react';
import { Button, Box, LinearProgress, Alert } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const FileUpload: React.FC<{ onUploadSuccess: () => void }> = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        setError('');
      } else {
        setError('Please select a CSV file');
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`Successfully uploaded ${data.totalTasks} tasks`);
        setSelectedFile(null);
        onUploadSuccess();
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      setError('Server error. Make sure backend is running.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box sx={{ p: 3, border: '1px dashed #ccc', borderRadius: 2, mb: 3 }}>
      <input
        accept=".csv"
        style={{ display: 'none' }}
        id="csv-file-input"
        type="file"
        onChange={handleFileChange}
      />
      <label htmlFor="csv-file-input">
        <Button
          variant="outlined"
          component="span"
          startIcon={<CloudUploadIcon />}
          disabled={uploading}
          sx={{ mr: 2 }}
        >
          Choose CSV File
        </Button>
      </label>
      
      {selectedFile && (
        <Box sx={{ mt: 2, mb: 2 }}>
          <strong>Selected File:</strong> {selectedFile.name}
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploading}
            sx={{ ml: 2 }}
          >
            Upload
          </Button>
        </Box>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress />
          <p>Processing CSV file...</p>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ mt: 2, fontSize: '0.9rem', color: '#666' }}>
        <p>CSV should have columns: taskId, title, assignee, status, priority, estimatedHours, actualHours, startDate, endDate, category, notes</p>
      </Box>
    </Box>
  );
};

export default FileUpload;