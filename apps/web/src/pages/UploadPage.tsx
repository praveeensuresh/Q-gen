import React from 'react'
import { Box, Typography, Paper } from '@mui/material'
import { FileUpload } from '@/components/features/upload/FileUpload'

const UploadPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Upload PDF Document
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload a PDF document to generate AI-powered questions. The system will
        extract text from your document and create relevant questions based on
        the content.
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
        <FileUpload />
      </Paper>
    </Box>
  )
}

export default UploadPage
