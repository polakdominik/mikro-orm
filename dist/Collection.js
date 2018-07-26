"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseEntity_1 = require("./BaseEntity");
const MikroORM_1 = require("./MikroORM");
const Utils_1 = require("./Utils");
class Collection {
    constructor(owner, property, items = null) {
        this.owner = owner;
        this.property = property;
        this.initialized = false;
        this.dirty = false;
        this._populated = false;
        this.items = [];
        if (items) {
            this.initialized = true;
            this.items = items;
        }
    }
    isInitialized(fully = false) {
        if (fully) {
            return this.initialized && this.items.every(i => i.isInitialized());
        }
        return this.initialized;
    }
    shouldPopulate() {
        return this._populated;
    }
    populated(populated = true) {
        this._populated = populated;
    }
    isDirty() {
        return this.dirty;
    }
    async init() {
        // do not make db call if we know we will get no results
        if (this.property.reference === BaseEntity_1.ReferenceType.MANY_TO_MANY && this.property.owner && this.items.length === 0) {
            this.initialized = true;
            this.dirty = false;
            this.populated();
            return this;
        }
        const cond = this.createCondition();
        const order = this.items.map(item => `${item._id}`);
        this.items.length = 0;
        const em = MikroORM_1.getEntityManager();
        const items = await em.find(this.property.type, cond);
        // re-order items when searching with `$in` operator
        if (this.property.reference === BaseEntity_1.ReferenceType.MANY_TO_MANY && this.property.owner) {
            items.sort((a, b) => {
                return Utils_1.Utils.softIndexOf(order, `${a._id}`) - Utils_1.Utils.softIndexOf(order, `${b._id}`);
            });
        }
        this.items.push(...items);
        this.initialized = true;
        this.dirty = false;
        this.populated();
        return this;
    }
    getItems() {
        this.checkInitialized();
        return this.items;
    }
    getIdentifiers(field = '_id') {
        return this.getItems().map(i => i[field]);
    }
    add(...items) {
        this.checkInitialized();
        for (const item of items) {
            if (!this.contains(item)) {
                this.handleInverseSide(item, 'add');
                this.items.push(item);
            }
        }
        this.dirty = this.property.owner; // set dirty flag only to owning side
    }
    set(items, initialize = false) {
        if (initialize) {
            this.initialized = true;
        }
        this.removeAll();
        this.add(...items);
        if (initialize) {
            this.dirty = false;
        }
    }
    remove(...items) {
        this.checkInitialized();
        for (const item of items) {
            this.handleInverseSide(item, 'remove');
            const idx = this.items.findIndex(i => i.id === item.id);
            if (idx !== -1) {
                this.items.splice(idx, 1);
            }
        }
        this.dirty = this.property.owner; // set dirty flag only to owning side
    }
    removeAll() {
        this.checkInitialized();
        if (this.property.owner && this.property.inversedBy && this.items.length > 0) {
            this.items[0][this.property.inversedBy].length = 0;
        }
        this.items.length = 0;
        this.dirty = this.property.owner; // set dirty flag only to owning side
    }
    contains(item) {
        this.checkInitialized();
        return !!this.items.find(i => i.id !== null && i.id === item.id);
    }
    count() {
        this.checkInitialized();
        return this.items.length;
    }
    *[Symbol.iterator]() {
        for (const item of this.items) {
            yield item;
        }
    }
    checkInitialized() {
        if (!this.isInitialized()) {
            throw new Error(`Collection ${this.property.type}[] of entity ${this.owner.constructor.name}[${this.owner.id}] not initialized`);
        }
    }
    handleInverseSide(item, method) {
        if (this.property.owner && this.property.inversedBy && item[this.property.inversedBy].isInitialized()) {
            item[this.property.inversedBy][method](this.owner);
        }
    }
    createCondition() {
        const cond = {};
        if (this.property.reference === BaseEntity_1.ReferenceType.ONE_TO_MANY) {
            cond[this.property.fk] = this.owner._id;
        }
        else if (this.property.reference === BaseEntity_1.ReferenceType.MANY_TO_MANY) {
            if (this.property.owner) {
                cond._id = { $in: this.items.map(item => item._id) };
            }
            else {
                cond[this.property.mappedBy] = this.owner._id;
            }
        }
        return cond;
    }
}
exports.Collection = Collection;
