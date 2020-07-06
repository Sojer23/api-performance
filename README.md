# APIPerformance
*Tool to streamline the performance study process on the indicated endpoints and optimize the calculation of the optimal delay for simple executions.*

It has two functionalities, these are:
- Optimum delay calculation
- Total automated performance report

The commands to execute each functionality are the next:
- Optimum delay: `apiperformance -d <url> <param1> <param2> <iterationsToDelay>`
- Total performance report: `apiperformance -t <url> <param1> <param2> <iterationsToDelay>
<concurrentUsers> <problemsToGenerate> <multiplyProblem> <maxTime>`

## Install:
```terminal
$ npm install apiperformance -g
```
or directly with npx:
```terminal
$ npx apiperformance -d <url> <param1> <param2> <iterationsToDelay>
$ npx apiperformance -t <url> <param1> <param2> <iterationsToDelay> <concurrentUsers> <problemsToGenerate> <multiplyProblem> <maxTime>
```
## Usage examples:

### Optimum delay calculation
```terminal
$ apiper -d http://knapsack-api.herokuapp.com/api/v1/stress/ 10000 100 5
```
Output:
![alt text](https://github.com/Sojer23/api-performance/blob/dev/examples/delay_execution_example.jpg?raw=true)

### Total automated performance report
```terminal
$ apiper -t http://knapsack-api.herokuapp.com/api/v1/stress/ 10000 100 3 4 2 2 300
```
Output:
![alt text](https://github.com/Sojer23/api-performance/blob/dev/examples/ejemplo_total_1.jpg?raw=true)
![alt text](https://github.com/Sojer23/api-performance/blob/dev/examples/ejemplo_total_2.jpg?raw=true)
![alt text](https://github.com/Sojer23/api-performance/blob/dev/examples/ejemplo_total_3.jpg?raw=true)
![alt text](https://github.com/Sojer23/api-performance/blob/dev/examples/ejemplo_total_4.jpg?raw=true)

