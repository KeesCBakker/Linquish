import { ISimpleEvent, SimpleEventDispatcher } from 'strongly-typed-events';

/* small bridge to web JS */
if (typeof (module) === 'undefined') {
    (function (w: any) {

        w.module = w.module || {};
        w.module.exports = w.module.exports || {};
        w.exports = w.exports || w.module.exports || {};
        w.require = w.require || function (src) {
            return w[src] || w.exports;
        }
    }(window || {}));
}

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
export class Linquish<T> implements ITimeoutableLinqish<T> {

    private _actions = new Array<Action>();
    private _array = new Array<T>();

    constructor(array: Array<T>) {
        array.forEach(a => this._array.push(a));
    }

    public select<R>(callback: SelectCallbackType<T, R>): ITimeoutableLinqish<R> {
        var a = new SelectAction<T, R>(callback);
        this._actions.push(a);
        return <ITimeoutableLinqish<R>><any>this;
    }

    public where(callback: WhereCallbackType<T>): ITimeoutableLinqish<T> {
        var a = new WhereAction<T>(callback);
        this._actions.push(a);
        return this;
    }

    public forEach(callback: ForEachCallbackType<T>): ITimeoutableLinqish<T> {
        var a = new ForEachAction<T>(callback);
        this._actions.push(a);
        return this;
    }

    public selectMany<R>(callback: SelectManyCallbackType<T, R>): ITimeoutableLinqish<R> {
        var a = new SelectManyAction<T, R>(callback);
        this._actions.push(a);
        return <ITimeoutableLinqish<R>><any>this;
    }

    public wait(): Linquish<T> {
        var a = new WaitAction();
        this._actions.push(a);
        return this;
    }

    public run(callback?: RunCallbackType<T>): void {

        var sub = new Sub(this._actions, this._array);
        sub.run(callback);
    }

    public timeout(x: number): ILinquish<T> {
        if (this._actions.length > 0) {
            var a = this._actions[this._actions.length - 1];
            if (a instanceof TimeoutAction) {
                (<TimeoutAction>a).timeout = x;
            }
        }

        return this;
    }
}

abstract class BaseSub {

    public constructor() {
    }

    public abstract signalWait(): void;
    public abstract signalFinished(): void;
    public abstract actions: Array<Action>;
    public abstract get(): Array<any>;
}

class Sub<T> extends BaseSub {

    public actions = new Array<Action>();
    public sections = new Array<Section>();
    private callback: RunCallbackType<T>;
    private isFinished = false;

    constructor(actions: Array<Action>, items: Array<T>, startAction?: number) {

        super();

        actions.forEach(a => this.actions.push(a));
        items.forEach(item => {

            var section = new Section(item, this);
            if (startAction != null) {
                section.nr = startAction;
            }

            //may trigger other objects wait
            section.onStateChange.sub((state) => {
                this.signalWait()

            });

            this.sections.push(section);
        });
    }

    public signalWait(): void {

        var allFinished = this.sections.every(a => Sub.IsFinishedState(a.state));
        if (allFinished) {
            this.signalFinished();
            return;
        }

        var allWait = this.sections.every(a => Sub.IsWaitingState(a.state));
        if (allWait) {
            this.sections.forEach(a => a.run());
        }
    }

    public signalFinished(): void {

        if (this.isFinished) {
            return;
        }

        var allFinished = this.sections.every(a => Sub.IsFinishedState(a.state));
        if (!allFinished) {
            return;
        }

        this.isFinished = true;

        if (this.callback != null) {
            var results = this.get();
            this.callback(results);
        }
    }

    public get(): Array<T> {

        var result = new Array<T>();
        this.sections.forEach(a => a.get().forEach(b => result.push(b)));
        return result;

    }

    public run(callback?: RunCallbackType<T>): void {

        this.callback = callback;
        this.sections.forEach(a => a.run());
    }

    public static IsFinishedState(type: StateType) {
        return type == StateType.Error || type == StateType.Finished || type == StateType.Skip || type == StateType.Timeout;
    }

    public static IsWaitingState(type: StateType) {
        return type == StateType.Wait || Sub.IsFinishedState(type);
    }
}

enum StateType {
    Running,
    Skip,
    Wait,
    Error,
    Timeout,
    Finished
}

class Section {

    private _onSetStateDispatcher = new SimpleEventDispatcher<StateType>();

    public state = StateType.Running;
    public nr = 0;

    constructor(public item: any, public owner: BaseSub) { }

    public setState(state: StateType) {

        this.state = state;
        this._onSetStateDispatcher.dispatchAsync(this.state);
    }

    public get onStateChange(): ISimpleEvent<StateType> {
        return this._onSetStateDispatcher.asEvent();
    }

    public run(): void {

        if (this.state == StateType.Wait) {
            this.state = StateType.Running;
        }

        if (this.nr >= this.owner.actions.length) {
            this.setState(StateType.Finished);
            return;
        }

        setTimeout(() => {

            var action = this.owner.actions[this.nr];
            this.nr = this.nr + 1;
            action.execute(this);

        }, 1);
    }

    public get(): Array<any> {

        var array = new Array<any>();

        if (this.state == StateType.Finished) {

            if (this.item instanceof BaseSub) {
                (<BaseSub>this.item).get().forEach(a => {
                    array.push(a);
                });
            }
            else {
                array.push(this.item);
            }
        }

        return array;
    }
}

abstract class Action {

    constructor() { }

    public execute(section: Section): void {
        try {
            this.run(section);
        }
        catch (e) {
            section.setState(StateType.Error);
        }
    }

    protected abstract run(section: Section): void;
}

abstract class TimeoutAction extends Action {

    public timeout = 0;

    constructor() {
        super();
    }

    protected createTimeout(section: Section): any {
        if (this.timeout != null && this.timeout > 0) {
            return setTimeout(() => {
                section.setState(StateType.Timeout);
            }, this.timeout);
        }

        return null;
    }

    protected static conditionalExecute(timeoutId: any, section: Section, delegate: () => void): void {
        if (timeoutId != null) {
            clearTimeout(timeoutId);
        }

        if (section.state != StateType.Timeout) {
            delegate();
        }
    }
}

class SelectAction<T, R> extends TimeoutAction {

    constructor(private callback: SelectCallbackType<T, R>) {
        super();
    }

    protected run(section: Section): void {

        var t = this.createTimeout(section);

        this.callback(section.item, (output) => {

            TimeoutAction.conditionalExecute(t, section, () => {
                section.item = output;
                section.run();
            });

        });
    }
}

class WhereAction<T> extends TimeoutAction {

    constructor(private callback: WhereCallbackType<T>) {
        super();
    }

    protected run(section: Section): void {

        var t = this.createTimeout(section);

        this.callback(section.item, (include) => {

            TimeoutAction.conditionalExecute(t, section, () => {

                if (!include) {
                    section.setState(StateType.Skip);
                }
                else {
                    section.run();
                }
            });

        });
    }
}

class ForEachAction<T> extends TimeoutAction {

    constructor(private callback: ForEachCallbackType<T>) {
        super();
    }

    protected run(section: Section): void {

        var t = this.createTimeout(section);

        this.callback(section.item, () => {

            TimeoutAction.conditionalExecute(t, section, () => {

                section.run()
            });
        });
    }
}

class SelectManyAction<T, R> extends TimeoutAction {

    constructor(private callback: SelectManyCallbackType<T, R>) {
        super();
    }

    protected run(section: Section): void {

        var t = this.createTimeout(section);

        this.callback(section.item, (output: Array<R>) => {

            TimeoutAction.conditionalExecute(t, section, () => {

                if (output == null || output.length == 0) {
                    section.setState(StateType.Skip);
                }
                else {

                    var sub = new Sub(section.owner.actions, output, section.nr);
                    section.item = sub;

                    sub.run(() => {
                        section.setState(StateType.Finished);
                    });
                }
            });

        });
    }
}

class WaitAction extends Action {

    constructor() {
        super();
    }

    protected run(section: Section): void {
        section.setState(StateType.Wait);
    }
}

export interface SelectReturnCallbackType<T> {
    (returnObject: T): void
}

export interface SelectCallbackType<T, R> {
    (input: T, ready: SelectReturnCallbackType<R>): void
}

export interface WhereReturnCallbackType {
    (include: boolean): void
}

export interface WhereCallbackType<T> {
    (input: T, ready: WhereReturnCallbackType);
}

export interface ForEachCallbackType<T> {
    (input: T, ready: () => void)
}

export interface SelectReturnManyCallbackType<T> {
    (array: Array<T>)
}

export interface SelectManyCallbackType<T, R> {
    (input: T, ready: SelectReturnManyCallbackType<R>): void
}

export interface RunCallbackType<T> {
    (result: Array<T>): void
}

export interface ILinquishStatic {
    <T>(input: Array<T>): Linquish<T>
}

let exp: ILinquishStatic = function <T>(input: Array<T>): Linquish<T> {
    return new Linquish<T>(input);
}

module.exports = exp;
module.exports.Linquish = Linquish; 