#!/bin/bash

# FreelancerPro Backend Development Startup Script

echo "🚀 Starting FreelancerPro Backend Development Environment"
echo "=================================================="

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "📦 Starting MongoDB..."
    # Try to start MongoDB (adjust path as needed)
    if command -v brew &> /dev/null; then
        brew services start mongodb-community
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start mongod
    else
        echo "⚠️  Please start MongoDB manually"
        echo "   You can usually do this with: sudo systemctl start mongod"
        echo "   Or with Homebrew: brew services start mongodb-community"
    fi
else
    echo "✅ MongoDB is already running"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create logs directory if it doesn't exist
if [ ! -d "logs" ]; then
    echo "📁 Creating logs directory..."
    mkdir logs
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update .env file with your configuration"
fi

echo ""
echo "🎯 Starting development server..."
echo "📊 API will be available at: http://localhost:5000"
echo "📚 Health check: http://localhost:5000/health"
echo "🔗 API Base URL: http://localhost:5000/api/v1"
echo ""

# Start the development server
npm run dev
