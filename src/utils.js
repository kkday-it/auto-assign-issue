const parseCsvInput = (valueString) => {
    return valueString
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== '');
};

const parseAssignments = (valueString) => {
    const list = parseCsvInput(valueString);
    const weightedList = [];
    list.forEach((item) => {
        const itemValues = item.split(':');
        const name = itemValues[0];
        let weight = 1;
        if (itemValues.length === 2) {
            try {
                weight = parseIntInput(itemValues[1]);
                // eslint-disable-next-line no-unused-vars
            } catch (e) {
                throw new Error(
                    `Invalid weight value for ${name} assignment: ${itemValues[1]}`
                );
            }
        } else if (itemValues.length > 2) {
            throw new Error(`Invalid assignment value: ${valueString}`);
        }
        for (let i = 0; i < weight; i++) {
            weightedList.push(name);
        }
    });
    return weightedList;
};

const parseIntInput = (valueString, defaultValue = 0) => {
    let value = defaultValue;
    if (valueString) {
        resultValue = parseInt(valueString, 10);
        if (!isNaN(value)) {
            value = resultValue;
        }
    }
    return value;
};

const pickNRandomFromArray = (arr, n) => {
    if (arr.length === 0) {
        throw new Error('Can not pick random from empty list.');
    }
    let available = [...arr];
    const result = [];
    for (let i = 0; i < n && available.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * available.length);
        const pick = available[randomIndex];
        result.push(pick);
        available = available.filter((value) => value !== pick);
    }
    return result;
};

const getTeamMembers = async (octokit, org, teamNames) => {
    const teamMemberRequests = await Promise.all(
        teamNames.map((teamName) =>
            octokit.rest.teams.listMembersInOrg({
                org,
                team_slug: teamName
            })
        )
    ).catch((err) => {
        const newErr = new Error('Failed to retrieve team members');
        newErr.stack += `\nCaused by: ${err.stack}`;
        throw newErr;
    });
    return teamMemberRequests
        .map((response) => response.data)
        .reduce((all, cur) => all.concat(cur), [])
        .map((user) => user.login);
};

const getReviewers = async (octokit, owner, repo, issue_number) => {
    const pullRequest = await octokit.rest.pulls.listRequestedReviewers({
        owner,
        repo,
        pull_number: issue_number
    });
    const reviewers = pullRequest.data.users.map((user) => user.login);
    return reviewers;
};

const isAnIssue = async (octokit, owner, repo, issue_number) => {
    let isAnIssue = false;

    try {
        const issue = await octokit.rest.issues.get({
            owner,
            repo,
            issue_number
        });
        // In private repos, an exception is raised. In public ones, extra info comes.
        if (!issue?.data?.pull_request) {
            // if the pull_request node comes, it means is non a real issue, it is a PR
            isAnIssue = true;
        }
        // eslint-disable-next-line no-unused-vars
    } catch (err) {
        // It's the only way to identify if it's an issue, trying to retrieve its data
    }
    return isAnIssue;
};

module.exports = {
    parseAssignments,
    parseIntInput,
    pickNRandomFromArray,
    getTeamMembers,
    isAnIssue,
    getReviewers
};
