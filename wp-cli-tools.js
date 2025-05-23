#!/usr/bin/env node

/**
 * WordPress CLI Tools for MCP Server
 * 
 * Provides a bridge between the MCP server and WordPress admin functionality
 * using WP-CLI for executing WordPress admin operations.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);

/**
 * WP-CLI Executor Class for WordPress Admin Operations
 */
export class WPCLIExecutor {
  constructor(wpPath = '../') {
    this.wpPath = path.resolve(wpPath);
    this.localWPCLIPath = null;
    this.dockerContainer = null;
  }

  /**
   * Initialize the WP-CLI executor
   * Detects the best way to run WP-CLI commands based on the environment
   */
  async initialize() {
    try {
      // First, check if WP-CLI exists directly
      try {
        await execPromise('wp --info');
        this.wpCliMethod = 'direct';
        console.log('Using global WP-CLI installation');
        return;
      } catch (err) {
        // WP-CLI is not globally available
      }

      // Check if we're in a Local by Flywheel environment
      if (await this.detectLocalByFlywheel()) {
        console.log('Local by Flywheel environment detected');
        return;
      }

      // As a last resort, try to use the WP-CLI Phar file if available
      const wpCliPhar = path.join(this.wpPath, 'wp-cli.phar');
      try {
        await fs.access(wpCliPhar);
        this.wpCliMethod = 'phar';
        console.log('Using wp-cli.phar file');
        return;
      } catch (err) {
        // WP-CLI Phar not available
      }

      throw new Error('No method to run WP-CLI commands was found. Please install WP-CLI or ensure Local by Flywheel is properly configured.');
    } catch (error) {
      console.error(`Failed to initialize WP-CLI: ${error.message}`);
      throw error;
    }
  }

  /**
   * Detect Local by Flywheel environment and configure appropriate WP-CLI execution method
   */
  async detectLocalByFlywheel() {
    try {
      // Check common paths where Local by Flywheel might store site data
      const localAppsPath = '/Users/developerjillur/Local Sites';
      
      if (this.wpPath.includes(localAppsPath)) {
        // Extract site name from path
        const pathParts = this.wpPath.split('/');
        const siteNameIndex = pathParts.findIndex(part => part === 'Local Sites') + 1;
        
        if (siteNameIndex < pathParts.length) {
          const siteName = pathParts[siteNameIndex];
          
          // Check if site has a Docker container running
          const { stdout: dockerOutput } = await execPromise('docker ps --format "{{.Names}}"');
          
          const containers = dockerOutput.split('\n').filter(name => name.includes(siteName));
          if (containers.length > 0) {
            this.dockerContainer = containers[0];
            this.wpCliMethod = 'docker';
            console.log(`Found Local by Flywheel Docker container: ${this.dockerContainer}`);
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.log('Docker not detected, trying different method');
      return false;
    }
  }

  /**
   * Run a WP-CLI command
   * @param {string} command - The WP-CLI command to run (without the 'wp' prefix)
   * @param {Object} options - Additional options for the command
   * @returns {Promise<Object>} - The result of the command execution
   */
  async runCommand(command, options = {}) {
    try {
      const { format = 'json', ...otherOptions } = options;
      
      // Build command arguments string
      const args = Object.entries(otherOptions)
        .map(([key, value]) => {
          if (typeof value === 'boolean') {
            return value ? `--${key}` : '';
          }
          return `--${key}="${value}"`;
        })
        .filter(Boolean)
        .join(' ');
      
      // Add format flag if needed
      const formatFlag = format ? `--format=${format}` : '';
      
      // Full command to execute
      let fullCommand;
      
      switch (this.wpCliMethod) {
        case 'direct':
          fullCommand = `cd ${this.wpPath} && wp ${command} ${args} ${formatFlag}`;
          break;
          
        case 'docker':
          fullCommand = `docker exec -it ${this.dockerContainer} wp ${command} ${args} ${formatFlag}`;
          break;
          
        case 'phar':
          fullCommand = `cd ${this.wpPath} && php wp-cli.phar ${command} ${args} ${formatFlag}`;
          break;
          
        default:
          throw new Error('No WP-CLI execution method configured');
      }
      
      console.log(`Executing command: ${fullCommand}`);
      const { stdout, stderr } = await execPromise(fullCommand);
      
      if (stderr && !stderr.includes('Warning:')) {
        throw new Error(stderr);
      }
      
      // Parse JSON output if format is json
      if (format === 'json' && stdout.trim()) {
        try {
          return JSON.parse(stdout);
        } catch (e) {
          console.error('Failed to parse JSON output:', e);
          return { raw: stdout, error: 'Failed to parse JSON output' };
        }
      }
      
      return { output: stdout };
    } catch (error) {
      console.error(`WP-CLI command failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get WordPress core information
   */
  async getCoreInfo() {
    return this.runCommand('core version');
  }

  /**
   * Get list of plugins
   * @param {Object} options - Options for the command
   */
  async getPlugins(options = {}) {
    return this.runCommand('plugin list', options);
  }

  /**
   * Get plugin details
   * @param {string} plugin - Plugin slug
   */
  async getPluginDetails(plugin) {
    return this.runCommand(`plugin get ${plugin}`);
  }

  /**
   * Activate a plugin
   * @param {string} plugin - Plugin slug
   */
  async activatePlugin(plugin) {
    return this.runCommand(`plugin activate ${plugin}`, { format: '' });
  }

  /**
   * Deactivate a plugin
   * @param {string} plugin - Plugin slug
   */
  async deactivatePlugin(plugin) {
    return this.runCommand(`plugin deactivate ${plugin}`, { format: '' });
  }

  /**
   * Get list of themes
   */
  async getThemes() {
    return this.runCommand('theme list');
  }

  /**
   * Get theme details
   * @param {string} theme - Theme name
   */
  async getThemeDetails(theme) {
    return this.runCommand(`theme get ${theme}`);
  }

  /**
   * Activate a theme
   * @param {string} theme - Theme name
   */
  async activateTheme(theme) {
    return this.runCommand(`theme activate ${theme}`, { format: '' });
  }

  /**
   * Get list of users
   * @param {Object} options - Options for the command
   */
  async getUsers(options = {}) {
    return this.runCommand('user list', options);
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   */
  async createUser(userData) {
    const { username, email, password, role = 'subscriber', ...otherData } = userData;
    
    // Required parameters
    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required to create a user');
    }
    
    const command = `user create ${username} ${email}`;
    
    // Build options
    const options = {
      format: '',
      role,
      password,
      ...otherData
    };
    
    return this.runCommand(command, options);
  }

  /**
   * Update a user
   * @param {number} userId - User ID
   * @param {Object} userData - User data to update
   */
  async updateUser(userId, userData) {
    if (!userId) {
      throw new Error('User ID is required to update a user');
    }
    
    return this.runCommand(`user update ${userId}`, { format: '', ...userData });
  }

  /**
   * Delete a user
   * @param {number} userId - User ID
   * @param {boolean} reassign - Reassign posts to another user ID
   */
  async deleteUser(userId, reassign = null) {
    if (!userId) {
      throw new Error('User ID is required to delete a user');
    }
    
    const options = { format: '' };
    if (reassign) {
      options.reassign = reassign;
    }
    
    return this.runCommand(`user delete ${userId}`, options);
  }

  /**
   * Get media items
   */
  async getMedia(options = {}) {
    return this.runCommand('media list', options);
  }

  /**
   * Get options
   * @param {string} option - Option name
   */
  async getOption(option) {
    return this.runCommand(`option get ${option}`, { format: '' });
  }

  /**
   * Update an option
   * @param {string} option - Option name
   * @param {string} value - Option value
   */
  async updateOption(option, value) {
    return this.runCommand(`option update ${option} "${value}"`, { format: '' });
  }

  /**
   * Run a database query
   * @param {string} sql - SQL query
   */
  async dbQuery(sql) {
    // Sanitize the SQL to only allow SELECT statements
    if (!sql.trim().toLowerCase().startsWith('select')) {
      throw new Error('Only SELECT queries are allowed for security reasons');
    }
    
    return this.runCommand('db query', { format: '', query: sql });
  }

  /**
   * Get site information
   */
  async getSiteInfo() {
    try {
      const url = await this.runCommand('option get siteurl', { format: '' });
      const title = await this.runCommand('option get blogname', { format: '' });
      const description = await this.runCommand('option get blogdescription', { format: '' });
      const adminEmail = await this.runCommand('option get admin_email', { format: '' });
      
      return {
        url: url.output.trim(),
        title: title.output.trim(),
        description: description.output.trim(),
        adminEmail: adminEmail.output.trim()
      };
    } catch (error) {
      console.error(`Failed to get site info: ${error.message}`);
      throw error;
    }
  }
}

// For testing as a standalone script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tester = async () => {
    try {
      const wpCliExecutor = new WPCLIExecutor();
      await wpCliExecutor.initialize();
      
      console.log('Testing WP-CLI executor...');
      const coreInfo = await wpCliExecutor.getCoreInfo();
      console.log('WordPress version:', coreInfo);
      
      const plugins = await wpCliExecutor.getPlugins();
      console.log('Plugins:', plugins);
      
    } catch (error) {
      console.error('Test failed:', error);
    }
  };
  
  tester();
}
