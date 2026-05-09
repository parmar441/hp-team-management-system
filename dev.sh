#!/bin/bash
# Start both servers for development

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
nvm use 20

# Kill any existing server processes
pkill -f "tsx.*src/index" 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 1

echo "🚀 Starting Accommodation Seva..."

# Start backend
cd "$(dirname "$0")/server"
PORT=4500 node_modules/.bin/tsx src/index.ts &
SERVER_PID=$!
cd ..

# Wait for server to be ready
sleep 2
echo "✅ Backend running on http://localhost:4500"

# Start frontend
cd client
npm run dev &
CLIENT_PID=$!
cd ..

echo "✅ Frontend running on http://localhost:5173"
echo ""
echo "🌐 Open http://localhost:5173 in your browser"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap "kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT
wait
