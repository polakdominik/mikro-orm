import { PropertyOptions } from './Property';
export declare function OneToMany(options: OneToManyOptions): Function;
export interface OneToManyOptions extends PropertyOptions {
    entity: () => string;
    fk: string;
}
