# React Technical Documentation & Interview Knowledge Base

## Components, JSX, and Props
React components are the building blocks of a React application. A component is a self-contained, reusable piece of code that returns a React element (usually written in JSX) describing what should appear on the screen.
JSX (JavaScript XML) is a syntax extension to JavaScript that allows developers to write HTML-like structures directly inside JavaScript. JSX is compiled by tools like Babel or swc into standard JavaScript function calls (`React.createElement` or `jsx`).
Props (short for properties) are read-only inputs passed from a parent component to a child component. Props are immutable within the child component, ensuring a predictable one-way data flow.

## State and Component Lifecycle
State is an object that holds information local to a component that may change over the lifetime of the component. Unlike props, state is fully private and controlled by the component itself. When state changes, the component schedules a re-render.
In class components, state is managed via `this.state` and updated with `this.setState`. In functional components, state is managed using the `useState` hook.
Re-rendering is the process by which React updates the virtual DOM and calculates the minimum set of changes needed to sync the real browser DOM with the updated virtual DOM.

## React Hooks: useState, useEffect, and Rules
React Hooks were introduced in React 16.8. They allow functional components to use state, lifecycle methods, and other React features.
`useState` declares a state variable and a setter function to update it.
`useEffect` lets you perform side effects (such as data fetching, subscriptions, or manual DOM updates) in functional components. It accepts a callback function and an optional dependency array. If the dependency array is empty `[]`, the effect runs once after the initial render. If it contains dependencies `[a, b]`, the effect runs whenever those values change. If no array is provided, it runs after every single render.
The cleanup function returned by the `useEffect` callback runs before the component unmounts and before running the effect again on subsequent renders, preventing memory leaks (e.g. clearing event listeners or timers).
Rules of Hooks: Hooks must only be called at the top level (not inside loops, conditions, or nested functions) and only from React functional components or custom hooks.

## React Performance Optimization: useMemo and useCallback
In React, when a parent component re-renders, all of its children re-render by default. This can lead to performance bottlenecks if rendering children is expensive.
`useMemo` returns a memoized value. It recalculates the value only when one of its dependencies changes. This avoids expensive calculations on every render.
`useCallback` returns a memoized version of a callback function that only changes if one of its dependencies changes. This is useful when passing callbacks to optimized child components that rely on reference equality to prevent unnecessary renders (e.g., using `React.memo`).

## Context API and Global State Management
The Context API provides a way to pass data down the component tree without having to pass props manually at every level (avoiding "prop drilling").
A Context object is created using `React.createContext`. It provides a `Provider` component that accepts a `value` prop. All consumers (using the `useContext` hook or `Consumer` component) that are descendants of this Provider will re-render whenever the provider's `value` changes.

## Virtual DOM, Reconciliation, and Fiber
The Virtual DOM is a lightweight, in-memory representation of the real browser DOM elements.
Reconciliation is the algorithm React uses to diff the virtual DOM trees and determine which parts of the real DOM need to be updated. React uses a heuristic O(n) diffing algorithm based on two assumptions: two elements of different types will produce different trees, and keys can be used to identify stable elements across renders.
React Fiber is the reconciliation engine introduced in React 16. It enables incremental rendering by splitting rendering work into small units of work called "fibers" and scheduling them across animation frames. This allows React to pause, abort, or reuse work, keeping the application responsive to user input and animations.
