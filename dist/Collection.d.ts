import { ObjectID } from 'bson';
import { BaseEntity, EntityProperty } from './BaseEntity';
export declare class Collection<T extends BaseEntity> {
    readonly owner: BaseEntity;
    private readonly property;
    private initialized;
    private dirty;
    private _populated;
    private readonly items;
    constructor(owner: BaseEntity, property: EntityProperty, items?: T[]);
    isInitialized(fully?: boolean): boolean;
    shouldPopulate(): boolean;
    populated(populated?: boolean): void;
    isDirty(): boolean;
    init(): Promise<Collection<T>>;
    getItems(): T[];
    getIdentifiers(field?: string): ObjectID[];
    add(...items: T[]): void;
    set(items: T[], initialize?: boolean): void;
    remove(...items: T[]): void;
    removeAll(): void;
    contains(item: T): boolean;
    count(): number;
    [Symbol.iterator](): IterableIterator<T>;
    private checkInitialized;
    private handleInverseSide;
    private createCondition;
}
