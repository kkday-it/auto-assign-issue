# GitHub action that Auto-assigns reviewers to team's users
Fork & Modify & Credit from: https://github.com/pozil/auto-assign-issue

## Github Action Examples

```yml
name: Auto-assign PR Reviewer

on:
    pull_request:
        types: [opened, edited, synchronize, reopened]

jobs:
    auto-assign:
        runs-on: ubuntu-latest
        permissions:
            issues: write
        steps:
            - name: 'Auto-assign PR Reviewer'
              uses: app-harry/auto-assign-issue@v2
              with:
                  repo-token: ${{ secrets.MY_PERSONAL_ACCESS_TOKEN }} 
                  targetTeam: 'ios' # The name of the team to which the target assignees belong
                  numOfAssignee: 2 # Number of random assignees
                  excludeAssignees: '' # Optional, Users to be excluded from being assigned as reviewers (comma-separated)
```