/**
 * API Test Page
 */

import React from 'react'
import { Container, Typography, Box } from '@mui/material'
import { ApiConnectionTest } from '@/components/features/upload/ApiConnectionTest'

const ApiTestPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom>
          API Connection Test
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Verify your API connections for Q-gen
        </Typography>
      </Box>
      
      <ApiConnectionTest />
    </Container>
  )
}

export default ApiTestPage
