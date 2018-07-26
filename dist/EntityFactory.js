"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const bson_1 = require("bson");
const ts_simple_ast_1 = require("ts-simple-ast");
const MikroORM_1 = require("./MikroORM");
const Collection_1 = require("./Collection");
const BaseEntity_1 = require("./BaseEntity");
const Utils_1 = require("./Utils");
exports.SCALAR_TYPES = ['string', 'number', 'boolean', 'Date'];
class EntityFactory {
    constructor(em) {
        this.em = em;
        this.metadata = MikroORM_1.getMetadataStorage();
        this.options = this.em.options;
        this.logger = this.em.options.logger;
        this.loadMetadata();
    }
    getMetadata() {
        return this.metadata;
    }
    create(entityName, data, initialized = true) {
        const meta = this.metadata[entityName];
        const exclude = [];
        let entity;
        if (data.id || data._id) {
            data._id = new bson_1.ObjectID(data.id || data._id);
            delete data.id;
        }
        if (!data._id) {
            const params = this.extractConstructorParams(meta, data);
            const Entity = require(meta.path)[entityName];
            entity = new Entity(...params);
            exclude.push(...meta.constructorParams);
        }
        else if (this.em.identityMap[`${entityName}-${data._id}`]) {
            entity = this.em.identityMap[`${entityName}-${data._id}`];
        }
        else {
            // creates new entity instance, with possibility to bypass constructor call when instancing already persisted entity
            const Entity = require(meta.path)[meta.name];
            entity = Object.create(Entity.prototype);
            this.em.identityMap[`${entityName}-${data._id}`] = entity;
        }
        this.initEntity(entity, meta.properties, data, exclude);
        if (initialized) {
            delete entity['_initialized'];
        }
        else {
            entity['_initialized'] = initialized;
        }
        return entity;
    }
    createReference(entityName, id) {
        if (this.em.identityMap[`${entityName}-${id}`]) {
            return this.em.identityMap[`${entityName}-${id}`];
        }
        return this.create(entityName, { id }, false);
    }
    initEntity(entity, properties, data, exclude) {
        // process base entity properties first
        ['_id', 'createdAt', 'updatedAt'].forEach(k => {
            if (data[k]) {
                entity[k] = data[k];
            }
        });
        // then process user defined properties (ignore not defined keys in `data`)
        Object.keys(properties).forEach(p => {
            if (exclude.includes(p)) {
                return;
            }
            const prop = properties[p];
            if (prop.reference === BaseEntity_1.ReferenceType.ONE_TO_MANY && !data[p]) {
                return entity[p] = new Collection_1.Collection(entity, prop);
            }
            if (prop.reference === BaseEntity_1.ReferenceType.MANY_TO_MANY) {
                if (prop.owner && Utils_1.Utils.isArray(data[p])) {
                    const items = data[p].map((id) => this.createReference(prop.type, id.toHexString()));
                    return entity[p] = new Collection_1.Collection(entity, prop, items);
                }
                else if (!entity[p]) {
                    return entity[p] = new Collection_1.Collection(entity, prop, prop.owner ? [] : null);
                }
            }
            if (prop.reference === BaseEntity_1.ReferenceType.MANY_TO_ONE) {
                if (data[p] && !(data[p] instanceof BaseEntity_1.BaseEntity)) {
                    const id = data[p] instanceof bson_1.ObjectID ? data[p].toHexString() : '' + data[p];
                    entity[p] = this.createReference(prop.type, id);
                }
                return;
            }
            if (prop.reference === BaseEntity_1.ReferenceType.SCALAR && data[p]) {
                entity[p] = data[p];
            }
        });
    }
    /**
     * returns parameters for entity constructor, creating references from plain ids
     */
    extractConstructorParams(meta, data) {
        return meta.constructorParams.map((k) => {
            if (meta.properties[k].reference === BaseEntity_1.ReferenceType.MANY_TO_ONE && data[k]) {
                return this.em.getReference(meta.properties[k].type, data[k]);
            }
            return data[k];
        });
    }
    loadMetadata() {
        const startTime = Date.now();
        this.logger(`ORM entity discovery started`);
        const project = new ts_simple_ast_1.default();
        const sources = [];
        if (!this.em.options.entitiesDirsTs) {
            this.em.options.entitiesDirsTs = this.em.options.entitiesDirs;
        }
        this.em.options.entitiesDirsTs.forEach(dir => {
            sources.push(...project.addExistingSourceFiles(`${this.em.options.baseDir}/${dir}/**/*.ts`));
        });
        this.options.entitiesDirs.forEach(dir => this.discover(sources, dir));
        const diff = Date.now() - startTime;
        this.logger(`- entity discovery finished after ${diff} ms`);
    }
    discover(sources, basePath) {
        const files = fs_1.readdirSync(this.options.baseDir + '/' + basePath);
        this.logger(`- processing ${files.length} files from directory ${basePath}`);
        files.forEach(file => {
            if (!file.match(/\.[jt]s$/) || file.lastIndexOf('.js.map') !== -1 || file.startsWith('.')) {
                return;
            }
            this.logger(`- processing entity ${file.replace(/\.[jt]s$/, '')}`);
            const name = file.split('.')[0];
            const path = `${this.options.baseDir}/${basePath}/${file}`;
            require(path); // include the file to trigger loading of metadata
            const source = sources.find(s => !!s.getFilePath().match(new RegExp(name + '.ts')));
            this.metadata[name].path = path;
            const properties = source.getClass(name).getInstanceProperties();
            // init types
            const props = this.metadata[name].properties;
            Object.keys(props).forEach(p => {
                if (props[p].entity) {
                    props[p].type = props[p].entity();
                }
                if (props[p].reference === BaseEntity_1.ReferenceType.SCALAR) {
                    const property = properties.find(v => v.getName() === p);
                    props[p].type = property.getType().getText();
                }
            });
        });
    }
}
exports.EntityFactory = EntityFactory;
