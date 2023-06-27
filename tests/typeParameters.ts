var apply = function <T,U>(f: (x: T) => U, x: T): U { return f(x) }
var apply2: <T,U>(f2: (x: T) => U, x: T) => U = function <T,U>(f3: (x: T) => U, x: T): U { return f3(x) }
apply<number, number>(function (n: number) { return n }, 1)
apply<number>(function (m: number) { return m }, 2)
apply<number, number, number>(function (l: number) { return l }, "oops")
apply<string, string>(function (k: number) { return k }, 4)
apply<string, number>(function (j: number) { return j }, "ok")
apply(function (i: number) { return i }, 5)
apply(function (s: string) { return s }, "a")
