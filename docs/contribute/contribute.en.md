# Contribute to development

## Executing autotests

To verify that your changes do not break existing functionality we recommend to run autotests and check that all of them pass. You can do that by executing the following command in the root of the project:

    mocha

## Running autotests with test coverage report

You can check the level of the code coverage by tests using the command:

    make test-cover

Then open `coverage.html` file in a browser. Code lines which have not been executed during the tests will be marked red.
