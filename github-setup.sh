#!/usr/bin/env bash
# GitHub Repository Setup Script

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display title
echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}GitHub Repository Setup for WordPress MCP Server${NC}"
echo -e "${BLUE}=====================================${NC}"

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
check_requirement "git"
check_requirement "gh"
echo -e "${GREEN}✅ All requirements met!${NC}"

# Prompt for GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME
if [ -z "$GITHUB_USERNAME" ]; then
  echo -e "${RED}❌ GitHub username cannot be empty${NC}"
  exit 1
fi

# Prompt for name
read -p "Enter your name (for package.json author field): " AUTHOR_NAME
if [ -z "$AUTHOR_NAME" ]; then
  AUTHOR_NAME=$GITHUB_USERNAME
fi

# Update placeholders in files
echo -e "\n${YELLOW}Updating placeholders in files...${NC}"
find . -type f -name "*.md" -exec sed -i '' "s/developerjillur/$GITHUB_USERNAME/g" {} \;
find . -type f -name "*.sh" -exec sed -i '' "s/developerjillur/$GITHUB_USERNAME/g" {} \;
sed -i '' "s/developerjillur/$GITHUB_USERNAME/g" package.json
sed -i '' "s/YOUR_NAME/$AUTHOR_NAME/g" package.json
echo -e "${GREEN}✅ Placeholders updated!${NC}"

# Rename GitHub README
echo -e "\n${YELLOW}Setting up GitHub README...${NC}"
mv GITHUB_README.md README.md.new
mv README.md README.original.md
mv README.md.new README.md
echo -e "${GREEN}✅ GitHub README set as main README!${NC}"

# Initialize git repository
echo -e "\n${YELLOW}Initializing Git repository...${NC}"
git init
git add .
git commit -m "Initial commit: WordPress MCP Server"

# Create GitHub repository
echo -e "\n${YELLOW}Creating GitHub repository...${NC}"
gh repo create wordpress-mcp-server --public --description "Model Context Protocol server for WordPress database operations" --source=. --push

echo -e "\n${GREEN}✅ GitHub repository created and code pushed!${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Visit https://github.com/$GITHUB_USERNAME/wordpress-mcp-server to see your repository"
echo "2. Make note of the installation command for your WordPress projects:"
echo -e "${BLUE}curl -s https://raw.githubusercontent.com/$GITHUB_USERNAME/wordpress-mcp-server/main/global-install.sh | bash -s -- /path/to/wordpress${NC}"
