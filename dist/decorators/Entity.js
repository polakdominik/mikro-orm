"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const MikroORM_1 = require("../MikroORM");
const Utils_1 = require("../Utils");
function Entity(options = {}) {
    return function (target) {
        const storage = MikroORM_1.getMetadataStorage(target.name);
        const meta = storage[target.name];
        if (options) {
            lodash_1.merge(meta, options);
        }
        if (!meta.collection) {
            meta.collection = target.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
        }
        meta.name = target.name;
        meta.constructorParams = Utils_1.Utils.getParamNames(target);
        return target;
    };
}
exports.Entity = Entity;
