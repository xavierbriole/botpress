const bitfan = require('@botpress/bitfan').default
const chalk = require('chalk')
const readdir = require('recursive-readdir')
const yargs = require('yargs')
const _ = require('lodash')
const path = require('path')

const { updateResults, readResults } = require('./score-service')

const TEST_FILE_EXT = '.nlu.test.js'
const SETUP_FILE_EXT = 'setup.nlu.test.js'

async function runTest(testDescription, { update, keepGoing }) {
  const { name, test } = testDescription
  const { computePerformance, evaluatePerformance } = test
  const performance = await computePerformance()

  if (update) {
    await updateResults(name, performance)
    return true
  }

  const previousPerformance = await readResults(name)
  const comparison = await evaluatePerformance(performance, previousPerformance)

  bitfan.visualisation.showComparisonReport(name, comparison)
  console.log('')

  if (comparison.status === 'regression') {
    if (!keepGoing) {
      throw new Error('Regression')
    }
    console.log(chalk.gray('Skipping to next test...\n'))
    return false
  }

  if (comparison.status !== 'success') {
    return true
  }

  return true
}

async function runSetupFiles(srcPath) {
  const files = await readdir(srcPath)
  files.filter(f => f.endsWith(SETUP_FILE_EXT)).map(f => require(f).default)
}

async function listTests(srcPath, pattern) {
  const files = await readdir(srcPath)

  const keepFile = filePath => {
    const fileName = path.basename(filePath)
    const fileAsCorrectExtension = fileName.endsWith(TEST_FILE_EXT) && fileName !== SETUP_FILE_EXT
    if (pattern) {
      return fileAsCorrectExtension && fileName.startsWith(pattern)
    }
    return fileAsCorrectExtension
  }

  return _(files)
    .filter(keepFile)
    .flatMap(filePath => {
      const fileName = path.basename(filePath).replace(TEST_FILE_EXT, '')
      return Object.entries(require(filePath)).map(([testName, test]) => ({
        name: `${fileName}.${testName}`,
        test
      }))
    })
    .value()
}

async function main(args) {
  const { update, keepGoing, srcPath, pattern } = args

  await runSetupFiles(srcPath)
  const tests = await listTests(srcPath, pattern)

  if (!tests.length) {
    const msg = pattern
      ? `No test to run in directory "${srcPath}" with pattern "${pattern}".`
      : `No test to run in directory "${srcPath}".`
    console.log(chalk.red(msg))
  }

  let testsPass = true
  for (const test of tests) {
    const currentTestPass = await runTest(test, { update, keepGoing })
    testsPass = testsPass && currentTestPass
  }

  if (update) {
    console.log(chalk.green('Test results where updated with success.'))
    return
  }

  if (!testsPass) {
    throw new Error('There was a regression in at least one test.')
  }
}

yargs
  .command(
    ['test', '$0'],
    'run nlu regression tests',
    {
      update: {
        description: 'Weither or not to update previous results',
        alias: 'u',
        type: 'boolean'
      },
      keepGoing: {
        description: "Which problem to keep running tests when there's a regression",
        alias: 'k',
        type: 'boolean'
      },
      srcPath: {
        description: 'Path where to find test files',
        type: 'string',
        default: `${__dirname}/../../out/bp`
      },
      pattern: {
        description: 'Test files to run',
        alias: 'p',
        type: 'string',
        default: ''
      }
    },
    argv => {
      main(argv)
        .then(() => console.log('Done.'))
        .catch(err => console.log(err))
    }
  )
  .help().argv
