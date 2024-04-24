import "./style.scss";
import {endOfWeek, format, parse} from "date-fns";
import {WeeksInput} from "./weeksInput"
import bootstrap from "bootstrap";

type Mentee = {
    username: string;
    mentors: string[];
    organizations: string[];
    project: {
        title: string;
        ideaUrl: string;
        platformUrl: string;
    }
};

type Program = {
    term: string;
    startDate: string;
    endDate: string;
    cohort: Mentee[];
    weeks: string[];
};

type Repository = {
    owner: {
        login: string;
    };
    nameWithOwner: string;
    url: string;
};

type CommitContribByRepo = {
    repository:Repository;
    url:string;
    contributions:{
        totalCount:number;
    };
};

type IssueContribByRepo = {
    repository:Repository;
    contributions:{
        totalCount:number;
        nodes:{
            issue:{
                number:number;
            };
        }[];
    };
};

type PullRequestContribByRepo = {
    repository:Repository;
    contributions:{
        totalCount:number;
        nodes:{
            pullRequest:{
                number:number;
            };
        }[];
    };
};

type PullRequestReviewContribByRepo = {
    repository:Repository;
    contributions:{
        totalCount:number;
        nodes:{
            pullRequestReview:{
                pullRequest:{
                    number:number;
                };
                url:string;
            };
        }[];
    };
};

type MenteeActivitySummary = {
    mentee: {
        login: string;
        name: string;
        contributionsCollection: {
            startedAt: string;
            endedAt: string;
            hasAnyContributions: boolean;
            totalCommitContributions: number;
            totalIssueContributions: number;
            totalPullRequestContributions: number;
            totalPullRequestReviewContributions: number;
            totalRepositoriesWithContributedCommits: number;
            totalRepositoriesWithContributedIssues: number;
            commitContributionsByRepository: CommitContribByRepo[];
            issueContributionsByRepository: IssueContribByRepo[];
            pullRequestContributionsByRepository: PullRequestContribByRepo[];
            pullRequestReviewContributionsByRepository: PullRequestReviewContribByRepo[];
        };
    };
    term: string;
    weekOf: string;
};

type MenteeSummaryRow = {
    mentee:{
        username: string;
        name: string;
    };
    mentors: string[];
    organizations: string[];
    project: {
        title: string;
        ideaUrl: string;
        platformUrl: string;
    }
    status: boolean;
    pullRequests:{
        repository:string;
        number:number;
    }[];
    issues:{
        repository:string;
        number:number;
    }[];
    commits:{[repo:string]:number};
    pullRequestReviews:{
        repository:string;
        number:number;
        url:string;
    }[];
};

async function fetchPrograms():Promise<string[]> {
    const res = await fetch("https://raw.githubusercontent.com/aliok/mentorship-monitor/main/000-build-programs/programs-list.json");
    return await res.json();
}

async function fetchProgram(name:string):Promise<Program> {
    const res = await fetch(`https://raw.githubusercontent.com/aliok/mentorship-monitor/main/000-build-programs/${name}.json`);
    return await res.json();
}

async function fetchCohortActivitySummaries(program:Program):Promise<MenteeActivitySummary[]> {
    const res = await fetch(`https://raw.githubusercontent.com/aliok/mentorship-monitor/main/150-build-cohort-activity-summaries/${program.term}.json`)
    return await res.json();
}

function findInProgressProgram(programs:{ [name:string]:Program }):string {
    for (const programName in programs) {
        const program = programs[programName];
        if(isProgramActive(program)) {
            return programName;
        }
    }
    // if not return the first key
    return Object.keys(programs)[0];
}

function isProgramActive(program:Program) {
    return new Date(program.startDate) < new Date() && new Date() < new Date(program.endDate);
}

function renderProgramInput(programs:{ [name:string]:Program }, selectedProgram:string) {
    jQuery("#programInput").html(Object.keys(programs).map((programName:string) => {
        const selected = programName === selectedProgram;
        const inProgress = isProgramActive(programs[programName]);
        const dateRange = `${programs[programName].startDate} - ${programs[programName].endDate}`;

        let text = `${programName} (${dateRange})`;
        if(inProgress) {
            text = "🟢 " + text;
        } else {
            text = "🔴 " + text;
        }
        return `<option value="${programName}" ${programName === selectedProgram ? "selected" : ""}>${text}</option>`;
    }).join(""));
}

async function main() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl, {
            html: true,
            trigger: "click hover focus",
        });
    });

    // fetch programs list
    // fetch the files for each program
    // make an in-progress program selected
    // make the previous week selected
    // fetch the cohort activity summary for the selected program
    // show the cohort activity summary for the program and the week

    const programNames = await fetchPrograms();

    const programs:{[name:string]:Program} = {};

    await Promise.all(programNames.map(async (programName:string) => {
        programs[programName] = await fetchProgram(programName);
    }));

    // make an in-progress program selected
    let selectedProgram = findInProgressProgram(programs);

    renderProgramInput(programs, selectedProgram);

    const weeksInput = new WeeksInput(programs[selectedProgram].weeks, "#weeksInput", "#weekPicker");
    weeksInput.render();

    selectProgram(selectedProgram);
    jQuery("#programInput").on("change", () => {
        selectedProgram = jQuery("#programInput").val() as string;
        selectProgram(selectedProgram);
    });

    function buildMenteeSummaryRows(program:Program, cohortActivitySummaries:MenteeActivitySummary[]) {
        // TODO: any sorting of rows?
        const menteeSummaryRows:{ [mentee:string]:MenteeSummaryRow } = {};
        for (let mentee of program.cohort) {
            let username = mentee.username.toLowerCase();
            menteeSummaryRows[username] = {
                mentee: {
                    username: username,
                    name: "",
                },
                mentors: mentee.mentors,
                organizations: mentee.organizations,
                project: mentee.project,
                status: false,
                pullRequests: [],
                issues: [],
                commits: {},
                pullRequestReviews: [],
            };
        }


        for (let summary of cohortActivitySummaries) {
            let username = summary.mentee.login.toLowerCase();
            const row = menteeSummaryRows[username];

            if (!row) {
                console.log("Mentee not found in the cohort, why do we have activities for this user?: ", username);
                continue;
            }

            // we don't have this in advance, so we need to fill it in
            row.mentee.name = summary.mentee.name;

            for (let contrib of summary.mentee.contributionsCollection.pullRequestContributionsByRepository) {
                for (let node of contrib.contributions.nodes) {
                    row.pullRequests.push({
                        repository: contrib.repository.nameWithOwner,
                        number: node.pullRequest.number
                    });
                }
            }
            for (let contrib of summary.mentee.contributionsCollection.issueContributionsByRepository) {
                for (let node of contrib.contributions.nodes) {
                    row.issues.push({
                        repository: contrib.repository.nameWithOwner,
                        number: node.issue.number
                    });
                }
            }
            for (let contrib of summary.mentee.contributionsCollection.commitContributionsByRepository) {
                if (!row.commits[contrib.repository.nameWithOwner]) {
                    row.commits[contrib.repository.nameWithOwner] = 0;
                }
                row.commits[contrib.repository.nameWithOwner] += contrib.contributions.totalCount;
            }
            for (let contrib of summary.mentee.contributionsCollection.pullRequestReviewContributionsByRepository) {
                for (let node of contrib.contributions.nodes) {
                    row.pullRequestReviews.push({
                        repository: contrib.repository.nameWithOwner,
                        number: node.pullRequestReview.pullRequest.number,
                        url: node.pullRequestReview.url,
                    });
                }
            }

            // there can be contributions duplicated in 2 weeks, so we need to merge them
            // see the bug report at https://github.com/orgs/community/discussions/121029
            row.pullRequests = dedupe(row.pullRequests, (pr) => `${pr.repository}#${pr.number}`);
            row.issues = dedupe(row.issues, (issue) => `${issue.repository}#${issue.number}`);
            // no need to dedupe row.commits
            row.pullRequestReviews = dedupe(row.pullRequestReviews, (pr) => `${pr.repository}#${pr.number}`);

            // TODO: to be defined with Nate
            row.status = Object.keys(row.commits).length > 0 || row.pullRequests.length > 0;
        }
        return menteeSummaryRows;
    }

    jQuery("#showButton").on("click", async () => {
        const selectedProgram = jQuery("#programInput").val() as string;
        const selectedWeeks = weeksInput.getSelectedWeeks();
        const program = programs[selectedProgram];
        console.log("Selected program: ", selectedProgram);
        console.log("Selected weeks: ", selectedWeeks);

        let cohortActivitySummaries = await fetchCohortActivitySummaries(program);
        cohortActivitySummaries = filterBySelectedWeeks(cohortActivitySummaries, selectedWeeks);

        // if projectOrgActivitiesOnlyInput is checked, filter out the ones that are not in the project orgs
        if (jQuery("#projectOrgActivitiesOnlyInput").is(":checked")) {
            removeNonProjectOrgActivities(program, cohortActivitySummaries);
        }

        let menteeSummaryRows = buildMenteeSummaryRows(program, cohortActivitySummaries);

        if(jQuery("#sortByStatusInput").is(":checked")) {
            menteeSummaryRows = Object.fromEntries(Object.entries(menteeSummaryRows).sort((a, b) => {
                if(a[1].status && !b[1].status) {
                    return 1;
                } else if(!a[1].status && b[1].status) {
                    return -1;
                } else {
                    return a[0].localeCompare(b[0]);
                }
            }));
        }

        const startDate = selectedWeeks[0];
        const endDate = format(endOfWeek(parse(selectedWeeks[selectedWeeks.length - 1], "yyyy-MM-dd", new Date()), {weekStartsOn:1}), "yyyy-MM-dd");
        updateMenteeSummariesTable(menteeSummaryRows, startDate, endDate);
    });

    function selectProgram(programName:string) {
        weeksInput.setWeeks(programs[programName].weeks);
    }

    function filterBySelectedWeeks(cohortActivitySummaries:MenteeActivitySummary[], selectedWeeks:string[]) {
        return cohortActivitySummaries.filter((summary:MenteeActivitySummary) => {
            return selectedWeeks.some((week:string) => {
                if(!summary.mentee){
                    return false;
                }

                return summary.weekOf == week;
            });
        });
    }

    function removeNonProjectOrgActivities(program:Program, cohortActivitySummaries:MenteeActivitySummary[]) {
        // create a map of mentee to organizations
        const menteeToOrgs:{[mentee:string]:string[]} = {};
        for(let mentee of program.cohort) {
            menteeToOrgs[mentee.username.toLowerCase()] = mentee.organizations;
        }

        for(let summary of cohortActivitySummaries) {
            let menteeUsername = summary.mentee.login.toLowerCase()
            const menteeOrgArr = menteeToOrgs[menteeUsername];

            let filteredCommits:CommitContribByRepo[] = [];
            for(let contrib of summary.mentee.contributionsCollection.commitContributionsByRepository) {
                if(menteeOrgArr.indexOf(contrib.repository.owner.login) !== -1) {
                    filteredCommits.push(contrib);
                }
            }
            summary.mentee.contributionsCollection.commitContributionsByRepository = filteredCommits;

            let filteredIssues:IssueContribByRepo[] = [];
            for(let contrib of summary.mentee.contributionsCollection.issueContributionsByRepository) {
                if(menteeOrgArr.indexOf(contrib.repository.owner.login) !== -1) {
                    filteredIssues.push(contrib);
                }
            }
            summary.mentee.contributionsCollection.issueContributionsByRepository = filteredIssues;

            let filteredPullRequests:PullRequestContribByRepo[] = [];
            for(let contrib of summary.mentee.contributionsCollection.pullRequestContributionsByRepository) {
                if(menteeOrgArr.indexOf(contrib.repository.owner.login) !== -1) {
                    filteredPullRequests.push(contrib);
                }
            }
            summary.mentee.contributionsCollection.pullRequestContributionsByRepository = filteredPullRequests;

            let filteredPullRequestReviews:PullRequestReviewContribByRepo[] = [];
            for(let contrib of summary.mentee.contributionsCollection.pullRequestReviewContributionsByRepository) {
                if(menteeOrgArr.indexOf(contrib.repository.owner.login) !== -1) {
                    filteredPullRequestReviews.push(contrib);
                }
            }
            summary.mentee.contributionsCollection.pullRequestReviewContributionsByRepository = filteredPullRequestReviews;
        }
    }

    function updateMenteeSummariesTable(menteeSummaryRows:{ [mentee:string]:MenteeSummaryRow }, startDate:string, endDate:string) {
        let body = jQuery("#menteeSummaries").find("tbody");
        body.html("");
        let index = 0;
        for(let mentee in menteeSummaryRows) {
            index++;

            const row = menteeSummaryRows[mentee];
            let html = "";

            html += `<td>${index}</td>`;

            html += `<td>
                <div>
                    <div class="row">
                        <div class="col-2">
                            <img src="https://github.com/${row.mentee.username}.png?size=40" class="rounded-circle" style="width: 40px;">
                        </div>
                        <div class="col-10">
                            <a href="https://github.com/${row.mentee.username}" target="_blank">@${row.mentee.username}</a>
                            
                            <p class="small mt-2">
                                <a href="https://github.com/${row.mentee.username}" target="_blank">${row.mentee.name}</a>
                            </p>
                            
                            <p class="small m-0">
                                <i><a href="${row.project.ideaUrl}" target="_blank">${row.project.title}</a></i>
                            </p>
                            
                            <p class="small m-0">
                            Mentors: ${row.mentors.map((mentor:string) => `<a href="https://github.com/${mentor}" target="_blank">@${mentor}</a>`).join(", ")} 
                            </p>
                            
                            <p class="small m-0">
                            GH orgs: ${row.organizations.map((org:string) => `<a href="https://github.com/${org}" target="_blank">${org}</a>`).join(", ")} 
                            </p>
                            
                            <p class="small m-0">
                                <a href="${row.project.platformUrl}" target="_blank">Go to platform</a>
                            </p>
                        </div>
                    </div>
                </div>
            </td>`;

            if(row.status) {
                html += `<td><span class="badge bg-success">OK</span></td>`;
            } else{
                html += `<td><span class="badge bg-danger">No</span></td>`;
            }

            html += `<td>
                <a href="https://github.com/search?q=author:${mentee} type:pr created:${startDate}..${endDate}&type=pullrequests" target="_blank">${row.pullRequests.length} <i class="bi bi-github"></i></a>
                <div class="mt-2">
                    ${row.pullRequests.map((pr:{repository:string, number:number}) => `<a href="https://github.com/${pr.repository}/pull/${pr.number}" target="_blank">${pr.repository}#${pr.number}</a>`).join(", ")}
                </div>
            </td>`;

            const commitCount = Object.keys(row.commits).reduce((acc:number, repo:string) => acc + row.commits[repo], 0);

            html += `<td>
                <a href="https://github.com/search?q=committer:${mentee} type:commit committer-date:${startDate}..${endDate} &type=commits" target="_blank">${commitCount} <i class="bi bi-github"></i></a>
                <div class="mt-2">
                    ${Object.keys(row.commits).map((repo:string) => `<a href="https://github.com/${repo}/commits?author=${mentee}&since=${startDate}&until=${endDate}" target="_blank">${repo} (${row.commits[repo]})</a>`).join(", ")}
                </div>
            </td>`;

            html += `<td>
                <a href="https://github.com/search?q=author:${mentee} type:issue created:${startDate}..${endDate}&type=issues" target="_blank">${row.issues.length} <i class="bi bi-github"></i></a>
                <div class="mt-2">
                    ${row.issues.map((issue:{repository:string, number:number}) => `<a href="https://github.com/${issue.repository}/issues/${issue.number}" target="_blank">${issue.repository}#${issue.number}</a>`).join(", ")}
                </div>
            </td>`;

            html += `<td>
                <span>${row.pullRequestReviews.length} <i class="bi bi-github"></i></span>
                <div class="mt-2">
                    ${row.pullRequestReviews.map((pr:{repository:string, number:number, url:string}) => `<a href="${pr.url}" target="_blank">${pr.repository}#${pr.number}</a>`).join(", ")}
                </div>
            </td>`;

            html += `<td><a href="https://github.com/${row.mentee.username}?tab=overview&from=${startDate}&to=${endDate}" target="_blank">Details</a></td>`;


            html = `<tr>${html}</tr>`;

            body.append(html);
        }
    }

    function dedupe<T>(contribs:T[], keyFn:(contrib:T) => string):T[] {
        // dedupe the contributions
        // use a map to keep track of the keys
        const keys:{[key:string]:boolean} = {};
        const deduped:T[] = [];
        for(let contrib of contribs) {
            const key = keyFn(contrib);
            if(!keys[key]) {
                keys[key] = true;
                deduped.push(contrib);
            }
        }
        return deduped;
    }
}

(() => {
    main();
})();
