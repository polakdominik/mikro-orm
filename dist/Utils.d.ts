import { BaseEntity } from './BaseEntity';
export declare class Utils {
    private static readonly DIFF_IGNORED_KEYS;
    static isObject(o: any): boolean;
    static isArray(arr: any): boolean;
    static isString(s: any): boolean;
    static equals(a: any, b: any): boolean;
    static unique<T = string>(items: T[]): T[];
    static diff(a: any, b: any): any;
    /**
     * Process references first so we do not have to deal with cycles
     */
    static diffEntities(a: BaseEntity, b: BaseEntity): any;
    static prepareEntity(e: BaseEntity): any;
    static copy(entity: any): any;
    static renameKey(payload: any, from: string, to: string): void;
    static convertObjectIds(payload: any): any;
    static getParamNames(func: Function | string): string[];
    static softIndexOf(arr: any[], item: any): number;
}
