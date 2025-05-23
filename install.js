#!/usr/bin/env node

/**
 * WordPress MCP Server Installer
 * 
 * This script installs the WordPress MCP Server to any WordPress project.
 * Usage: node install.js /path/to/wordpress
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function copyRecursive(src, dest) {
  const stats = await fs.stat(src);
  const isDirectory = stats.isDirectory();
  
  if (isDirectory) {
    await fs.mkdir(dest, { recursive: true });
    const children = await fs.readdir(src);
    
    for (const child of children) {
      // Skip node_modules
      if (child === 'node_modules') continue;
      
      await copyRecursive(
        path.join(src, child),
        path.join(dest, child)
      );
    }
  } else {
    await fs.copyFile(src, dest);
  }
}

async function main() {
  try {
    // Get target WordPress directory
    const targetDir = process.argv[2];
    
    if (!targetDir) {
      console.error("❌ Error: Please provide a target WordPress directory");
      console.log("Usage: node install.js /path/to/wordpress");
      process.exit(1);
    }
    
    // Check if target is a WordPress installation
    const wpConfigPath = path.join(targetDir, 'wp-config.php');
    
    try {
      await fs.access(wpConfigPath);
    } catch (error) {
      console.error("❌ Error: The target directory doesn't appear to be a WordPress installation (wp-config.php not found)");
      process.exit(1);
    }
    
    // Create mcp-server directory in target
    const targetMcpDir = path.join(targetDir, 'mcp-server');
    await fs.mkdir(targetMcpDir, { recursive: true });
    
    // Copy MCP server files to target
    console.log("📂 Copying WordPress MCP Server files...");
    await copyRecursive(__dirname, targetMcpDir);
    
    console.log("✅ WordPress MCP Server files copied successfully!");
    console.log("\n🚀 To complete the installation:");
    console.log(`1. cd ${targetMcpDir}`);
    console.log("2. node setup.js\n");
    
  } catch (error) {
    console.error("❌ Installation failed:", error);
    process.exit(1);
  }
}

main();
