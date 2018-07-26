"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseEntity_1 = require("../BaseEntity");
const MikroORM_1 = require("../MikroORM");
function OneToMany(options) {
    return function (target, propertyName) {
        const entity = target.constructor.name;
        const storage = MikroORM_1.getMetadataStorage(entity);
        const meta = storage[entity];
        meta.properties = meta.properties || {};
        if (!options.entity) {
            throw new Error(`'@OneToMany({ entity: string })' is required in '${target.constructor.name}.${propertyName}'`);
        }
        const property = { name: propertyName, reference: BaseEntity_1.ReferenceType.ONE_TO_MANY };
        meta.properties[propertyName] = Object.assign(property, options);
    };
}
exports.OneToMany = OneToMany;
