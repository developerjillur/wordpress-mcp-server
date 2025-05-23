#!/usr/bin/env node

import { WordPressDatabaseServer } from './enhanced-wp-mcp.js';
import { parseWPConfig } from './wp-config-reader.js';
import mysql from 'mysql2/promise';

async function testEnhancedServer() {
  console.log('Testing Enhanced WordPress MCP Server...\n');
  
  try {
    // Test WordPress config reader
    console.log('1️⃣ Testing WordPress Config Detection...');
    const dbSettings = await parseWPConfig();
    
    if (dbSettings) {
      console.log('✅ WordPress configuration detected successfully:');
      console.log(`   - Database: ${dbSettings.database}`);
      console.log(`   - Table Prefix: ${dbSettings.table_prefix}`);
      console.log(`   - Connection Type: ${dbSettings.socketPath ? 'Socket' : 'TCP/IP'}`);
    } else {
      throw new Error('Could not detect WordPress configuration');
    }
    
    // Test database connection
    console.log('\n2️⃣ Testing Database Connection...');
    const server = new WordPressDatabaseServer();
    await server.initialize();
    
    // Test basic queries directly
    console.log('\n3️⃣ Testing Direct Database Queries...');
    
    // Create a database connection
    const connection = await mysql.createConnection(server.dbConfig);
    
    // Test posts count
    const [postsResult] = await connection.query(`SELECT COUNT(*) as count FROM ${dbSettings.table_prefix}posts`);
    console.log(`✅ Found ${postsResult[0].count} total posts`);
    
    // Test tables
    const [tablesResult] = await connection.query(`SHOW TABLES LIKE '${dbSettings.table_prefix}%'`);
    console.log(`✅ Found ${tablesResult.length} WordPress tables`);
    
    // Test users
    const [usersResult] = await connection.query(`SELECT COUNT(*) as count FROM ${dbSettings.table_prefix}users`);
    console.log(`✅ Found ${usersResult[0].count} users in the database`);
    
    // Close the connection
    await connection.end();
    
    console.log('\n🎉 All tests passed! Enhanced MCP Server is ready to use.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testEnhancedServer();
