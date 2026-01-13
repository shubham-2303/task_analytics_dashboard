import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import {
  CheckCircle,
  PendingActions,
  AccessTime,
  TrendingUp,
  TrendingDown
} from '@mui/icons-material';

interface AnalyticsData {
  totalTasks: number;
  byStatus: {
    todo: number;
    inProgress: number;
    completed: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
  avgEfficiencyScore: number;
  avgDelayDays: number;
  topPerformers: Array<{
    name: string;
    completed: number;
    avgEfficiency: number;
    completionRate: number;
  }>;
  categoryDistribution: Array<{
    name: string;
    count: number;
  }>;
}

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/analytics');
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Typography>Loading analytics...</Typography>;
  }

  if (!analytics) {
    return <Typography>No analytics data available</Typography>;
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        📊 Task Analytics Dashboard
      </Typography>

      {/* Metrics Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CheckCircle color="success" sx={{ mr: 1 }} />
                <Typography color="textSecondary">Completed Tasks</Typography>
              </Box>
              <Typography variant="h4">{analytics.byStatus.completed}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PendingActions color="warning" sx={{ mr: 1 }} />
                <Typography color="textSecondary">In Progress</Typography>
              </Box>
              <Typography variant="h4">{analytics.byStatus.inProgress}</Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AccessTime color="info" sx={{ mr: 1 }} />
                <Typography color="textSecondary">Avg Efficiency</Typography>
              </Box>
              <Typography variant="h4">
                {analytics.avgEfficiencyScore.toFixed(1)}%
                {analytics.avgEfficiencyScore > 100 ? (
                  <TrendingUp color="success" sx={{ ml: 1 }} />
                ) : (
                  <TrendingDown color="error" sx={{ ml: 1 }} />
                )}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUp color="action" sx={{ mr: 1 }} />
                <Typography color="textSecondary">Avg Delay Days</Typography>
              </Box>
              <Typography variant="h4">{analytics.avgDelayDays.toFixed(1)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Performers Table */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🏆 Top Performers
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Assignee</TableCell>
                      <TableCell align="right">Completed</TableCell>
                      <TableCell align="right">Efficiency</TableCell>
                      <TableCell align="right">Completion Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.topPerformers.map((performer, index) => (
                      <TableRow key={index}>
                        <TableCell>{performer.name}</TableCell>
                        <TableCell align="right">{performer.completed}</TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${performer.avgEfficiency.toFixed(1)}%`}
                            color={performer.avgEfficiency > 100 ? "success" : "default"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {performer.completionRate.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📈 Category Distribution
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Task Count</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.categoryDistribution.map((category, index) => (
                      <TableRow key={index}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell align="right">{category.count}</TableCell>
                        <TableCell align="right">
                          {((category.count / analytics.totalTasks) * 100).toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;