#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Starting deployment process...\n');

const deployTarget = process.argv[2] || 'vercel';

// Deployment configurations
const deployConfigs = {
  vercel: {
    name: 'Vercel',
    command: 'vercel --prod',
    envCheck: ['VERCEL_TOKEN'],
  },
  netlify: {
    name: 'Netlify',
    command: 'netlify deploy --prod --dir=.next',
    envCheck: ['NETLIFY_AUTH_TOKEN'],
  },
  docker: {
    name: 'Docker',
    command: 'docker build -t vitordo:latest .',
    envCheck: [],
  },
};

const config = deployConfigs[deployTarget];

if (!config) {
  console.error(`❌ Unknown deployment target: ${deployTarget}`);
  console.log('Available targets:', Object.keys(deployConfigs).join(', '));
  process.exit(1);
}

console.log(`📦 Deploying to ${config.name}...\n`);

// Check required environment variables
if (config.envCheck.length > 0) {
  console.log('🔍 Checking deployment credentials...');
  const missingVars = config.envCheck.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  console.log('✅ Credentials validated');
}

// Pre-deployment checks
console.log('\n🔍 Running pre-deployment checks...');
try {
  // Check if build exists
  if (!fs.existsSync('.next')) {
    console.log('📦 No build found, running build process...');
    execSync('node scripts/deploy/build.js', { stdio: 'inherit' });
  }
  
  // Verify build integrity
  const buildManifest = '.next/build-manifest.json';
  if (!fs.existsSync(buildManifest)) {
    throw new Error('Build manifest not found. Build may be corrupted.');
  }
  
  console.log('✅ Pre-deployment checks passed');
} catch (error) {
  console.error('❌ Pre-deployment checks failed:', error.message);
  process.exit(1);
}

// Deploy
console.log(`\n🚀 Deploying to ${config.name}...`);
try {
  execSync(config.command, { stdio: 'inherit' });
  console.log(`✅ Deployment to ${config.name} completed successfully!`);
} catch (error) {
  console.error(`❌ Deployment to ${config.name} failed:`, error.message);
  process.exit(1);
}

// Post-deployment tasks
console.log('\n📋 Running post-deployment tasks...');
try {
  // Log deployment info
  const deploymentInfo = {
    target: deployTarget,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  };
  
  console.log('📊 Deployment Info:', JSON.stringify(deploymentInfo, null, 2));
  
  // Optional: Send deployment notification
  if (process.env.WEBHOOK_URL) {
    console.log('📢 Sending deployment notification...');
    // Implementation would depend on your notification system
  }
  
  console.log('✅ Post-deployment tasks completed');
} catch (error) {
  console.warn('⚠️  Post-deployment tasks failed:', error.message);
}

console.log('\n🎉 Deployment process completed successfully!');