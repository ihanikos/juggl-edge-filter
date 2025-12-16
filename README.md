# Juggl Edge Filter

An Obsidian plugin that allows you to filter edges (relationships) in Juggl graphs by type. Show only specific relationship types or hide unwanted ones with simple commands.

## Features

- **Whitelist Mode**: Show only specific edge types, hiding all others
- **Blacklist Mode**: Hide specific edge types, showing all others
- **Quick Commands**: Filter edges without opening settings
- **Universal**: Works with any relationship field names in your vault
- **Real-time**: Changes apply immediately to all open Juggl graphs

## Requirements

- [Obsidian](https://obsidian.md/)
- [Juggl plugin](https://github.com/HEmile/juggl)

## Installation

1. Copy the `juggl-edge-filter` folder to your vault's `.obsidian/plugins/` directory
2. Restart Obsidian or reload plugins
3. Enable "Juggl Edge Filter" in Settings → Community plugins

## Usage

### Commands

Open the command palette (Ctrl/Cmd + P) and use:

- **Show only specific edge types**: Enter edge types to display (whitelist mode)
- **Hide specific edge types**: Enter edge types to hide (blacklist mode)
- **Show all edges**: Clear all filters

When prompted, enter relationship types separated by commas (e.g., `parent, child, sibling`).

### Settings

Go to Settings → Juggl Edge Filter to:
- View current filter status
- Manually configure filter mode (whitelist/blacklist)
- Set edge types to filter
- See available commands

## How It Works

The plugin uses Juggl's API to access the Cytoscape.js graph instance directly. When you apply a filter, it:

1. Finds all active Juggl graphs
2. Accesses the Cytoscape instance (`viz`) for each graph
3. Uses Cytoscape's `.hide()` and `.show()` methods to filter edges by their `type` attribute

This approach is more reliable than CSS-based filtering and works consistently across different Juggl view types.

## Examples

### Show only parent relationships
Command: "Show only specific edge types" → Enter: `parent`

Result: Only edges with `type="parent"` are visible

### Hide sibling and friend relationships
Command: "Hide specific edge types" → Enter: `sibling, friend`

Result: All edges except those with `type="sibling"` or `type="friend"` are visible

### Clear all filters
Command: "Show all edges"

Result: All relationship types are visible

## Technical Details

- **API Used**: Juggl Plugin API + Cytoscape.js
- **Filter Method**: Direct Cytoscape edge manipulation
- **Compatibility**: Works with any Juggl graph view (local, global, workspace, embedded)
- **Edge Detection**: Filters based on Cytoscape edge `type` attribute

## Troubleshooting

**No active graphs found**: Make sure you have a Juggl graph view open when running commands.

**Edges not filtering**: Check the developer console (Ctrl+Shift+I) for error messages. The plugin logs its operations with the prefix "JugglEdgeFilter:".

**Plugin not appearing**: Verify the plugin is enabled in Settings → Community plugins.

## License

MIT

## Author

Custom plugin created for personal use.
