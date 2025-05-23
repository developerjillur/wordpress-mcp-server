import fs from 'fs/promises';
import path from 'path';

/**
 * WP Config Parser - Automatically extracts database settings from wp-config.php
 */
export async function parseWPConfig(wpConfigPath = '../wp-config.php') {
  try {
    // Read the wp-config.php file
    const content = await fs.readFile(wpConfigPath, 'utf8');
    
    // Extract database settings using regex
    const dbSettings = {
      host: extractConfigValue(content, 'DB_HOST') || 'localhost',
      user: extractConfigValue(content, 'DB_USER') || 'root',
      password: extractConfigValue(content, 'DB_PASSWORD') || 'root',
      database: extractConfigValue(content, 'DB_NAME') || 'local',
      table_prefix: extractTablePrefix(content) || 'wp_',
    };
    
    // Try to find the socket path for Local by Flywheel
    const socketPath = await findLocalByFlywheelSocket();
    if (socketPath) {
      dbSettings.socketPath = socketPath;
    }
    
    return dbSettings;
  } catch (error) {
    console.error('Error parsing wp-config.php:', error.message);
    // Return default settings if parsing fails
    return {
      host: 'localhost',
      user: 'root',
      password: 'root',
      database: 'local',
      table_prefix: 'wp_'
    };
  }
}

/**
 * Extract a specific config value from wp-config.php content
 */
function extractConfigValue(content, key) {
  const regex = new RegExp(`define\\s*\\(\\s*['"]${key}['"]\\s*,\\s*['"]([^'"]+)['"]\\s*\\)`, 'i');
  const match = content.match(regex);
  return match ? match[1] : null;
}

/**
 * Extract the table prefix from wp-config.php content
 */
function extractTablePrefix(content) {
  const regex = /\$table_prefix\s*=\s*['"]([^'"]+)['"]/i;
  const match = content.match(regex);
  return match ? match[1] : null;
}

/**
 * Try to find the Local by Flywheel MySQL socket path
 */
async function findLocalByFlywheelSocket() {
  try {
    // Check common Local by Flywheel paths
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    
    // Different patterns Local by Flywheel might use
    const patterns = [
      path.join(homeDir, 'Library/Application Support/Local/run/*/mysql/mysqld.sock'),
      // Add more patterns if needed
    ];
    
    // Use the first socket file found that exists
    for (const pattern of patterns) {
      // This is a simplified approach - in a real implementation you'd use glob
      // For now, we'll just check if there's a directory with this structure
      const localDir = path.join(homeDir, 'Library/Application Support/Local/run');
      
      try {
        const dirs = await fs.readdir(localDir);
        for (const dir of dirs) {
          const socketPath = path.join(localDir, dir, 'mysql/mysqld.sock');
          try {
            await fs.access(socketPath);
            return socketPath; // Return the first valid socket found
          } catch {
            continue; // Socket doesn't exist, try the next one
          }
        }
      } catch {
        // Directory doesn't exist or can't be read
      }
    }
    
    return null; // No socket found
  } catch (error) {
    console.error('Error finding Local by Flywheel socket:', error.message);
    return null;
  }
}
