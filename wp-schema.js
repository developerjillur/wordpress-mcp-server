/**
 * WordPress Schema Helper
 * Maps WordPress database tables and provides common operations
 */

export class WordPressSchema {
  constructor(tablePrefix = 'wp_') {
    this.prefix = tablePrefix;
    this.tables = this.mapTables();
  }

  /**
   * Map all standard WordPress tables
   */
  mapTables() {
    const p = this.prefix;
    return {
      posts: {
        name: `${p}posts`,
        primaryKey: 'ID',
        fields: [
          'ID', 'post_author', 'post_date', 'post_date_gmt', 'post_content', 'post_title', 
          'post_excerpt', 'post_status', 'comment_status', 'ping_status', 'post_password', 'post_name',
          'to_ping', 'pinged', 'post_modified', 'post_modified_gmt', 'post_content_filtered',
          'post_parent', 'guid', 'menu_order', 'post_type', 'post_mime_type', 'comment_count'
        ]
      },
      postmeta: {
        name: `${p}postmeta`,
        primaryKey: 'meta_id',
        fields: ['meta_id', 'post_id', 'meta_key', 'meta_value'],
        relations: {
          post: { table: `${p}posts`, foreignKey: 'post_id', targetKey: 'ID' }
        }
      },
      users: {
        name: `${p}users`,
        primaryKey: 'ID',
        fields: [
          'ID', 'user_login', 'user_pass', 'user_nicename', 'user_email', 'user_url',
          'user_registered', 'user_activation_key', 'user_status', 'display_name'
        ]
      },
      usermeta: {
        name: `${p}usermeta`,
        primaryKey: 'umeta_id',
        fields: ['umeta_id', 'user_id', 'meta_key', 'meta_value'],
        relations: {
          user: { table: `${p}users`, foreignKey: 'user_id', targetKey: 'ID' }
        }
      },
      comments: {
        name: `${p}comments`,
        primaryKey: 'comment_ID',
        fields: [
          'comment_ID', 'comment_post_ID', 'comment_author', 'comment_author_email',
          'comment_author_url', 'comment_author_IP', 'comment_date', 'comment_date_gmt',
          'comment_content', 'comment_karma', 'comment_approved', 'comment_agent',
          'comment_type', 'comment_parent', 'user_id'
        ],
        relations: {
          post: { table: `${p}posts`, foreignKey: 'comment_post_ID', targetKey: 'ID' },
          user: { table: `${p}users`, foreignKey: 'user_id', targetKey: 'ID' }
        }
      },
      commentmeta: {
        name: `${p}commentmeta`,
        primaryKey: 'meta_id',
        fields: ['meta_id', 'comment_id', 'meta_key', 'meta_value'],
        relations: {
          comment: { table: `${p}comments`, foreignKey: 'comment_id', targetKey: 'comment_ID' }
        }
      },
      terms: {
        name: `${p}terms`,
        primaryKey: 'term_id',
        fields: ['term_id', 'name', 'slug', 'term_group']
      },
      term_taxonomy: {
        name: `${p}term_taxonomy`,
        primaryKey: 'term_taxonomy_id',
        fields: ['term_taxonomy_id', 'term_id', 'taxonomy', 'description', 'parent', 'count'],
        relations: {
          term: { table: `${p}terms`, foreignKey: 'term_id', targetKey: 'term_id' }
        }
      },
      term_relationships: {
        name: `${p}term_relationships`,
        primaryKey: ['object_id', 'term_taxonomy_id'],
        fields: ['object_id', 'term_taxonomy_id', 'term_order'],
        relations: {
          taxonomy: { table: `${p}term_taxonomy`, foreignKey: 'term_taxonomy_id', targetKey: 'term_taxonomy_id' }
        }
      },
      options: {
        name: `${p}options`,
        primaryKey: 'option_id',
        fields: ['option_id', 'option_name', 'option_value', 'autoload']
      },
      links: {
        name: `${p}links`,
        primaryKey: 'link_id',
        fields: [
          'link_id', 'link_url', 'link_name', 'link_image', 'link_target',
          'link_description', 'link_visible', 'link_owner', 'link_rating',
          'link_updated', 'link_rel', 'link_notes', 'link_rss'
        ]
      }
    };
  }

  /**
   * Get all WordPress tables
   */
  getAllTables() {
    return Object.values(this.tables).map(table => table.name);
  }

  /**
   * Get a specific table schema
   */
  getTable(tableName) {
    // Remove prefix if it's included
    const normalizedName = tableName.startsWith(this.prefix) 
      ? tableName.substring(this.prefix.length) 
      : tableName;
    
    return this.tables[normalizedName] || null;
  }

  /**
   * Generate common query templates for a specific table
   */
  getQueries(tableName) {
    const table = this.getTable(tableName);
    if (!table) return null;
    
    return {
      select: `SELECT * FROM ${table.name}`,
      selectById: `SELECT * FROM ${table.name} WHERE ${table.primaryKey} = ?`,
      insert: `INSERT INTO ${table.name} (${table.fields.join(', ')}) VALUES (${table.fields.map(() => '?').join(', ')})`,
      update: `UPDATE ${table.name} SET ${table.fields.map(f => `${f} = ?`).join(', ')} WHERE ${table.primaryKey} = ?`,
      delete: `DELETE FROM ${table.name} WHERE ${table.primaryKey} = ?`,
      count: `SELECT COUNT(*) as count FROM ${table.name}`
    };
  }
}
