// AWS DevOps Dashboard - Modern Interactive JavaScript

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    initializePipeline();
    initializeSmoothScroll();
    initializeScrollAnimations();
});

// ========================================
// Pipeline Status
// ========================================
function initializePipeline() {
    fetchPipelineStatus().then(data => {
        updateStageStatus('source', data.stages[0]);
        updateStageStatus('build', data.stages[1]);
        updateStageStatus('deploy', data.stages[2]);

        const lastExecution = new Date(data.lastExecution);
        const lastExecElement = document.getElementById('lastExecution');
        if (lastExecElement) {
            lastExecElement.textContent = formatRelativeTime(lastExecution);
        }
    });
}

// Update individual stage status
function updateStageStatus(stageName, stageData) {
    const statusElement = document.getElementById(`${stageName}-status`);
    const timeElement = document.getElementById(`${stageName}-time`);
    const badgeElement = document.getElementById(`${stageName}-status-badge`);

    if (statusElement) {
        statusElement.textContent = stageData.status;
    }

    if (timeElement) {
        timeElement.textContent = stageData.duration;
    }

    if (badgeElement) {
        badgeElement.className = `stage-status ${stageData.status.toLowerCase()}`;
    }
}

// ========================================
// API Calls
// ========================================
async function fetchPipelineStatus() {
    try {
        const response = await fetch('/api/pipeline-status');
        if (!response.ok) throw new Error('Failed to fetch pipeline status');
        return await response.json();
    } catch (error) {
        console.error('Error fetching pipeline status:', error);
        return {
            pipeline: 'aws-devops-pipeline',
            status: 'Ready',
            stages: [
                { name: 'Source', status: 'Configured', duration: 'GitHub' },
                { name: 'Build', status: 'Configured', duration: 'CodeBuild' },
                { name: 'Deploy', status: 'Configured', duration: 'ECS Fargate' }
            ],
            lastExecution: new Date().toISOString()
        };
    }
}

// ========================================
// Utility Functions
// ========================================
function formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
}

// Smooth scroll for navigation links
function initializeSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);

            if (target) {
                const navHeight = 80;
                const targetPosition = target.offsetTop - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ========================================
// Scroll Animations
// ========================================
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe elements for scroll animations
    const animatedElements = document.querySelectorAll(
        '.feature-card, .overview-card, .pipeline-stage, .arch-card, .tech-item'
    );

    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

// ========================================
// Navbar Scroll Effect
// ========================================
let lastScroll = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.background = 'rgba(10, 10, 15, 0.95)';
        navbar.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.2)';
    } else {
        navbar.style.background = 'rgba(10, 10, 15, 0.8)';
        navbar.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
});

// ========================================
// Health Check Monitor
// ========================================
async function checkHealth() {
    try {
        const response = await fetch('/health');
        if (!response.ok) throw new Error('Health check failed');
        const data = await response.json();
        console.log('✓ Health check passed:', data);
        return data;
    } catch (error) {
        console.error('✗ Health check error:', error);
        return null;
    }
}

// Run health check on load
checkHealth();

// ========================================
// Console Branding
// ========================================
console.log('%c🚀 AWS DevOps CI/CD Pipeline', 'color: #667eea; font-size: 24px; font-weight: bold; padding: 10px;');
console.log('%cProduction-ready infrastructure built with AWS & Terraform', 'color: #a0aec0; font-size: 14px; padding: 5px;');
console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #667eea;');
console.log('%cGitHub: https://github.com/Amitabh-DevOps/aws-devops', 'color: #667eea; font-size: 12px;');
console.log('%cAuthor: Amitabh', 'color: #a0aec0; font-size: 12px;');
