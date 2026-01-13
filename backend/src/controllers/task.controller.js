const csv = require('csv-parser');
const fs = require('fs');
const Task = require('../models/task.model');

class TaskController {
  // Upload CSV file
  static uploadCSV = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const filePath = req.file.path;
      const tasks = [];

      // Parse CSV
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          tasks.push(row);
        })
        .on('end', async () => {
          try {
            // Process and save tasks
            const processedTasks = await TaskController.processTasks(tasks);
            
            // Save to database
            await Task.insertMany(processedTasks);

            res.status(200).json({
              message: 'File processed successfully',
              totalTasks: processedTasks.length,
              tasks: processedTasks.slice(0, 5)
            });
          } catch (error) {
            console.error('Error processing tasks:', error);
            res.status(500).json({ error: 'Error processing tasks' });
          }
        });

    } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };

  // Process and clean task data
  static processTasks = async (rawTasks) => {
    return rawTasks.map((task, index) => {
      const estimatedHours = parseFloat(task.estimatedHours) || 0;
      const actualHours = parseFloat(task.actualHours) || 0;
      
      // Custom Metric 1: Efficiency Score
      const efficiencyScore = estimatedHours > 0 
        ? Math.round((estimatedHours / actualHours) * 100) 
        : 0;
      
      // Custom Metric 2: Delay Days
      const startDate = new Date(task.startDate);
      const endDate = new Date(task.endDate);
      const estimatedEnd = new Date(startDate);
      estimatedEnd.setDate(startDate.getDate() + Math.ceil(estimatedHours / 8));
      const delayDays = Math.max(0, Math.ceil((endDate.getTime() - estimatedEnd.getTime()) / (1000 * 3600 * 24)));

      return {
        taskId: task.taskId || `TASK-${Date.now()}-${index}`,
        title: task.title || 'Untitled Task',
        assignee: task.assignee || 'Unassigned',
        status: ['todo', 'in-progress', 'completed'].includes(task.status?.toLowerCase()) 
          ? task.status.toLowerCase() 
          : 'todo',
        priority: ['low', 'medium', 'high'].includes(task.priority?.toLowerCase())
          ? task.priority.toLowerCase()
          : 'medium',
        estimatedHours,
        actualHours,
        startDate: startDate || new Date(),
        endDate: endDate || new Date(),
        category: task.category || 'General',
        notes: task.notes || '',
        efficiencyScore,
        delayDays
      };
    });
  };

  // Get all tasks
  static getTasks = async (req, res) => {
    try {
      const tasks = await Task.find();
      res.status(200).json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Error fetching tasks' });
    }
  };

  // Get analytics
  static getAnalytics = async (req, res) => {
    try {
      const tasks = await Task.find();
      
      const analytics = {
        totalTasks: tasks.length,
        byStatus: {
          todo: tasks.filter(t => t.status === 'todo').length,
          inProgress: tasks.filter(t => t.status === 'in-progress').length,
          completed: tasks.filter(t => t.status === 'completed').length
        },
        byPriority: {
          low: tasks.filter(t => t.priority === 'low').length,
          medium: tasks.filter(t => t.priority === 'medium').length,
          high: tasks.filter(t => t.priority === 'high').length
        },
        avgEfficiencyScore: tasks.reduce((sum, t) => sum + (t.efficiencyScore || 0), 0) / tasks.length,
        avgDelayDays: tasks.reduce((sum, t) => sum + (t.delayDays || 0), 0) / tasks.length,
        topPerformers: TaskController.getTopPerformers(tasks),
        categoryDistribution: TaskController.getCategoryDistribution(tasks)
      };

      res.status(200).json(analytics);
    } catch (error) {
      console.error('Error generating analytics:', error);
      res.status(500).json({ error: 'Error generating analytics' });
    }
  };

  // Helper: Get top performers
  static getTopPerformers(tasks) {
    const assigneeMap = new Map();
    
    tasks.forEach(task => {
      if (!assigneeMap.has(task.assignee)) {
        assigneeMap.set(task.assignee, { 
          name: task.assignee, 
          completed: 0, 
          avgEfficiency: 0,
          totalTasks: 0 
        });
      }
      const data = assigneeMap.get(task.assignee);
      data.totalTasks++;
      if (task.status === 'completed') data.completed++;
      data.avgEfficiency += task.efficiencyScore || 0;
    });

    return Array.from(assigneeMap.values())
      .map(d => ({
        ...d,
        avgEfficiency: d.avgEfficiency / d.totalTasks,
        completionRate: (d.completed / d.totalTasks) * 100
      }))
      .sort((a, b) => b.avgEfficiency - a.avgEfficiency)
      .slice(0, 5);
  }

  // Helper: Get category distribution
  static getCategoryDistribution(tasks) {
    const categoryMap = new Map();
    
    tasks.forEach(task => {
      const category = task.category;
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }));
  }
}

module.exports = { TaskController };