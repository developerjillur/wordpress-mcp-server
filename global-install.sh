#!/usr/bin/env bash
# WordPress MCP Server Global Installation Script
# This script installs the WordPress MCP Server from GitHub to any WordPress project

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display title
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}WordPress MCP Server Global Installer${NC}"
echo -e "${BLUE}=====================================${NC}"

# Functions
function check_requirement() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}❌ Required tool '$1' is not installed.${NC}"
    echo "Please install it first."
    exit 1
  fi
}

# Check if target directory is provided
if [ -z "$1" ]; then
  echo -e "${RED}❌ Error: No target WordPress directory specified.${NC}"
  echo "Usage: $0 /path/to/wordpress/project"
  exit 1
fi

TARGET_DIR="$1"

# Check if the target is a WordPress installation
if [ ! -f "$TARGET_DIR/wp-config.php" ]; then
  echo -e "${RED}❌ Error: wp-config.php not found at $TARGET_DIR${NC}"
  echo "Make sure this is a valid WordPress installation."
  exit 1
fi

# Check requirements
echo -e "\n${YELLOW}Checking requirements...${NC}"
check_requirement "git"
check_requirement "node"
check_requirement "npm"
echo -e "${GREEN}✅ All requirements met!${NC}"

# Create mcp-server directory
echo -e "\n${YELLOW}Creating mcp-server directory...${NC}"
mkdir -p "$TARGET_DIR/mcp-server"
cd "$TARGET_DIR/mcp-server"

# Clone the repository
echo -e "\n${YELLOW}Downloading WordPress MCP Server from GitHub...${NC}"
git clone --depth=1 https://github.com/developerjillur/wordpress-mcp-server.git . || {
  echo -e "${RED}❌ Failed to clone the repository${NC}"
  exit 1
}

# Remove .git directory to disconnect from the source repository
rm -rf .git

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
npm install --production || {
  echo -e "${RED}❌ Failed to install dependencies${NC}"
  exit 1
}

# Run setup script
echo -e "\n${YELLOW}Running setup script...${NC}"
node setup.js || {
  echo -e "${RED}❌ Setup script failed${NC}"
  exit 1
}

echo -e "\n${GREEN}✅ WordPress MCP Server installed successfully!${NC}"
echo -e "${YELLOW}To use the MCP Server with VS Code:${NC}"
echo "1. Open your WordPress project in VS Code"
echo "2. Make sure you have the Model Context Protocol extension installed"
echo "3. Open the command palette and select 'MCP: Select Server'"
echo "4. Choose 'wordpress-db-enhanced' from the list"
echo -e "${GREEN}Now the AI assistant can access and understand your WordPress database!${NC}"
