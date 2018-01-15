import { Scrubber, ObjectScrubber, ScrubLog, PartialRecord } from './interfaces'

export { Scrubber, ObjectScrubber, ScrubLog, PartialRecord }

export function schema<T>(path : string) : ObjectScrubber<T, {}> {
    return new _ObjectScrubber(path);
}

class _ObjectScrubber implements ObjectScrubber<any, {}> {
    constructor(private path : string) {}

    private deferred : (
        { severity : 'must', memberName : string, type : new (path : string) => Scrubber<any, any>, default? : never } |
        { severity : 'should', memberName : string, type : new (path : string) => Scrubber<any, any>, default : any } |
        { severity : 'may', memberName : string, type : new (path : string) => Scrubber<any, any>, default? : never })[] = [];

    must(memberName : string, type : new (path : string) => Scrubber<any, any>) : any {
        this.deferred.push({ severity: 'must', memberName, type });
        return this;
    }

    should(memberName : string, type : new (path : string) => Scrubber<any, any>, defaultValue : any) : any {
        this.deferred.push({ severity: 'should', memberName, type, default : defaultValue });
        return this;
    }

    may(memberName : string, type : new (path : string) => Scrubber<any, any>) : any {
        this.deferred.push({ severity: 'may', memberName, type });
        return this;
    }

    scrub(obj : any) : { scrubbed : any, scrubLog : ScrubLog[] } {
        if (obj === null || typeof obj !== 'object') {
            return { 
                scrubbed : undefined, 
                scrubLog : <ScrubLog[]>[{
                    level: 'Fatal',
                    path: `${this.path}`,
                    detail: `Expected an object but got (${JSON.stringify(obj) || 'undefined'}).`
                }]
            };
        } else {
            return this.deferred.reduce(({ scrubbed, scrubLog }, deferred) => {
                const { scrubbed : memberScrubbed, scrubLog : memberScrubLog } = 
                    new (deferred.type)(this.path).scrub(obj[deferred.memberName]);

                scrubLog.push(... memberScrubLog);
                Object.assign(scrubbed, { [deferred.memberName] : memberScrubbed });

                return { scrubbed, scrubLog };
            },
            { scrubbed : <any>{}, scrubLog : <ScrubLog[]>[] });
        }
    }
}

export function Union<A, B>(
    a : new (path : string) => Scrubber<A, A>, 
    b : new (path : string) => Scrubber<B, B>) : new (path : string) => Scrubber<A | B, A | B>
export function Union<A, B, C>(
    a : new (path : string) => Scrubber<A, A>, 
    b : new (path : string) => Scrubber<B, B>, 
    c : new (path : string) => Scrubber<C, C>) : new (path : string) => Scrubber<A | B | C, A | B | C>
export function Union<A, B, C, D>(
    a : new (path : string) => Scrubber<A, A>, 
    b : new (path : string) => Scrubber<B, B>, 
    c : new (path : string) => Scrubber<C, C>, 
    d : new (path : string) => Scrubber<D, D>) : new (path : string) => Scrubber<A | B | C | D, A | B | C | D>
export function Union(... scrubbers : (new (path : string) => Scrubber<any, any>)[]) {
    return class implements Scrubber<any[], any> {
        constructor(private path : string) { }
    
        scrub(obj : any) : { scrubbed : any, scrubLog : ScrubLog[] } {
            const attempts = scrubbers.reduce((matches, type) => {
                if (!matches.length ||
                    !!matches[matches.length - 1].scrubLog.filter(l => l.level === 'Fatal').length) {
                    matches.push(new (type)(this.path).scrub(obj));
                }
    
                return matches;
            },
            <{ scrubbed : any, scrubLog : ScrubLog[] }[]>[]);
    
            if (!!attempts.length &&
                !attempts[attempts.length - 1].scrubLog.filter(l => l.level === 'Fatal').length) {
                return attempts[attempts.length - 1];
            } else {
                return { 
                    scrubbed : undefined, 
                    scrubLog : <ScrubLog[]>[{
                        level: 'Fatal',
                        path: `${this.path}`,
                        detail: `Expected a string but got (${JSON.stringify(obj) || 'undefined'}).`
                    }]
                }
            }
        }
    }
}

export class StringType implements Scrubber<string, string> {
    constructor(private path : string) {}

    scrub(obj : any) : { scrubbed : string | undefined, scrubLog : ScrubLog[] } {
        if ( typeof obj === 'string' ) {
            return { 
                scrubbed : <string>obj, 
                scrubLog : <ScrubLog[]>[]
            };
        } else {
            return { 
                scrubbed : undefined, 
                scrubLog : <ScrubLog[]>[{
                    level: 'Fatal',
                    path: `${this.path}`,
                    detail: `Expected a string but got (${JSON.stringify(obj) || 'undefined'}).`
                }]
            };
        }
    }
}

export class NumberType implements Scrubber<number, number> {
    constructor(private path : string) {}

    scrub(obj : any) : { scrubbed : number | undefined, scrubLog : ScrubLog[] } {
        if ( typeof obj === 'number' ) {
            return { 
                scrubbed : <number>obj, 
                scrubLog : <ScrubLog[]>[]
            };
        } else {
            return { 
                scrubbed : undefined, 
                scrubLog : <ScrubLog[]>[{
                    level: 'Fatal',
                    path: `${this.path}`,
                    detail: `Expected a number but got (${JSON.stringify(obj) || 'undefined'}).`
                }]
            };
        }
    }
}

export class BooleanType implements Scrubber<boolean, boolean> {
    constructor(private path : string) {}

    scrub(obj : any) : { scrubbed : boolean | undefined, scrubLog : ScrubLog[] } {
        if ( typeof obj === 'boolean' ) {
            return { 
                scrubbed : <boolean>obj, 
                scrubLog : <ScrubLog[]>[]
            };
        } else {
            return { 
                scrubbed : undefined, 
                scrubLog : <ScrubLog[]>[{
                    level: 'Fatal',
                    path: `${this.path}`,
                    detail: `Expected a boolean but got (${JSON.stringify(obj) || 'undefined'}).`
                }]
            };
        }
    }
}

export function ArrayOfType<T>(scrubber : new (path : string) => Scrubber<T, T>) : new (path : string) => Scrubber<T[], T[]>
export function ArrayOfType<T>(scrubber : new (path : string) => Scrubber<T, T>) {
    return class implements Scrubber<T[], T[]> {
        constructor(private path : string) {}

        scrub(obj : any) : { scrubbed : any[] | undefined, scrubLog : ScrubLog[] } {
            if ( Array.isArray(obj) ) {
                const scrubbedElements = obj.map((e, i) => {
                    return new scrubber(`${!!this.path.length ? `${this.path}.` : ''}[${i}]`).scrub(e);
                });

                return { 
                    scrubbed : scrubbedElements.map(r => r.scrubbed), 
                    scrubLog : ([] as ScrubLog[]).concat( ... scrubbedElements.map(r => r.scrubLog))
                };
            } else {
                return { 
                    scrubbed : undefined, 
                    scrubLog : <ScrubLog[]>[{
                        level: 'Fatal',
                        path: `${this.path}`,
                        detail: `Expected an array but got (${JSON.stringify(obj) || 'undefined'}).`
                    }]
                };
            }
        }
    }
}

export class NullType implements Scrubber<null, null> {
    constructor(private path : string) {}

    scrub(obj : any) : { scrubbed : null | undefined, scrubLog : ScrubLog[] } {
        if ( obj === null ) {
            return { 
                scrubbed : <null>obj, 
                scrubLog : <ScrubLog[]>[]
            };
        } else {
            return { 
                scrubbed : undefined, 
                scrubLog : <ScrubLog[]>[{
                    level: 'Fatal',
                    path: `${this.path}`,
                    detail: `Expected null but got (${JSON.stringify(obj) || 'undefined'}).`
                }]
            };
        }
    }
}

export class UndefinedType implements Scrubber<undefined, undefined> {
    constructor(private path : string) {}

    scrub(obj : any) : { scrubbed : undefined, scrubLog : ScrubLog[] } {
        if ( obj === undefined ) {
            return { 
                scrubbed : <undefined>obj,
                scrubLog : <ScrubLog[]>[]
            };
        } else {
            return { 
                scrubbed : undefined, 
                scrubLog : <ScrubLog[]>[{
                    level: 'Fatal',
                    path: `${this.path}`,
                    detail: `Expected null but got (${JSON.stringify(obj) || 'undefined'}).`
                }]
            };
        }
    }
}

export function ObjectType<T, S>(typeDef : (schema : ObjectScrubber<T, {}>) => Scrubber<T, S>) : new (path : string) => Scrubber<T, S>
export function ObjectType<T, S>(typeDef : (schema : ObjectScrubber<T, {}>) => Scrubber<T, S>) {
    return class implements Scrubber<T, S> {
        constructor(private path : string) { }

        private schema = new _ObjectScrubber(this.path);
        scrub = typeDef(this.schema).scrub.bind(this.schema);
    }
}

export const StringOrNullType = Union(StringType, NullType);
export const StringOrNullOrUndefinedType = Union(StringType, NullType, UndefinedType);
export const NumberOrNullType = Union(NumberType, NullType);
export const NumberOrNullOrUndefinedType = Union(NumberType, NullType, UndefinedType);
export const BooleanOrNullType = Union(BooleanType, NullType);
export const BooleanOrNullOrUndefinedType = Union(BooleanType, NullType, UndefinedType);