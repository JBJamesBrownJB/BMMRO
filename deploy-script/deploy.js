const childProcessExec = require("child_process").exec;
const util = require("util");
const exec = util.promisify(childProcessExec);

const allowedEnvironments = ["uat", "prod"];

async function isCurrentBranchMaster() {
  const branchesOutput = await exec("git branch");

  if (branchesOutput.stderr) {
    console.error(branchesOutput.stderr);
    process.exit(1);
  }

  const branches = branchesOutput.stdout;
  const currentBranch = branches
    .split("\n")
    .find((b) => b.trim().charAt(0) === "*")
    .trim()
    .substring(2);

  if (currentBranch !== "master") {
    console.error(
      "Error: Cannot deploy from this branch. Please change to the master branch."
    );
    return false;
  }

  return true;
}

async function fetchTags() {
  const fetchTagsOutput = await exec("git fetch origin --tags -q");

  if (fetchTagsOutput.stderr) {
    console.error(fetchTagsOutput.stderr);
    process.exit(1);
  }
}

async function createAndPushTag(pendingTag, tag) {
  try {
    const createTagOutput = await exec(`git tag ${pendingTag} ${tag} -f`);

    if (createTagOutput.stderr) {
      console.error(createTagOutput.stderr);
      process.exit(1);
    }

    const pushTagOutput = await exec(
      `git push origin ${pendingTag} --porcelain -f`
    );

    if (pushTagOutput.stderr) {
      console.error(pushTagOutput.stderr);
      process.exit(1);
    } else {
      console.log(`Tag ${pendingTag} successfully created.`);
    }
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

(async function createTagForEnvironment() {
  if (!process.argv[2] || !process.argv[3]) {
    console.error("Error: Please provide environment and tag to be deployed.");
    process.exit(1);
  }

  const environment = process.argv[2];
  const tag = process.argv[3];

  if (!allowedEnvironments.includes(environment)) {
    console.error(
      `Error: Cannot deploy to the environment different than ${allowedEnvironments.join(
        ", "
      )}.`
    );
    process.exit(1);
  }

  if (
    (environment.toLowerCase() === "uat" && !tag.startsWith("dev-deployed-")) ||
    (environment.toLowerCase() === "prod" && !tag.startsWith("uat-deployed-"))
  ) {
    console.error(
      `Error: Cannot deploy tag ${tag} to ${environment}. Can only deploy to UAT tags that start with dev-deployed- or to Production tags that start with uat-deployed-.`
    );
    process.exit(1);
  }

  if (await isCurrentBranchMaster()) {
    await fetchTags();

    const versionToDeploy = tag.split("-deployed-")[1];
    const pendingTag = `${environment.toLowerCase()}-pending-${versionToDeploy}`;

    await createAndPushTag(pendingTag, tag);
  }
})();
