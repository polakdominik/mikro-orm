import { FilterQuery } from 'mongodb';
import { EntityManager } from './EntityManager';
import { BaseEntity } from './BaseEntity';
export declare class EntityRepository<T extends BaseEntity> {
    protected em: EntityManager;
    protected entityName: string;
    constructor(em: EntityManager, entityName: string);
    persist(entity: T, flush?: boolean): Promise<void>;
    findOne(where: FilterQuery<T> | string, populate?: string[]): Promise<T>;
    find(where: FilterQuery<T>, populate?: string[], orderBy?: {
        [k: string]: 1 | -1;
    }, limit?: number, offset?: number): Promise<T[]>;
    findAll(populate?: string[], orderBy?: {
        [k: string]: 1 | -1;
    }, limit?: number, offset?: number): Promise<T[]>;
    remove(where: T | any): Promise<number>;
    flush(): Promise<void>;
    /**
     * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
     */
    getReference<T extends BaseEntity>(id: string): T;
    canPopulate(property: string): boolean;
    /**
     * Creates new instance of given entity and populates it with given data
     */
    create(data: any): T;
    count(where?: any): Promise<number>;
}
