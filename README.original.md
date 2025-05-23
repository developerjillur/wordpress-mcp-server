# WordPress MCP Server

A powerful Model Context Protocol (MCP) server specifically designed for WordPress development. This server automatically detects and connects to WordPress databases, providing powerful tools for AI assistants to interact with your WordPress site.

## Features

- 🔍 **Automatic WordPress Detection**: Automatically finds and parses your wp-config.php
- 🔌 **Local by Flywheel Support**: Special handling for Local by Flywheel socket connections
- 🛠️ **Rich WordPress API**: Tools for posts, users, options, and direct SQL queries
- 📊 **Database Schema Awareness**: Built-in knowledge of WordPress table structures
- 🚀 **Easy Deployment**: Simple deployment script to any WordPress project
- 🔒 **Secure Access**: Safe and controlled database access for AI assistants

## Installation

1. Navigate to the mcp-server directory:
```bash
cd mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Configure your database connection in `.env` file (already configured for your setup)

## Configuration

The server is pre-configured for your Local by Flywheel WordPress setup:

- **Database**: local
- **User**: root
- **Password**: root
- **Socket**: /Users/developerjillur/Library/Application Support/Local/run/pm8rucPdU/mysql/mysqld.sock
- **Table Prefix**: wp_

## Available Tools

### 1. get_posts_count
Get the total count of WordPress posts with optional filtering.

**Parameters:**
- `post_status` (optional): Filter by post status (publish, draft, private, etc.)
- `post_type` (optional): Filter by post type (post, page, custom post type)

### 2. get_posts_list
Get a detailed list of WordPress posts.

**Parameters:**
- `limit` (optional): Number of posts to retrieve (default: 10)
- `offset` (optional): Number of posts to skip (default: 0)
- `post_status` (optional): Filter by post status (default: publish)
- `post_type` (optional): Filter by post type (default: post)
- `order_by` (optional): Order by field (post_date, post_title, ID)
- `order` (optional): Order direction (ASC or DESC)

### 3. execute_custom_query
Execute custom SQL SELECT queries safely.

**Parameters:**
- `query` (required): The SQL query to execute (must be a SELECT statement)

### 4. get_database_info
Get comprehensive information about the WordPress database structure.

### 5. check_database_performance
Analyze database performance and get optimization suggestions.

### 6. get_table_info
Get detailed information about a specific WordPress table.

**Parameters:**
- `table_name` (required): Name of the table (without prefix, e.g., "posts", "users")

## Usage

### Testing the Server
```bash
npm test
```

### Running the Server
```bash
npm start
```

### Development Mode (with auto-reload)
```bash
npm run dev
```

## Example Queries

1. **Get all published posts count:**
   - Tool: `get_posts_count`
   - Parameters: `{"post_status": "publish", "post_type": "post"}`

2. **Get latest 5 posts:**
   - Tool: `get_posts_list`
   - Parameters: `{"limit": 5, "order_by": "post_date", "order": "DESC"}`

3. **Custom query to find posts by author:**
   - Tool: `execute_custom_query`
   - Parameters: `{"query": "SELECT post_title, post_date FROM wp_posts WHERE post_author = 1 AND post_status = 'publish'"}`

4. **Check database performance:**
   - Tool: `check_database_performance`
   - Parameters: `{}`

## Security Features

- Only SELECT queries are allowed for custom queries
- Database credentials are stored securely in environment variables
- Input validation and sanitization
- Connection pooling and proper connection handling

## Database Schema Support

The server works with standard WordPress database schema including:
- wp_posts
- wp_users
- wp_comments
- wp_options
- wp_postmeta
- wp_usermeta
- wp_terms
- wp_term_taxonomy
- wp_term_relationships

## Troubleshooting

### Connection Issues
1. Ensure Local by Flywheel is running
2. Verify the MySQL socket path in `.env`
3. Check database credentials
4. Test connection with `npm test`

### Query Issues
1. Ensure proper table names with correct prefix
2. Use only SELECT statements for custom queries
3. Check column names and data types

## Performance Tips

1. Use LIMIT clauses for large result sets
2. Index frequently queried columns
3. Regular database maintenance and optimization
4. Monitor query execution times

## Support

For issues or questions, check the server logs and ensure your Local by Flywheel setup is properly configured.
