import React, { Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import { Layout } from '@/components/layout/Layout'
import NotFoundPage from '@/pages/NotFoundPage'

// Lazy load pages for code splitting
const UploadPage = React.lazy(() => import('@/pages/UploadPage'))
const ProcessingPage = React.lazy(() => import('@/pages/ProcessingPage'))
const PreviewPage = React.lazy(() => import('@/pages/PreviewPage'))
const ExportPage = React.lazy(() => import('@/pages/ExportPage'))

// Loading component
const PageLoader: React.FC = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="50vh"
  >
    <CircularProgress />
  </Box>
)

export const AppRoutes: React.FC = () => {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/processing" element={<ProcessingPage />} />
          <Route path="/preview" element={<PreviewPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
