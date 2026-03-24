import { defineCommand } from "citty";
import consola from "consola";
import { getByKey, getRange, getByPrefix, countRecords, doesExist, stats, drop } from "./reader.js";

export const lmdbReaderCommand = defineCommand({

    meta: {
        name: 'lm-read',
        description: 'Read and inspect data from an LMDB database'
    },

    args: {
        path: { type: 'string', description: 'Path to the LMDB database file', required: true },
        name: { type: 'string', description: 'Name of the LMDB database', required: true },
        operation: { type: 'enum', description: 'Operation to perform', options: ['get', 'range', 'prefix', 'count', 'exists', 'stats', 'drop'], required: true },
        key: { type: 'string', description: 'Exact key to look up (required for: get, exists)', required: false },
        prefix: { type: 'string', description: 'Key prefix to search (required for: prefix)', required: false },
        limit:{ type: 'string', description: 'Max number of records to return (used by: range, prefix — default: 10)', required: false },
    },

    async run({ args }) {
        const { path: dbPath, name: dbName, operation, key, prefix } = args;
        const limit = args.limit ? parseInt(args.limit, 10) : 10;

        switch (operation) {
            case 'get':
                if (!key) { consola.error('--key is required for the get operation'); process.exit(1); }
                getByKey(dbPath, dbName, key);
                break;

            case 'range':
                getRange(dbPath, dbName, limit);
                break;

            case 'prefix':
                if (!prefix) { consola.error('--prefix is required for the prefix operation'); process.exit(1); }
                getByPrefix(dbPath, dbName, prefix, limit);
                break;

            case 'count':
                countRecords(dbPath, dbName);
                break;

            case 'exists':
                if (!key) { consola.error('--key is required for the exists operation'); process.exit(1); }
                doesExist(dbPath, dbName, key);
                break;

            case 'stats':
                stats(dbPath, dbName);
                break;

            case 'drop':
                consola.warn(`You are about to drop the entire "${dbName}" database at ${dbPath}. This is irreversible.`);
                await drop(dbPath, dbName);
                break;

            default:
                consola.error(`Unknown operation: ${String(operation)}`);
                process.exit(1);
        }
    }
});