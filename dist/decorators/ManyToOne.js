"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseEntity_1 = require("../BaseEntity");
const MikroORM_1 = require("../MikroORM");
function ManyToOne(options) {
    return function (target, propertyName) {
        const entity = target.constructor.name;
        const storage = MikroORM_1.getMetadataStorage(entity);
        const meta = storage[entity];
        meta.properties = meta.properties || {};
        const reflectMetadataType = Reflect.getMetadata('design:type', target, propertyName);
        if (!options.type && reflectMetadataType) {
            options.type = reflectMetadataType;
        }
        if (!options.entity) {
            throw new Error(`'@ManyToOne({ entity: string })' is required in '${target.constructor.name}.${propertyName}'`);
        }
        if (!options.fk) {
            options.fk = '_id';
        }
        const property = { name: propertyName, reference: BaseEntity_1.ReferenceType.MANY_TO_ONE };
        meta.properties[propertyName] = Object.assign(property, options);
    };
}
exports.ManyToOne = ManyToOne;
