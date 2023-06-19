var f = function (x: number): number { return x };
var g = function g (x) { return x };
var e = function (): string { return 1 }
e = f
e = g
f = e
g = e
e = function () { return "hi" }
e = function () { return 0 }
f = function (y: number) { return 12 }
f = function (z: string) { return 13 }
var h: (x: number) => number = function (x) { return x }
h = f
var i: (x: number) => string = f
var j: (x: string) => number = f
var apply = function (f: (x: number) => number, x: number) { return f(x) }
var misapply = function (f: (x: number) => number, x: string) { return f(x) }
