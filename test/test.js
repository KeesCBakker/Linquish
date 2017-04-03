/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />
'use strict';
var expect = require('chai').expect;
var linquish_1 = require("../linquish");
describe("Linquish", function () {
    describe("run", function () {
        it("run with callback", function (done) {
            var ints = [1, 2, 4, 8, 16];
            new linquish_1.Linquish(ints)
                .run(function (outputs) {
                expect(outputs, 'Should be equal to [1, 2, 4, 8, 16]').to.deep.equal([1, 2, 4, 8, 16]);
                done();
            });
        });
    });
    describe("each", function () {
        it("standard each", function (done) {
            var ints = [1, 2, 4, 8, 16];
            var result = [];
            new linquish_1.Linquish(ints)
                .forEach(function (n, ready) {
                result.push(n);
                ready();
            })
                .run(function () {
                expect(result, 'Should contain 1').to.contain(1);
                expect(result, 'Should contain 2').to.contain(2);
                expect(result, 'Should contain 4').to.contain(4);
                expect(result, 'Should contain 8').to.contain(8);
                expect(result, 'Should contain 16').to.contain(16);
                done();
            });
        });
        it("async each", function (done) {
            var ints = [1, 2, 4, 8, 16];
            var result = [];
            new linquish_1.Linquish(ints)
                .forEach(function (n, ready) {
                setTimeout(function () {
                    result.push(n);
                    ready();
                }, 16 - n);
            })
                .run(function () {
                expect(result, 'Should contain 1').to.contain(1);
                expect(result, 'Should contain 2').to.contain(2);
                expect(result, 'Should contain 4').to.contain(4);
                expect(result, 'Should contain 8').to.contain(8);
                expect(result, 'Should contain 16').to.contain(16);
                done();
            });
        });
    });
    describe("wait", function () {
        it("wait for timeouts", function (done) {
            var ints = [40, 20, 10, 5];
            var result = new Array();
            var selectExecuted = false;
            var foreachExecuted = false;
            var i = 1;
            new linquish_1.Linquish(ints)
                .select(function (n, done) {
                selectExecuted = true;
                setTimeout(function () {
                    result.push(n);
                    done(n * n);
                }, n * 10);
            })
                .wait()
                .forEach(function (n, done) {
                foreachExecuted = true;
                expect(result.length, 'Should be 4').to.eq(4);
                done();
            })
                .run(function () {
                expect(selectExecuted, 'selectExecuted should be true').to.eq(true);
                expect(foreachExecuted, 'foreachExecuted should be true').to.eq(true);
                expect(result.length, 'Should be 4').to.eq(4);
                done();
            });
        });
    });
    describe("where", function () {
        it("where uneven", function (done) {
            var ints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            new linquish_1.Linquish(ints)
                .where(function (n, done) {
                done(n % 2 != 0);
            })
                .run(function (result) {
                expect(result, 'Shoud be equal to [1, 3, 5, 7, 9]').to.deep.equal([1, 3, 5, 7, 9]);
                done();
            });
        });
        it("async each", function (done) {
            var ints = [1, 2, 4, 8, 16];
            var result = [];
            new linquish_1.Linquish(ints)
                .forEach(function (n, ready) {
                setTimeout(function () {
                    result.push(n);
                    ready();
                }, 16 - n);
            })
                .run(function () {
                expect(result, 'Should contain 1').to.contain(1);
                expect(result, 'Should contain 2').to.contain(2);
                expect(result, 'Should contain 4').to.contain(4);
                expect(result, 'Should contain 8').to.contain(8);
                expect(result, 'Should contain 16').to.contain(16);
                done();
            });
        });
    });
    describe("select", function () {
        it("select power", function (done) {
            var ints = [1, 2, 4, 8, 16];
            new linquish_1.Linquish(ints)
                .select(function (n, ouput) {
                ouput(n * n);
            })
                .run(function (result) {
                expect(result, 'Should contain 1').to.contain(1);
                expect(result, 'Should contain 4').to.contain(4);
                expect(result, 'Should contain 16').to.contain(16);
                expect(result, 'Should contain 64').to.contain(64);
                expect(result, 'Should contain 256').to.contain(256);
                done();
            });
        });
        it("select factorial", function (done) {
            var ints = [1, 2, 4, 8, 16];
            new linquish_1.Linquish(ints)
                .select(function (n, ouput) {
                var result = n, i = n;
                while (i > 1) {
                    i--;
                    result = result * i;
                }
                ouput(result);
            })
                .run(function (result) {
                expect(result, 'Should contain 1').to.contain(1);
                expect(result, 'Should contain 2').to.contain(2);
                expect(result, 'Should contain 24').to.contain(24);
                expect(result, 'Should contain 40320').to.contain(40320);
                expect(result, 'Should contain 20922789888000').to.contain(20922789888000);
                done();
            });
        });
        it("select prime", function (done) {
            var ints = [1000, 2000, 4000, 8000, 16000];
            new linquish_1.Linquish(ints)
                .select(function (n, ouput) {
                var prime = findNextPrimeNumber(n);
                ouput(prime);
            })
                .run(function (result) {
                expect(result, 'Should contain 7919').to.contain(7919);
                expect(result, 'Should contain 17389').to.contain(17389);
                expect(result, 'Should contain 37813').to.contain(37813);
                expect(result, 'Should contain 81799').to.contain(81799);
                expect(result, 'Should contain 176081').to.contain(176081);
                done();
            });
        });
        it("select number to string", function (done) {
            var ints = [9, 8, 0];
            var alphabet = getGreekAlphaBet();
            new linquish_1.Linquish(ints)
                .select(function (n, output) {
                var c = alphabet[n];
                output(c);
            })
                .run(function (result) {
                expect(result, 'Should contain [\'kappa\', \'iota\', \'alpha\']').to.deep.equal(['kappa', 'iota', 'alpha']);
                done();
            });
        });
    });
    describe("selectMany", function () {
        it("select many - find primes between 0 and 1000", function (done) {
            var ints = [10000];
            new linquish_1.Linquish(ints)
                .selectMany(function (n, done) {
                var primes = findPrimes(n);
                done(primes);
            })
                .run(function (result) {
                expect(result, 'Shoud be equal to [1, 2 , 3 , 5 , 11, 31, 127, 709, 5381]').to.deep.equal([1, 2, 3, 5, 11, 31, 127, 709, 5381]);
                done();
            });
        });
    });
    describe('integration', function () {
        it("selectMany -> select - find primes between 0 and 1000, select next prime", function (done) {
            var ints = [10000];
            new linquish_1.Linquish(ints)
                .selectMany(function (n, done) {
                var primes = findPrimes(n);
                done(primes);
            })
                .select(function (prime, done) {
                done(findNextPrimeNumber(prime));
            })
                .run(function (result) {
                expect(result, 'Shoud be equal to [2 , 3 , 5 , 11, 31, 127, 709, 5381]').to.deep.equal([2, 3, 5, 11, 31, 127, 709, 5381, 52711]);
                done();
            });
        });
        it("selectMany -> selectMany - find primes between 0 and 1000, select prime and next prime", function (done) {
            var ints = [10];
            new linquish_1.Linquish(ints)
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
                expect(result, 'Shoud be equal to [1, 2, 2, 3, 3, 5, 5, 11]').to.deep.equal([1, 2, 2, 3, 3, 5, 5, 11]);
                done();
            });
        });
        it("select -> select -> select - find the next next prime.", function (done) {
            var ints = [2, 3, 5];
            var result = new Array();
            new linquish_1.Linquish(ints)
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
                expect(result, 'Shoud be equal to [11, 31, 127]').to.deep.equal([11, 31, 127]);
                done();
            });
        });
        it("select many -> where - find primes between 100 and 1000", function (done) {
            var ints = [10000];
            new linquish_1.Linquish(ints)
                .selectMany(function (n, done) {
                var primes = findPrimes(n);
                done(primes);
            })
                .where(function (n, done) {
                done(n > 100);
            })
                .run(function (result) {
                expect(result, 'Shoud be equal to [127, 709, 5381]').to.deep.equal([127, 709, 5381]);
                done();
            });
        });
    });
});
function findNextPrimeNumber(n) {
    var count = 0;
    var a = 2;
    while (count < n) {
        var b = 2;
        var prime = 1; // to check if found a prime
        while (b * b <= a) {
            if (a % b == 0) {
                prime = 0;
                break;
            }
            b++;
        }
        if (prime > 0) {
            count++;
        }
        a++;
    }
    return (--a);
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
        'chi', 'psi', 'omega'
    ];
}
