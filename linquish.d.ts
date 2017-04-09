/**
 * Linquish provides a way of traversing an array in an asynchronous way.
 * Each operation is queued until it is executes by the run function.
 */
export declare class Linquish<T> implements ILinquish<T>, IConditionalLinquish<T> {
    private _actions;
    private _array;
    constructor(array: Array<T>);
    select<R>(callback: SelectCallbackType<T, R>): IConditionalLinquish<R>;
    where(callback: WhereCallbackType<T>): IConditionalLinquish<T>;
    forEach(callback: ForEachCallbackType<T>): IConditionalLinquish<T>;
    selectMany<R>(callback: SelectManyCallbackType<T, R>): IConditionalLinquish<R>;
    wait(): Linquish<T>;
    run(callback?: RunCallbackType<T>): void;
    timeout(x: number): ILinquish<T>;
    gate(slots: number, spanInMs: number): ITimeoutableLinqish<T>;
    when(condition: ConditionCallbackType<T>): IConditionalLinquish<T>;
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
export interface ConditionCallbackType<T> {
    (input: T): boolean;
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
declare let exp: ILinquishStatic;
export default exp;
export interface ICallback {
    (): void;
}
export interface IGatorAction {
    (callback: ICallback): void;
}
export declare class Gator {
    private slots;
    private spanInMs;
    private isRunning;
    private running;
    private ready;
    private queue;
    private timer;
    constructor(slots: number, spanInMs: number);
    schedule(action: IGatorAction): void;
    private run();
}
export interface ILinquish<T> {
    select<R>(callback: SelectCallbackType<T, R>): IGateableLinquish<R>;
    where(callback: WhereCallbackType<T>): IGateableLinquish<T>;
    forEach(callback: ForEachCallbackType<T>): IConditionalLinquish<T>;
    selectMany<R>(callback: SelectManyCallbackType<T, R>): IGateableLinquish<R>;
    wait(): ILinquish<T>;
    run(callback?: RunCallbackType<T>): void;
}
export interface IConditionalLinquish<T> extends IGateableLinquish<T>, ILinquish<T> {
    when(condition: ConditionCallbackType<T>): IConditionalLinquish<T>;
}
export interface IGateableLinquish<T> extends ITimeoutableLinqish<T>, ILinquish<T> {
    gate(slots: number, spanInMs: number): ITimeoutableLinqish<T>;
}
export interface ITimeoutableLinqish<T> extends ILinquish<T> {
    timeout(x: number): ILinquish<T>;
}
