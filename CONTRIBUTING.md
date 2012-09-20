# How to contribute

## Getting Started

- Make sure you have a [GitHub account](https://github.com/signup/free).
- Submit a ticket for your issue, assuming one does not already exist.
  - Clearly describe the issue including steps to reproduce when it is a bug.
  - Make sure you fill in the version that you know has the issue.
- Fork the repository on GitHub.

## Making Changes

- Create a topic branch from where you want to base your work.
  - This is usually the master branch.
  - Only target release branches if you are certain your fix must be on that
    branch.
  - To quickly create a topic branch based on master: `git branch
    fix/master/my_contribution master` then checkout the new branch with `git
    checkout fix/master/my_contribution`. Please avoid working directly on the
    `master` branch.
- Make commits of logical units.
- Check for unnecessary whitespace with `git diff --check` before committing.
- Make sure your commit messages are in the proper format. See more on this
  in [the blog post](https://github.com/blog/926-shiny-new-commit-styles).
- Make sure you have added the necessary tests for your changes.
- Run `npm test` to assure nothing else was accidentally broken.

## Submitting Changes

- Push your changes to a topic branch in your fork of the repository.
- Submit a pull request to the repository in the bem organization.

# Additional Resources

- [General GitHub documentation](http://help.github.com/)
- [GitHub pull request documentation](http://help.github.com/send-pull-requests/)
