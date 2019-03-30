import * as assert from 'assert'
import { schema, ObjectScrubber, UndefinedType, StringType,
    BooleanType, NumberType, NullType, ArrayOfType, Union,
    StringOrNullOrUndefinedType, ObjectType } from '../../src/index'
import { Scrubber } from '../../src/interfaces';

describe('scrubber tests', function () {
    describe('Simple', function () {

        function testScrubber<T, S>(scrubber: Scrubber<T, S>, data : any) {
            const { scrubbed, scrubLog } = scrubber.scrub(data);
            const dataMatches = JSON.stringify(scrubbed) === JSON.stringify(data);
            return { scrubbed, scrubLog : scrubLog.map(l => `[${l.level}] at ${l.path}: ${l.detail}`), dataMatches };
        }

        const primative1Scrubber = new StringType('');

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

        it('primative1', function () {
            const { scrubbed, scrubLog, dataMatches } = testScrubber(primative1Scrubber, 'hello');

            assert(dataMatches, `"successfully" scrubbed data doesn't match`);
            assert(!scrubLog.length, scrubLog.join('\n'));
        });

        it('conformingSimpleDocument1a', function () {
            const { scrubbed, scrubLog, dataMatches } = testScrubber(simpleDocument1Scrubber, conformingSimpleDocument1a);

            const typeTest : SimpleDocument1 | undefined = scrubbed;

            assert(dataMatches, `"successfully" scrubbed data doesn't match`);
            assert(!scrubLog.length, scrubLog.join('\n'));
        });

        it('conformingSimpleDocument1b', function () {
            const { scrubbed, scrubLog, dataMatches } = testScrubber(simpleDocument1Scrubber, conformingSimpleDocument1b);
            assert(dataMatches, `"successfully" scrubbed data doesn't match`);
            assert(!scrubLog.length, scrubLog.join('\n'));
        });

        it('conformingSimpleDocument1c', function () {
            const { scrubbed, scrubLog, dataMatches } = testScrubber(simpleDocument1Scrubber, conformingSimpleDocument1c);
            assert(dataMatches, `"successfully" scrubbed data doesn't match`);
            assert(!scrubLog.length, scrubLog.join('\n'));
        });

        it('nonconformingSimpleDocument1a', function () {
            const { scrubbed, scrubLog, dataMatches } = testScrubber(simpleDocument1Scrubber, nonconformingSimpleDocument1a);
            assert(!dataMatches, `"unsuccessfully" scrubbed data does match`);
            assert(!!scrubLog.length, `Expected errors or warnings but got: \n${scrubLog.join('\n')}\nEND`);
        });

        it('nonconformingSimpleDocument1b', function () {
            const { scrubbed, scrubLog, dataMatches } = testScrubber(simpleDocument1Scrubber, nonconformingSimpleDocument1b);
            assert(!dataMatches, `"unsuccessfully" scrubbed data does match`);
            assert(!!scrubLog.length, `Expected errors or warnings but got: \n${scrubLog.join('\n')}\nEND`);
        });
    });
});

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

const conformingSimpleDocument1b = {
    stringMember: 'one',
    stringOrNullMember: null,
    stringOrNullOrUndefinedMember1: null,
    stringOrNullOrUndefinedMember2: null,
    stringOrNullOrUndefinedMember3: null,

    stringArrayMember: [],
    stringArrayArrayMember: [[], []],

    booleanMember : false,

    objectMember : {
        stringMember: 'objectString',
        numberMember: 0
    }
};

const conformingSimpleDocument1c = {
    stringMember: 'one',
    stringOrNullMember: null,

    stringArrayMember: null,

    stringArrayArrayMember: [],

    booleanMember : false,

    objectMember : {
        stringMember: '',
        numberMember: 456
    }
};

const nonconformingSimpleDocument1a = {
    stringMember: null,
    stringOrNullMember: 42,

    stringArrayMember: [ 42 ]
};


const nonconformingSimpleDocument1b = {
    stringMember: 'one',
    stringOrNullMember: null,

    stringArrayMember: null,

    stringArrayArrayMember: [],

    booleanMember : false,

    objectMember : null
};
