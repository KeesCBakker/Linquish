"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var strongly_typed_events_1 = require("strongly-typed-events");
/* small bridge to web JS */
if (typeof (module) === 'undefined') {
    (function (w) {
        w.module = w.module || {};
        w.module.exports = w.module.exports || {};
        w.exports = w.exports || w.module.exports || {};
        w.require = w.require || function (src) {
            return w[src] || w.exports;
        };
    }(window || {}));
}
var Linquish = (function () {
    function Linquish(array) {
        var _this = this;
        this._actions = new Array();
        this._array = new Array();
        array.forEach(function (a) { return _this._array.push(a); });
    }
    Linquish.prototype.select = function (callback, timeout) {
        var a = new SelectAction(callback, timeout);
        this._actions.push(a);
        return this;
    };
    Linquish.prototype.where = function (callback, timeout) {
        var a = new WhereAction(callback, timeout);
        this._actions.push(a);
        return this;
    };
    Linquish.prototype.forEach = function (callback, timeout) {
        var a = new ForEachAction(callback, timeout);
        this._actions.push(a);
        return this;
    };
    Linquish.prototype.selectMany = function (callback, timeout) {
        var a = new SelectManyAction(callback, timeout);
        this._actions.push(a);
        return this;
    };
    Linquish.prototype.wait = function () {
        var a = new WaitAction();
        this._actions.push(a);
        return this;
    };
    Linquish.prototype.run = function (callback) {
        var sub = new Sub(this._actions, this._array);
        sub.run(callback);
    };
    return Linquish;
}());
exports.Linquish = Linquish;
var BaseSub = (function () {
    function BaseSub() {
    }
    return BaseSub;
}());
var Sub = (function (_super) {
    __extends(Sub, _super);
    function Sub(actions, items, startAction) {
        var _this = _super.call(this) || this;
        _this.actions = new Array();
        _this.array = new Array();
        _this.isFinished = false;
        actions.forEach(function (a) { return _this.actions.push(a); });
        items.forEach(function (item) {
            var section = new Section(item, _this);
            if (startAction != null) {
                section.nr = startAction;
            }
            //may trigger other objects wait
            section.onStateChange.sub(function (state) {
                _this.signalWait();
            });
            _this.array.push(section);
        });
        return _this;
    }
    Sub.prototype.signalWait = function () {
        var allFinished = this.array.every(function (a) { return Sub.IsFinishedState(a.state); });
        if (allFinished) {
            this.signalFinished();
            return;
        }
        var allWait = this.array.every(function (a) { return Sub.IsWaitingState(a.state); });
        if (allWait) {
            this.array.forEach(function (a) { return a.run(); });
        }
    };
    Sub.prototype.signalFinished = function () {
        if (this.isFinished) {
            return;
        }
        var allFinished = this.array.every(function (a) { return Sub.IsFinishedState(a.state); });
        if (!allFinished) {
            return;
        }
        this.isFinished = true;
        if (this.callback != null) {
            var results = this.get();
            this.callback(results);
        }
    };
    Sub.prototype.get = function () {
        var result = new Array();
        this.array.forEach(function (a) { return a.get().forEach(function (b) { return result.push(b); }); });
        return result;
    };
    Sub.prototype.run = function (callback) {
        this.callback = callback;
        this.array.forEach(function (a) { return a.run(); });
    };
    Sub.IsFinishedState = function (type) {
        return type == StateType.Error || type == StateType.Finished || type == StateType.Skip;
    };
    Sub.IsWaitingState = function (type) {
        return type == StateType.Wait || Sub.IsFinishedState(type);
    };
    return Sub;
}(BaseSub));
var StateType;
(function (StateType) {
    StateType[StateType["Running"] = 0] = "Running";
    StateType[StateType["Skip"] = 1] = "Skip";
    StateType[StateType["Wait"] = 2] = "Wait";
    StateType[StateType["Error"] = 3] = "Error";
    StateType[StateType["Finished"] = 4] = "Finished";
})(StateType || (StateType = {}));
var Section = (function () {
    function Section(item, owner) {
        this.item = item;
        this.owner = owner;
        this._onSetStateDispatcher = new strongly_typed_events_1.SimpleEventDispatcher();
        this.state = StateType.Running;
        this.nr = 0;
    }
    Section.prototype.setState = function (state) {
        this.state = state;
        this._onSetStateDispatcher.dispatchAsync(this.state);
    };
    Object.defineProperty(Section.prototype, "onStateChange", {
        get: function () {
            return this._onSetStateDispatcher.asEvent();
        },
        enumerable: true,
        configurable: true
    });
    Section.prototype.run = function () {
        var _this = this;
        if (this.state == StateType.Wait) {
            this.state = StateType.Running;
        }
        if (this.nr >= this.owner.actions.length) {
            this.setState(StateType.Finished);
            return;
        }
        setTimeout(function () {
            var action = _this.owner.actions[_this.nr];
            _this.nr = _this.nr + 1;
            action.execute(_this);
        }, 1);
    };
    Section.prototype.get = function () {
        var array = new Array();
        if (this.state != StateType.Skip) {
            if (this.item instanceof BaseSub) {
                this.item.get().forEach(function (a) {
                    array.push(a);
                });
            }
            else {
                array.push(this.item);
            }
        }
        return array;
    };
    return Section;
}());
var Action = (function () {
    function Action(name, timeout) {
        this.name = name;
        this.timeout = timeout;
    }
    Action.prototype.execute = function (section) {
        try {
            this.run(section);
        }
        catch (e) {
            section.setState(StateType.Error);
        }
    };
    return Action;
}());
var SelectAction = (function (_super) {
    __extends(SelectAction, _super);
    function SelectAction(callback, timeout) {
        var _this = _super.call(this, 'select', timeout) || this;
        _this.callback = callback;
        return _this;
    }
    SelectAction.prototype.run = function (section) {
        this.callback(section.item, function (output) {
            section.item = output;
            section.run();
        });
    };
    return SelectAction;
}(Action));
var WhereAction = (function (_super) {
    __extends(WhereAction, _super);
    function WhereAction(callback, timeout) {
        var _this = _super.call(this, 'where', timeout) || this;
        _this.callback = callback;
        return _this;
    }
    WhereAction.prototype.run = function (section) {
        this.callback(section.item, function (include) {
            if (!include) {
                section.setState(StateType.Skip);
            }
            else {
                section.run();
            }
        });
    };
    return WhereAction;
}(Action));
var ForEachAction = (function (_super) {
    __extends(ForEachAction, _super);
    function ForEachAction(callback, timeout) {
        var _this = _super.call(this, 'each', timeout) || this;
        _this.callback = callback;
        return _this;
    }
    ForEachAction.prototype.run = function (section) {
        this.callback(section.item, function () { return section.run(); });
    };
    return ForEachAction;
}(Action));
var SelectManyAction = (function (_super) {
    __extends(SelectManyAction, _super);
    function SelectManyAction(callback, timeout) {
        var _this = _super.call(this, 'selectMany', timeout) || this;
        _this.callback = callback;
        return _this;
    }
    SelectManyAction.prototype.run = function (section) {
        this.callback(section.item, function (output) {
            if (output == null || output.length == 0) {
                section.setState(StateType.Skip);
            }
            else {
                var sub = new Sub(section.owner.actions, output, section.nr);
                section.item = sub;
                sub.run(function () {
                    section.setState(StateType.Finished);
                });
            }
        });
    };
    return SelectManyAction;
}(Action));
var WaitAction = (function (_super) {
    __extends(WaitAction, _super);
    function WaitAction() {
        return _super.call(this, 'wait') || this;
    }
    WaitAction.prototype.run = function (section) {
        section.setState(StateType.Wait);
    };
    return WaitAction;
}(Action));
var exp = function (input) {
    return new Linquish(input);
};
module.exports = exp;
