export interface ILinquish<T> {
    select<R>(callback: SelectCallbackType<T, R>): ITimeoutableLinqish<R>;
    where(callback: WhereCallbackType<T>): ITimeoutableLinqish<T>;
    forEach(callback: ForEachCallbackType<T>): ITimeoutableLinqish<T>;
    selectMany<R>(callback: SelectManyCallbackType<T, R>): ITimeoutableLinqish<R>;
    wait(): ILinquish<T>;
    run(callback?: RunCallbackType<T>): void;
}
export interface ITimeoutableLinqish<T> extends ILinquish<T> {
    timeout(x: number): ILinquish<T>;
}
/**
 * Linquish provides a way of traversing an array in an asynchronous way.
 * Each operation is queued until it is executes by the run function.
 */
export declare class Linquish<T> implements ITimeoutableLinqish<T> {
    private _actions;
    private _array;
    constructor(array: Array<T>);
    select<R>(callback: SelectCallbackType<T, R>): ITimeoutableLinqish<R>;
    where(callback: WhereCallbackType<T>): ITimeoutableLinqish<T>;
    forEach(callback: ForEachCallbackType<T>): ITimeoutableLinqish<T>;
    selectMany<R>(callback: SelectManyCallbackType<T, R>): ITimeoutableLinqish<R>;
    wait(): Linquish<T>;
    run(callback?: RunCallbackType<T>): void;
    timeout(x: number): ILinquish<T>;
}
export interface SelectReturnCallbackType<T> {
    (returnObject: T): void;
}
export interface SelectCallbackType<T, R> {
    (input: T, ready: SelectReturnCallbackType<R>): void;
}
export interface WhereReturnCallbackType {
    (include: boolean): void;
}
export interface WhereCallbackType<T> {
    (input: T, ready: WhereReturnCallbackType): any;
}
export interface ForEachCallbackType<T> {
    (input: T, ready: () => void): any;
}
export interface SelectReturnManyCallbackType<T> {
    (array: Array<T>): any;
}
export interface SelectManyCallbackType<T, R> {
    (input: T, ready: SelectReturnManyCallbackType<R>): void;
}
export interface RunCallbackType<T> {
    (result: Array<T>): void;
}
export interface ILinquishStatic {
    <T>(input: Array<T>): Linquish<T>;
}
