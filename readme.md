
# Type-safety scrubber for json data

Define scrubbers of data of unreliable formats to ensure at run-time that the scrubbed data matches the specified schema/contract and type definitions.  Your scrubbers are also typechecked against your typescript types at design-time so that your scrubbers don't fall out of sync with the types they are meant to guarantee.

As with most typesafety benefits, it really requires interaction to understand, but here's an example anyway.

Let's say you need to read in this type at runtime from storage.  You want to rely on the members being there in your application code and not have to do runtime assertions throughout, but the data might be of an older format or from an unreliable source such that missing runtime assertions would cause havok on your algorithms.  Here's your expectation encoded into typescript interfaces:

```ts
interface SimpleDocument1 {
    stringMember: string
    stringOrNullMember: string | null
    stringOrNullOrUndefinedMember1: string | null | undefined
    stringOrNullOrUndefinedMember2?: string | null
    stringOrNullOrUndefinedMember3?: string | null | undefined

    stringArrayMember: string[] | null
    stringArrayArrayMember: string[][]

    booleanMember: boolean
    objectMember: SubType1
}

interface SubType1 {
    stringMember: string
    numberMember: number
}
```

Here's the data you'll read in (using `JSON.parse`, etc.):

```ts
const conformingSimpleDocument1a = {
    stringMember: 'one',
    stringOrNullMember: 'two',
    stringOrNullOrUndefinedMember1: 'three',
    stringOrNullOrUndefinedMember2: 'four',
    stringOrNullOrUndefinedMember3: 'five',

    stringArrayMember: ['x', 'y', 'z'],
    stringArrayArrayMember: [['xx', 'yy', 'zz'], ['aa', 'bb', 'cc']],

    booleanMember : true,

    objectMember : {
        stringMember: 'objectString',
        numberMember: 100
    }
};
```

```ts
import { schema, ObjectScrubber, UndefinedType, StringType, 
    BooleanType, NumberType, NullType, ArrayOfType, Union, 
    StringOrNullOrUndefinedType, ObjectType } from 'typesafe-json-scrubber'

const simpleDocument1Scrubber = schema<SimpleDocument1>('simpleDocument1Scrubber')
    .must('stringMember', StringType)
    .must('stringOrNullMember', Union(StringType, NullType))
    .must('stringOrNullOrUndefinedMember1', Union(StringType, NullType, UndefinedType))
    .must('stringOrNullOrUndefinedMember2', StringOrNullOrUndefinedType)
    .must('stringOrNullOrUndefinedMember3', StringOrNullOrUndefinedType)
    .must('stringArrayMember', Union(ArrayOfType(StringType), NullType))
    .must('stringArrayArrayMember', ArrayOfType(ArrayOfType(StringType)))
    .must('booleanMember', BooleanType)
    .must('objectMember', ObjectType((schema : ObjectScrubber<SubType1>) => schema
        .must('stringMember', StringType)
        .must('numberMember', NumberType)));

const { scrubbed, scrubLog } = simpleDocument1Scrubber.scrub(conformingSimpleDocument1a);

if (scrubLog.filter(l => l.level === 'Fatal').length) {
    console.log('Unsuccessful because: ');
    console.log(scrubLog.map(l => `[${l.level}] at ${l.path}: ${l.detail}`));
} else {
    if (scrubLog.length) {
        console.log('Succeeded with warnings: ');
        console.log(scrubLog.map(l => `[${l.level}] at ${l.path}: ${l.detail}`));
        console.log(JSON.stringify(scrubbed));
    } else {
        console.log('Succeeded: ');
        console.log(JSON.stringify(scrubbed));
    }

    // Where the scrubber's output is to the application type finally (design-time)
    // the typescript checker will complain about misalignment between what the scrubber is built to scrub
    // and the type you're outputting to!  This is very very cool but you can only really experience it's
    // awesomeness for youself interactively.
    const clean : SimpleDocument1 = scrubbed;

    // That said, I haven't put enough miles on this code yet to be very confident that the typechecker can have
    // enough information in all scenarios.
}

```

There's also `.may()` and `.should()` for `ObjectType` construction but I haven't tested it or given examples.

This whole library is alpha stage use-at-your-own-risk for now ... so try it out.