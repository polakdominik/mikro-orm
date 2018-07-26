"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const mongodb_1 = require("mongodb");
const EntityManager_1 = require("./EntityManager");
let em;
function getMetadataStorage(entity) {
    if (!global['MIKRO-ORM-STORAGE']) {
        global['MIKRO-ORM-STORAGE'] = {};
    }
    const storage = global['MIKRO-ORM-STORAGE'];
    if (entity && !storage[entity]) {
        storage[entity] = {};
    }
    return storage;
}
exports.getMetadataStorage = getMetadataStorage;
function getEntityManager() {
    if (!em) {
        throw new Error('Call MikroORM.init() first!');
    }
    return em;
}
exports.getEntityManager = getEntityManager;
class MikroORM {
    constructor(options) {
        this.options = options;
        if (!this.options.dbName) {
            throw new Error('No database specified, please fill in `dbName` option');
        }
        if (!this.options.entitiesDirs || this.options.entitiesDirs.length === 0) {
            throw new Error('No directories for entity discovery specified, please fill in `entitiesDirs` option');
        }
        if (!this.options.logger) {
            this.options.logger = () => null;
        }
        if (!this.options.baseDir) {
            this.options.baseDir = process.cwd();
        }
        if (!this.options.clientUrl) {
            this.options.clientUrl = 'mongodb://localhost:27017';
        }
    }
    static async init(options) {
        const orm = new MikroORM(options);
        const db = await orm.connect();
        em = orm.em = new EntityManager_1.EntityManager(db, orm.options);
        return orm;
    }
    async connect() {
        this.client = await mongodb_1.MongoClient.connect(this.options.clientUrl, { useNewUrlParser: true });
        this.db = this.client.db(this.options.dbName);
        const clientUrl = this.options.clientUrl.replace(/\/\/(\w+):(\w+)@/, '//$1:*****@');
        this.options.logger(`MikroORM: successfully connected to database ${this.options.dbName} on ${clientUrl}`);
        return this.db;
    }
    isConnected() {
        return this.client.isConnected();
    }
    async close(force = false) {
        return this.client.close(force);
    }
}
exports.MikroORM = MikroORM;
