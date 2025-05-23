#!/usr/bin/env node

/**
 * Test script for WordPress Admin MCP Server
 * 
 * This script tests the WP-CLI integration and WordPress Admin tools
 */

import { WordPressAdminServer } from './wp-admin-mcp.js';
import { WPCLIExecutor } from './wp-cli-tools.js';

async function testWPAdminServer() {
  console.log('Testing WordPress Admin MCP Server...\n');
  
  try {
    // Test WP-CLI executor
    console.log('1️⃣ Testing WP-CLI Integration...');
    const wpCli = new WPCLIExecutor();
    
    try {
      await wpCli.initialize();
      console.log('✅ WP-CLI executor initialized successfully');
      
      // Test basic WP-CLI command
      try {
        const coreInfo = await wpCli.getCoreInfo();
        console.log(`✅ WordPress version detected: ${JSON.stringify(coreInfo)}`);
      } catch (error) {
        console.log(`❌ Could not get WordPress version: ${error.message}`);
      }
    } catch (error) {
      console.log(`❌ WP-CLI initialization failed: ${error.message}`);
      console.log('⚠️ WordPress Admin functionality will be limited');
    }
    
    // Test WordPress Admin MCP Server
    console.log('\n2️⃣ Testing WordPress Admin MCP Server...');
    const server = new WordPressAdminServer();
    
    const initialized = await server.initialize();
    if (initialized) {
      console.log('✅ WordPress Admin MCP Server initialized successfully');
      
      // Register tools
      server.registerTools();
      console.log('✅ WordPress Admin tools registered successfully');
      
      // Verify tools are registered correctly
      const toolCount = Object.keys(server.server.implementation.capabilities.tools).length;
      console.log(`✅ ${toolCount} WordPress Admin tools are available`);
      
      console.log('\n🎉 WordPress Admin MCP Server is ready to use!');
      
      // Suggest adding the server to mcp-config.json
      console.log('\n📝 To use this server, add the following to your mcp-config.json:');
      console.log(`
{
  "mcpServers": {
    "wordpress-admin": {
      "command": "node",
      "args": ["${process.cwd()}/wp-admin-mcp.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
`);
    } else {
      console.error('❌ WordPress Admin MCP Server initialization failed');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testWPAdminServer();
