"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseEntity_1 = require("../BaseEntity");
const MikroORM_1 = require("../MikroORM");
function Property(options = {}) {
    return function (target, propertyName) {
        const entity = target.constructor.name;
        const storage = MikroORM_1.getMetadataStorage(entity);
        const meta = storage[entity];
        const type = Reflect.getMetadata('design:type', target, propertyName);
        if (!options.type && type) {
            options.type = type.name;
        }
        options.name = propertyName;
        meta.properties = meta.properties || {};
        meta.properties[propertyName] = Object.assign({ reference: BaseEntity_1.ReferenceType.SCALAR }, options);
    };
}
exports.Property = Property;
