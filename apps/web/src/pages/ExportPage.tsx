import React from 'react'
import { Box, Typography, Paper, Button } from '@mui/material'
import { Description, PictureAsPdf } from '@mui/icons-material'

const ExportPage: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Export Questions
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Export your generated questions in various formats for use in your
        teaching materials.
      </Typography>
      
      <Paper elevation={2} sx={{ p: 3, mt: 2 }}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Typography variant="h6" color="text.secondary">
            No questions available for export
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Generate questions first to export them
          </Typography>
          
          <Box display="flex" gap={2} sx={{ mt: 2, maxWidth: 400 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Description />}
              disabled
              sx={{ height: 60 }}
            >
              Word Document
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PictureAsPdf />}
              disabled
              sx={{ height: 60 }}
            >
              PDF Document
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  )
}

export default ExportPage
