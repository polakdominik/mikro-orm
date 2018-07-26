"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseEntity_1 = require("./BaseEntity");
const EntityFactory_1 = require("./EntityFactory");
class Validator {
    constructor(strict) {
        this.strict = strict;
    }
    validate(entity, payload, meta) {
        Object.keys(payload).forEach(prop => {
            const property = meta.properties[prop];
            if (!property || property.reference !== BaseEntity_1.ReferenceType.SCALAR || !EntityFactory_1.SCALAR_TYPES.includes(property.type)) {
                return;
            }
            payload[prop] = entity[prop] = this.validateProperty(property, payload[prop], entity);
        });
    }
    validateProperty(prop, givenValue, entity) {
        if (givenValue === null) {
            return givenValue;
        }
        const expectedType = prop.type.toLowerCase();
        const objectType = Object.prototype.toString.call(givenValue);
        let givenType = objectType.match(/\[object (\w+)]/)[1].toLowerCase();
        let ret = givenValue;
        if (!this.strict && expectedType === 'date' && givenType === 'string') {
            const date = new Date(givenValue);
            if (date.toString() !== 'Invalid Date') {
                ret = date;
                givenType = 'date';
            }
        }
        if (!this.strict && expectedType === 'number' && givenType === 'string') {
            const num = +givenValue;
            if ('' + num === givenValue) {
                ret = num;
                givenType = 'number';
            }
        }
        if (givenType !== expectedType) {
            throw new Error(`Validation error: trying to set ${entity.constructor.name}.${prop.name} of type '${expectedType}' to '${givenValue}' of type '${givenType}'`);
        }
        return ret;
    }
}
exports.Validator = Validator;
