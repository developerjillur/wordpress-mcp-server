#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Import our custom helpers
import { parseWPConfig } from './wp-config-reader.js';
import { WordPressSchema } from './wp-schema.js';

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

    // Will be populated during initialization
    this.dbConfig = null;
    this.wpSchema = null;
    this.tablePrefix = 'wp_';
    this.connection = null;
    
    // We'll set up tools after database config is loaded
    this.registerTools = this.registerTools.bind(this);
  }

  /**
   * Initialize the server with WordPress configuration
   */
  async initialize() {
    try {
      console.log("Initializing WordPress MCP Server...");
      
      // First try to read from environment variables
      let dbConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        socketPath: process.env.DB_SOCKET
      };
      
      // If any essential config is missing, try to parse wp-config.php
      if (!dbConfig.host || !dbConfig.user || !dbConfig.database) {
        console.log("Loading database configuration from wp-config.php...");
        dbConfig = await parseWPConfig('../wp-config.php');
        console.log("Found database:", dbConfig.database);
      }
      
      this.dbConfig = dbConfig;
      this.tablePrefix = dbConfig.table_prefix || 'wp_';
      
      // Initialize WordPress schema
      this.wpSchema = new WordPressSchema(this.tablePrefix);
      
      // Test database connection
      console.log("Testing database connection...");
      await this.testConnection();
      
      // Register tools with the server
      this.registerTools();
      
      console.log("WordPress MCP Server is ready!");
    } catch (error) {
      console.error("Error initializing WordPress MCP Server:", error.message);
      console.log("Server will start with limited functionality.");
      
      // Register basic tools even if DB connection fails
      this.registerTools();
    }
  }
  
  /**
   * Test the database connection
   */
  async testConnection() {
    try {
      const connection = await mysql.createConnection(this.dbConfig);
      await connection.execute('SELECT 1');
      await connection.end();
      console.log("Database connection successful!");
      return true;
    } catch (error) {
      console.error("Database connection failed:", error.message);
      return false;
    }
  }

  /**
   * Register all tools with the server
   */
  registerTools() {
    // Register WordPress database tools
    if (!this.server.implementation) {
      this.server.implementation = {};
    }
    if (!this.server.implementation.capabilities) {
      this.server.implementation.capabilities = {};
    }
    if (!this.server.implementation.capabilities.tools) {
      this.server.implementation.capabilities.tools = {};
    }
    
    // Now we can safely assign to tools
    this.server.implementation.capabilities.tools = {
      // Posts tools
      get_posts: {
        description: "Get WordPress posts with filtering options.",
        parameters: {
          properties: {
            post_type: { type: "string", description: "Post type, e.g., 'post', 'page', 'product'", default: "post" },
            post_status: { type: "string", description: "Post status, e.g., 'publish', 'draft', 'private'" },
            limit: { type: "number", description: "Maximum number of posts to fetch", default: 10 },
            offset: { type: "number", description: "Number of posts to skip", default: 0 },
            orderby: { type: "string", description: "Column to order by", default: "ID" },
            order: { type: "string", description: "Order direction ('ASC' or 'DESC')", default: "DESC" }
          },
          type: "object"
        },
        handler: async ({ post_type = "post", post_status, limit = 10, offset = 0, orderby = "ID", order = "DESC" }) => {
          try {
            const connection = await mysql.createConnection(this.dbConfig);
            
            let query = `SELECT * FROM ${this.tablePrefix}posts WHERE post_type = ?`;
            const params = [post_type];
            
            if (post_status) {
              query += ' AND post_status = ?';
              params.push(post_status);
            }
            
            query += ` ORDER BY ${orderby} ${order} LIMIT ? OFFSET ?`;
            params.push(limit, offset);
            
            const [rows] = await connection.execute(query, params);
            await connection.end();
            
            return { posts: rows };
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      get_post_by_id: {
        description: "Get a WordPress post by ID.",
        parameters: {
          properties: {
            post_id: { type: "number", description: "The WordPress post ID" }
          },
          required: ["post_id"],
          type: "object"
        },
        handler: async ({ post_id }) => {
          try {
            const connection = await mysql.createConnection(this.dbConfig);
            
            // Get post
            const [posts] = await connection.execute(
              `SELECT * FROM ${this.tablePrefix}posts WHERE ID = ?`,
              [post_id]
            );
            
            // Get post meta
            const [meta] = await connection.execute(
              `SELECT meta_key, meta_value FROM ${this.tablePrefix}postmeta WHERE post_id = ?`,
              [post_id]
            );
            
            await connection.end();
            
            if (posts.length === 0) {
              return { error: "Post not found" };
            }
            
            // Format meta as key-value pairs
            const metaData = {};
            meta.forEach(m => {
              metaData[m.meta_key] = m.meta_value;
            });
            
            return { 
              post: posts[0],
              meta: metaData
            };
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      get_posts_count: {
        description: "Get count of WordPress posts by post type.",
        parameters: {
          properties: {
            post_type: { type: "string", description: "Post type, e.g., 'post', 'page', 'product'" },
            post_status: { type: "string", description: "Post status, e.g., 'publish', 'draft'" }
          },
          type: "object"
        },
        handler: async ({ post_type, post_status }) => {
          try {
            const connection = await mysql.createConnection(this.dbConfig);
            
            let query = `SELECT COUNT(*) as count FROM ${this.tablePrefix}posts WHERE 1=1`;
            const params = [];
            
            if (post_type) {
              query += ' AND post_type = ?';
              params.push(post_type);
            }
            
            if (post_status) {
              query += ' AND post_status = ?';
              params.push(post_status);
            }
            
            const [rows] = await connection.execute(query, params);
            await connection.end();
            
            return { count: rows[0].count };
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      // User tools
      get_users: {
        description: "Get WordPress users.",
        parameters: {
          properties: {
            role: { type: "string", description: "Filter by user role" },
            limit: { type: "number", description: "Maximum number of users to fetch", default: 10 },
            offset: { type: "number", description: "Number of users to skip", default: 0 }
          },
          type: "object"
        },
        handler: async ({ role, limit = 10, offset = 0 }) => {
          try {
            const connection = await mysql.createConnection(this.dbConfig);
            
            let query, params;
            
            if (role) {
              // Get users by role (requires joining with usermeta)
              query = `
                SELECT u.* FROM ${this.tablePrefix}users u
                JOIN ${this.tablePrefix}usermeta um ON u.ID = um.user_id
                WHERE um.meta_key = '${this.tablePrefix}capabilities'
                AND um.meta_value LIKE ?
                LIMIT ? OFFSET ?
              `;
              params = [`%"${role}"%`, limit, offset];
            } else {
              // Get all users
              query = `SELECT * FROM ${this.tablePrefix}users LIMIT ? OFFSET ?`;
              params = [limit, offset];
            }
            
            const [rows] = await connection.execute(query, params);
            await connection.end();
            
            return { users: rows };
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      // Database management tools
      get_tables: {
        description: "Get list of tables in the WordPress database.",
        parameters: { type: "object" },
        handler: async () => {
          try {
            const connection = await mysql.createConnection(this.dbConfig);
            
            const [tables] = await connection.execute(`
              SELECT table_name, table_rows
              FROM information_schema.tables
              WHERE table_schema = ?
              ORDER BY table_name
            `, [this.dbConfig.database]);
            
            await connection.end();
            
            return { tables: tables.map(t => ({ name: t.table_name, rows: t.table_rows })) };
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      get_table_structure: {
        description: "Get the structure of a WordPress database table.",
        parameters: {
          properties: {
            table_name: { type: "string", description: "Table name (without prefix)" }
          },
          required: ["table_name"],
          type: "object"
        },
        handler: async ({ table_name }) => {
          try {
            const fullTableName = `${this.tablePrefix}${table_name}`;
            const connection = await mysql.createConnection(this.dbConfig);
            
            // Get table columns
            const [columns] = await connection.execute(`
              SELECT column_name, column_type, is_nullable, column_key, column_default, extra
              FROM information_schema.columns
              WHERE table_schema = ? AND table_name = ?
              ORDER BY ordinal_position
            `, [this.dbConfig.database, fullTableName]);
            
            // Get table indices
            const [indices] = await connection.execute(`
              SELECT index_name, column_name, non_unique
              FROM information_schema.statistics
              WHERE table_schema = ? AND table_name = ?
              ORDER BY index_name, seq_in_index
            `, [this.dbConfig.database, fullTableName]);
            
            await connection.end();
            
            return { 
              table: fullTableName,
              columns: columns,
              indices: indices
            };
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      execute_query: {
        description: "Execute a custom SQL query against the WordPress database.",
        parameters: {
          properties: {
            query: { type: "string", description: "SQL query to execute" },
            params: { 
              type: "array", 
              description: "Parameters for prepared statement",
              items: { type: "string" }
            }
          },
          required: ["query"],
          type: "object"
        },
        handler: async ({ query, params = [] }) => {
          try {
            // Security check - only allow SELECT queries
            if (!query.trim().toLowerCase().startsWith('select')) {
              return { error: "Only SELECT queries are allowed for security reasons" };
            }
            
            const connection = await mysql.createConnection(this.dbConfig);
            const [rows] = await connection.execute(query, params);
            await connection.end();
            
            return { 
              results: rows,
              count: rows.length
            };
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      // WordPress specific tools
      get_options: {
        description: "Get WordPress options.",
        parameters: {
          properties: {
            option_name: { type: "string", description: "Specific option to retrieve" },
            like: { type: "string", description: "Search for options with names containing this string" }
          },
          type: "object"
        },
        handler: async ({ option_name, like }) => {
          try {
            const connection = await mysql.createConnection(this.dbConfig);
            
            let query, params;
            
            if (option_name) {
              query = `SELECT * FROM ${this.tablePrefix}options WHERE option_name = ?`;
              params = [option_name];
            } else if (like) {
              query = `SELECT * FROM ${this.tablePrefix}options WHERE option_name LIKE ?`;
              params = [`%${like}%`];
            } else {
              query = `SELECT * FROM ${this.tablePrefix}options LIMIT 100`;
              params = [];
            }
            
            const [rows] = await connection.execute(query, params);
            await connection.end();
            
            return { options: rows };
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      get_wp_info: {
        description: "Get WordPress core information.",
        parameters: { type: "object" },
        handler: async () => {
          try {
            const connection = await mysql.createConnection(this.dbConfig);
            
            // Get WordPress version
            const [versionRows] = await connection.execute(
              `SELECT option_value FROM ${this.tablePrefix}options WHERE option_name = 'siteurl'`
            );
            
            // Get site information
            const [siteInfo] = await connection.execute(
              `SELECT option_value, option_name 
               FROM ${this.tablePrefix}options 
               WHERE option_name IN ('siteurl', 'home', 'blogname', 'blogdescription')`
            );
            
            // Get active plugins
            const [pluginsRow] = await connection.execute(
              `SELECT option_value FROM ${this.tablePrefix}options WHERE option_name = 'active_plugins'`
            );
            
            // Get user count
            const [userCount] = await connection.execute(
              `SELECT COUNT(*) as count FROM ${this.tablePrefix}users`
            );
            
            // Get post counts by type and status
            const [postCounts] = await connection.execute(`
              SELECT post_type, post_status, COUNT(*) as count 
              FROM ${this.tablePrefix}posts 
              GROUP BY post_type, post_status
            `);
            
            await connection.end();
            
            // Format site info as key-value pairs
            const info = {};
            siteInfo.forEach(item => {
              info[item.option_name] = item.option_value;
            });
            
            return { 
              site: info,
              users: userCount[0].count,
              posts: postCounts,
              active_plugins: pluginsRow.length > 0 ? pluginsRow[0].option_value : '[]'
            };
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      // Server status tool
      server_status: {
        description: "Get the status of the WordPress MCP Server.",
        parameters: { type: "object" },
        handler: async () => {
          try {
            const isConnected = await this.testConnection();
            
            return {
              server: {
                name: this.server.info.name,
                version: this.server.info.version,
                status: isConnected ? "connected" : "disconnected"
              },
              database: {
                host: this.dbConfig?.host || "unknown",
                name: this.dbConfig?.database || "unknown",
                user: this.dbConfig?.user || "unknown",
                table_prefix: this.tablePrefix
              }
            };
          } catch (error) {
            return { 
              error: error.message,
              server: {
                name: this.server.info.name,
                version: this.server.info.version,
                status: "error"
              }
            };
          }
        }
      }
    };
  }

  /**
   * Run the MCP server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Set up request handlers
    this.server.onRequest(ListToolsRequestSchema, async (req) => {
      return {
        type: "list_tools_response",
        id: req.id,
        tools: this.server.implementation.capabilities.tools,
        info: this.server.info,
      };
    });

    this.server.onRequest(CallToolRequestSchema, async (req) => {
      const { tool, parameters } = req;
      const handler = this.server.implementation.capabilities.tools[tool]?.handler;
      
      if (!handler) {
        return {
          type: "call_tool_response",
          id: req.id,
          result: { error: `Tool '${tool}' not found` },
        };
      }

      try {
        const result = await handler(parameters || {});
        return {
          type: "call_tool_response",
          id: req.id,
          result,
        };
      } catch (error) {
        return {
          type: "call_tool_response",
          id: req.id,
          result: { error: error.message },
        };
      }
    });

    await this.server.start();
  }
}

// Export the class for testing
export { WordPressDatabaseServer };

// Only run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new WordPressDatabaseServer();
  server.run().catch(error => {
    console.error("Failed to start WordPress MCP Server:", error);
    process.exit(1);
  });
}
