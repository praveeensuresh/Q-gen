import React from 'react'
import { Box, Typography, Paper, Button } from '@mui/material'
import { Edit, Visibility } from '@mui/icons-material'

const PreviewPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Preview Questions
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Review and edit the generated questions before exporting them.
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Typography variant="h6" color="text.secondary">
            No questions generated yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload a document to generate questions
          </Typography>
          <Box display="flex" gap={2} mt={2}>
            <Button
              variant="contained"
              startIcon={<Edit />}
              disabled
            >
              Edit Questions
            </Button>
            <Button
              variant="outlined"
              startIcon={<Visibility />}
              disabled
            >
              Preview
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}

export default PreviewPage
