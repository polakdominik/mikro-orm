import { PropertyOptions } from './Property';
export declare function ManyToMany(options: ManyToManyOptions): Function;
export interface ManyToManyOptions extends PropertyOptions {
    entity: () => string;
    owner?: boolean;
    inversedBy?: string;
    mappedBy?: string;
}
