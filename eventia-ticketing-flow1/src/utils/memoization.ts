import React from 'react';

/**
 * A type-safe wrapper around React.memo that accepts a custom comparison function
 * @param Component The component to memoize
 * @param propsAreEqual Optional custom comparison function
 */
export function memo<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  return React.memo(Component, propsAreEqual);
}

/**
 * Creates a props comparator that only checks the specified props for equality
 * This is useful when you only want to re-render when specific props change
 * @param propNames Array of prop names to check
 */
export function createPropsComparator<P extends object>(propNames: (keyof P)[]) {
  return (prevProps: Readonly<P>, nextProps: Readonly<P>): boolean => {
    return propNames.every(propName => prevProps[propName] === nextProps[propName]);
  };
}

/**
 * A deep comparison function for props
 * Be careful as this is more expensive than shallow comparison
 * Only use for complex objects where shallow comparison won't work
 */
export function deepPropsAreEqual(prevProps: any, nextProps: any): boolean {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  return prevKeys.every(key => {
    const prevValue = prevProps[key];
    const nextValue = nextProps[key];
    
    if (prevValue === nextValue) return true;
    
    // If both values are objects or arrays, perform deep comparison
    if (
      prevValue &&
      nextValue &&
      typeof prevValue === 'object' &&
      typeof nextValue === 'object'
    ) {
      if (Array.isArray(prevValue) && Array.isArray(nextValue)) {
        if (prevValue.length !== nextValue.length) return false;
        return prevValue.every((val, i) => deepPropsAreEqual({ val }, { val: nextValue[i] }));
      }
      
      return deepPropsAreEqual(prevValue, nextValue);
    }
    
    return false;
  });
}

/**
 * Memoization utility for expensive calculations within components
 * @param factory Function that produces the value
 * @param deps Dependency array (similar to useEffect)
 */
export function memoize<T>(factory: () => T, deps: React.DependencyList): T {
  const cache = React.useRef<{ deps: React.DependencyList; value: T } | null>(null);
  
  if (
    cache.current === null ||
    deps.length !== cache.current.deps.length ||
    deps.some((dep, i) => dep !== cache.current!.deps[i])
  ) {
    cache.current = {
      deps,
      value: factory(),
    };
  }
  
  return cache.current.value;
} 