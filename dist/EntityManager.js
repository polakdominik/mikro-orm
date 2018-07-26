"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
const BaseEntity_1 = require("./BaseEntity");
const EntityRepository_1 = require("./EntityRepository");
const EntityFactory_1 = require("./EntityFactory");
const UnitOfWork_1 = require("./UnitOfWork");
const Utils_1 = require("./Utils");
const MikroORM_1 = require("./MikroORM");
const Collection_1 = require("./Collection");
const Validator_1 = require("./Validator");
class EntityManager {
    constructor(db, options) {
        this.db = db;
        this.options = options;
        this.entityFactory = new EntityFactory_1.EntityFactory(this);
        this.identityMap = {};
        this.validator = new Validator_1.Validator(this.options.strict);
        this.unitOfWork = new UnitOfWork_1.UnitOfWork(this);
        this.repositoryMap = {};
        this.metadata = {};
        this.metadata = MikroORM_1.getMetadataStorage();
    }
    getCollection(entityName) {
        const col = this.metadata[entityName] ? this.metadata[entityName].collection : entityName;
        return this.db.collection(col);
    }
    getRepository(entityName) {
        if (!this.repositoryMap[entityName]) {
            const meta = this.metadata[entityName];
            if (meta.customRepository) {
                const customRepository = meta.customRepository();
                this.repositoryMap[entityName] = new customRepository(this, entityName);
            }
            else {
                this.repositoryMap[entityName] = new EntityRepository_1.EntityRepository(this, entityName);
            }
        }
        return this.repositoryMap[entityName];
    }
    async find(entityName, where = {}, populate = [], orderBy = {}, limit = null, offset = null) {
        const { query, resultSet } = this.buildQuery(entityName, where, orderBy, limit, offset);
        this.options.logger(`[query-logger] ${query}.toArray();`);
        const results = await resultSet.toArray();
        if (results.length === 0) {
            return [];
        }
        const ret = [];
        for (const data of results) {
            const entity = this.merge(entityName, data);
            ret.push(entity);
        }
        for (const field of populate) {
            await this.populateMany(entityName, ret, field);
        }
        return ret;
    }
    async findOne(entityName, where, populate = []) {
        if (!where || (typeof where === 'object' && Object.keys(where).length === 0)) {
            throw new Error(`You cannot call 'EntityManager.findOne()' with empty 'where' parameter`);
        }
        if (where instanceof mongodb_1.ObjectID) {
            where = where.toHexString();
        }
        if (Utils_1.Utils.isString(where) && this.identityMap[`${entityName}-${where}`] && this.identityMap[`${entityName}-${where}`].isInitialized()) {
            await this.populateOne(entityName, this.identityMap[`${entityName}-${where}`], populate);
            return this.identityMap[`${entityName}-${where}`];
        }
        if (Utils_1.Utils.isString(where)) {
            where = { _id: new mongodb_1.ObjectID(where) };
        }
        Utils_1.Utils.renameKey(where, 'id', '_id');
        const query = `db.getCollection("${this.metadata[entityName].collection}").find(${JSON.stringify(where)}).limit(1).next();`;
        this.options.logger(`[query-logger] ${query}`);
        where = Utils_1.Utils.convertObjectIds(where);
        const data = await this.getCollection(entityName).find(where).limit(1).next();
        if (!data) {
            return null;
        }
        const entity = this.merge(entityName, data);
        await this.populateOne(entityName, entity, populate);
        return entity;
    }
    merge(entityName, data) {
        if (!data || (!data.id && !data._id)) {
            throw new Error('You cannot merge entity without id!');
        }
        const entity = data instanceof BaseEntity_1.BaseEntity ? data : this.entityFactory.create(entityName, data, true);
        if (this.identityMap[`${entityName}-${entity.id}`]) {
            entity.assign(data);
            this.unitOfWork.addToIdentityMap(entity);
        }
        else {
            this.addToIdentityMap(entity);
        }
        return entity;
    }
    /**
     * Creates new instance of given entity and populates it with given data
     */
    create(entityName, data) {
        return this.entityFactory.create(entityName, data, false);
    }
    /**
     * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
     */
    getReference(entityName, id) {
        if (this.identityMap[`${entityName}-${id}`]) {
            return this.identityMap[`${entityName}-${id}`];
        }
        return this.entityFactory.createReference(entityName, id);
    }
    async remove(entityName, where) {
        if (where instanceof BaseEntity_1.BaseEntity) {
            return this.removeEntity(where);
        }
        Utils_1.Utils.renameKey(where, 'id', '_id');
        const query = `db.getCollection("${this.metadata[entityName].collection}").deleteMany(${JSON.stringify(where)});`;
        this.options.logger(`[query-logger] ${query}`);
        where = Utils_1.Utils.convertObjectIds(where);
        const result = await this.getCollection(this.metadata[entityName].collection).deleteMany(where);
        return result.deletedCount;
    }
    async removeEntity(entity) {
        this.runHooks('beforeDelete', entity);
        const query = `db.getCollection("${this.metadata[entity.constructor.name].collection}").deleteOne({ _id: ${entity._id} });`;
        this.options.logger(`[query-logger] ${query}`);
        const result = await this.getCollection(this.metadata[entity.constructor.name].collection).deleteOne({ _id: entity._id });
        delete this.identityMap[`${entity.constructor.name}-${entity.id}`];
        this.unitOfWork.remove(entity);
        this.runHooks('afterDelete', entity);
        return result.deletedCount;
    }
    async count(entityName, where) {
        Utils_1.Utils.renameKey(where, 'id', '_id');
        const query = `db.getCollection("${this.metadata[entityName].collection}").count(${JSON.stringify(where)});`;
        this.options.logger(`[query-logger] ${query}`);
        where = Utils_1.Utils.convertObjectIds(where);
        return this.getCollection(this.metadata[entityName].collection).countDocuments(where, {});
    }
    async persist(entity, flush = true) {
        if (entity instanceof BaseEntity_1.BaseEntity) {
            await this.unitOfWork.persist(entity);
        }
        else {
            for (const e of entity) {
                await this.unitOfWork.persist(e);
            }
        }
        if (flush) {
            await this.flush();
        }
    }
    /**
     * flush changes to database
     */
    async flush() {
        await this.unitOfWork.commit();
    }
    /**
     * clear identity map, detaching all entities
     */
    clear() {
        Object.keys(this.identityMap).forEach(key => delete this.identityMap[key]);
        this.unitOfWork.clear();
    }
    addToIdentityMap(entity) {
        this.identityMap[`${entity.constructor.name}-${entity.id}`] = entity;
        this.unitOfWork.addToIdentityMap(entity);
    }
    canPopulate(entityName, property) {
        const props = this.metadata[entityName].properties;
        return property in props && !!props[property].reference;
    }
    async populateOne(entityName, entity, populate) {
        for (const field of populate) {
            if (!this.canPopulate(entityName, field)) {
                throw new Error(`Entity '${entityName}' does not have property '${field}'`);
            }
            if (entity[field] instanceof Collection_1.Collection && !entity[field].isInitialized(true)) {
                await entity[field].init();
            }
            if (entity[field] instanceof BaseEntity_1.BaseEntity && !entity[field].isInitialized()) {
                await entity[field].init();
            }
            if (entity[field]) {
                entity[field].populated();
            }
        }
    }
    /**
     * preload everything in one call (this will update already existing references in IM)
     */
    async populateMany(entityName, entities, field) {
        if (!this.canPopulate(entityName, field)) {
            throw new Error(`Entity '${entityName}' does not have property '${field}'`);
        }
        // set populate flag
        entities.forEach(entity => {
            if (entity[field] instanceof BaseEntity_1.BaseEntity || entity[field] instanceof Collection_1.Collection) {
                entity[field].populated();
            }
        });
        const meta = this.metadata[entityName].properties[field];
        if (meta.reference === BaseEntity_1.ReferenceType.MANY_TO_MANY && !meta.owner) {
            for (const entity of entities) {
                if (!entity[field].isInitialized()) {
                    await entity[field].init();
                }
            }
            return;
        }
        const children = [];
        let fk = '_id';
        if (meta.reference === BaseEntity_1.ReferenceType.ONE_TO_MANY) {
            const filtered = entities.filter(e => e[field] instanceof Collection_1.Collection);
            children.push(...filtered.map(e => e[field].owner));
            fk = meta.fk;
        }
        else if (meta.reference === BaseEntity_1.ReferenceType.MANY_TO_MANY) {
            const filtered = entities.filter(e => e[field] instanceof Collection_1.Collection && !e[field].isInitialized(true));
            children.push(...filtered.reduce((a, b) => [...a, ...b[field].getItems()], []));
        }
        else {
            children.push(...entities.filter(e => e[field] instanceof BaseEntity_1.BaseEntity && !e[field].isInitialized()).map(e => e[field]));
        }
        if (children.length === 0) {
            return;
        }
        const ids = Utils_1.Utils.unique(children.map(e => e.id));
        const data = await this.find(meta.type, { [fk]: { $in: ids } });
        // initialize collections for one to many
        if (meta.reference === BaseEntity_1.ReferenceType.ONE_TO_MANY) {
            for (const entity of entities) {
                const items = data.filter(child => child[fk] === entity);
                entity[field].set(items, true);
            }
        }
    }
    buildQuery(entityName, where, orderBy, limit, offset) {
        Utils_1.Utils.renameKey(where, 'id', '_id');
        let query = `db.getCollection("${this.metadata[entityName].collection}").find(${JSON.stringify(where)})`;
        where = Utils_1.Utils.convertObjectIds(where);
        const resultSet = this.getCollection(entityName).find(where);
        if (Object.keys(orderBy).length > 0) {
            query += `.sort(${JSON.stringify(orderBy)})`;
            resultSet.sort(orderBy);
        }
        if (limit !== null) {
            query += `.limit(${limit})`;
            resultSet.limit(limit);
        }
        if (offset !== null) {
            query += `.skip(${offset})`;
            resultSet.skip(offset);
        }
        return { query, resultSet };
    }
    runHooks(type, entity) {
        const hooks = this.metadata[entity.constructor.name].hooks;
        if (hooks && hooks[type] && hooks[type].length > 0) {
            hooks[type].forEach(hook => entity[hook]());
        }
    }
}
exports.EntityManager = EntityManager;
