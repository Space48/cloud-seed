/* eslint-disable */
const { Bitbucket } = require("bitbucket");
const fs = require("fs");

const clientOptions = {
  notice: false,
  baseUrl: "https://api.bitbucket.org/2.0",
  request: {
    timeout: 10000,
  },
  auth: {
    username: process.env.BB_API_USER,
    password: process.env.BB_API_PASS,
  },
};

const bitbucket = new Bitbucket(clientOptions);

(async () => {
  try {
    const requiredEnvVars = [
      "BITBUCKET_PR_ID",
      "BITBUCKET_REPO_SLUG",
      "BITBUCKET_WORKSPACE",
      "BB_API_USER",
      "BB_API_PASS",
    ];
    requiredEnvVars.forEach((envVar) => {
      if (!(envVar in process.env)) {
        throw new Error(`Missing environment variable: ${envVar}`);
      }
    });
    const stdinBuffer = fs.readFileSync(0); // STDIN_FILENO = 0
    const planBody = stdinBuffer.toString();

    const commentIntro =
      "SEVERE VULNERABILITIES FOUND!";
    const newComment =
      `${commentIntro}\n\r` +
      `Last updated at: ${new Date()
        .toISOString()
        .replace(/T/, " ")
        .replace(/\..+/, "")}\n` +
      "```\n" +
      `${planBody}\n` +
      "```\n";

    // Fetch all comments from the PR
    const comments = await bitbucket.pullrequests.listComments({
      pull_request_id: process.env.BITBUCKET_PR_ID,
      repo_slug: process.env.BITBUCKET_REPO_SLUG,
      workspace: process.env.BITBUCKET_WORKSPACE,
    });

    // Find an existing comment containing a terraform plan.
    const existingComments = comments.data.values.filter((comment) => {
      return !comment.deleted && comment.content.raw.includes(commentIntro);
    });

    const commentParams = {
      pull_request_id: process.env.BITBUCKET_PR_ID,
      repo_slug: process.env.BITBUCKET_REPO_SLUG,
      workspace: process.env.BITBUCKET_WORKSPACE,
      _body: {
        content: {
          raw: newComment,
        },
      },
    };

    // If there's an existing comment with a plan then we'll update it.
    if (existingComments.length) {
      await bitbucket.pullrequests.updateComment({
        comment_id: existingComments[0].id,
        ...commentParams,
      });
      return
    }

    // Create a new comment on the PR.
    await bitbucket.pullrequests.createComment(commentParams);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
