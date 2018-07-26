import { EntityManager } from './EntityManager';
import { BaseEntity, EntityMetadata } from './BaseEntity';
export declare const SCALAR_TYPES: string[];
export declare class EntityFactory {
    private em;
    private metadata;
    private options;
    private logger;
    constructor(em: EntityManager);
    getMetadata(): {
        [entity: string]: EntityMetadata;
    };
    create<T extends BaseEntity>(entityName: string, data: any, initialized?: boolean): T;
    createReference<T extends BaseEntity>(entityName: string, id: string): T;
    private initEntity;
    /**
     * returns parameters for entity constructor, creating references from plain ids
     */
    private extractConstructorParams;
    private loadMetadata;
    private discover;
}
