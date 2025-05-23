#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { parseWPConfig } from './wp-config-reader.js';
import { WordPressSchema } from './wp-schema.js';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

class WordPressDatabaseServer {
  constructor() {
    this.server = new Server(
      {
        name: process.env.MCP_SERVER_NAME || "wordpress-db-server",
        version: process.env.MCP_SERVER_VERSION || "1.0.0"
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );
    
    this.dbConfig = null;
    this.wpSchema = null;
    this.connection = null;
    
    // Initialize the server - this will be an async process
    this.initialize();
    };

    this.tablePrefix = process.env.WP_TABLE_PREFIX || 'wp_';
    
    this.setupToolHandlers();
  }

  async createConnection() {
    try {
      const connection = await mysql.createConnection(this.dbConfig);
      return connection;
    } catch (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "get_posts_count",
          description: "Get the total count of WordPress posts",
          inputSchema: {
            type: "object",
            properties: {
              post_status: {
                type: "string",
                description: "Filter by post status (publish, draft, private, etc.)",
                default: "publish"
              },
              post_type: {
                type: "string", 
                description: "Filter by post type (post, page, custom post type)",
                default: "post"
              }
            }
          }
        },
        {
          name: "get_posts_list",
          description: "Get a list of WordPress posts with details",
          inputSchema: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                description: "Number of posts to retrieve",
                default: 10
              },
              offset: {
                type: "number",
                description: "Number of posts to skip",
                default: 0
              },
              post_status: {
                type: "string",
                description: "Filter by post status",
                default: "publish"
              },
              post_type: {
                type: "string",
                description: "Filter by post type",
                default: "post"
              },
              order_by: {
                type: "string",
                description: "Order by field (post_date, post_title, ID)",
                default: "post_date"
              },
              order: {
                type: "string",
                description: "Order direction (ASC or DESC)",
                default: "DESC"
              }
            }
          }
        },
        {
          name: "execute_custom_query",
          description: "Execute a custom SQL query (SELECT queries only for safety)",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The SQL query to execute (must be a SELECT statement)"
              }
            },
            required: ["query"]
          }
        },
        {
          name: "get_database_info",
          description: "Get information about the WordPress database structure",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "check_database_performance",
          description: "Get database performance metrics and optimization suggestions",
          inputSchema: {
            type: "object",
            properties: {}
          }
        },
        {
          name: "get_table_info",
          description: "Get information about a specific WordPress table",
          inputSchema: {
            type: "object",
            properties: {
              table_name: {
                type: "string",
                description: "Name of the table (without prefix)"
              }
            },
            required: ["table_name"]
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "get_posts_count":
            return await this.getPostsCount(args);
          case "get_posts_list":
            return await this.getPostsList(args);
          case "execute_custom_query":
            return await this.executeCustomQuery(args);
          case "get_database_info":
            return await this.getDatabaseInfo();
          case "check_database_performance":
            return await this.checkDatabasePerformance();
          case "get_table_info":
            return await this.getTableInfo(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error.message}`
            }
          ]
        };
      }
    });
  }

  async getPostsCount(args = {}) {
    const connection = await this.createConnection();
    try {
      const { post_status = 'publish', post_type = 'post' } = args;
      const tableName = `${this.tablePrefix}posts`;
      
      const query = `
        SELECT COUNT(*) as total_posts 
        FROM ${tableName} 
        WHERE post_status = ? AND post_type = ?
      `;
      
      const [rows] = await connection.execute(query, [post_status, post_type]);
      const count = rows[0].total_posts;

      return {
        content: [
          {
            type: "text",
            text: `Total ${post_type}s with status '${post_status}': ${count}`
          }
        ]
      };
    } finally {
      await connection.end();
    }
  }

  async getPostsList(args = {}) {
    const connection = await this.createConnection();
    try {
      const { 
        limit = 10, 
        offset = 0, 
        post_status = 'publish', 
        post_type = 'post',
        order_by = 'post_date',
        order = 'DESC'
      } = args;
      
      const tableName = `${this.tablePrefix}posts`;
      
      // Validate order_by and order parameters to prevent SQL injection
      const validOrderBy = ['post_date', 'post_title', 'ID', 'post_modified'];
      const validOrder = ['ASC', 'DESC'];
      
      const safeOrderBy = validOrderBy.includes(order_by) ? order_by : 'post_date';
      const safeOrder = validOrder.includes(order.toUpperCase()) ? order.toUpperCase() : 'DESC';
      
      // Use string interpolation for ORDER BY and LIMIT since they can't be parameterized
      const query = `
        SELECT ID, post_title, post_date, post_status, post_type, post_excerpt, post_name
        FROM ${tableName} 
        WHERE post_status = ? AND post_type = ?
        ORDER BY ${safeOrderBy} ${safeOrder}
        LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
      `;
      
      const [rows] = await connection.execute(query, [post_status, post_type]);
      
      let result = `Found ${rows.length} ${post_type}s:\n\n`;
      rows.forEach((post, index) => {
        result += `${index + 1}. ID: ${post.ID}\n`;
        result += `   Title: ${post.post_title}\n`;
        result += `   Date: ${post.post_date}\n`;
        result += `   Status: ${post.post_status}\n`;
        result += `   Slug: ${post.post_name}\n`;
        result += `   Excerpt: ${post.post_excerpt ? post.post_excerpt.substring(0, 100) + '...' : 'No excerpt'}\n\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: result
          }
        ]
      };
    } finally {
      await connection.end();
    }
  }

  async executeCustomQuery(args) {
    const connection = await this.createConnection();
    try {
      const { query } = args;
      
      // Security check: only allow SELECT queries
      const trimmedQuery = query.trim().toLowerCase();
      if (!trimmedQuery.startsWith('select')) {
        throw new Error('Only SELECT queries are allowed for security reasons');
      }

      const [rows] = await connection.execute(query);
      
      let result = `Query executed successfully. Results:\n\n`;
      if (rows.length === 0) {
        result += 'No results found.';
      } else {
        // Display first few rows as sample
        const sampleRows = rows.slice(0, 10);
        result += `Showing ${sampleRows.length} of ${rows.length} results:\n\n`;
        
        if (sampleRows.length > 0) {
          const columns = Object.keys(sampleRows[0]);
          result += columns.join(' | ') + '\n';
          result += columns.map(() => '---').join(' | ') + '\n';
          
          sampleRows.forEach(row => {
            result += columns.map(col => row[col] || 'NULL').join(' | ') + '\n';
          });
        }
      }

      return {
        content: [
          {
            type: "text",
            text: result
          }
        ]
      };
    } finally {
      await connection.end();
    }
  }

  async getDatabaseInfo() {
    const connection = await this.createConnection();
    try {
      // Get WordPress tables
      const [tables] = await connection.execute(`
        SHOW TABLES LIKE '${this.tablePrefix}%'
      `);
      
      // Get database size
      const [sizeResult] = await connection.execute(`
        SELECT 
          ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
        FROM information_schema.tables 
        WHERE table_schema = ?
        AND table_name LIKE '${this.tablePrefix}%'
      `, [this.dbConfig.database]);

      let result = `WordPress Database Information:\n\n`;
      result += `Database: ${this.dbConfig.database}\n`;
      result += `Table Prefix: ${this.tablePrefix}\n`;
      result += `Total Size: ${sizeResult[0].size_mb} MB\n`;
      result += `WordPress Tables: ${tables.length}\n\n`;
      
      result += `Tables:\n`;
      tables.forEach((table, index) => {
        const tableName = Object.values(table)[0];
        result += `${index + 1}. ${tableName}\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: result
          }
        ]
      };
    } finally {
      await connection.end();
    }
  }

  async checkDatabasePerformance() {
    const connection = await this.createConnection();
    try {
      // Get table sizes and row counts
      const [tableStats] = await connection.execute(`
        SELECT 
          table_name,
          ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
          table_rows
        FROM information_schema.TABLES 
        WHERE table_schema = ?
        AND table_name LIKE '${this.tablePrefix}%'
        ORDER BY (data_length + index_length) DESC
      `, [this.dbConfig.database]);

      // Check for large tables that might need optimization
      const [processlist] = await connection.execute('SHOW PROCESSLIST');
      
      let result = `Database Performance Analysis:\n\n`;
      
      result += `Table Sizes:\n`;
      tableStats.forEach((table, index) => {
        result += `${index + 1}. ${table.table_name}: ${table.size_mb} MB (${table.table_rows || 'N/A'} rows)\n`;
      });
      
      result += `\nActive Connections: ${processlist.length}\n\n`;
      
      // Performance suggestions
      result += `Performance Suggestions:\n`;
      const largeTables = tableStats.filter(t => t.size_mb > 10);
      if (largeTables.length > 0) {
        result += `- Consider optimizing large tables: ${largeTables.map(t => t.table_name).join(', ')}\n`;
      }
      
      const highRowTables = tableStats.filter(t => t.table_rows > 10000);
      if (highRowTables.length > 0) {
        result += `- Tables with high row counts may benefit from indexing: ${highRowTables.map(t => t.table_name).join(', ')}\n`;
      }
      
      result += `- Regular database maintenance and cleanup recommended\n`;
      result += `- Consider implementing caching for frequently accessed data\n`;

      return {
        content: [
          {
            type: "text",
            text: result
          }
        ]
      };
    } finally {
      await connection.end();
    }
  }

  async getTableInfo(args) {
    const connection = await this.createConnection();
    try {
      const { table_name } = args;
      const fullTableName = `${this.tablePrefix}${table_name}`;
      
      // Get table structure
      const [columns] = await connection.execute(`DESCRIBE ${fullTableName}`);
      
      // Get table stats
      const [stats] = await connection.execute(`
        SELECT 
          ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb,
          table_rows,
          data_length,
          index_length
        FROM information_schema.TABLES 
        WHERE table_schema = ? AND table_name = ?
      `, [this.dbConfig.database, fullTableName]);

      let result = `Table Information: ${fullTableName}\n\n`;
      
      if (stats.length > 0) {
        result += `Size: ${stats[0].size_mb} MB\n`;
        result += `Rows: ${stats[0].table_rows || 'N/A'}\n`;
        result += `Data Length: ${stats[0].data_length || 'N/A'} bytes\n`;
        result += `Index Length: ${stats[0].index_length || 'N/A'} bytes\n\n`;
      }
      
      result += `Columns:\n`;
      columns.forEach((col, index) => {
        result += `${index + 1}. ${col.Field} (${col.Type}) - ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`;
        if (col.Key) result += ` [${col.Key}]`;
        if (col.Default !== null) result += ` Default: ${col.Default}`;
        result += `\n`;
      });

      return {
        content: [
          {
            type: "text",
            text: result
          }
        ]
      };
    } finally {
      await connection.end();
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("WordPress Database MCP Server running on stdio");
  }
}

// Export the class for testing
export { WordPressDatabaseServer };

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new WordPressDatabaseServer();
  server.run().catch(console.error);
}
