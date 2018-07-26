"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Utils_1 = require("./Utils");
const BaseEntity_1 = require("./BaseEntity");
class UnitOfWork {
    constructor(em) {
        this.em = em;
        // holds copy of entity manager's identity map so we can compute changes when persisting
        this.identityMap = {};
        this.persistStack = [];
    }
    addToIdentityMap(entity) {
        this.identityMap[`${entity.constructor.name}-${entity.id}`] = Utils_1.Utils.copy(entity);
    }
    async persist(entity) {
        const changeSet = await this.computeChangeSet(entity);
        if (!changeSet) {
            return null;
        }
        changeSet.index = this.persistStack.length;
        this.persistStack.push(changeSet);
        return changeSet;
    }
    async commit() {
        for (const changeSet of this.persistStack) {
            await this.immediateCommit(changeSet, false);
        }
        this.persistStack.length = 0;
    }
    clear() {
        Object.keys(this.identityMap).forEach(key => delete this.identityMap[key]);
    }
    remove(entity) {
        delete this.identityMap[`${entity.constructor.name}-${entity.id}`];
    }
    async computeChangeSet(entity) {
        const ret = { entity };
        const metadata = this.em.entityFactory.getMetadata();
        const meta = metadata[entity.constructor.name];
        ret.name = meta.name;
        ret.collection = meta.collection;
        if (entity.id && this.identityMap[`${meta.name}-${entity.id}`]) {
            ret.payload = Utils_1.Utils.diffEntities(this.identityMap[`${meta.name}-${entity.id}`], entity);
        }
        else {
            ret.payload = Object.assign({}, entity); // TODO maybe we need deep copy? or no copy at all?
        }
        delete ret.payload._id;
        delete ret.payload._initialized;
        await this.processReferences(ret, meta);
        this.removeUnknownProperties(ret, meta);
        this.em.validator.validate(ret.entity, ret.payload, meta);
        if (Object.keys(ret.payload).length === 0) {
            return null;
        }
        return ret;
    }
    async processReferences(changeSet, meta) {
        const properties = Object.keys(meta.properties);
        for (const p of properties) {
            const prop = meta.properties[p];
            if (prop.reference === BaseEntity_1.ReferenceType.ONE_TO_MANY) {
                await this.processOneToMany(changeSet, prop);
            }
            else if (prop.reference === BaseEntity_1.ReferenceType.MANY_TO_MANY) {
                await this.processManyToMany(changeSet, prop);
            }
            else if (prop.reference === BaseEntity_1.ReferenceType.MANY_TO_ONE && changeSet.entity[prop.name]) {
                await this.processManyToOne(changeSet, prop);
            }
        }
    }
    async processManyToOne(changeSet, prop) {
        // when new entity found in reference, cascade persist it first so we have its id
        if (!changeSet.entity[prop.name]._id) {
            const propChangeSet = await this.persist(changeSet.entity[prop.name]);
            await this.immediateCommit(propChangeSet);
        }
        if (changeSet.payload[prop.name] instanceof BaseEntity_1.BaseEntity) {
            changeSet.payload[prop.name] = changeSet.entity[prop.name]._id;
        }
    }
    async processOneToMany(changeSet, prop) {
        if (changeSet.entity[prop.name].isDirty()) {
            // TODO cascade persist...
        }
        delete changeSet.payload[prop.name];
    }
    async processManyToMany(changeSet, prop) {
        if (prop.owner && changeSet.entity[prop.name].isDirty()) {
            for (const item of changeSet.entity[prop.name].getItems()) {
                // when new entity found in reference, cascade persist it first so we have its id
                if (!item._id) {
                    const itemChangeSet = await this.persist(item);
                    await this.immediateCommit(itemChangeSet);
                }
            }
            changeSet.payload[prop.name] = changeSet.entity[prop.name].getIdentifiers();
        }
        else {
            delete changeSet.payload[prop.name];
        }
    }
    removeUnknownProperties(changeSet, meta) {
        const properties = Object.keys(changeSet.payload);
        for (const p of properties) {
            if (!meta.properties[p] && !['_id', 'createdAt', 'updatedAt'].includes(p)) {
                delete changeSet.payload[p];
            }
        }
    }
    async immediateCommit(changeSet, removeFromStack = true) {
        const type = changeSet.entity._id ? 'Update' : 'Create';
        this.runHooks(`before${type}`, changeSet.entity);
        const metadata = this.em.entityFactory.getMetadata();
        const meta = metadata[changeSet.entity.constructor.name];
        const properties = Object.keys(meta.properties);
        // process references first
        for (const p of properties) {
            const prop = meta.properties[p];
            const reference = changeSet.entity[prop.name];
            if (prop.reference === BaseEntity_1.ReferenceType.MANY_TO_ONE && reference) {
                // TODO many to one cascade support
                // ...
            }
            if (prop.reference === BaseEntity_1.ReferenceType.ONE_TO_MANY) {
                // TODO one to many collection cascade support
                // ...
                reference.dirty = false;
            }
            if (prop.reference === BaseEntity_1.ReferenceType.MANY_TO_MANY && prop.owner) {
                // TODO many to many collection cascade support
                // ...
                reference.dirty = false;
            }
        }
        // persist the entity itself
        if (changeSet.entity._id) {
            changeSet.entity.updatedAt = changeSet.payload.updatedAt = new Date();
            const query = `db.getCollection("${changeSet.collection}").updateOne({ _id: ${changeSet.entity._id} }, { $set: ${JSON.stringify(changeSet.payload)} });`;
            this.em.options.logger(`[query-logger] ${query}`);
            await this.em.getCollection(changeSet.collection).updateOne({ _id: changeSet.entity._id }, { $set: changeSet.payload });
        }
        else {
            const query = `db.getCollection("${changeSet.collection}").insertOne(${JSON.stringify(changeSet.payload)});`;
            this.em.options.logger(`[query-logger] ${query}`);
            const result = await this.em.getCollection(changeSet.collection).insertOne(changeSet.payload);
            changeSet.entity._id = result.insertedId;
            delete changeSet.entity['_initialized'];
            this.em.merge(changeSet.name, changeSet.entity);
        }
        this.runHooks(`after${type}`, changeSet.entity);
        if (removeFromStack) {
            this.persistStack.splice(changeSet.index, 1);
        }
    }
    runHooks(type, entity) {
        const metadata = this.em.entityFactory.getMetadata();
        const hooks = metadata[entity.constructor.name].hooks;
        if (hooks && hooks[type] && hooks[type].length > 0) {
            hooks[type].forEach(hook => entity[hook]());
        }
    }
}
exports.UnitOfWork = UnitOfWork;
