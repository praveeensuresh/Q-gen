import React from 'react'
import { Box, Typography, Paper, CircularProgress, LinearProgress } from '@mui/material'

const ProcessingPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Processing Document
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Your document is being processed. This may take a few moments...
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <CircularProgress size={60} />
          <Typography variant="body2" color="text.secondary">
            Extracting text and generating questions...
          </Typography>
          <Box width="100%" mt={2}>
            <LinearProgress />
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}

export default ProcessingPage
