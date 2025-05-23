# WordPress Developer MCP Server - Smart Database Access

This MCP (Model Context Protocol) server is designed specifically for WordPress developers who work with Local by Flywheel or other WordPress environments. It provides intelligent access to WordPress databases through the Model Context Protocol.

## What This Does

The WordPress Developer MCP Server enables AI assistants like GitHub Copilot to:

1. **Automatically connect** to WordPress databases in any project
2. **Understand WordPress database schema** and relationships
3. **Execute intelligent queries** against your database
4. **Work across different WordPress installations** without manual configuration
5. **Support Local by Flywheel's unique socket configuration**

## Features

- 🔍 **Auto-Detection**: Automatically finds database settings from wp-config.php
- 🔌 **Local By Flywheel Support**: Special handling for Local's MySQL socket connections
- 🛠️ **Rich WordPress API**: Tools for working with posts, users, options, and more
- 📊 **Database Schema Awareness**: Built-in knowledge of WordPress table structures
- 🚀 **Easy Deployment**: Simple script to deploy to any WordPress project

## Installation

### From This Project to New Projects

Use the included deployment script to install the MCP server to any WordPress project:

```bash
cd /path/to/this/mcp-server
./deploy.sh /path/to/wordpress/project
```

### Manual Installation in a New Project

1. Create a `mcp-server` directory in your WordPress root
2. Copy the following files:
   - `wp-config-reader.js`
   - `wp-schema.js`
   - `enhanced-wp-mcp.js`
   - `setup.js`
3. Run `npm init -y` to create a package.json
4. Install dependencies: `npm install @modelcontextprotocol/sdk mysql2 dotenv`
5. Run the setup script: `node setup.js`

## Using with VS Code

1. Open your WordPress project in VS Code
2. Make sure you have the Model Context Protocol extension installed
3. Open the command palette and select "MCP: Select Server"
4. Choose "wordpress-db" from the list
5. Now the AI assistant can access and understand your WordPress database

## Available Tools

The MCP server provides these tools for AI assistants to work with your WordPress database:

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

## For Local by Flywheel Users

This MCP server is specifically designed to handle Local by Flywheel's unique database connection setup. It automatically:

1. Detects the MySQL socket path used by Local
2. Sets up the proper connection parameters
3. Bypasses connection issues that standard MySQL connections might have

## Security Notes

- Only SELECT queries are allowed by default
- The server runs locally within your VS Code environment
- Database credentials never leave your system

## Creating a Custom MCP Server For Each Project

For maximum efficiency, create a copy of this MCP server for each WordPress project you work on:

1. After setting up a new WordPress site with Local by Flywheel
2. Run: `./deploy.sh /path/to/new/wordpress/site`
3. Open the new project in VS Code and select the MCP server

## Troubleshooting

If you encounter issues:

1. **Connection problems**: Check that Local by Flywheel is running
2. **Socket errors**: The MySQL socket path might be different, check your Local configuration
3. **Permission denied**: Make sure your user has access to the socket file
