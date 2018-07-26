import { Collection as MongoCollection, Db, FilterQuery } from 'mongodb';
import { BaseEntity } from './BaseEntity';
import { EntityRepository } from './EntityRepository';
import { EntityFactory } from './EntityFactory';
import { Options } from './MikroORM';
import { Validator } from './Validator';
export declare class EntityManager {
    private db;
    options: Options;
    entityFactory: EntityFactory;
    readonly identityMap: {
        [k: string]: BaseEntity;
    };
    readonly validator: Validator;
    private readonly unitOfWork;
    private readonly repositoryMap;
    private readonly metadata;
    constructor(db: Db, options: Options);
    getCollection(entityName: string): MongoCollection;
    getRepository<T extends BaseEntity>(entityName: string): EntityRepository<T>;
    find<T extends BaseEntity>(entityName: string, where?: FilterQuery<T>, populate?: string[], orderBy?: {
        [k: string]: 1 | -1;
    }, limit?: number, offset?: number): Promise<T[]>;
    findOne<T extends BaseEntity>(entityName: string, where: FilterQuery<T> | string, populate?: string[]): Promise<T>;
    merge<T extends BaseEntity>(entityName: string, data: any): T;
    /**
     * Creates new instance of given entity and populates it with given data
     */
    create<T extends BaseEntity>(entityName: string, data: any): T;
    /**
     * Gets a reference to the entity identified by the given type and identifier without actually loading it, if the entity is not yet loaded
     */
    getReference<T extends BaseEntity>(entityName: string, id: string): T;
    remove(entityName: string, where: BaseEntity | any): Promise<number>;
    removeEntity(entity: BaseEntity): Promise<number>;
    count(entityName: string, where: any): Promise<number>;
    persist(entity: BaseEntity | BaseEntity[], flush?: boolean): Promise<void>;
    /**
     * flush changes to database
     */
    flush(): Promise<void>;
    /**
     * clear identity map, detaching all entities
     */
    clear(): void;
    addToIdentityMap(entity: BaseEntity): void;
    canPopulate(entityName: string, property: string): boolean;
    private populateOne;
    /**
     * preload everything in one call (this will update already existing references in IM)
     */
    private populateMany;
    private buildQuery;
    private runHooks;
}
