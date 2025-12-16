const { Plugin, PluginSettingTab, Setting, Notice, Modal } = require('obsidian');

const DEFAULT_SETTINGS = {
    mode: 'blacklist',
    edgeTypes: '',
    filterEnabled: false,
    hideIsolated: false
};

module.exports = class JugglEdgeFilterPlugin extends Plugin {
    async onload() {
        await this.loadSettings();
        this.addSettingTab(new JugglEdgeFilterSettingTab(this.app, this));

        this.addCommand({
            id: 'show-all-edges',
            name: 'Show all edges',
            callback: async () => {
                this.settings.filterEnabled = false;
                await this.saveSettings();
                new Notice('Showing all edges');
            }
        });

        this.addCommand({
            id: 'show-only-types',
            name: 'Show only specific edge types',
            callback: async () => {
                const input = await this.promptForEdgeTypes('Enter edge types to show (comma-separated)');
                if (input) {
                    this.settings.mode = 'whitelist';
                    this.settings.edgeTypes = input;
                    this.settings.filterEnabled = true;
                    await this.saveSettings();
                    new Notice(`Showing only: ${input}`);
                }
            }
        });

        this.addCommand({
            id: 'hide-types',
            name: 'Hide specific edge types',
            callback: async () => {
                const input = await this.promptForEdgeTypes('Enter edge types to hide (comma-separated)');
                if (input) {
                    this.settings.mode = 'blacklist';
                    this.settings.edgeTypes = input;
                    this.settings.filterEnabled = true;
                    await this.saveSettings();
                    new Notice(`Hiding: ${input}`);
                }
            }
        });

        this.addCommand({
            id: 'hide-isolated-nodes',
            name: 'Hide isolated nodes (no connections)',
            callback: async () => {
                this.settings.hideIsolated = true;
                await this.saveSettings();
                new Notice('Hiding isolated nodes');
            }
        });

        this.addCommand({
            id: 'show-all-nodes',
            name: 'Show all nodes',
            callback: async () => {
                this.settings.hideIsolated = false;
                await this.saveSettings();
                new Notice('Showing all nodes');
            }
        });

        this.applyEdgeFilter();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.applyEdgeFilter();
    }

    async promptForEdgeTypes(promptText) {
        return new Promise((resolve) => {
            const modal = new EdgeTypePromptModal(this.app, promptText, (result) => {
                resolve(result);
            });
            modal.open();
        });
    }

    getJugglPlugin() {
        return this.app.plugins.plugins['juggl'];
    }

    applyEdgeFilter() {
        const jugglPlugin = this.getJugglPlugin();
        if (!jugglPlugin) {
            new Notice('Juggl plugin not found');
            console.log('JugglEdgeFilter: Juggl plugin not found');
            return;
        }

        console.log('JugglEdgeFilter: Juggl plugin found', jugglPlugin);

        // Access active Juggl graphs - it's a function, not a property
        const activeGraphs = jugglPlugin.activeGraphs();
        console.log('JugglEdgeFilter: activeGraphs:', activeGraphs);
        if (!activeGraphs || activeGraphs.length === 0) {
            new Notice('No active Juggl graphs found');
            console.log('JugglEdgeFilter: No active graphs');
            return;
        }

        console.log('JugglEdgeFilter: Found active graphs:', activeGraphs.length);

        // Filter out undefined/null graphs
        const validGraphs = activeGraphs.filter(g => g != null);
        console.log('JugglEdgeFilter: Valid graphs:', validGraphs.length);

        validGraphs.forEach(graph => {
            console.log('JugglEdgeFilter: Processing graph:', graph);
            if (!graph || !graph.viz) {
                console.log('JugglEdgeFilter: No viz on graph');
                return;
            }

            const cy = graph.viz;
            console.log('JugglEdgeFilter: Got Cytoscape instance, edges:', cy.edges().length);

            if (!this.settings.filterEnabled) {
                // Show all edges
                cy.edges().show();
                return;
            }

            const edgeTypes = this.settings.edgeTypes
                .split(',')
                .map(t => t.trim())
                .filter(t => t.length > 0);

            if (edgeTypes.length === 0) {
                cy.edges().show();
                return;
            }

            if (this.settings.mode === 'whitelist') {
                // Hide all edges first
                cy.edges().hide();
                // Show only specified types
                edgeTypes.forEach(type => {
                    cy.edges(`[type="${type}"]`).show();
                });
            } else {
                // Show all edges first
                cy.edges().show();
                // Hide specified types
                edgeTypes.forEach(type => {
                    cy.edges(`[type="${type}"]`).hide();
                });
            }

            // After filtering edges, update node visibility based on hideIsolated setting
            if (this.settings.hideIsolated) {
                // First show all nodes, then hide the isolated ones
                // This ensures previously hidden nodes that now have edges are shown
                cy.nodes().show();
                cy.nodes().filter(node => {
                    // Count visible connected edges
                    const visibleEdges = node.connectedEdges().filter(edge => edge.visible());
                    return visibleEdges.length === 0;
                }).hide();
            } else {
                // Show all nodes if hideIsolated is disabled
                cy.nodes().show();
            }
        });
    }

    async onunload() {
        // Show all edges and nodes when plugin is disabled
        const jugglPlugin = this.getJugglPlugin();
        if (jugglPlugin && jugglPlugin.activeGraphs) {
            const activeGraphs = jugglPlugin.activeGraphs();
            activeGraphs.forEach(graph => {
                if (graph && graph.viz) {
                    graph.viz.edges().show();
                    graph.viz.nodes().show();
                }
            });
        }
    }
};

class JugglEdgeFilterSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display() {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'Juggl Edge Filter Settings' });

        containerEl.createEl('p', {
            text: 'Use commands (Ctrl+P) for quick filtering: "Show only specific edge types", "Hide specific edge types", or "Show all edges".',
            cls: 'setting-item-description'
        });

        containerEl.createEl('h3', { text: 'Current Filter Status' });

        const statusText = this.plugin.settings.filterEnabled
            ? `Active: ${this.plugin.settings.mode === 'whitelist' ? 'Showing only' : 'Hiding'} "${this.plugin.settings.edgeTypes}"`
            : 'Inactive (showing all edges)';

        containerEl.createEl('p', {
            text: statusText,
            cls: 'setting-item-description'
        });

        containerEl.createEl('h3', { text: 'Advanced Settings' });

        containerEl.createEl('p', {
            text: 'Modify these settings directly or use the commands above. You can specify multiple edge types separated by commas.',
            cls: 'setting-item-description'
        });

        new Setting(containerEl)
            .setName('Filter mode')
            .setDesc('Whitelist: show only specified types. Blacklist: hide specified types.')
            .addDropdown(dropdown => dropdown
                .addOption('whitelist', 'Whitelist (show only)')
                .addOption('blacklist', 'Blacklist (hide)')
                .setValue(this.plugin.settings.mode)
                .onChange(async (value) => {
                    this.plugin.settings.mode = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Edge types')
            .setDesc('Comma-separated list of edge types (e.g., "parent, child, sibling")')
            .addText(text => text
                .setPlaceholder('parent, child')
                .setValue(this.plugin.settings.edgeTypes)
                .onChange(async (value) => {
                    this.plugin.settings.edgeTypes = value;
                    if (value.trim()) {
                        this.plugin.settings.filterEnabled = true;
                    }
                    await this.plugin.saveSettings();
                }));

        containerEl.createEl('p', {
            text: 'Note: Changes apply immediately. Refresh Juggl graphs to see the effect.',
            cls: 'setting-item-description'
        });
    }
}

class EdgeTypePromptModal extends Modal {
    constructor(app, promptText, onSubmit) {
        super(app);
        this.promptText = promptText;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: this.promptText });

        const inputEl = contentEl.createEl('input', {
            type: 'text',
            placeholder: 'e.g., parent, child, sibling'
        });
        inputEl.style.width = '100%';
        inputEl.style.marginBottom = '10px';

        const buttonContainer = contentEl.createEl('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.justifyContent = 'flex-end';
        buttonContainer.style.gap = '10px';

        const submitBtn = buttonContainer.createEl('button', { text: 'OK' });
        submitBtn.addEventListener('click', () => {
            this.onSubmit(inputEl.value.trim());
            this.close();
        });

        const cancelBtn = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelBtn.addEventListener('click', () => {
            this.onSubmit(null);
            this.close();
        });

        inputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.onSubmit(inputEl.value.trim());
                this.close();
            }
        });

        setTimeout(() => inputEl.focus(), 10);
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
