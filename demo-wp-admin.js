#!/usr/bin/env node

/**
 * WordPress Admin MCP Server Demo
 * 
 * This demonstration script shows how to use the WordPress Admin MCP Server
 * to interact with WordPress admin functionality.
 */

import { WPCLIExecutor } from './wp-cli-tools.js';

async function demonstrateWPAdminTools() {
  console.log('🚀 WordPress Admin MCP Server Demo\n');
  console.log('='.repeat(50) + '\n');
  
  try {
    // Initialize WP-CLI executor
    console.log('1️⃣ Initializing WP-CLI executor...');
    const wpCli = new WPCLIExecutor();
    await wpCli.initialize();
    console.log('✅ WP-CLI executor initialized successfully\n');
    
    // Get WordPress version
    console.log('2️⃣ Getting WordPress version...');
    const coreInfo = await wpCli.getCoreInfo();
    console.log(`✅ WordPress version: ${JSON.stringify(coreInfo)}\n`);
    
    // Get site info
    console.log('3️⃣ Getting site information...');
    try {
      const siteInfo = await wpCli.getSiteInfo();
      console.log('✅ Site information:');
      console.log(`   - URL: ${siteInfo.url}`);
      console.log(`   - Title: ${siteInfo.title}`);
      console.log(`   - Description: ${siteInfo.description}`);
      console.log(`   - Admin Email: ${siteInfo.adminEmail}\n`);
    } catch (error) {
      console.log(`❌ Could not get site information: ${error.message}\n`);
    }
    
    // Get plugins
    console.log('4️⃣ Getting plugins...');
    try {
      const plugins = await wpCli.getPlugins({ status: 'active' });
      console.log('✅ Active plugins:');
      
      if (Array.isArray(plugins)) {
        plugins.forEach((plugin, index) => {
          console.log(`   ${index + 1}. ${plugin.name} (${plugin.version})`);
        });
      } else {
        console.log('   No active plugins or unexpected response format');
      }
      console.log('');
    } catch (error) {
      console.log(`❌ Could not get plugins: ${error.message}\n`);
    }
    
    // Get themes
    console.log('5️⃣ Getting themes...');
    try {
      const themes = await wpCli.getThemes();
      console.log('✅ Installed themes:');
      
      if (Array.isArray(themes)) {
        themes.forEach((theme, index) => {
          const status = theme.status === 'active' ? '(active)' : '';
          console.log(`   ${index + 1}. ${theme.name} ${status}`);
        });
      } else {
        console.log('   No themes or unexpected response format');
      }
      console.log('');
    } catch (error) {
      console.log(`❌ Could not get themes: ${error.message}\n`);
    }
    
    // Get users count
    console.log('6️⃣ Getting users count...');
    try {
      const users = await wpCli.getUsers({ limit: 5 });
      console.log(`✅ Found ${Array.isArray(users) ? users.length : 0} users in WordPress\n`);
    } catch (error) {
      console.log(`❌ Could not get users: ${error.message}\n`);
    }
    
    console.log('='.repeat(50));
    console.log('\n🎉 Demo completed successfully!');
    console.log('This demonstrates how the WordPress Admin MCP Server');
    console.log('allows AI assistants to interact with WordPress admin functionality.');
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    console.error(error.stack);
  }
}

// Run the demo
demonstrateWPAdminTools();
