/**
 * Performance Monitor Component
 * Displays real-time performance metrics and system status
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Memory as MemoryIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
  // Warning as WarningIcon,
} from '@mui/icons-material';
import { performanceService } from '../../../services/performanceService';

interface PerformanceMonitorProps {
  showDetails?: boolean;
  refreshInterval?: number;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showDetails = false,
  refreshInterval = 5000,
}) => {
  const [performanceData, setPerformanceData] = useState(performanceService.getPerformanceReport());
  const [isExpanded, setIsExpanded] = useState(showDetails);

  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceData(performanceService.getPerformanceReport());
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  const { currentStatus, stats, recentMetrics } = performanceData;

  const getMemoryUsageColor = () => {
    const usage = (currentStatus.memoryUsage / currentStatus.maxMemory) * 100;
    if (usage > 80) return 'error';
    if (usage > 60) return 'warning';
    return 'success';
  };

  const getQueueStatusColor = () => {
    const usage = (currentStatus.activeCount / currentStatus.maxConcurrent) * 100;
    if (usage > 80) return 'error';
    if (usage > 60) return 'warning';
    return 'success';
  };

  // const formatBytes = (bytes: number) => {
  //   if (bytes === 0) return '0 B';
  //   const k = 1024;
  //   const sizes = ['B', 'KB', 'MB', 'GB'];
  //   const i = Math.floor(Math.log(bytes) / Math.log(k));
  //   return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  // };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Card>
      <CardHeader
        title="Performance Monitor"
        action={
          <Chip
            icon={<MemoryIcon />}
            label={`${currentStatus.memoryUsage.toFixed(1)}MB`}
            color={getMemoryUsageColor()}
            variant="outlined"
          />
        }
      />
      <CardContent>
        {/* System Status */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Memory Usage
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(currentStatus.memoryUsage / currentStatus.maxMemory) * 100}
                color={getMemoryUsageColor()}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                {currentStatus.memoryUsage.toFixed(1)}MB / {currentStatus.maxMemory}MB
              </Typography>
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Processing Queue
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(currentStatus.activeCount / currentStatus.maxConcurrent) * 100}
                color={getQueueStatusColor()}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary">
                {currentStatus.activeCount} / {currentStatus.maxConcurrent} active
              </Typography>
            </Box>
          </Box>

          {/* Performance Warnings */}
          {currentStatus.memoryUsage > currentStatus.maxMemory * 0.8 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                High memory usage detected. Consider optimizing or reducing concurrent operations.
              </Typography>
            </Alert>
          )}

          {currentStatus.activeCount >= currentStatus.maxConcurrent && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Processing queue is full. New operations will be queued.
              </Typography>
            </Alert>
          )}
        </Box>

        {/* Performance Statistics */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Performance Statistics
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <SpeedIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6">{formatTime(stats.averageProcessingTime)}</Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Processing Time
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <MemoryIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6">{stats.averageMemoryUsage.toFixed(1)}MB</Typography>
              <Typography variant="caption" color="text.secondary">
                Avg Memory Usage
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <AssessmentIcon color="primary" sx={{ fontSize: 32, mb: 1 }} />
              <Typography variant="h6">{stats.successRate.toFixed(1)}%</Typography>
              <Typography variant="caption" color="text.secondary">
                Success Rate
              </Typography>
            </Box>

            <Box sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="h6">{stats.totalOperations}</Typography>
              <Typography variant="caption" color="text.secondary">
                Total Operations
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Detailed Metrics */}
        <Accordion expanded={isExpanded} onChange={() => setIsExpanded(!isExpanded)}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" color="text.secondary">
              Recent Processing Metrics
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell align="right">Duration</TableCell>
                    <TableCell align="right">Memory</TableCell>
                    <TableCell align="right">Text Length</TableCell>
                    <TableCell align="right">Quality</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentMetrics.map((metric, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {metric.timestamp.toLocaleTimeString()}
                      </TableCell>
                      <TableCell align="right">
                        {formatTime(metric.processingTime)}
                      </TableCell>
                      <TableCell align="right">
                        {metric.memoryUsage.toFixed(1)}MB
                      </TableCell>
                      <TableCell align="right">
                        {metric.textLength.toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={metric.qualityScore.toFixed(2)}
                          color={metric.qualityScore > 0.7 ? 'success' : metric.qualityScore > 0.4 ? 'warning' : 'error'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default PerformanceMonitor;
