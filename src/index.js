const core = require('@actions/core');
const github = require('@actions/github');
const { runAction } = require('./action');
const { parseIntInput, parseAssignments } = require('./utils');

try {
    // Get params
    const gitHubToken = core.getInput('repo-token', { required: true });

    const targetTeamA = core.getInput('targetTeamA', { required: true });
    const targetTeamB = core.getInput('targetTeamB', { required: true });
    
    let numOfAssignee = parseIntInput(
        core.getInput('numOfAssignee', {
            require: true
        }),
        2
    );

    const excludeAssignees = parseAssignments(
        core.getInput('excludeAssignees', { required: false })
    );

    let manualIssueNumber;
    try {
        manualIssueNumber = parseIntInput(
            core.getInput('issueNumber', {
                require: false
            }),
            0
        );
    } catch (error) {
        throw new Error(
            `Failed to parse value for issueNumber: ${error.message}`
        );
    }

    // Get octokit
    const octokit = github.getOctokit(gitHubToken);

    // Get context
    const contextPayload = github.context.payload;

    // Run action
    runAction(octokit, contextPayload, {
        targetTeams: [targetTeamA, targetTeamB],
        excludeAssignees,
        numOfAssignee,
        manualIssueNumber
    });
} catch (error) {
    core.setFailed(error.message);
}
