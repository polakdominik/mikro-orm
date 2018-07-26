import { PropertyOptions } from './Property';
export declare function ManyToOne(options: ManyToOneOptions): Function;
export interface ManyToOneOptions extends PropertyOptions {
    entity: () => string;
    fk?: string;
}
