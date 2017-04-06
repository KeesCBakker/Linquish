'use strict';
var expect = require('chai').expect;
var linquish_1 = require("../linquish");
var linquish = function (input) {
    return new linquish_1.Linquish(input);
};
describe("Linquish", function () {
    describe("Run", function () {
        it("Run with callback.", function (done) {
            var ints = [1, 2, 4, 8, 16];
            linquish(ints)
                .run(function (outputs) {
                expect(outputs, 'Should be equal to [1, 2, 4, 8, 16]').to.deep.equal([1, 2, 4, 8, 16]);
                done();
            });
        });
        it("Run without callback.", function (done) {
            var ints = [1, 2, 4, 8, 16];
            linquish(ints)
                .run();
            setTimeout(function () { return done(); }, 5);
        });
    });
    describe("Each", function () {
        it("Loop should not change results.", function (done) {
            var ints = [1, 2, 4, 8, 16];
            var loopResult = [];
            linquish(ints)
                .forEach(function (n, ready) {
                loopResult.push(n);
                ready();
            })
                .run(function (result) {
                expect(result, 'Should be equal to [1, 2, 4, 8, 16]').to.deep.equal([1, 2, 4, 8, 16]);
                expect(loopResult, 'Should contain 1').to.contain(1);
                expect(loopResult, 'Should contain 2').to.contain(2);
                expect(loopResult, 'Should contain 4').to.contain(4);
                expect(loopResult, 'Should contain 8').to.contain(8);
                expect(loopResult, 'Should contain 16').to.contain(16);
                done();
            });
        });
        it("Test async loop using a setTimeout.", function (done) {
            var ints = [1, 2, 4, 8, 16];
            var loopResult = [];
            linquish(ints)
                .forEach(function (n, ready) {
                setTimeout(function () {
                    loopResult.push(n);
                    ready();
                }, 16 - n);
            })
                .run(function () {
                expect(loopResult, 'Should contain 1').to.contain(1);
                expect(loopResult, 'Should contain 2').to.contain(2);
                expect(loopResult, 'Should contain 4').to.contain(4);
                expect(loopResult, 'Should contain 8').to.contain(8);
                expect(loopResult, 'Should contain 16').to.contain(16);
                done();
            });
        });
        it("Test async loop using a setTimeout, with loop timeout.", function (done) {
            var ints = [1, 2, 4, 8, 16];
            var loopResult = [];
            linquish(ints)
                .forEach(function (n, ready) {
                setTimeout(function () {
                    loopResult.push(n);
                    ready();
                }, 16 - n);
            })
                .timeout(5)
                .run(function (result) {
                expect(result, 'Should be equal to [16]').to.deep.equal([16]);
            });
            //validate the foreach has run - functions cannot be cancelled,
            //but the values should be disregarded in the end result.
            setTimeout(function () {
                expect(loopResult, 'Should contain 1').to.contain(1);
                expect(loopResult, 'Should contain 2').to.contain(2);
                expect(loopResult, 'Should contain 4').to.contain(4);
                expect(loopResult, 'Should contain 8').to.contain(8);
                expect(loopResult, 'Should contain 16').to.contain(16);
                done();
            }, 25);
        });
    });
    describe("Wait", function () {
        it("Tests if all functions are executed after wait.", function (done) {
            var ints = [10, 5, 2, 1];
            var result = new Array();
            var selectExecuted = 0;
            var selectTimeoutExecuted = 0;
            var foreachExecuted = 0;
            var i = 1;
            linquish(ints)
                .select(function (n, done) {
                selectExecuted++;
                setTimeout(function () {
                    selectTimeoutExecuted++;
                    result.push(n);
                    done(n * n);
                }, n);
            })
                .wait()
                .forEach(function (n, done) {
                expect(selectExecuted, 'selectExecuted should be 4').to.eq(4);
                expect(selectTimeoutExecuted, 'selectExecuted should be 4').to.eq(4);
                foreachExecuted++;
                expect(result.length, 'Should be 4').to.eq(4);
                done();
            })
                .run(function (result) {
                expect(selectExecuted, 'selectExecuted should be 4').to.eq(4);
                expect(foreachExecuted, 'foreachExecuted should be 4').to.eq(4);
                expect(result, 'Should be equal to [100, 25, 4, 1]').to.deep.equal([100, 25, 4, 1]);
                done();
            });
        });
    });
    describe("Where", function () {
        it("Test simple where based on excluding the even number.", function (done) {
            var ints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            linquish(ints)
                .where(function (n, done) {
                done(n % 2 != 0);
            })
                .run(function (result) {
                expect(result, 'Should be equal to [1, 3, 5, 7, 9]').to.deep.equal([1, 3, 5, 7, 9]);
                done();
            });
        });
        it('Test async where with setTimeout.', function (done) {
            var ints = [2, 10, 50, 100, 200];
            linquish(ints)
                .where(function (n, output) {
                setTimeout(function () {
                    output(true);
                }, n);
            })
                .timeout(60)
                .run(function (result) {
                expect(result, 'Should be equal to [2, 10, 50]').to.deep.equal([2, 10, 50]);
                done();
            });
        });
        it('Test with nothing selected.', function (done) {
            var ints = [1, 3, 5, 7, 9];
            linquish(ints)
                .where(function (n, ready) {
                ready(n % 2 == 0);
            })
                .run(function (result) {
                expect(result, 'Should be equal to []').to.deep.equal([]);
                done();
            });
        });
        it('Test when only the first item is selected.', function (done) {
            var ints = [1, 3, 5, 7, 9];
            linquish(ints)
                .where(function (n, ready) {
                ready(n == 1);
            })
                .run(function (result) {
                expect(result, 'Should be equal to [1]').to.deep.equal([1]);
                done();
            });
        });
        it('Test when first is not selected.', function (done) {
            var ints = [1, 3, 5, 7, 9];
            linquish(ints)
                .where(function (n, ready) {
                ready(n != 1);
            })
                .run(function (result) {
                expect(result, 'Should be equal to [3, 5, 7, 9]').to.deep.equal([3, 5, 7, 9]);
                done();
            });
        });
        it('Test when only the last item is selected.', function (done) {
            var ints = [1, 3, 5, 7, 9];
            linquish(ints)
                .where(function (n, ready) {
                ready(n == 9);
            })
                .run(function (result) {
                expect(result, 'Should be equal to [9]').to.deep.equal([9]);
                done();
            });
        });
        it('Test when the last item is not selected.', function (done) {
            var ints = [1, 3, 5, 7, 9];
            linquish(ints)
                .where(function (n, ready) {
                ready(n != 9);
            })
                .run(function (result) {
                expect(result, 'Should be equal to [1, 3, 5, 7]').to.deep.equal([1, 3, 5, 7]);
                done();
            });
        });
    });
    describe("Select", function () {
        it("Test select by finding the next prime in the series.", function (done) {
            var ints = [1000, 2000, 4000, 8000];
            linquish(ints)
                .select(function (n, ouput) {
                var prime = findNextPrimeNumber(n);
                ouput(prime);
            })
                .run(function (result) {
                expect(result, 'Should contain 1009').to.contain(1009);
                expect(result, 'Should contain 2003').to.contain(2003);
                expect(result, 'Should contain 4001').to.contain(4001);
                expect(result, 'Should contain 8009').to.contain(8009);
                done();
            });
        });
        it("Test mapping a number to a string.", function (done) {
            var ints = [9, 8, 0];
            var alphabet = getGreekAlphaBet();
            linquish(ints)
                .select(function (n, output) {
                var c = alphabet[n];
                output(c);
            })
                .run(function (result) {
                expect(result, 'Should contain [\'kappa\', \'iota\', \'alpha\']').to.deep.equal(['kappa', 'iota', 'alpha']);
                done();
            });
        });
        it('Test async select by using setTimeout.', function (done) {
            var ints = [2, 10, 50];
            linquish(ints)
                .select(function (n, output) {
                setTimeout(function () {
                    output(n);
                }, n);
            })
                .run(function (result) {
                expect(result, 'Should be equal to [2, 10, 50]').to.deep.equal([2, 10, 50]);
                done();
            });
        });
        it('Test async select by using setTimeout and a timeout constraint.', function (done) {
            var ints = [2, 10, 50];
            linquish(ints)
                .select(function (n, output) {
                setTimeout(function () {
                    output(n);
                }, n);
            })
                .timeout(30)
                .run(function (result) {
                expect(result, 'Should be equal to [2, 10]').to.deep.equal([2, 10]);
                done();
            });
        });
        it('Test gated select with not enough slots for all operations.', function (done) {
            var ints = [2, 4, 6, 8, 10];
            var stamp = new Date().getTime();
            var diff;
            linquish(ints)
                .select(function (n, done) {
                diff = new Date().getTime() - stamp;
                done(n + 1);
            })
                .gate(3, 25)
                .run(function (result) {
                expect(diff, 'The diff should be greater than 25, because there were not enough slots.').to.be.greaterThan(25);
                expect(result, 'Should be equal to [3, 5, 7, 9, 11]').to.deep.equal([3, 5, 7, 9, 11]);
                done();
            });
        });
        it('Test gated select with enough slots for all operations.', function (done) {
            var ints = [2, 4, 6, 8, 10];
            var stamp = new Date().getTime();
            var diff;
            linquish(ints)
                .select(function (n, done) {
                diff = new Date().getTime() - stamp;
                done(n + 1);
            })
                .gate(5, 25)
                .run(function (result) {
                expect(diff, 'The diff should NOT be greater than 25, because there were enough slots.').to.be.lessThan(25);
                expect(result, 'Should be equal to [3, 5, 7, 9, 11]').to.deep.equal([3, 5, 7, 9, 11]);
                done();
            });
        });
    });
    describe("SelectMany", function () {
        it("Test selectMany by finding all primes between 0 and 45.", function (done) {
            var ints = [45];
            linquish(ints)
                .selectMany(function (n, done) {
                var primes = findPrimes(n);
                done(primes);
            })
                .run(function (result) {
                expect(result, 'Should be equal to [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43]').to.deep.equal([1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43]);
                done();
            });
        });
        it("Test async selectMany by selecting (x, x^2, x^3) with timeout of x*10. Constraint selectMany by 35ms.", function (done) {
            var ints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            linquish(ints)
                .selectMany(function (n, select) {
                setTimeout(function () {
                    var array = [];
                    array.push(n);
                    array.push(n * n);
                    array.push(n * n * n);
                    select(array);
                }, n * 10);
            })
                .timeout(35)
                .run(function (result) {
                expect(result, 'Should be equal to [1, 1, 1, 2, 4, 8, 3, 9, 27]').to.deep.equal([1, 1, 1, 2, 4, 8, 3, 9, 27]);
                done();
            });
        });
    });
    describe('Integration tests', function () {
        it("selectMany -> select - find primes between 0 and 10, select next prime", function (done) {
            var ints = [10];
            linquish(ints)
                .selectMany(function (n, done) {
                var primes = findPrimes(n);
                done(primes);
            })
                .select(function (prime, done) {
                done(findNextPrimeNumber(prime));
            })
                .run(function (result) {
                expect(result, 'Should be equal to [2, 3, 5, 7, 11]').to.deep.equal([2, 3, 5, 7, 11]);
                done();
            });
        });
        it("selectMany -> selectMany - find primes between 0 and 10, select prime and next prime", function (done) {
            var ints = [10];
            linquish(ints)
                .selectMany(function (n, done) {
                var primes = findPrimes(n);
                done(primes);
            })
                .selectMany(function (prime, done) {
                var p2 = findNextPrimeNumber(prime);
                var primes = [];
                primes.push(prime);
                primes.push(p2);
                done(primes);
            })
                .run(function (result) {
                expect(result, 'Should be equal to [1, 2, 2, 3, 3, 5, 5, 7, 7, 11]').to.deep.equal([1, 2, 2, 3, 3, 5, 5, 7, 7, 11]);
                done();
            });
        });
        it("select -> select -> select - find the next next prime.", function (done) {
            var ints = [2, 3, 5];
            var result = new Array();
            linquish(ints)
                .select(function (prime, done) {
                done(findNextPrimeNumber(prime));
            })
                .select(function (prime, done) {
                done(findNextPrimeNumber(prime));
            })
                .select(function (prime, done) {
                done(findNextPrimeNumber(prime));
            })
                .run(function (result) {
                expect(result, 'Should be equal to [7, 11, 13]').to.deep.equal([7, 11, 13]);
                done();
            });
        });
        it("select many -> where - find primes between 0 and 25 that contain a 2", function (done) {
            var ints = [25];
            linquish(ints)
                .selectMany(function (n, done) {
                var primes = findPrimes(n);
                done(primes);
            })
                .where(function (n, done) {
                done(n.toString().indexOf('2') != -1);
            })
                .run(function (result) {
                expect(result).to.deep.equal([2, 23]);
                done();
            });
        });
        it("select many -> where -> where - find primes between 0 and 250 that contain a 2 and a 7", function (done) {
            var ints = [250];
            linquish(ints)
                .selectMany(function (n, done) {
                var primes = findPrimes(n);
                done(primes);
            })
                .where(function (n, done) {
                done(n.toString().indexOf('2') != -1);
            })
                .where(function (n, done) {
                done(n.toString().indexOf('7') != -1);
            })
                .run(function (result) {
                expect(result, 'Should be equal to [127, 227]').to.deep.equal([127, 227]);
                done();
            });
        });
    });
    describe("Gator", function () {
        it('Test gator without gating.', function (done) {
            var result = [];
            var gator = new linquish_1.Gator(0, 0);
            var z = 0;
            for (var i = 0; i < 3; i++) {
                gator.schedule(function (ready) {
                    result.push(result.length);
                    z += result.length;
                    ready();
                });
            }
            expect(z, 'Z should be 6 (1+2+3). Make sure everything is executed.').to.be.eq(6);
            expect(result, 'Should be equal to [0, 1, 2]').to.deep.equal([0, 1, 2]);
            done();
        });
        it("Gate should not be used when there are enough slots. Check if all operation finish in time.", function (done) {
            var gator = new linquish_1.Gator(3, 20);
            var stamp = new Date().getTime();
            var diff = 0;
            var z = 0;
            var _loop_1 = function (i) {
                gator.schedule(function (ready) {
                    z += (i + 1);
                    diff = new Date().getTime() - stamp;
                    ready();
                });
            };
            for (var i = 0; i < 3; i++) {
                _loop_1(i);
            }
            setTimeout(function () {
                expect(z, 'Z should be 6 (1+2+3). Make sure everything is executed.').to.be.eq(6);
                expect(diff, 'Should be greater or less than 100.').to.be.lessThan(100);
                done();
            }, 25);
        });
        it("Gate should be used when there aren't.", function (done) {
            var gator = new linquish_1.Gator(2, 20);
            var stamp = new Date().getTime();
            var diff = 0;
            var z = 0;
            var _loop_2 = function (i) {
                gator.schedule(function (ready) {
                    z += (i + 1);
                    diff = new Date().getTime() - stamp;
                    ready();
                });
            };
            for (var i = 0; i < 3; i++) {
                _loop_2(i);
            }
            setTimeout(function () {
                expect(z, 'Z should be 6 (1+2+3). Make sure everything is executed.').to.be.eq(6);
                expect(diff, 'Should be greater or equal than 20.').to.be.gte(20);
                done();
            }, 25);
        });
        it("Test long running gates.", function (done) {
            var gator = new linquish_1.Gator(2, 10);
            var stamp = new Date().getTime();
            var z = 0;
            var diffs = [];
            var _loop_3 = function (i) {
                gator.schedule(function (ready) {
                    var diff = new Date().getTime() - stamp;
                    diffs.push(diff);
                    setTimeout(function () {
                        z += (i + 1);
                        ready();
                    }, 11);
                });
            };
            for (var i = 0; i < 3; i++) {
                _loop_3(i);
            }
            setTimeout(function () {
                expect(z, 'Z should be 6 (1+2+3). Make sure everything is executed.').to.be.eq(6);
                expect(diffs[0], '1st diff should be less than 10.').to.be.lessThan(10);
                expect(diffs[1], '1st diff should be less than 10.').to.be.lessThan(10);
                expect(diffs[2], '2st diff should be less than 20 (2 gate cycles).').to.be.gte(20);
                done();
            }, 40);
        });
    });
});
function findNextPrimeNumber(n) {
    var a = 1;
    do {
        if (a > n) {
            return a;
        }
        a = findNextPrimeNumberBasedOnPrime(a);
    } while (true);
}
function findNextPrimeNumberBasedOnPrime(prime) {
    if (prime > 2) {
        var i, q;
        do {
            i = 3;
            prime += 2;
            q = Math.floor(Math.sqrt(prime));
            while (i <= q && prime % i) {
                i += 2;
            }
        } while (i <= q);
        return prime;
    }
    return prime === 2 ? 3 : 2;
}
function findPrimes(max) {
    var primes = new Array();
    var i = 0;
    while (i < max) {
        i = findNextPrimeNumber(i);
        if (i < max) {
            primes.push(i);
        }
    }
    return primes;
}
function getGreekAlphaBet() {
    return ['alpha', 'beta', 'gamma',
        'delta', 'epsilon', 'zeta',
        'eta', 'theta', 'iota',
        'kappa', 'lambda', 'mu',
        'nu', 'xi', 'omicron',
        'pi', 'rho', 'sigma',
        'tau', 'upsilon', 'phi',
        'chi', 'psi', 'omega'];
}
