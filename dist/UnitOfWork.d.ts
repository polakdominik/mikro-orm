import { EntityManager } from './EntityManager';
import { BaseEntity } from './BaseEntity';
export declare class UnitOfWork {
    private em;
    private readonly identityMap;
    private readonly persistStack;
    constructor(em: EntityManager);
    addToIdentityMap(entity: BaseEntity): void;
    persist(entity: BaseEntity): Promise<ChangeSet>;
    commit(): Promise<void>;
    clear(): void;
    remove(entity: BaseEntity): void;
    private computeChangeSet;
    private processReferences;
    private processManyToOne;
    private processOneToMany;
    private processManyToMany;
    private removeUnknownProperties;
    private immediateCommit;
    private runHooks;
}
export interface ChangeSet {
    index: number;
    payload: any;
    collection: string;
    name: string;
    entity: BaseEntity;
}
