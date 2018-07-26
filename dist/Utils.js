"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fastEqual = require("fast-deep-equal");
const clone = require("clone");
const bson_1 = require("bson");
const BaseEntity_1 = require("./BaseEntity");
const Collection_1 = require("./Collection");
const MikroORM_1 = require("./MikroORM");
class Utils {
    static isObject(o) {
        return typeof o === 'object' && o !== null;
    }
    static isArray(arr) {
        return Object.prototype.toString.call(arr) === '[object Array]';
    }
    static isString(s) {
        return typeof s === 'string';
    }
    static equals(a, b) {
        return fastEqual(a, b);
    }
    static unique(items) {
        return [...new Set(items)];
    }
    static diff(a, b) {
        const ret = {};
        Object.keys(b).forEach(k => {
            if (Utils.DIFF_IGNORED_KEYS.includes(k)) {
                return;
            }
            if (a[k] === undefined && b !== undefined) {
                return ret[k] = b[k];
            }
            if (a[k] !== undefined && b === undefined) {
                return ret[k] = a[k];
            }
            if (Utils.equals(a[k], b[k])) {
                return;
            }
            if (Utils.isArray(a[k]) && Utils.isArray(b[k])) {
                return ret[k] = b[k]; // right-hand side has priority
            }
            ret[k] = b[k];
        });
        return ret;
    }
    /**
     * Process references first so we do not have to deal with cycles
     */
    static diffEntities(a, b) {
        return Utils.diff(Utils.prepareEntity(a), Utils.prepareEntity(b));
    }
    static prepareEntity(e) {
        const metadata = MikroORM_1.getMetadataStorage();
        const meta = metadata[e.constructor.name];
        const ret = Utils.copy(e);
        // remove collections and references
        Object.keys(meta.properties).forEach(prop => {
            if (ret[prop] instanceof Collection_1.Collection || (ret[prop] instanceof BaseEntity_1.BaseEntity && !ret[prop]._id)) {
                return delete ret[prop];
            }
            if (ret[prop] instanceof BaseEntity_1.BaseEntity) {
                return ret[prop] = ret[prop].id;
            }
        });
        // remove unknown properties
        Object.keys(e).forEach(prop => {
            if (!meta.properties[prop]) {
                return delete ret[prop];
            }
        });
        return ret;
    }
    static copy(entity) {
        return clone(entity);
    }
    static renameKey(payload, from, to) {
        if (Utils.isObject(payload) && payload[from] && !payload[to]) {
            payload[to] = payload[from];
            delete payload[from];
        }
    }
    static convertObjectIds(payload) {
        if (payload instanceof bson_1.ObjectID) {
            return payload;
        }
        if (Utils.isString(payload) && payload.match(/^[0-9a-f]{24}$/i)) {
            return new bson_1.ObjectID(payload);
        }
        if (Utils.isArray(payload)) {
            return payload.map((item) => Utils.convertObjectIds(item));
        }
        if (Utils.isObject(payload)) {
            Object.keys(payload).forEach(k => {
                payload[k] = Utils.convertObjectIds(payload[k]);
            });
        }
        return payload;
    }
    static getParamNames(func) {
        const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
        const ARGUMENT_NAMES = /([^\s,]+)/g;
        const fnStr = func.toString().replace(STRIP_COMMENTS, '');
        const result = fnStr.slice(fnStr.indexOf('(') + 1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
        if (result === null) {
            return [];
        }
        // handle class with no constructor
        if (result.length > 0 && result[0] === 'class') {
            return [];
        }
        // strip default values
        for (let i = 0; i < result.length; i++) {
            if (result[i] === '=') {
                result.splice(i, 2);
            }
            else if (result[i].includes('=')) {
                result[i] = result[i].split('=')[0];
                result.splice(i + 1, 1);
            }
        }
        return result;
    }
    static softIndexOf(arr, item) {
        for (let i = 0; i < arr.length; i++) {
            if (arr[i] == item) {
                return i;
            }
        }
        return -1;
    }
}
Utils.DIFF_IGNORED_KEYS = ['_id', '_initialized', 'createdAt', 'updatedAt'];
exports.Utils = Utils;
