import { useCallback, useState } from 'react';

/**
 * 보기·정렬 같은 개인 선택을 localStorage 에 남긴다. 저장소가 막혀 있어도 화면은 기본값으로 돈다.
 * 허용 목록에 없는 저장값은 버리고 기본값을 쓴다.
 */
export const useStoredChoice = <T extends string>(
  key: string,
  fallback: T,
  allowed: readonly T[]
): [T, (next: T) => void] => {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored && (allowed as readonly string[]).includes(stored)
        ? (stored as T)
        : fallback;
    } catch {
      return fallback;
    }
  });

  const update = useCallback(
    (next: T) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, next);
      } catch {
        /* 저장소를 못 써도 이번 화면에서는 선택이 유지된다 */
      }
    },
    [key]
  );

  return [value, update];
};
