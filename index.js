#!/usr/bin/env node

const exec = require("child_process").exec;
const Table = require('cli-table');
const cliProgress = require('cli-progress');

const delayAnalisys = (process.argv[2] === ("-d"));
const totalAnalisys = (process.argv[2] === ("-t"));
const url = process.argv[3] || "http://ks.com/api/v1/stress/"
const queryParam1 = process.argv[4] || 10000;
const queryParam2 = process.argv[5] || 100;
const iterationsToDelay = process.argv[6] || 2;
const concurrentUsers = process.argv[7] || 1;
const problemsToGenerate = process.argv[8] || 1;
const multiplyFactor = process.argv[9] || 4;
const maxTime = process.argv[10] || 20000; //20s

// BARS AND TABLES
const delayBar = new cliProgress.SingleBar({
    format: ' ║ {initText} [{bar}] {percentage}% | Iteration {i}/{iterations}'
}, cliProgress.Presets.shades_classic);

const generateProblemsBar = new cliProgress.SingleBar({
    format: ' ║ {initText} [{bar}] {percentage}% | Problem {i}/{problems}'
}, cliProgress.Presets.shades_classic);

const solveProblemsBar = new cliProgress.SingleBar({
    format: ' ║ {initText} [{bar}] {percentage}% | Problem {i}/{problems} | Parameter 1: {p1}, Parameter 2: {p2}, Users: {cU}, Delay: {delay}'
}, cliProgress.Presets.shades_classic);

let tableChars = {
    'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗'
    , 'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝'
    , 'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼'
    , 'right': '║', 'right-mid': '╢', 'middle': '│'
};


var initialDataTable = new Table({
    chars: tableChars
});

initialDataTable.push(
    { 'Analysis': delayAnalisys ? 'Optimize delay number' : 'Total analysis' },
    { 'URL': url },
    { 'Parameter 1': queryParam1 },
    { 'Parameter 2': queryParam2 },
    { 'Iterations to delay': iterationsToDelay },
)

if (totalAnalisys) {
    initialDataTable.push(
        { 'Concurrent users \nto test': concurrentUsers },
        { 'Number of problems': problemsToGenerate },
        { 'Multiply factor': multiplyFactor },
        { 'Maximum time': maxTime + " ms" });
}

var delayTable = new Table({
    head: ['Execution', 'Mean', 'std', 'Delay used'],
    chars: tableChars
});

if ((delayAnalisys && process.argv.length != 7) ||
    (totalAnalisys && process.argv.length < 8) ||
    (!delayAnalisys && !totalAnalisys) ||
    (iterationsToDelay < 2 || iterationsToDelay > 6) ||
    (maxTime < 500 || maxTime > 30000) ||
    (multiplyFactor < 2 || multiplyFactor > 10) ||
    (problemsToGenerate < 1 || problemsToGenerate > 6) ||
    (concurrentUsers < 1 || concurrentUsers > 10) ||
    (!queryParam1)) {
    console.log(" ╔══════════════════════════════════╗ ");
    console.log(" ║         INCORRECT FORMAT!        ║ ");
    console.log(" ╚══════════════════════════════════╝ ");
    console.log(" ║ Use: apiper <analysisType> <url> <queryParam1> <queryParam2> <iterationsToDelay> <multiplyProblem> <maxTime>");
    console.log(" ║");
    console.log(" ║ Example: apiper -d http://ks.com/api/v1/stress/ 10000 100 2");
    console.log(" ║ Example: apiper -t http://ks.com/api/v1/stress/ 10000 100 2 2 2 4 500");
    console.log(" ║ - (1) Analysis type (required):");
    console.log(" ║ -   -d: Indicate that only execute the script to get the optimum delay number");
    console.log(" ║ -       - Params required: url, queryNumber1, iterationsToDelay");
    console.log(" ║ -   -t: Indicate that execute the complete study over the API");
    console.log(" ║ -       - Params required: url, queryNumber1, concurrentUsers, problemsToGenerate, multiplyProblem, maxTime");
    console.log(" ║ - (2) url (required): The URL of the API endpoint to test");
    console.log(" ║ - (3) queryParam1 (required): First query param of the endpoint");
    console.log(" ║ - (4) queryParam2 (optional): Second query param of the endpoint");
    console.log(" ║ - (5) iterationsToDelay (required): Number of iterations to reach the optimum delay number");
    console.log(" ║     - Min: 2, Max: 6");
    console.log(" ║ - (6) concurrentUsers (required): Number of concurrent users to test in each problem size.");
    console.log(" ║     - Min: 2, Max: 10");
    console.log(" ║ - (7) problemsToGenerate (required): Number of different problems to generate besides of the original one.");
    console.log(" ║     - Min: 1, Max: 6");
    console.log(" ║ - (8) multiplyProblem (required): Multiply factor to increase the size of the problem.");
    console.log(" ║     - Min: 2, Max: 10");
    console.log(" ║ - (9) maxTime (ms) (optional): The maximum execution time of a request to continue testing problems unless it exists more");
    console.log(" ║     - Min: 500 ms, Max: 30000 ms, Default: 20000 ms");
    process.exit();
}

async function showResult() {

    // Show initial data
    console.log(initialDataTable.toString());

    if (delayAnalisys) {
        // Calculate delay param one time
        let delaySelected = await optimizingDelayNumber();
        console.log(" ╔══════════════════════════════════╗ ");
        console.log(" ║     OPTIMUM DELAY: " + delaySelected + "       ║ ");
        console.log(" ╚══════════════════════════════════╝ ");
    } else {
        // Generate and solve problems
        let problems = await generateProblems();
        let totalResults = await solveProblems(problems);

        // let totalResults = [
        //     {
        //         type: 't0',
        //         problem: { p1: 10000, p2: 100, concurrentUsers: 1, delay: 2323 },
        //         result: {
        //             count: 50,
        //             min: 255.866,
        //             max: 296.372,
        //             mean: 1,
        //             std: 10.017
        //         }
        //     },
        //     {
        //         type: 't0',
        //         problem: { p1: 10000, p2: 100, concurrentUsers: 2, delay: 2323 },
        //         result: {
        //             count: 50,
        //             min: 255.866,
        //             max: 296.372,
        //             mean: 2,
        //             std: 10.017
        //         }
        //     },
        //     {
        //         type: 't0',
        //         problem: { p1: 10000, p2: 100, concurrentUsers: 3, delay: 2323 },
        //         result: {
        //             count: 50,
        //             min: 255.866,
        //             max: 296.372,
        //             mean: 3,
        //             std: 10.017
        //         }
        //     },
        //     {
        //         type: 't0',
        //         problem: { p1: 10000, p2: 100, concurrentUsers: 4, delay: 2323 },
        //         result: {
        //             count: 50,
        //             min: 255.866,
        //             max: 296.372,
        //             mean: 4,
        //             std: 10.017
        //         }
        //     },
        //     {
        //         type: 't1',
        //         problem: { p1: 20000, p2: 200, concurrentUsers: 1, delay: 2323 },
        //         result: {
        //             count: 50,
        //             min: 320.282,
        //             max: 391.087,
        //             mean: 335.732,
        //             std: 13.682
        //         }
        //     }, {
        //         type: 't2',
        //         problem: { p1: 20000, p2: 200, concurrentUsers: 1, delay: 2323 },
        //         result: {
        //             count: 50,
        //             min: 320.282,
        //             max: 391.087,
        //             mean: 335.732,
        //             std: 13.682
        //         }
        //     }
        // ];

        formatTotalResult(totalResults);

        process.exit();
    }

}

// Launch requests
showResult();


function formatTotalResult(totalResults) {

    console.log(" ╔══════════════════════════════════╗ ");
    console.log(" ║            RESULTADOS            ║ ");
    console.log(" ╚══════════════════════════════════╝ ");
    // Iterate by problem and generate a table by each problem size
    let tablesToCreate = new Map();

    totalResults.forEach(r => {
        if (!tablesToCreate.has(r.type)) {
            tablesToCreate.set(r.type, { problem: { p1: r.problem.p1, p2: r.problem.p2 }, iterations: [r] });
        } else {
            let table = tablesToCreate.get(r.type);
            table.iterations.push(r);
            tablesToCreate.set(r.type, table)
        }
    });

    for (let [key, value] of tablesToCreate) {
        let table = new Table({
            head: ['Params', 'Concurrent\nusers', 'Delay', 'Mean (ms)', 'Standar\ndeviation'],
            chars: tableChars
        });

        value.iterations.forEach(iteration => {
            table.push(
                [iteration.problem.p1 + '/' + iteration.problem.p2, iteration.problem.concurrentUsers, iteration.problem.delay, iteration.result.mean, iteration.result.std],
            );
        });

        console.log(" ╔═══════════════════════════════════════════════════════╗ ");
        console.log(" ║              PROBLEM "+key+" SIZE: "+value.problem.p1 + '/' + value.problem.p2+"               ║ ");
        console.log(" ╚═══════════════════════════════════════════════════════╝ ");
        console.log(table.toString());

    }


}

// solve problems
async function solveProblems(problems) {

    return new Promise(async (res, rej) => {

        try {

            console.log(" ╔══════════════════════════════════╗ ");
            console.log(" ║        RESOLVING PROBLEMS        ║ ");
            console.log(" ╚══════════════════════════════════╝ ");
            console.log(" ║ Starting... ");


            // solve problems
            let totalResults = [];
            let problemsSolved = 1;
            asyncForEach(problems, async (p) => {

                // Config to solve problem
                const config = {
                    concurrentUsers: p.concurrentUsers,
                    iterations: 50,
                    url: url,
                    param1: p.p1,
                    param2: p.p2
                };


                // Generate delay number
                const delay = await optimizingDelayNumber(config);
                config.delay = delay;
                p.delay = delay;
                if (delay) {

                    // First execution or next
                    if (problemsSolved === 1) {
                        // Start the progress bar
                        solveProblemsBar.start(100, 0,
                            { initText: "Solving...", i: problemsSolved, problems: problems.length, p1: config.param1, p2: config.param2, cU: config.concurrentUsers, delay: config.delay });
                        solveProblemsBar.update(problemsSolved * (100 / problems.length));
                    } else {
                        solveProblemsBar.update(problemsSolved * (100 / problems.length),
                            { initText: "Solving...", i: problemsSolved, p1: config.param1, p2: config.param2, cU: config.concurrentUsers, delay: config.delay });
                    }

                    let result = await getStatsByProblem(config);
                    if (result) {
                        totalResults.push({ type: p.type, problem: p, result: result });
                        problemsSolved = problemsSolved + 1;

                        if (problemsSolved === problems.length + 1) {
                            solveProblemsBar.update({ initText: 'Finished' });
                            solveProblemsBar.stop();
                            res(totalResults);
                        }
                    }
                } else {
                    console.log(" Delay number not calculated yet");
                }
                //console.log("p1: " + p.p1 + " p2: " + p.p2 + ' Users: ' + p.concurrentUsers + ' -----> ' + delay);


            });

        } catch (err) {
            console.log(err);
            rej(err);
            process.exit();
        }

    });

}


// Generate array problems
function generateProblems() {
    return new Promise((res, rej) => {
        try {
            console.log(" ╔══════════════════════════════════╗ ");
            console.log(" ║        GENERATING PROBLEMS       ║ ");
            console.log(" ╚══════════════════════════════════╝ ");
            // Start the progress bar
            generateProblemsBar.start(100, 0, { initText: "Generating...", i: 0, problems: problemsToGenerate * concurrentUsers });
            let problems = [];

            // Generate initial problem 
            let initialProblem = { p1: parseInt(queryParam1), p2: parseInt(queryParam2), type: 't0' };
            problems.push(initialProblem);

            // Generate rest of problems 
            for (i = 1; i <= problemsToGenerate; i++) {
                let p = { p1: problems[i - 1].p1 * multiplyFactor, p2: problems[i - 1].p2 * multiplyFactor, type: 't' + i };
                problems.push(p);
            }

            // Multiply each problem size by user
            problems.forEach(p => {
                for (j = 1; j <= concurrentUsers; j++) {
                    let problem = { p1: p.p1, p2: p.p2 };
                    problem.concurrentUsers = j;
                    problem.type = p.type;
                    problems.push(problem);
                    generateProblemsBar.update(j * 100 / problemsToGenerate * concurrentUsers, { i: j });
                }
            });

            // Remove first problems
            problems = problems.filter(p => p.concurrentUsers);

            generateProblemsBar.update({ initText: 'Finished' });
            generateProblemsBar.stop();
            res(problems);
        } catch (err) {
            console.log(err);
            rej(err);
            process.exit(err);
        }
    });

}

// Generate KS-Problems
function getStatsByProblem(config) {

    let command = "apipecker "
        + config.concurrentUsers + " "
        + config.iterations + " "
        + config.delay + " "
        + config.url + config.param1 + "/" + config.param2;

    return new Promise((res, rej) => {
        try {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.log(`error: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.log(`stderr: ${stderr}`);
                    return;
                }

                let result = resultToJson(stdout);

                res(result);
            });
        } catch (err) {
            console.log(err);
            rej(err);
        }

    });
}

// Optimizing delay number
async function optimizingDelayNumber(execConfig) {

    if (delayAnalisys) {
        console.log(" ╔══════════════════════════════════╗ ");
        console.log(" ║      Optimizing delay number     ║ ");
        console.log(" ╚══════════════════════════════════╝ ");
    }

    let res = [];

    // Config depending on -d or -t
    let config = {
        concurrentUsers: execConfig ? execConfig.concurrentUsers : 1,
        iterations: 1,
        delay: 1,
        url: url,
        param1: execConfig ? execConfig.param1 : queryParam1,
        param2: execConfig ? execConfig.param2 : queryParam2
    };

    // Start the progress bar
    if (delayAnalisys) { delayBar.start(100, 0, { initText: "Calculating...", i: 0, iterations: iterationsToDelay }) };
    for (i = 1; i <= iterationsToDelay; i++) {
        let stats = await getStatsByProblem(config);
        let iteration = { number: i, mean: stats.mean.toFixed(2), std: stats.std.toFixed(2), delay: config.delay.toFixed(2) };
        res.push(iteration);

        //New configuration
        const new_config = {
            iterations: config.iterations * 4,
            delay: i === 1 ? stats.max * 10 :
                (i === 2 ? (stats.max * 2) :
                    (i === 3 ? (stats.max * 1.5) :
                        stats.max * 1.5))
        }

        config.iterations = new_config.iterations;
        config.delay = new_config.delay;

        // update the current value in your application..
        if (delayAnalisys) { delayBar.update(i * 100 / iterationsToDelay, { i: i }); }
    }
    if (delayAnalisys) {
        //Update to finished
        delayBar.update({ initText: 'Finished' });
        // stop the progress bar 
        delayBar.stop();
        //Format table of delay iterations
        formatDelayTable(res);
    }
    return res[res.length - 1].delay;
}

// Format Delay table results
function formatDelayTable(results) {

    results.forEach(e => {
        delayTable.push(
            [e.number, e.mean, e.std, e.delay],
        );
    });

    console.log(delayTable.toString());
}

// Parse results of APIPecker execution to JSON format
function resultToJson(output) {

    try {
        let res = output.split('\n');
        res = res.slice(res.length - 7, res.length - 2);
        res = res.map(line => {
            return line.replace(",", "");
        });
        res = '{' + res + '}'

        return JSON.parse(res);
    } catch (err) {
        console.log(err);
        process.exit();
    }

}


async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}



