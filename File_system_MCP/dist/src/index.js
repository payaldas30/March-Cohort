#!/usr/bin/env node
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
// Define memory file path using environment variable with fallback
const defaultMemoryPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'memory.json');
// If MEMORY_FILE_PATH is just a filename, put it in the same directory as the script
const MEMORY_FILE_PATH = process.env.MEMORY_FILE_PATH
    ? path.isAbsolute(process.env.MEMORY_FILE_PATH)
        ? process.env.MEMORY_FILE_PATH
        : path.join(path.dirname(fileURLToPath(import.meta.url)), process.env.MEMORY_FILE_PATH)
    : defaultMemoryPath;
// The KnowledgeGraphManager class contains all operations to interact with the knowledge graph
class KnowledgeGraphManager {
    loadGraph() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield fs.readFile(MEMORY_FILE_PATH, "utf-8");
                const lines = data.split("\n").filter(line => line.trim() !== "");
                return lines.reduce((graph, line) => {
                    const item = JSON.parse(line);
                    if (item.type === "entity")
                        graph.entities.push(item);
                    if (item.type === "relation")
                        graph.relations.push(item);
                    return graph;
                }, { entities: [], relations: [] });
            }
            catch (error) {
                if (error instanceof Error && 'code' in error && error.code === "ENOENT") {
                    return { entities: [], relations: [] };
                }
                throw error;
            }
        });
    }
    saveGraph(graph) {
        return __awaiter(this, void 0, void 0, function* () {
            const lines = [
                ...graph.entities.map(e => JSON.stringify(Object.assign({ type: "entity" }, e))),
                ...graph.relations.map(r => JSON.stringify(Object.assign({ type: "relation" }, r))),
            ];
            yield fs.writeFile(MEMORY_FILE_PATH, lines.join("\n"));
        });
    }
    createEntities(entities) {
        return __awaiter(this, void 0, void 0, function* () {
            const graph = yield this.loadGraph();
            const newEntities = entities.filter(e => !graph.entities.some(existingEntity => existingEntity.name === e.name));
            graph.entities.push(...newEntities);
            yield this.saveGraph(graph);
            return newEntities;
        });
    }
    createRelations(relations) {
        return __awaiter(this, void 0, void 0, function* () {
            const graph = yield this.loadGraph();
            const newRelations = relations.filter(r => !graph.relations.some(existingRelation => existingRelation.from === r.from &&
                existingRelation.to === r.to &&
                existingRelation.relationType === r.relationType));
            graph.relations.push(...newRelations);
            yield this.saveGraph(graph);
            return newRelations;
        });
    }
    addObservations(observations) {
        return __awaiter(this, void 0, void 0, function* () {
            const graph = yield this.loadGraph();
            const results = observations.map(o => {
                const entity = graph.entities.find(e => e.name === o.entityName);
                if (!entity) {
                    throw new Error(`Entity with name ${o.entityName} not found`);
                }
                const newObservations = o.contents.filter(content => !entity.observations.includes(content));
                entity.observations.push(...newObservations);
                return { entityName: o.entityName, addedObservations: newObservations };
            });
            yield this.saveGraph(graph);
            return results;
        });
    }
    deleteEntities(entityNames) {
        return __awaiter(this, void 0, void 0, function* () {
            const graph = yield this.loadGraph();
            graph.entities = graph.entities.filter(e => !entityNames.includes(e.name));
            graph.relations = graph.relations.filter(r => !entityNames.includes(r.from) && !entityNames.includes(r.to));
            yield this.saveGraph(graph);
        });
    }
    deleteObservations(deletions) {
        return __awaiter(this, void 0, void 0, function* () {
            const graph = yield this.loadGraph();
            deletions.forEach(d => {
                const entity = graph.entities.find(e => e.name === d.entityName);
                if (entity) {
                    entity.observations = entity.observations.filter(o => !d.observations.includes(o));
                }
            });
            yield this.saveGraph(graph);
        });
    }
    deleteRelations(relations) {
        return __awaiter(this, void 0, void 0, function* () {
            const graph = yield this.loadGraph();
            graph.relations = graph.relations.filter(r => !relations.some(delRelation => r.from === delRelation.from &&
                r.to === delRelation.to &&
                r.relationType === delRelation.relationType));
            yield this.saveGraph(graph);
        });
    }
    readGraph() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.loadGraph();
        });
    }
    // Very basic search function
    searchNodes(query) {
        return __awaiter(this, void 0, void 0, function* () {
            const graph = yield this.loadGraph();
            // Filter entities
            const filteredEntities = graph.entities.filter(e => e.name.toLowerCase().includes(query.toLowerCase()) ||
                e.entityType.toLowerCase().includes(query.toLowerCase()) ||
                e.observations.some(o => o.toLowerCase().includes(query.toLowerCase())));
            // Create a Set of filtered entity names for quick lookup
            const filteredEntityNames = new Set(filteredEntities.map(e => e.name));
            // Filter relations to only include those between filtered entities
            const filteredRelations = graph.relations.filter(r => filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to));
            const filteredGraph = {
                entities: filteredEntities,
                relations: filteredRelations,
            };
            return filteredGraph;
        });
    }
    openNodes(names) {
        return __awaiter(this, void 0, void 0, function* () {
            const graph = yield this.loadGraph();
            // Filter entities
            const filteredEntities = graph.entities.filter(e => names.includes(e.name));
            // Create a Set of filtered entity names for quick lookup
            const filteredEntityNames = new Set(filteredEntities.map(e => e.name));
            // Filter relations to only include those between filtered entities
            const filteredRelations = graph.relations.filter(r => filteredEntityNames.has(r.from) && filteredEntityNames.has(r.to));
            const filteredGraph = {
                entities: filteredEntities,
                relations: filteredRelations,
            };
            return filteredGraph;
        });
    }
}
const knowledgeGraphManager = new KnowledgeGraphManager();
// The server instance and tools exposed to Claude
const server = new Server({
    name: "memory-server",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, () => __awaiter(void 0, void 0, void 0, function* () {
    return {
        tools: [
            {
                name: "create_entities",
                description: "Create multiple new entities in the knowledge graph",
                inputSchema: {
                    type: "object",
                    properties: {
                        entities: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string", description: "The name of the entity" },
                                    entityType: { type: "string", description: "The type of the entity" },
                                    observations: {
                                        type: "array",
                                        items: { type: "string" },
                                        description: "An array of observation contents associated with the entity"
                                    },
                                },
                                required: ["name", "entityType", "observations"],
                            },
                        },
                    },
                    required: ["entities"],
                },
            },
            {
                name: "create_relations",
                description: "Create multiple new relations between entities in the knowledge graph. Relations should be in active voice",
                inputSchema: {
                    type: "object",
                    properties: {
                        relations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    from: { type: "string", description: "The name of the entity where the relation starts" },
                                    to: { type: "string", description: "The name of the entity where the relation ends" },
                                    relationType: { type: "string", description: "The type of the relation" },
                                },
                                required: ["from", "to", "relationType"],
                            },
                        },
                    },
                    required: ["relations"],
                },
            },
            {
                name: "add_observations",
                description: "Add new observations to existing entities in the knowledge graph",
                inputSchema: {
                    type: "object",
                    properties: {
                        observations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    entityName: { type: "string", description: "The name of the entity to add the observations to" },
                                    contents: {
                                        type: "array",
                                        items: { type: "string" },
                                        description: "An array of observation contents to add"
                                    },
                                },
                                required: ["entityName", "contents"],
                            },
                        },
                    },
                    required: ["observations"],
                },
            },
            {
                name: "delete_entities",
                description: "Delete multiple entities and their associated relations from the knowledge graph",
                inputSchema: {
                    type: "object",
                    properties: {
                        entityNames: {
                            type: "array",
                            items: { type: "string" },
                            description: "An array of entity names to delete"
                        },
                    },
                    required: ["entityNames"],
                },
            },
            {
                name: "delete_observations",
                description: "Delete specific observations from entities in the knowledge graph",
                inputSchema: {
                    type: "object",
                    properties: {
                        deletions: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    entityName: { type: "string", description: "The name of the entity containing the observations" },
                                    observations: {
                                        type: "array",
                                        items: { type: "string" },
                                        description: "An array of observations to delete"
                                    },
                                },
                                required: ["entityName", "observations"],
                            },
                        },
                    },
                    required: ["deletions"],
                },
            },
            {
                name: "delete_relations",
                description: "Delete multiple relations from the knowledge graph",
                inputSchema: {
                    type: "object",
                    properties: {
                        relations: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    from: { type: "string", description: "The name of the entity where the relation starts" },
                                    to: { type: "string", description: "The name of the entity where the relation ends" },
                                    relationType: { type: "string", description: "The type of the relation" },
                                },
                                required: ["from", "to", "relationType"],
                            },
                            description: "An array of relations to delete"
                        },
                    },
                    required: ["relations"],
                },
            },
            {
                name: "read_graph",
                description: "Read the entire knowledge graph",
                inputSchema: {
                    type: "object",
                    properties: {},
                },
            },
            {
                name: "search_nodes",
                description: "Search for nodes in the knowledge graph based on a query",
                inputSchema: {
                    type: "object",
                    properties: {
                        query: { type: "string", description: "The search query to match against entity names, types, and observation content" },
                    },
                    required: ["query"],
                },
            },
            {
                name: "open_nodes",
                description: "Open specific nodes in the knowledge graph by their names",
                inputSchema: {
                    type: "object",
                    properties: {
                        names: {
                            type: "array",
                            items: { type: "string" },
                            description: "An array of entity names to retrieve",
                        },
                    },
                    required: ["names"],
                },
            },
        ],
    };
}));
server.setRequestHandler(CallToolRequestSchema, (request) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, arguments: args } = request.params;
    if (!args) {
        throw new Error(`No arguments provided for tool: ${name}`);
    }
    switch (name) {
        case "create_entities":
            return { content: [{ type: "text", text: JSON.stringify(yield knowledgeGraphManager.createEntities(args.entities), null, 2) }] };
        case "create_relations":
            return { content: [{ type: "text", text: JSON.stringify(yield knowledgeGraphManager.createRelations(args.relations), null, 2) }] };
        case "add_observations":
            return { content: [{ type: "text", text: JSON.stringify(yield knowledgeGraphManager.addObservations(args.observations), null, 2) }] };
        case "delete_entities":
            yield knowledgeGraphManager.deleteEntities(args.entityNames);
            return { content: [{ type: "text", text: "Entities deleted successfully" }] };
        case "delete_observations":
            yield knowledgeGraphManager.deleteObservations(args.deletions);
            return { content: [{ type: "text", text: "Observations deleted successfully" }] };
        case "delete_relations":
            yield knowledgeGraphManager.deleteRelations(args.relations);
            return { content: [{ type: "text", text: "Relations deleted successfully" }] };
        case "read_graph":
            return { content: [{ type: "text", text: JSON.stringify(yield knowledgeGraphManager.readGraph(), null, 2) }] };
        case "search_nodes":
            return { content: [{ type: "text", text: JSON.stringify(yield knowledgeGraphManager.searchNodes(args.query), null, 2) }] };
        case "open_nodes":
            return { content: [{ type: "text", text: JSON.stringify(yield knowledgeGraphManager.openNodes(args.names), null, 2) }] };
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}));
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const transport = new StdioServerTransport();
        yield server.connect(transport);
        console.error("Knowledge Graph MCP Server running on stdio");
    });
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
