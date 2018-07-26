import { ObjectID } from 'bson';
import { Collection } from './Collection';
export declare class BaseEntity {
    _id: ObjectID;
    createdAt: Date;
    updatedAt: Date;
    [property: string]: any | BaseEntity | Collection<BaseEntity>;
    private _initialized;
    private _populated;
    constructor();
    id: string;
    isInitialized(): boolean;
    shouldPopulate(): boolean;
    populated(populated?: boolean): void;
    init(): Promise<BaseEntity>;
    assign(data: any): void;
    toObject(parent?: BaseEntity): any;
    toJSON(): any;
}
export declare enum ReferenceType {
    SCALAR = 0,
    MANY_TO_ONE = 1,
    ONE_TO_MANY = 2,
    MANY_TO_MANY = 3
}
export interface EntityProperty {
    name: string;
    fk: string;
    entity: () => string;
    type: string;
    reference: ReferenceType;
    attributes?: {
        [attribute: string]: any;
    };
    owner?: boolean;
    inversedBy: string;
    mappedBy: string;
}
export interface EntityMetadata {
    name: string;
    constructorParams: string[];
    collection: string;
    path: string;
    properties: {
        [property: string]: EntityProperty;
    };
    customRepository: any;
    hooks: {
        [type: string]: string[];
    };
}
