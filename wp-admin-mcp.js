#!/usr/bin/env node

/**
 * WordPress Admin MCP Server
 * 
 * An MCP (Model Context Protocol) server that provides access to WordPress
 * administration functionality using WP-CLI. This allows AI assistants
 * to manage WordPress sites through the Admin interface.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { WPCLIExecutor } from './wp-cli-tools.js';
import { parseWPConfig } from './wp-config-reader.js';

/**
 * WordPress Admin MCP Server Class
 */
class WordPressAdminServer {
  constructor() {
    // Initialize MCP server
    this.server = new Server();
    
    // Initialize WP-CLI Executor
    this.wpCli = new WPCLIExecutor();
    
    // Initialize database settings
    this.dbSettings = null;
    
    console.log('Initializing WordPress Admin MCP Server...');
  }
  
  /**
   * Initialize the server and detect WordPress settings
   */
  async initialize() {
    try {
      // Get WordPress database settings
      this.dbSettings = await parseWPConfig();
      
      // Initialize WP-CLI executor
      await this.wpCli.initialize();
      
      console.log('WordPress Admin MCP Server is ready!');
      return true;
    } catch (error) {
      console.error('Failed to initialize WordPress Admin MCP Server:', error);
      return false;
    }
  }
  
  /**
   * Register MCP tools for WordPress admin functionality
   */
  registerTools() {
    // Register WordPress admin tools
    if (!this.server.implementation) {
      this.server.implementation = {};
    }
    if (!this.server.implementation.capabilities) {
      this.server.implementation.capabilities = {};
    }
    if (!this.server.implementation.capabilities.tools) {
      this.server.implementation.capabilities.tools = {};
    }
    
    // Define WordPress Admin tools
    this.server.implementation.capabilities.tools = {
      // Core & Site Information
      get_wp_version: {
        description: "Get WordPress version",
        parameters: {
          type: "object",
          properties: {},
        },
        handler: async () => {
          try {
            return await this.wpCli.getCoreInfo();
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      get_site_info: {
        description: "Get WordPress site information",
        parameters: {
          type: "object",
          properties: {},
        },
        handler: async () => {
          try {
            return await this.wpCli.getSiteInfo();
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      // Plugin management
      get_plugins: {
        description: "Get list of installed plugins",
        parameters: {
          type: "object",
          properties: {
            status: { type: "string", description: "Filter by plugin status (active, inactive, all)" },
          },
        },
        handler: async ({ status }) => {
          try {
            return await this.wpCli.getPlugins({ status });
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      get_plugin_details: {
        description: "Get details about a specific plugin",
        parameters: {
          type: "object",
          properties: {
            plugin: { type: "string", description: "Plugin slug" },
          },
          required: ["plugin"],
        },
        handler: async ({ plugin }) => {
          try {
            return await this.wpCli.getPluginDetails(plugin);
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      activate_plugin: {
        description: "Activate a WordPress plugin",
        parameters: {
          type: "object",
          properties: {
            plugin: { type: "string", description: "Plugin slug" },
          },
          required: ["plugin"],
        },
        handler: async ({ plugin }) => {
          try {
            return await this.wpCli.activatePlugin(plugin);
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      deactivate_plugin: {
        description: "Deactivate a WordPress plugin",
        parameters: {
          type: "object",
          properties: {
            plugin: { type: "string", description: "Plugin slug" },
          },
          required: ["plugin"],
        },
        handler: async ({ plugin }) => {
          try {
            return await this.wpCli.deactivatePlugin(plugin);
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      // Theme management
      get_themes: {
        description: "Get list of installed themes",
        parameters: {
          type: "object",
          properties: {
            status: { type: "string", description: "Filter by theme status (active, inactive, all)" },
          },
        },
        handler: async ({ status }) => {
          try {
            return await this.wpCli.getThemes({ status });
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      get_theme_details: {
        description: "Get details about a specific theme",
        parameters: {
          type: "object",
          properties: {
            theme: { type: "string", description: "Theme name" },
          },
          required: ["theme"],
        },
        handler: async ({ theme }) => {
          try {
            return await this.wpCli.getThemeDetails(theme);
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      activate_theme: {
        description: "Activate a WordPress theme",
        parameters: {
          type: "object",
          properties: {
            theme: { type: "string", description: "Theme name" },
          },
          required: ["theme"],
        },
        handler: async ({ theme }) => {
          try {
            return await this.wpCli.activateTheme(theme);
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      // User management
      get_users: {
        description: "Get WordPress users",
        parameters: {
          type: "object",
          properties: {
            role: { type: "string", description: "Filter by user role" },
            limit: { type: "number", description: "Maximum number of users to return" },
          },
        },
        handler: async ({ role, limit }) => {
          try {
            const options = {};
            if (role) options.role = role;
            if (limit) options.limit = limit;
            
            return await this.wpCli.getUsers(options);
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      create_user: {
        description: "Create a new WordPress user",
        parameters: {
          type: "object",
          properties: {
            username: { type: "string", description: "User's login name" },
            email: { type: "string", description: "User's email address" },
            password: { type: "string", description: "User's password" },
            role: { type: "string", description: "User's role (default: subscriber)" },
            first_name: { type: "string", description: "User's first name" },
            last_name: { type: "string", description: "User's last name" },
          },
          required: ["username", "email", "password"],
        },
        handler: async ({ username, email, password, role, first_name, last_name }) => {
          try {
            const userData = { username, email, password };
            if (role) userData.role = role;
            if (first_name) userData.first_name = first_name;
            if (last_name) userData.last_name = last_name;
            
            return await this.wpCli.createUser(userData);
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      update_user: {
        description: "Update an existing WordPress user",
        parameters: {
          type: "object",
          properties: {
            user_id: { type: "number", description: "User ID to update" },
            role: { type: "string", description: "Change user's role" },
            password: { type: "string", description: "Set new password" },
            user_url: { type: "string", description: "Set user's URL" },
            first_name: { type: "string", description: "Set user's first name" },
            last_name: { type: "string", description: "Set user's last name" },
            description: { type: "string", description: "Set user's description" },
          },
          required: ["user_id"],
        },
        handler: async ({ user_id, ...userData }) => {
          try {
            return await this.wpCli.updateUser(user_id, userData);
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      // Options management
      get_option: {
        description: "Get a WordPress option",
        parameters: {
          type: "object",
          properties: {
            option: { type: "string", description: "Option name" },
          },
          required: ["option"],
        },
        handler: async ({ option }) => {
          try {
            return await this.wpCli.getOption(option);
          } catch (error) {
            return { error: error.message };
          }
        }
      },
      
      update_option: {
        description: "Update a WordPress option",
        parameters: {
          type: "object",
          properties: {
            option: { type: "string", description: "Option name" },
            value: { type: "string", description: "New option value" },
          },
          required: ["option", "value"],
        },
        handler: async ({ option, value }) => {
          try {
            return await this.wpCli.updateOption(option, value);
          } catch (error) {
            return { error: error.message };
          }
        }
      },
    };
  }
  
  /**
   * Start the MCP server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Register tools
    this.registerTools();
    
    // Handle list tools requests
    this.server.onRequest(ListToolsRequestSchema, async (req) => {
      console.log('Received list tools request');
      return {
        tools: Object.entries(this.server.implementation.capabilities.tools).map(
          ([name, tool]) => ({
            name,
            description: tool.description,
            parameters: tool.parameters,
          })
        ),
      };
    });
    
    // Handle call tool requests
    this.server.onRequest(CallToolRequestSchema, async (req) => {
      const { name, parameters } = req;
      console.log(`Received call tool request: ${name}`);
      
      const tool = this.server.implementation.capabilities.tools[name];
      if (!tool) {
        return {
          error: `Tool '${name}' not found`,
        };
      }
      
      try {
        const result = await tool.handler(parameters || {});
        return { result };
      } catch (error) {
        console.error(`Error executing tool ${name}:`, error);
        return {
          error: error.message,
        };
      }
    });
    
    console.log('WordPress Admin MCP Server is listening for requests');
  }
}

// When run directly as a script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const server = new WordPressAdminServer();
  server.initialize().then((success) => {
    if (success) {
      server.run().catch((error) => {
        console.error('Failed to run WordPress Admin MCP Server:', error);
        process.exit(1);
      });
    } else {
      console.error('Failed to initialize WordPress Admin MCP Server');
      process.exit(1);
    }
  });
}
