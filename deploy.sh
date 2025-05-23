#!/usr/bin/env bash
# WordPress MCP Server Deployment Script
# This script deploys the WordPress MCP Server to any WordPress installation

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display title
echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}WordPress MCP Server Deployment${NC}"
echo -e "${BLUE}================================${NC}"

# Functions
function check_requirement() {
  if ! command -v $1 &> /dev/null; then
    echo -e "${RED}❌ Required tool '$1' is not installed.${NC}"
    echo "Please install it first."
    exit 1
  fi
}

# Check requirements
echo -e "\n${YELLOW}Checking requirements...${NC}"
check_requirement "node"
check_requirement "npm"
echo -e "${GREEN}✅ All requirements met!${NC}"

# Get WordPress installation path
if [ -z "$1" ]; then
  read -p "Enter the path to your WordPress installation: " WP_PATH
else
  WP_PATH="$1"
fi

# Make sure path doesn't end with a slash
WP_PATH=${WP_PATH%/}

# Check if the provided path is a WordPress installation
if [ ! -f "$WP_PATH/wp-config.php" ]; then
  echo -e "${RED}❌ Error: wp-config.php not found at $WP_PATH${NC}"
  echo "Make sure this is a valid WordPress installation."
  exit 1
fi

echo -e "\n${YELLOW}WordPress installation found at: ${BLUE}$WP_PATH${NC}"

# Create mcp-server directory if it doesn't exist
MCP_SERVER_DIR="$WP_PATH/mcp-server"
if [ ! -d "$MCP_SERVER_DIR" ]; then
  echo -e "\n${YELLOW}Creating mcp-server directory...${NC}"
  mkdir -p "$MCP_SERVER_DIR"
else
  echo -e "\n${YELLOW}mcp-server directory already exists, will update files...${NC}"
fi

# Copy server files
echo -e "\n${YELLOW}Copying MCP server files...${NC}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Files to copy
FILES=(
  "wp-config-reader.js"
  "wp-schema.js"
  "enhanced-wp-mcp.js"
  "setup.js"
)

for file in "${FILES[@]}"; do
  cp "$SCRIPT_DIR/$file" "$MCP_SERVER_DIR/"
  echo -e "${GREEN}✅ Copied $file${NC}"
done

# Create package.json if it doesn't exist
if [ ! -f "$MCP_SERVER_DIR/package.json" ]; then
  echo -e "\n${YELLOW}Creating package.json...${NC}"
  cat > "$MCP_SERVER_DIR/package.json" << EOF
{
  "name": "wordpress-mcp-server",
  "version": "1.0.0",
  "description": "MCP Server for WordPress development",
  "type": "module",
  "main": "enhanced-wp-mcp.js",
  "scripts": {
    "start": "node enhanced-wp-mcp.js",
    "dev": "node --watch enhanced-wp-mcp.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.4.0",
    "mysql2": "^3.6.5",
    "dotenv": "^16.3.1"
  },
  "keywords": ["mcp", "wordpress", "database", "mysql"],
  "author": "Developer",
  "license": "MIT"
}
EOF
  echo -e "${GREEN}✅ Created package.json${NC}"
fi

# Create mcp-config.json if it doesn't exist
if [ ! -f "$MCP_SERVER_DIR/mcp-config.json" ]; then
  echo -e "\n${YELLOW}Creating mcp-config.json...${NC}"
  cat > "$MCP_SERVER_DIR/mcp-config.json" << EOF
{
  "mcpServers": {
    "wordpress-db": {
      "command": "node",
      "args": ["$MCP_SERVER_DIR/enhanced-wp-mcp.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF
  echo -e "${GREEN}✅ Created mcp-config.json${NC}"
fi

# Install dependencies
echo -e "\n${YELLOW}Installing dependencies...${NC}"
cd "$MCP_SERVER_DIR" && npm install
echo -e "${GREEN}✅ Dependencies installed!${NC}"

# Create VS Code settings
echo -e "\n${YELLOW}Configuring VS Code settings...${NC}"
VSCODE_DIR="$WP_PATH/.vscode"
if [ ! -d "$VSCODE_DIR" ]; then
  mkdir -p "$VSCODE_DIR"
fi

# Create or update settings.json
SETTINGS_FILE="$VSCODE_DIR/settings.json"
if [ ! -f "$SETTINGS_FILE" ]; then
  echo "{}" > "$SETTINGS_FILE"
fi

# Read current settings
SETTINGS=$(cat "$SETTINGS_FILE")

# Check if jq is installed for proper JSON manipulation
if command -v jq &> /dev/null; then
  # Use jq for proper JSON manipulation
  echo "$SETTINGS" | jq '.["modelContextProtocol.servers"] = {"wordpress-db": {"command": "node", "args": ["./mcp-server/enhanced-wp-mcp.js"], "env": {"NODE_ENV": "development"}}}' > "$SETTINGS_FILE.tmp"
  mv "$SETTINGS_FILE.tmp" "$SETTINGS_FILE"
else
  # Fallback to basic text replacement if jq is not available
  echo -e "${YELLOW}Note: Install 'jq' for better JSON handling${NC}"
  
  # Create a simple settings file
  cat > "$SETTINGS_FILE" << EOF
{
  "modelContextProtocol.servers": {
    "wordpress-db": {
      "command": "node",
      "args": ["./mcp-server/enhanced-wp-mcp.js"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
EOF
fi

echo -e "${GREEN}✅ VS Code settings configured!${NC}"

# Success message
echo -e "\n${GREEN}✅✅✅ WordPress MCP Server deployed successfully! ✅✅✅${NC}"
echo -e "\n${BLUE}To use the MCP server:${NC}"
echo -e "1. Open this WordPress project in VS Code"
echo -e "2. Make sure you have the Model Context Protocol extension installed"
echo -e "3. Use the Command Palette to select 'MCP: Select Server'"
echo -e "4. Choose 'wordpress-db'"
echo -e "\n${BLUE}The MCP server will automatically connect to your WordPress database!${NC}"
echo -e "\n${YELLOW}For manual testing, run:${NC}"
echo -e "cd $MCP_SERVER_DIR && npm start"
