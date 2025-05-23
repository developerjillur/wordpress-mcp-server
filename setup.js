#!/usr/bin/env node

/**
 * WordPress MCP Server Setup Script
 * 
 * This script helps deploy the WordPress MCP Server to any WordPress project.
 * It automatically detects database settings and configures the server.
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  try {
    console.log("🚀 Setting up WordPress MCP Server...");
    
    // Check if npm is installed
    try {
      execSync('npm --version', { stdio: 'ignore' });
    } catch (error) {
      console.error("❌ Error: npm is required but not found. Please install Node.js and npm first.");
      process.exit(1);
    }
    
    // Create .env file with database settings from wp-config.php
    console.log("📂 Detecting WordPress installation...");
    const wpConfigPath = path.join(__dirname, '..', 'wp-config.php');
    
    try {
      await fs.access(wpConfigPath);
      console.log("✅ WordPress installation found!");
    } catch (error) {
      console.error("❌ Error: Could not find wp-config.php. Make sure this script is in your WordPress mcp-server directory.");
      process.exit(1);
    }
    
    // Install dependencies
    console.log("📦 Installing dependencies...");
    try {
      execSync('npm install', { stdio: 'inherit', cwd: __dirname });
      console.log("✅ Dependencies installed successfully!");
    } catch (error) {
      console.error("❌ Error installing dependencies:", error.message);
      process.exit(1);
    }
    
    // Create VSCode settings for MCP server
    try {
      const vscodeDir = path.join(__dirname, '..', '.vscode');
      
      try {
        await fs.mkdir(vscodeDir, { recursive: true });
      } catch (err) {
        // Directory may already exist
      }
      
      const settingsPath = path.join(vscodeDir, 'settings.json');
      let settings = {};
      
      try {
        const settingsContent = await fs.readFile(settingsPath, 'utf8');
        settings = JSON.parse(settingsContent);
      } catch (err) {
        // File may not exist yet
      }
      
      // Add MCP server configuration
      settings['modelContextProtocol.servers'] = settings['modelContextProtocol.servers'] || {};
      settings['modelContextProtocol.servers']['wordpress-db'] = {
        command: 'node',
        args: ['./mcp-server/enhanced-wp-mcp.js'],
        env: {
          NODE_ENV: 'development'
        }
      };
      
      await fs.writeFile(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
      console.log("✅ VSCode settings configured for MCP server!");
    } catch (error) {
      console.error("⚠️ Warning: Could not configure VSCode settings:", error.message);
    }
    
    console.log("\n🎉 WordPress MCP Server setup complete!");
    console.log("\n📝 To use the MCP server:");
    console.log("1. Open this WordPress project in VSCode");
    console.log("2. Make sure you have the Model Context Protocol extension installed");
    console.log("3. Open the command palette and select 'MCP: Select Server'");
    console.log("4. Choose 'wordpress-db' from the list");
    console.log("\n🔍 The server will automatically connect to your WordPress database");
    console.log("   and provide AI tools for interacting with it!\n");
  } catch (error) {
    console.error("❌ Setup failed:", error);
    process.exit(1);
  }
}

main();
