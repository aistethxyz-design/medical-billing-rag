#!/bin/bash
# AISteth Deployment Script for Coolify
# Usage: ./deploy-to-coolify.sh

set -e

echo "🚀 AISteth Deployment to Coolify at aisteth.xyz"
echo "================================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REMOTE_HOST="5.161.47.228"
REMOTE_USER="kwasi"
GIT_BRANCH="main"
REPO_NAME="medical-billing-rag"

# Step 1: Check prerequisites
echo "📋 Step 1: Checking prerequisites..."

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed${NC}"
    exit 1
fi

if ! command -v ssh &> /dev/null; then
    echo -e "${RED}❌ SSH is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Step 2: Run local tests
echo "🧪 Step 2: Running local build test..."

cd frontend
if npm run build; then
    echo -e "${GREEN}✓ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    echo "Please fix build errors before deploying"
    exit 1
fi
cd ..

echo ""

# Step 3: Check git status
echo "📦 Step 3: Checking git status..."

if [[ $(git status --porcelain) ]]; then
    echo -e "${YELLOW}⚠ You have uncommitted changes${NC}"
    echo "Changed files:"
    git status --short
    echo ""
    read -p "Do you want to commit and push these changes? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter commit message: " commit_msg
        git add .
        git commit -m "$commit_msg"
        git push origin $GIT_BRANCH
        echo -e "${GREEN}✓ Changes committed and pushed${NC}"
    else
        echo -e "${YELLOW}⚠ Skipping commit${NC}"
    fi
else
    echo -e "${GREEN}✓ No uncommitted changes${NC}"
fi

echo ""

# Step 4: Check SSH connection
echo "🔐 Step 4: Checking SSH connection to server..."

if ssh -o BatchMode=yes -o ConnectTimeout=5 $REMOTE_USER@$REMOTE_HOST exit 2>&1; then
    echo -e "${GREEN}✓ SSH connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to server${NC}"
    echo "Please ensure:"
    echo "  1. SSH key is added: ssh-add ~/.ssh/id_rsa"
    echo "  2. SSH config is correct"
    echo "  3. Server is reachable"
    exit 1
fi

echo ""

# Step 5: Verify Coolify is running
echo "🐳 Step 5: Verifying Coolify status..."

COOLIFY_STATUS=$(ssh $REMOTE_USER@$REMOTE_HOST 'docker ps | grep coolify || echo "not_running"')

if [[ $COOLIFY_STATUS == "not_running" ]]; then
    echo -e "${RED}❌ Coolify is not running on the server${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Coolify is running${NC}"
fi

echo ""

# Step 6: Display deployment instructions
echo "📝 Step 6: Deployment Instructions"
echo "==================================="
echo ""
echo "Your code is ready for deployment!"
echo ""
echo "Next steps:"
echo ""
echo "1. Access Coolify Dashboard:"
echo "   ${YELLOW}https://coolify.aisteth.xyz${NC}"
echo "   Or via SSH tunnel:"
echo "   ${YELLOW}ssh -L 8000:localhost:8000 $REMOTE_USER@$REMOTE_HOST${NC}"
echo "   Then open: http://localhost:8000"
echo ""
echo "2. In Coolify, click 'Deploy' or 'Redeploy' button"
echo ""
echo "3. Monitor the build logs for any errors"
echo ""
echo "4. Once deployed, verify at:"
echo "   Frontend: ${YELLOW}https://aisteth.xyz${NC}"
echo "   API: ${YELLOW}https://aisteth.xyz/api/health${NC}"
echo ""

# Step 7: Offer to open tunnel
echo ""
read -p "Would you like to open SSH tunnel to Coolify now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${GREEN}Opening SSH tunnel...${NC}"
    echo "Access Coolify at: http://localhost:8000"
    echo "Press Ctrl+C to close tunnel"
    echo ""
    ssh -L 8000:localhost:8000 $REMOTE_USER@$REMOTE_HOST
else
    echo ""
    echo -e "${GREEN}✨ Deployment preparation complete!${NC}"
    echo ""
    echo "When ready, access Coolify and click Deploy."
    echo ""
fi

