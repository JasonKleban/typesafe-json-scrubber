export type PartialRecord<K extends string, T> = {
    [P in K]?: T;
};

export interface ScrubLog {
    level: 'Fatal' | 'NonFatal'
    path: string
    detail: string
}

export interface Scrubber<T, P> {
    /** scrub the obj */
    scrub(obj : any) : { scrubbed : P | undefined, scrubLog : ScrubLog[] }
}

export interface ObjectScrubber<T, P = {}> extends Scrubber<T, P> {
    /** memberName : string */
    must<M extends Extract<keyof T, string>, S>(memberName : M, type : new (path : string) => Scrubber<T[M], S>) : ObjectScrubber<T, P & Record<M, S>>
    
    /** memberName : string = defaultValue */
    should<M extends Extract<keyof T, string>, S>(memberName : M, type : new (path : string) => Scrubber<T[M], S>, defaultValue : T[M]) : ObjectScrubber<T, P & Record<M, S>>
    
    /** memberName? : string */
    may<M extends Extract<keyof T, string>, S>(memberName : M, type : new (path : string) => Scrubber<T[M], S>) : ObjectScrubber<T, P & PartialRecord<M, S>>
}