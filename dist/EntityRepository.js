"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EntityRepository {
    constructor(em, entityName) {
        this.em = em;
        this.entityName = entityName;
    }
    async persist(entity, flush = true) {
        return this.em.persist(entity, flush);
    }
    async findOne(where, populate = []) {
        return this.em.findOne(this.entityName, where, populate);
    }
    async find(where, populate = [], orderBy = {}, limit = null, offset = null) {
        return this.em.find(this.entityName, where, populate, orderBy, limit, offset);
    }
    async findAll(populate = [], orderBy = {}, limit = null, offset = null) {
        return this.em.find(this.entityName, {}, populate, orderBy, limit, offset);
    }
    async remove(where) {
        return this.em.remove(this.entityName, where);
    }
    async flush() {
        return this.em.flush();
    }
    /**
     * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
     */
    getReference(id) {
        return this.em.getReference(this.entityName, id);
    }
    canPopulate(property) {
        return this.em.canPopulate(this.entityName, property);
    }
    /**
     * Creates new instance of given entity and populates it with given data
     */
    create(data) {
        return this.em.create(this.entityName, data);
    }
    async count(where = {}) {
        return this.em.count(this.entityName, where);
    }
}
exports.EntityRepository = EntityRepository;
