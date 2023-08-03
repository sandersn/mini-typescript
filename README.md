# mini-typescript
A miniature model of the Typescript compiler, intended to teach the structure of the real Typescript compiler

This project contains two models of the compiler: micro-typescript and centi-typescript.

micro-typescript started when I started reading [Modern Compiler Implementation in ML](https://www.cs.princeton.edu/~appel/modern/ml/) because I wanted to learn more about compiler backends. When I started building the example compiler I found I disagreed with the implementation of nearly everything in the *frontend*. So I wrote my own, and found that I had just written [a small Typescript](https://github.com/sandersn/minits).

I realised a small Typescript would be useful to others who want to learn how the Typescript compiler works. So I rewrote it in Typescript and added some exercises to let you practise with it. micro-typescript is the smallest compiler I can imagine, implementing just a tiny slice of Typescript: `var` declarations, assignments and numeric literals. The only two types are `string` and `number`.

So that's micro-typescript: a textbook compiler that implements a tiny bit of Typescript in a way that's a tiny bit like the Typescript compiler. centi-typescript, on the other hand, is a 1/100 scale model of the Typescript compiler. It's intended as a reference in code for peopple who want to see how the Typescript compiler actually works, without the clutter caused by real-life compatibility and requirements. Currently centi-typescript is most complete in the checker, because most of Typescript's complexity is there.

### To get set up

```sh
git clone https://github.com/sandersn/mini-typescript
cd mini-typescript
code .

# Get set up
npm i
npm run build

# Or have your changes instantly happen
npm run build --watch

# Run the compiler:
npm run mtsc ./tests/singleVar.ts
```

### To switch to centi-typescript

```sh
git checkout centi-typescript
npm run build
```

## Limitations

1. This is an example of the way that Typescript's compiler does things. A compiler textbook will help you learn *compilers*. This project will help you learn *Typescript's code*.
2. This is only a tiny slice of the language, also unlike a textbook. Often I only put it one instance of a thing, like nodes that introduce a scope, to keep the code size small.
3. There is no laziness, caching or node reuse, so the checker and transformer code do not teach you those aspects of the design.
4. There's no surrounding infrastructure, like a language service or a program builder. This is just a model of tsc.

## Exercises

- Add EmptyStatement.
- Make semicolon a statement ender, not statement separator.
  - Hint: You'll need a predicate to peek at the next token and decide if it's the start of an element.
  - Bonus: Switch from semicolon to newline as statement ender.
- Add string literals.
- Add `let`.
  - Make sure the binder resolves variables declared with `var` and `let` the same way. The simplest way is to add a `kind` property to `Symbol`.
  - Add use-before-declaration errors in the checker.
  - Finally, add an ES2015 -> ES5 transform that transforms `let` to `var`.
- Allow var to have multiple declarations.
  - Check that all declarations have the same type.
- Add objects and object types.
  - `Type` will need to become more complicated.
- Add `interface`.
  - Make sure the binder resolves types declared with `type` and `interface` the same way.
  - After the basics are working, allow interface to have multiple declarations.
  - Interfaces should have an object type, but that object type should combine the properties from every declaration.
- Add an ES5 transformer that converts `let` -> `var`.
- Add function declarations and function calls.
- Add arrow functions with an appropriate transform in ES5.
