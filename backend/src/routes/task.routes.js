const express = require('express');
const router = express.Router();
const upload = require('../utils/fileUpload');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// In-memory storage
let tasksDatabase = [];
let analyticsData = null;

// Ensure processed directory exists
const processedDir = path.join(__dirname, '../../processed');
if (!fs.existsSync(processedDir)) {
    fs.mkdirSync(processedDir, { recursive: true });
}

// Upload CSV file
router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        console.log('📤 File received:', req.file);
        
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
                    console.log('✅ CSV parsing complete. Total rows:', tasks.length);
                    
                    // Process tasks with custom metrics
                    const processedTasks = tasks.map((task, index) => {
                        const estimatedHours = parseFloat(task.estimatedHours) || 0;
                        const actualHours = parseFloat(task.actualHours) || 0;
                        
                        // CUSTOM METRIC 1: Efficiency Score
                        const efficiencyScore = estimatedHours > 0 && actualHours > 0
                            ? Math.round((estimatedHours / actualHours) * 100) 
                            : 0;
                        
                        // CUSTOM METRIC 2: Delay Days
                        let delayDays = 0;
                        try {
                            const startDate = new Date(task.startDate);
                            const endDate = new Date(task.endDate);
                            if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
                                const estimatedEnd = new Date(startDate);
                                estimatedEnd.setDate(startDate.getDate() + Math.ceil(estimatedHours / 8));
                                delayDays = Math.max(0, Math.ceil((endDate.getTime() - estimatedEnd.getTime()) / (1000 * 3600 * 24)));
                            }
                        } catch (e) {
                            console.log('Date parsing error:', e.message);
                        }

                        return {
                            id: Date.now() + index,
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
                            startDate: task.startDate || new Date().toISOString().split('T')[0],
                            endDate: task.endDate || new Date().toISOString().split('T')[0],
                            category: task.category || 'General',
                            notes: task.notes || '', // Notes field
                            efficiencyScore,
                            delayDays
                        };
                    });

                    console.log('🔄 Saving to database...');
                    
                    // Save to memory
                    tasksDatabase = processedTasks;
                    
                    // Save to file
                    const dataFile = path.join(__dirname, '../../processed/tasks.json');
                    fs.writeFileSync(dataFile, JSON.stringify(processedTasks, null, 2));
                    
                    // Generate analytics
                    analyticsData = generateAnalytics(processedTasks);
                    const analyticsFile = path.join(__dirname, '../../processed/analytics.json');
                    fs.writeFileSync(analyticsFile, JSON.stringify(analyticsData, null, 2));

                    console.log('✅ Database saved successfully');

                    res.status(200).json({
                        message: 'File processed successfully',
                        totalTasks: processedTasks.length,
                        tasks: processedTasks.slice(0, 5)
                    });
                } catch (error) {
                    console.error('❌ Error processing tasks:', error);
                    res.status(500).json({ error: 'Error processing tasks: ' + error.message });
                }
            })
            .on('error', (error) => {
                console.error('❌ CSV parsing error:', error);
                res.status(500).json({ error: 'CSV parsing error' });
            });

    } catch (error) {
        console.error('❌ Server error:', error);
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Get all tasks
router.get('/tasks', async (req, res) => {
    try {
        // Load from file
        const dataFile = path.join(__dirname, '../../processed/tasks.json');
        if (fs.existsSync(dataFile)) {
            const fileData = fs.readFileSync(dataFile, 'utf8');
            tasksDatabase = JSON.parse(fileData);
        }
        
        console.log('📊 Returning tasks:', tasksDatabase.length);
        res.status(200).json(tasksDatabase);
    } catch (error) {
        console.error('❌ Error fetching tasks:', error);
        res.status(200).json([]);
    }
});

// Get analytics
router.get('/analytics', async (req, res) => {
    try {
        if (!analyticsData || analyticsData.totalTasks === 0) {
            const dataFile = path.join(__dirname, '../../processed/tasks.json');
            if (fs.existsSync(dataFile)) {
                const fileData = fs.readFileSync(dataFile, 'utf8');
                tasksDatabase = JSON.parse(fileData);
                analyticsData = generateAnalytics(tasksDatabase);
            } else {
                analyticsData = {
                    totalTasks: 0,
                    byStatus: { todo: 0, inProgress: 0, completed: 0 },
                    byPriority: { low: 0, medium: 0, high: 0 },
                    avgEfficiencyScore: 0,
                    avgDelayDays: 0,
                    topPerformers: [],
                    categoryDistribution: []
                };
            }
        }
        
        console.log('📈 Generating analytics for:', analyticsData.totalTasks, 'tasks');
        res.status(200).json(analyticsData);
    } catch (error) {
        console.error('❌ Error generating analytics:', error);
        res.status(200).json({
            totalTasks: 0,
            byStatus: { todo: 0, inProgress: 0, completed: 0 },
            byPriority: { low: 0, medium: 0, high: 0 },
            avgEfficiencyScore: 0,
            avgDelayDays: 0,
            topPerformers: [],
            categoryDistribution: []
        });
    }
});

// Add/Update notes for a task
router.put('/tasks/:id/notes', async (req, res) => {
    try {
        const taskId = req.params.id;
        const { notes } = req.body;
        
        console.log(`📝 Updating notes for task ${taskId}: ${notes}`);
        
        // Find and update task
        const taskIndex = tasksDatabase.findIndex(t => t.id == taskId || t.taskId == taskId);
        if (taskIndex !== -1) {
            tasksDatabase[taskIndex].notes = notes || '';
            
            // Save to file
            const dataFile = path.join(__dirname, '../../processed/tasks.json');
            fs.writeFileSync(dataFile, JSON.stringify(tasksDatabase, null, 2));
            
            return res.json({ success: true, message: 'Notes updated successfully' });
        }
        
        res.status(404).json({ error: 'Task not found' });
    } catch (error) {
        console.error('❌ Notes update error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper: Generate analytics
function generateAnalytics(tasks) {
    if (!tasks || tasks.length === 0) {
        return {
            totalTasks: 0,
            byStatus: { todo: 0, inProgress: 0, completed: 0 },
            byPriority: { low: 0, medium: 0, high: 0 },
            avgEfficiencyScore: 0,
            avgDelayDays: 0,
            topPerformers: [],
            categoryDistribution: []
        };
    }
    
    return {
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
        avgEfficiencyScore: tasks.length > 0 ? 
            parseFloat((tasks.reduce((sum, t) => sum + (t.efficiencyScore || 0), 0) / tasks.length).toFixed(1)) : 0,
        avgDelayDays: tasks.length > 0 ? 
            parseFloat((tasks.reduce((sum, t) => sum + (t.delayDays || 0), 0) / tasks.length).toFixed(1)) : 0,
        topPerformers: getTopPerformers(tasks),
        categoryDistribution: getCategoryDistribution(tasks)
    };
}

// Helper: Get top performers
function getTopPerformers(tasks) {
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
            avgEfficiency: d.totalTasks > 0 ? parseFloat((d.avgEfficiency / d.totalTasks).toFixed(1)) : 0,
            completionRate: d.totalTasks > 0 ? parseFloat(((d.completed / d.totalTasks) * 100).toFixed(1)) : 0
        }))
        .sort((a, b) => b.avgEfficiency - a.avgEfficiency)
        .slice(0, 5);
}

// Helper: Get category distribution
function getCategoryDistribution(tasks) {
    const categoryMap = new Map();
    
    tasks.forEach(task => {
        const category = task.category || 'Uncategorized';
        categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    return Array.from(categoryMap.entries())
        .map(([name, count]) => ({ name, count }));
}

module.exports = router;