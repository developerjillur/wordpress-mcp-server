# WordPress Admin MCP Server Guide

## Overview

This MCP (Model Context Protocol) server provides AI assistants with the ability to manage WordPress admin functionality through the WordPress Command Line Interface (WP-CLI). It extends the database access capabilities with administrative operations like managing plugins, themes, users, and site settings.

## Features

- 🔌 **WP-CLI Integration**: Auto-detects and uses WP-CLI in various environments
- 🛠️ **Plugin Management**: Activate, deactivate, and list plugins
- 🎨 **Theme Management**: Change and configure themes
- 👥 **User Management**: Create, update, and manage WordPress users
- ⚙️ **Site Settings**: Modify WordPress options and settings
- 🔄 **Local by Flywheel Support**: Special handling for Local's environment

## Prerequisites

This server requires one of the following to function properly:

1. **WP-CLI installed globally** - Ideal for direct access
2. **Docker with Local by Flywheel** - Allows access via container
3. **wp-cli.phar file** - Alternative for specific installations

## Available Tools

### Core & Site Information
- **get_wp_version**: Get the WordPress version
- **get_site_info**: Get WordPress site information (URL, title, description)

### Plugin Management
- **get_plugins**: List all installed plugins
- **get_plugin_details**: Get details about a specific plugin
- **activate_plugin**: Activate a plugin
- **deactivate_plugin**: Deactivate a plugin

### Theme Management
- **get_themes**: List all installed themes
- **get_theme_details**: Get details about a specific theme
- **activate_theme**: Activate a theme

### User Management
- **get_users**: List WordPress users with optional filtering
- **create_user**: Create a new WordPress user
- **update_user**: Update an existing WordPress user's details

### Options & Settings
- **get_option**: Get a WordPress option
- **update_option**: Update a WordPress option

## Usage with AI Assistants

The WordPress Admin MCP Server enables AI assistants to:

1. **Install and configure plugins**: "Install and activate WooCommerce plugin"
2. **Manage themes**: "Switch to the Twenty Twenty-Two theme"
3. **Create and manage users**: "Create an editor user for the marketing team"
4. **Update site settings**: "Change the site title to 'My Awesome Store'"
5. **Troubleshoot**: "Check which plugins are currently active"

## Security Notes

- This server runs with the same permissions as the WordPress installation
- Only read-only operations are permitted by default
- Destructive operations require explicit confirmation
- All activities are logged for security auditing

## Troubleshooting

If you encounter issues with the WordPress Admin MCP Server:

1. **WP-CLI not found**: Install WP-CLI globally or ensure Local by Flywheel is running
2. **Permission issues**: Ensure you have sufficient permissions to execute WP-CLI commands
3. **Connection errors**: Verify your WordPress installation is accessible

## Local by Flywheel Notes

This MCP server is specifically designed to work with Local by Flywheel by:

1. Auto-detecting Local's Docker containers
2. Routing WP-CLI commands through the appropriate container
3. Maintaining proper paths and permissions
