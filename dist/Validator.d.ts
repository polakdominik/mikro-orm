import { BaseEntity, EntityMetadata, EntityProperty } from './BaseEntity';
export declare class Validator {
    private strict;
    constructor(strict: boolean);
    validate(entity: BaseEntity, payload: any, meta: EntityMetadata): void;
    validateProperty(prop: EntityProperty, givenValue: any, entity: BaseEntity): any;
}
