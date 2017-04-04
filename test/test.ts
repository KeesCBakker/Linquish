/// <reference path="../typings/node/node.d.ts" />
/// <reference path="../typings/mocha/mocha.d.ts" />
/// <reference path="../typings/chai/chai.d.ts" />

'use strict';

var expect: Chai.ExpectStatic = require('chai').expect;

import { Linquish } from '../linquish';

var linquish = function <T>(input: Array<T>): Linquish<T> {
    return new Linquish<T>(input);
}

describe("Linquish", function () {

    describe("run", function () {

        it("run with callback", function (done) {

            var ints = [1, 2, 4, 8, 16];

            linquish<number>(ints)
                .run((outputs) => {
                    expect(outputs, 'Should be equal to [1, 2, 4, 8, 16]').to.deep.equal([1, 2, 4, 8, 16]);
                    done();
                });
        });

    });

    describe("each", function () {

        it("standard each", function (done) {

            var ints = [1, 2, 4, 8, 16];
            var result = [];

            linquish<number>(ints)
                .forEach((n, ready) => {
                    result.push(n);
                    ready();
                })
                .run((outputs) => {

                    expect(outputs, 'Should be equal to [1, 2, 4, 8, 16]').to.deep.equal([1, 2, 4, 8, 16]);

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

            linquish<number>(ints)
                .forEach((n, ready) => {
                    setTimeout(() => {
                        result.push(n);
                        ready();
                    }, 16 - n);
                })
                .run(() => {

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

            var ints = [10, 5, 2, 1];

            var result = new Array<number>();
            var selectExecuted = false;
            var foreachExecuted = false;

            var i = 1;

            linquish<number>(ints)
                .select<number>((n, done) => {

                    selectExecuted = true;

                    setTimeout(() => {
                        result.push(n);
                        done(n * n);
                    }, n);
                })
                .wait()
                .forEach((n, done) => {
                    foreachExecuted = true;
                    expect(result.length, 'Should be 4').to.eq(4);
                    done();
                })
                .run((result) => {
                    expect(selectExecuted, 'selectExecuted should be true').to.eq(true);
                    expect(foreachExecuted, 'foreachExecuted should be true').to.eq(true);
                    expect(result, 'Shoud be equal to [100, 25, 4, 1]').to.deep.equal([100, 25, 4, 1]);
                    done();
                });
        });
    });

    describe("where", function () {

        it("where uneven", function (done) {

            var ints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

            linquish<number>(ints)
                .where((n, done) => {
                    done(n % 2 != 0);
                })
                .run((result) => {
                    expect(result, 'Shoud be equal to [1, 3, 5, 7, 9]').to.deep.equal([1, 3, 5, 7, 9]);
                    done();
                });
        });


        it('select timeout', function (done) {

            var ints = [2, 10, 50, 100, 200];

            linquish<number>(ints)
                .where((n, output) => {

                    setTimeout(() => {
                        output(true);
                    }, n);

                }, 60)
                .run((result) => {
                    expect(result, 'Shoud be equal to [2, 10, 50]').to.deep.equal([2, 10, 50]);
                    done();
                });

        });
    });

    describe("select", function () {

        it("select power", function (done) {

            var ints = [1, 2, 4, 8, 16];

            linquish<number>(ints)
                .select<number>((n, ouput) => {
                    ouput(n * n);
                })
                .run((result) => {

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

            linquish<number>(ints)
                .select<number>((n, ouput) => {

                    var result = n, i = n;

                    while (i > 1) {
                        i--;

                        result = result * i;
                    }

                    ouput(result);
                })
                .run((result) => {

                    expect(result, 'Should contain 1').to.contain(1);
                    expect(result, 'Should contain 2').to.contain(2);
                    expect(result, 'Should contain 24').to.contain(24);
                    expect(result, 'Should contain 40320').to.contain(40320);
                    expect(result, 'Should contain 20922789888000').to.contain(20922789888000);

                    done();
                });
        });

        it("select prime", function (done) {

            var ints = [1000, 2000, 4000, 8000];

            linquish<number>(ints)
                .select<number>((n, ouput) => {
                    var prime = findNextPrimeNumber(n);
                    ouput(prime);
                })
                .run((result) => {

                    expect(result, 'Should contain 1009').to.contain(1009);
                    expect(result, 'Should contain 2003').to.contain(2003);
                    expect(result, 'Should contain 4001').to.contain(4001);
                    expect(result, 'Should contain 8009').to.contain(8009);

                    done();
                });
        });

        it("select number to string", function (done) {

            var ints = [9, 8, 0];
            var alphabet = getGreekAlphaBet();

            linquish<number>(ints)
                .select<string>((n, output) => {
                    var c = alphabet[n];
                    output(c);
                })
                .run((result) => {

                    expect(result, 'Should contain [\'kappa\', \'iota\', \'alpha\']').to.deep.equal(['kappa', 'iota', 'alpha']);
                    done();
                });
        });

        it('select with timeout', function (done) {

            var ints = [2, 10, 50, 100, 200];

            linquish<number>(ints)
                .select((n, output) => {

                    setTimeout(() => {
                        output(n);
                    }, n);

                }, 60)
                .run((result) => {
                    expect(result, 'Shoud be equal to [2, 10, 50]').to.deep.equal([2, 10, 50]);
                    done();
                });

        });

    });

    describe("selectMany", function () {

        it("select many - find primes between 0 and 45", function (done) {

            var ints = [45];

            linquish<number>(ints)
                .selectMany<number>((n, done) => {
                    var primes = findPrimes(n);
                    done(primes);
                })
                .run((result) => {

                    expect(result, 'Shoud be equal to [1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43]').to.deep.equal([1, 2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43]);
                    done();
                });
        });

        it("select many with timeout - within 35 ms, select (x, x^2, x^3) with timeout of x*10.", function (done) {

            var ints = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

            linquish<number>(ints)
                .selectMany<number>((n, done) => {

                    window.setTimeout(() => {

                        var array = [];
                        array.push(n);
                        array.push(n * n);
                        array.push(n * n * n);
                        done(array);

                    }, n * 10);

                }, 35)
                .run((result) => {
                    expect(result, 'Shoud not be equal to [1, 1, 1, 2, 4, 8, 3, 9, 27]').to.deep.equal([1, 1, 1, 2, 4, 8, 3, 9, 27]);
                    done();
                });
        });
    });


    describe('integration', function () {

        it("selectMany -> select - find primes between 0 and 10, select next prime", function (done) {

            var ints = [10];

            linquish<number>(ints)
                .selectMany<number>((n, done) => {
                    var primes = findPrimes(n);
                    done(primes);
                })
                .select<number>((prime, done) => {
                    done(findNextPrimeNumber(prime));
                })
                .run((result) => {
                    expect(result, 'Shoud be equal to [2, 3, 5, 7, 11]').to.deep.equal([2, 3, 5, 7, 11]);
                    done();
                });
        });


        it("selectMany -> selectMany - find primes between 0 and 10, select prime and next prime", function (done) {

            var ints = [10];

            linquish<number>(ints)
                .selectMany<number>((n, done) => {
                    var primes = findPrimes(n);
                    done(primes);
                })
                .selectMany<number>((prime, done) => {

                    var p2 = findNextPrimeNumber(prime);

                    var primes = [];
                    primes.push(prime);
                    primes.push(p2);

                    done(primes);
                })
                .run((result) => {
                    expect(result, 'Shoud be equal to [1, 2, 2, 3, 3, 5, 5, 7, 7, 11]').to.deep.equal([1, 2, 2, 3, 3, 5, 5, 7, 7, 11]);
                    done();
                });
        });


        it("select -> select -> select - find the next next prime.", function (done) {

            var ints = [2, 3, 5];
            var result = new Array<number>();

            linquish<number>(ints)
                .select<number>((prime, done) => {
                    done(findNextPrimeNumber(prime));
                })
                .select<number>((prime, done) => {
                    done(findNextPrimeNumber(prime));
                })
                .select<number>((prime, done) => {
                    done(findNextPrimeNumber(prime));
                })
                .run((result) => {
                    expect(result, 'Shoud be equal to [7, 11, 13]').to.deep.equal([7, 11, 13]);
                    done();
                });
        });


        it("select many -> where - find primes between 0 and 25 that contain a 2", function (done) {

            var ints = [25];

            linquish<number>(ints)
                .selectMany<number>((n, done) => {
                    var primes = findPrimes(n);
                    done(primes);
                })
                .where((n, done) => {
                    done(n.toString().indexOf('2') != -1);
                })
                .run((result) => {
                    expect(result).to.deep.equal([2, 23]);
                    done();
                });

        });

        it("select many -> where -> where - find primes between 0 and 250 that contain a 2 and a 7", function (done) {

            var ints = [250];

            linquish<number>(ints)
                .selectMany<number>((n, done) => {
                    var primes = findPrimes(n);
                    done(primes);
                })
                .where((n, done) => {
                    done(n.toString().indexOf('2') != -1);
                })
                .where((n, done) => {
                    done(n.toString().indexOf('7') != -1);
                })
                .run((result) => {
                    expect(result, 'Shoud be equal to [127, 227]').to.deep.equal([127, 227]);
                    done();
                });

        });
    });
});

function findNextPrimeNumber(n: number) {

    var a = 1;

    do {
        if (a > n) {
            return a;
        }

        a = findNextPrimeNumberBasedOnPrime(a);
    }
    while (true);
}

function findNextPrimeNumberBasedOnPrime(prime: number): number {

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

function findPrimes(max: number): Array<number> {
    var primes = new Array<number>();

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

