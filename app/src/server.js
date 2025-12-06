const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline styles for demo
}));

// Compression middleware
app.use(compression());

// CORS middleware
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API endpoint for pipeline status
app.get('/api/pipeline-status', (req, res) => {
    res.json({
        pipeline: 'aws-devops-pipeline',
        status: 'Ready',
        stages: [
            {
                name: 'Source',
                status: 'Configured',
                duration: 'GitHub',
                timestamp: new Date().toISOString()
            },
            {
                name: 'Build',
                status: 'Configured',
                duration: 'CodeBuild',
                timestamp: new Date().toISOString()
            },
            {
                name: 'Deploy',
                status: 'Configured',
                duration: 'ECS Fargate',
                timestamp: new Date().toISOString()
            }
        ],
        lastExecution: new Date().toISOString()
    });
});

// API endpoint for deployment metrics
app.get('/api/metrics', (req, res) => {
    res.json({
        deploymentsToday: 'Automated',
        successRate: 'HA Enabled',
        averageBuildTime: 'Optimized',
        activeContainers: 'Auto-Scaled',
        cpuUsage: 'Monitored',
        memoryUsage: 'Optimized'
    });
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
    });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 AWS DevOps App running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    process.exit(0);
});
