import path from 'node:path';
import requireAll from "require-all";

export function getItems<T>(pathName: string, predicate?: (item: T) => boolean): T[] {
  const sharedSettings = {
    recursion: true,
    filters: /\w*.[jt]s/g,
  };

  const items: T[] = [];

  const action = predicate ?? (() => true);

  requireAll({
    ...sharedSettings,
    dirname: path.join(import.meta.dirname, '..', pathName),
    resolve: x => {
      const item = x.default as T;

      if (action(item)) {
        items.push(item);
      }
    },
  });

  return items;
}