export declare class Linquish<T> {
    private _actions;
    private _array;
    constructor(array: Array<T>);
    select<R>(callback: SelectCallbackType<T, R>, timeout?: number): Linquish<R>;
    where(callback: WhereCallbackType<T>, timeout?: number): Linquish<T>;
    forEach(callback: ForEachCallbackType<T>, timeout?: number): Linquish<T>;
    selectMany<R>(callback: SelectManyCallbackType<T, R>, timeout?: number): Linquish<R>;
    wait(): Linquish<T>;
    run(callback?: RunCallback<T>): void;
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
export interface RunCallback<T> {
    (result: Array<T>): void;
}
export interface ILinquishStatic {
    <T>(input: Array<T>): Linquish<T>;
}
