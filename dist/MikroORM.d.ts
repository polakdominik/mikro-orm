import 'reflect-metadata';
import { Db } from 'mongodb';
import { EntityManager } from './EntityManager';
import { EntityMetadata } from './BaseEntity';
export declare function getMetadataStorage(entity?: string): {
    [entity: string]: EntityMetadata;
};
export declare function getEntityManager(): EntityManager;
export declare class MikroORM {
    options: Options;
    em: EntityManager;
    private client;
    private db;
    static init(options: Options): Promise<MikroORM>;
    constructor(options: Options);
    connect(): Promise<Db>;
    isConnected(): boolean;
    close(force?: boolean): Promise<void>;
}
export interface Options {
    dbName: string;
    entitiesDirs: string[];
    entitiesDirsTs?: string[];
    strict?: boolean;
    logger?: Function;
    baseDir?: string;
    clientUrl?: string;
}
