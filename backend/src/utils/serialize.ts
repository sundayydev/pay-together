export function serializeBigInts<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === "bigint") {
    return obj.toString() as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts) as any;
  }

  if (typeof obj === "object") {
    if (obj instanceof Date) {
      return obj;
    }
    const newObj: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = serializeBigInts((obj as any)[key]);
      }
    }
    return newObj;
  }

  return obj;
}
