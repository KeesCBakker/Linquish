import { ISimpleEvent, SimpleEventDispatcher } from 'strongly-typed-events';

export interface ILinquish<T> {

    select<R>(callback: SelectCallbackType<T, R>): IGateableLinquish<R>;
    where(callback: WhereCallbackType<T>): IGateableLinquish<T>;
    forEach(callback: ForEachCallbackType<T>): IGateableLinquish<T>;
    selectMany<R>(callback: SelectManyCallbackType<T, R>): IGateableLinquish<R>;
    wait(): ILinquish<T>;
    run(callback?: RunCallbackType<T>): void;
}

export interface IGateableLinquish<T> extends ILinquish<T>, ITimeoutableLinqish<T> {

    gate(slots: number, spanInMs: number): ITimeoutableLinqish<T>;
}

export interface ITimeoutableLinqish<T> extends ILinquish<T> {

    timeout(x: number): ILinquish<T>;
}

/**
 * Linquish provides a way of traversing an array in an asynchronous way.
 * Each operation is queued until it is executes by the run function.
 */
export class Linquish<T> implements IGateableLinquish<T> {

    private _actions = new Array<Action>();
    private _array = new Array<T>();

    constructor(array: Array<T>) {
        array.forEach(a => this._array.push(a));
    }

    public select<R>(callback: SelectCallbackType<T, R>): IGateableLinquish<R> {
        var a = new SelectAction<T, R>(callback);
        this._actions.push(a);
        return <IGateableLinquish<R>><any>this;
    }

    public where(callback: WhereCallbackType<T>): IGateableLinquish<T> {
        var a = new WhereAction<T>(callback);
        this._actions.push(a);
        return this;
    }

    public forEach(callback: ForEachCallbackType<T>): IGateableLinquish<T> {
        var a = new ForEachAction<T>(callback);
        this._actions.push(a);
        return this;
    }

    public selectMany<R>(callback: SelectManyCallbackType<T, R>): IGateableLinquish<R> {
        var a = new SelectManyAction<T, R>(callback);
        this._actions.push(a);
        return <IGateableLinquish<R>><any>this;
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

    public gate(slots: number, spanInMs: number): ITimeoutableLinqish<T>{
        if (this._actions.length > 0) {
            var a = this._actions[this._actions.length - 1];
            if (a instanceof TimeoutAction) {
                (<GateAction>a).slots = slots;
                (<GateAction>a).spanInMs = spanInMs;
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

        if (Sub.IsFinishedState(this.state)) {
            return;
        }

        if (this.state == StateType.Wait) {
            this.state = StateType.Running;
        }

        if (this.nr >= this.owner.actions.length) {
            this.setState(StateType.Finished);
            return;
        }

        if (!(this.item instanceof BaseSub)) {

            setTimeout(() => {

                var action = this.owner.actions[this.nr];
                this.nr = this.nr + 1;
                action.execute(this);

            }, 1);
        }
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

abstract class GateAction extends TimeoutAction {

    public slots: number;
    public spanInMs: number;
    public gator: Gator;

    constructor() {
        super();
    }

    protected run(section: Section): void {

        if (this.gator == null) {
            this.gator = new Gator(this.slots, this.spanInMs);
        }

        this.gator.schedule((ready: ICallback) => {
            this.workOnItem(section, ready);
        });
    }

    protected workOnItem(section: Section, ready: ICallback): void {

        var t = this.createTimeout(section);

        this.work(section, t, () => {
            ready();
            section.run();
        });
    }

    protected abstract work(section: Section, timeout: any, ready: () => void ): void;
}

class SelectAction<T, R> extends GateAction {

    constructor(private callback: SelectCallbackType<T, R>) {
        super();
    }

    protected work(section: Section, timeout: any, ready: () => void): void {

        this.callback(section.item, (output) => {

            TimeoutAction.conditionalExecute(timeout, section, () => {
                section.item = output;
                ready();
            });

        });
    }
}

class WhereAction<T> extends GateAction {

    constructor(private callback: WhereCallbackType<T>) {
        super();
    }

    protected work(section: Section, timeout: any, ready: () => void): void {

        this.callback(section.item, (include) => {

            TimeoutAction.conditionalExecute(timeout, section, () => {

                if (!include) {
                    section.setState(StateType.Skip);
                }

                ready();
            });

        });
    }
}

class ForEachAction<T> extends GateAction {

    constructor(private callback: ForEachCallbackType<T>) {
        super();
    }

    protected work(section: Section, timeout: any, ready: () => void): void {

        this.callback(section.item, () => {

            TimeoutAction.conditionalExecute(timeout, section, () => {
                ready();
            });
        });
    }
}

class SelectManyAction<T, R> extends GateAction {

    constructor(private callback: SelectManyCallbackType<T, R>) {
        super();
    }

    protected work(section: Section, timeout: any, ready: () => void): void {

        this.callback(section.item, (output: Array<R>) => {

            TimeoutAction.conditionalExecute(timeout, section, () => {

                if (output == null || output.length == 0) {
                    section.setState(StateType.Skip);
                    ready();
                }
                else {

                    var sub = new Sub(section.owner.actions, output, section.nr);
                    section.item = sub;

                    sub.run(() => {
                        section.setState(StateType.Finished);
                    });

                    ready();
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

export default exp;

export interface ICallback {
    (): void;
}

export interface IGatorAction {
    (callback: ICallback): void
}

export class Gator {

    private isRunning = false;
    private running = 0;
    private ready = 0;
    private queue = new Array<IGatorAction>();
    private timer: any;

    public constructor(private slots: number, private spanInMs: number) { }

    public schedule(action: IGatorAction) {

        if (this.slots == null || this.slots == 0 || this.spanInMs == 0 || this.spanInMs == null) {
            action(() => { });
        }
        else {
            this.queue.push(action);
            this.run();
        }
    }

    private run() {

        if (this.queue.length == 0) {

            if (this.isRunning) {
                clearInterval(this.timer);
                this.isRunning = false;
            }

            return;
        }

        if (this.running < this.slots) {

            let action: IGatorAction;

            do {
                action = this.queue.shift();

                let inner = action;

                if (inner != null) {

                    this.running++;
                    inner(() => {
                        this.ready++;
                    });
                }
            }
            while (action != null && this.running < this.slots);
        }

        if (!this.isRunning) {

            this.isRunning = true;

            this.timer = setInterval(() => {

                this.running = this.slots - this.ready;
                this.ready = 0;

                this.run();

            }, this.spanInMs);
        }
    }
}
