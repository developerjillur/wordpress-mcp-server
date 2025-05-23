# WordPress MCP Server

A Model Context Protocol (MCP) server for WordPress that enables AI assistants to intelligently work with WordPress databases.

[![GitHub license](https://img.shields.io/github/license/developerjillur/wordpress-mcp-server)](https://github.com/developerjillur/wordpress-mcp-server/blob/main/LICENSE)

## Features

- 🔍 **Automatic WordPress Detection**: Auto-discovers database settings from wp-config.php
- 🔌 **Local by Flywheel Support**: Special handling for Local's MySQL socket connections
- 🛠️ **Rich WordPress API**: Tools for posts, users, options, and direct SQL queries
- 📊 **Database Schema Knowledge**: Built-in understanding of WordPress table structures
- 🚀 **Easy Deployment**: One-line installation to any WordPress project

## Quick Installation

To install this server in any WordPress project:

```bash
curl -s https://raw.githubusercontent.com/developerjillur/wordpress-mcp-server/main/global-install.sh | bash -s -- /path/to/wordpress
```

Or download and run the script:

```bash
wget https://raw.githubusercontent.com/developerjillur/wordpress-mcp-server/main/global-install.sh
chmod +x global-install.sh
./global-install.sh /path/to/wordpress
```

## Manual Installation

1. Clone this repository inside your WordPress project:
   ```bash
   cd /path/to/wordpress
   mkdir mcp-server && cd mcp-server
   git clone https://github.com/developerjillur/wordpress-mcp-server.git .
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run setup:
   ```bash
   node setup.js
   ```

## Available Tools for AI Assistants

The MCP server provides the following tools for AI assistants:

### Posts & Content
- **get_posts**: Get WordPress posts with filtering options
- **get_post_by_id**: Get a specific post by ID with metadata
- **get_posts_count**: Count posts by type and status

### Users
- **get_users**: Get WordPress users with optional role filtering

### Database Management
- **get_tables**: List all tables in the WordPress database
- **get_table_structure**: Get structure details for specific tables
- **execute_query**: Run custom SQL SELECT queries safely

### WordPress Settings & Info
- **get_options**: Retrieve WordPress options
- **get_wp_info**: Get WordPress core information (site details, active plugins, etc.)
- **server_status**: Check the server connection status

## Security

- Only SELECT queries are allowed by default
- Database credentials never leave your local system
- The server runs only in your VS Code environment

## Requirements

- WordPress 4.0+
- Node.js 16.0+
- VS Code with Model Context Protocol extension
