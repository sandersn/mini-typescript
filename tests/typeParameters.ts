var apply = function <T,U>(f: (x: T) => U, x: T): U { return f(x) }
var apply2: <T,U>(f: (x: T) => U, x: T) => U = function <T,U>(f: (x: T) => U, x: T): U { return f(x) }
apply<number, number>(function (n: number) { return n }, 1)
apply<number>(function (n: number) { return n }, 1)
apply<number, number, number>(function (n: number) { return n }, 1)
apply<string, string>(function (n: number) { return n }, 1)
apply(function (n: number) { return n }, 1)
apply(function (s: string) { return s }, "a")
