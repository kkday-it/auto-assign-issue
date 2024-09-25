const {
    pickNRandomFromArray,
    getTeamMembers,
    isAnIssue,
    getReviewers
} = require('./utils');

/**
 * Runs the auto-assign issue action
 * @param {Object} octokit
 * @param {Object} context
 * @param {Object} parameters
 * @param {string} parameters.targetTeam
 * @param {string[]} parameters.excludeAssignees
 * @param {number} parameters.numOfAssignee
 * @param {number} parameters.manualIssueNumber
 */

const runAction = async (octokit, context, parameters) => {
    const {
        targetTeam = "",
        excludeAssignees = [],
        numOfAssignee = 0,
        manualIssueNumber = 0
    } = parameters;

    // Check assignees and teams parameters
    if (targetTeam == "") {
        throw new Error(
            'Missing required parameters: you must provide target team'
        );
    }

    let isIssue =
        typeof context.issue !== 'undefined' &&
        typeof context.pull_request === 'undefined' &&
        context.workflow_run?.pull_requests?.length === undefined;
    
    // IS PR
    if (isIssue) { 
        return
    }


    const author =
        context.issue?.user.login ||
        context.pull_request?.user.login ||
        context.workflow_run?.actor.login;
    const [owner, repo] = context.repository.full_name.split('/');

    let issueNumber = manualIssueNumber;
    if (manualIssueNumber === 0) {
        // Try to get number from the context.
        issueNumber =
            context.issue?.number ||
            context.pull_request?.number ||
            context.workflow_run?.pull_requests[0]?.number;
    }

    // If the issue is not found in context or by parameter, maybe it came for a card movement with a linked issue/PR.
    if (
        !issueNumber &&
        context?.project_card?.content_url?.includes('issues')
    ) {
        const contentUrlParts = context.project_card.content_url.split('/');
        issueNumber = parseInt(contentUrlParts[contentUrlParts.length - 1], 10);
        // Check with the API that issueNumber is tied to an issue (it could be a PR in this case)
        isIssue = await isAnIssue(octokit, owner, repo, issueNumber);
    }
    if (!issueNumber) {
        throw new Error(`Couldn't find issue info in current context`);
    }

    const teamMembers = await getTeamMembers(octokit, owner, [targetTeam]);
    let newAssignees = teamMembers;

    // Remove author from reviewers
    const newReviewers = [...newAssignees];
    const foundIndex = newReviewers.indexOf(author);
    if (foundIndex !== -1) {
        newReviewers.splice(foundIndex, 1);
    }

    // Remove excludeAssignees from reviewers
    excludeAssignees.forEach((reviewer) => {
        const foundIndex = newReviewers.indexOf(reviewer);
        if (foundIndex !== -1) {
            newReviewers.splice(foundIndex, 1);
        }
    });

    // Remove current reviewers
    const curReviewers = await getReviewers(octokit, owner, repo, issueNumber);
    curReviewers.forEach((reviewer) => {
        const foundIndex = newReviewers.indexOf(reviewer);
        if (foundIndex !== -1) {
            newReviewers.splice(foundIndex, 1);
        }
    });
    
    const leftReviewer = (numOfAssignee - curReviewers.length);
    if (leftReviewer > 0) {
        const addReviewers = pickNRandomFromArray(newReviewers, leftReviewer);
        if (addReviewers.length > 0) {
            console.log(
                `Setting reviewers for PR ${issueNumber}: ${JSON.stringify(
                    addReviewers
                )}`
            );
            const result = await octokit.rest.pulls.requestReviewers({
                owner,
                repo,
                pull_number: issueNumber,
                reviewers: addReviewers
            });
        }
    }
};

module.exports = {
    runAction
};
