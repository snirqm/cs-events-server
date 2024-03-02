// Run tests with `node run_tests.js`
import { Tests } from "./test.js";

const GREEN_BLOCK = "\x1b[32m\u2588\x1b[0m";
const RED_BLOCK = "\x1b[31m\u2588\x1b[0m";

const TESTS_TO_RUN = [
    // "testDeleteEvent",
    // "testAdminUpdatesEvent",
]



async function withTimeout(ms, callback) {
    if (ms < 0) {
        return callback();
    }
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error("Test timed out"));
        }, ms);
        callback().then((result) => {
            clearTimeout(timeout);
            resolve(result);
        }).catch((error) => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}

async function runAllTests(setup, tests, repeat, timeout = -1) {
    try {
        await setup();
    } catch (error) {
        console.error("Setup failed: ", error);
        return;
    }
    const startTime = Date.now();
    const results = tests.map(async (testCase) => {
        const testName = testCase.name.split(" ")[1];
        const result = { name: testName, passed: false}
        const repeats = Array.from({ length: repeat }, async () => await withTimeout(timeout, testCase))
        return Promise.all(repeats).then(() => {
            process.stdout.write(GREEN_BLOCK + " " + testName + " Passed\n");
            result.passed = true;
        }).catch((error) => {
            process.stdout.write(RED_BLOCK + " " + testName + " Failed\n");
            process.stderr.write(error.stack + "\n");
        }).then(() => result);
    });
    const testResults = await Promise.all(results);
    const passed = testResults.filter(result => result.passed).length;
    const failed = testResults.length - passed;
    console.log("Passed: " + passed + ", Failed: " + failed);
    console.log("Coverage: " + (passed / testResults.length * 100).toFixed(2) + "% (" + testResults.length + " tests)");
    if (failed > 0) {
        console.error("Failed tests:");
        testResults.filter(result => !result.passed).forEach(result => console.error(result.name));
        return;
    }
    const endTime = Date.now();
    console.log("All tests completed in " + (endTime - startTime) / 1000 + " seconds");
}


function collectTests() {
    const testObj = new Tests();
    const tests = Object.getOwnPropertyNames(Tests.prototype)
        .filter(name => name.startsWith("test"))
        .filter(name => TESTS_TO_RUN.length === 0 || TESTS_TO_RUN.includes(name))
        .map(name => testObj[name].bind(testObj));

    console.log("Collected " + tests.length + " tests.");
    return { setup: () => testObj.setup(), tests: tests };
}
const { setup, tests } = collectTests();

const repeat = 100;
const timeoutSec = 10;
const timeout = timeoutSec * 1000;
runAllTests(setup, tests, repeat);
