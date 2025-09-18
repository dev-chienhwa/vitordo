#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production build process...\n');

// Environment validation
console.log('🔍 Validating environment...');
try {
  // Check if required environment variables are set
  const requiredEnvVars = ['NODE_ENV'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Clean previous builds
console.log('\n🧹 Cleaning previous builds...');
try {
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }
  if (fs.existsSync('out')) {
    execSync('rm -rf out', { stdio: 'inherit' });
  }
  console.log('✅ Clean completed');
} catch (error) {
  console.error('❌ Clean failed:', error.message);
  process.exit(1);
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
try {
  execSync('npm ci --only=production', { stdio: 'inherit' });
  console.log('✅ Dependencies installed');
} catch (error) {
  console.error('❌ Dependency installation failed:', error.message);
  process.exit(1);
}

// Run tests
console.log('\n🧪 Running tests...');
try {
  execSync('npm run test -- --watchAll=false --coverage=false', { stdio: 'inherit' });
  console.log('✅ Tests passed');
} catch (error) {
  console.error('❌ Tests failed:', error.message);
  process.exit(1);
}

// Type checking
console.log('\n🔍 Type checking...');
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  console.log('✅ Type checking passed');
} catch (error) {
  console.error('❌ Type checking failed:', error.message);
  process.exit(1);
}

// Linting
console.log('\n🔍 Linting...');
try {
  execSync('npm run lint', { stdio: 'inherit' });
  console.log('✅ Linting passed');
} catch (error) {
  console.error('❌ Linting failed:', error.message);
  process.exit(1);
}

// Build application
console.log('\n🏗️  Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Generate build info
console.log('\n📋 Generating build info...');
try {
  const buildInfo = {
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'production',
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    branch: process.env.VERCEL_GIT_COMMIT_REF || 'unknown',
  };
  
  fs.writeFileSync('.next/build-info.json', JSON.stringify(buildInfo, null, 2));
  console.log('✅ Build info generated');
} catch (error) {
  console.error('❌ Build info generation failed:', error.message);
}

console.log('\n🎉 Production build completed successfully!');
console.log('📊 Build artifacts are ready in the .next directory');