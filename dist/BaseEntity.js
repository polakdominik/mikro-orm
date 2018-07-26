"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MikroORM_1 = require("./MikroORM");
const bson_1 = require("bson");
const Collection_1 = require("./Collection");
const Utils_1 = require("./Utils");
const EntityFactory_1 = require("./EntityFactory");
class BaseEntity {
    constructor() {
        this.createdAt = new Date();
        this.updatedAt = new Date();
        this._initialized = false;
        this._populated = false;
        const metadata = MikroORM_1.getMetadataStorage();
        const meta = metadata[this.constructor.name];
        const props = meta.properties;
        Object.keys(props).forEach(prop => {
            if ([ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference)) {
                this[prop] = new Collection_1.Collection(this, props[prop], []);
            }
        });
    }
    get id() {
        return this._id ? this._id.toHexString() : null;
    }
    set id(id) {
        this._id = id ? new bson_1.ObjectID(id) : null;
    }
    isInitialized() {
        return this._initialized !== false;
    }
    shouldPopulate() {
        return this._populated;
    }
    populated(populated = true) {
        this._populated = populated;
    }
    async init() {
        const em = MikroORM_1.getEntityManager();
        await em.findOne(this.constructor.name, this._id);
        this._populated = true;
        return this;
    }
    assign(data) {
        const em = MikroORM_1.getEntityManager();
        const metadata = MikroORM_1.getMetadataStorage();
        const meta = metadata[this.constructor.name];
        const props = meta.properties;
        Object.keys(data).forEach(prop => {
            if (props[prop] && props[prop].reference === ReferenceType.MANY_TO_ONE && data[prop]) {
                if (data[prop] instanceof BaseEntity) {
                    return this[prop] = data[prop];
                }
                if (data[prop] instanceof bson_1.ObjectID) {
                    return this[prop] = em.getReference(props[prop].type, data[prop].toHexString());
                }
                const id = typeof data[prop] === 'object' ? data[prop].id : data[prop];
                if (id) {
                    return this[prop] = em.getReference(props[prop].type, id);
                }
            }
            const isCollection = props[prop] && [ReferenceType.ONE_TO_MANY, ReferenceType.MANY_TO_MANY].includes(props[prop].reference);
            if (isCollection && Utils_1.Utils.isArray(data[prop])) {
                const items = data[prop].map((item) => {
                    if (item instanceof bson_1.ObjectID) {
                        return em.getReference(props[prop].type, item.toHexString());
                    }
                    if (item instanceof BaseEntity) {
                        return item;
                    }
                    return em.getReference(props[prop].type, item);
                });
                return this[prop].set(items);
            }
            if (props[prop] && props[prop].reference === ReferenceType.SCALAR && EntityFactory_1.SCALAR_TYPES.includes(props[prop].type)) {
                this[prop] = em.validator.validateProperty(props[prop], data[prop], this);
            }
            this[prop] = data[prop];
        });
    }
    toObject(parent = this) {
        const ret = { id: this.id, createdAt: this.createdAt, updatedAt: this.updatedAt };
        if (!this.isInitialized()) {
            return { id: this.id };
        }
        Object.keys(this).forEach(prop => {
            if (['id', 'createdAt', 'updatedAt'].includes(prop) || prop.startsWith('_')) {
                return;
            }
            if (this[prop] instanceof Collection_1.Collection) {
                if (this[prop].isInitialized()) {
                    const collection = this[prop].getItems();
                    ret[prop] = collection.map(item => {
                        return item.isInitialized() && this[prop].shouldPopulate() ? item.toObject(this) : item.id;
                    });
                }
                return;
            }
            if (this[prop] instanceof BaseEntity) {
                if (this[prop].isInitialized() && this[prop].shouldPopulate() && this[prop] !== parent) {
                    return ret[prop] = this[prop].toObject(this);
                }
                return ret[prop] = this[prop].id;
            }
            ret[prop] = this[prop];
        });
        return ret;
    }
    toJSON() {
        return this.toObject();
    }
}
exports.BaseEntity = BaseEntity;
var ReferenceType;
(function (ReferenceType) {
    ReferenceType[ReferenceType["SCALAR"] = 0] = "SCALAR";
    ReferenceType[ReferenceType["MANY_TO_ONE"] = 1] = "MANY_TO_ONE";
    ReferenceType[ReferenceType["ONE_TO_MANY"] = 2] = "ONE_TO_MANY";
    ReferenceType[ReferenceType["MANY_TO_MANY"] = 3] = "MANY_TO_MANY";
})(ReferenceType = exports.ReferenceType || (exports.ReferenceType = {}));
