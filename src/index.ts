import * as core from "@actions/core";
import * as exec from "@actions/exec";
import {promises as fsPromises} from "fs";
import * as path from "path";
import sourceMapSupport from "source-map-support";

import * as inputs from "./inputs";

const preamble = `
#!/usr/bin/env python3

def setup():
	from github import Github
	import os

	token = os.environ["GITHUB_TOKEN"]
	github = Github(token)
	repository_id = os.environ["GITHUB_REPOSITORY_ID"]
	repository = github.get_repo(int(repository_id))

	return {
		"github": github,
		"repository": repository,
	}

locals().update(setup())

del setup

# Add default set of imports for user scripts
import json, os, pathlib, sys

`;

async function main() {
	sourceMapSupport.install();

	const script = preamble + inputs.get().script;
	const temporaryDirectory = await fsPromises.mkdtemp("github-python-script-");
	const scriptPath = path.join(temporaryDirectory, "script.py");
	await fsPromises.writeFile(scriptPath, script);
	await exec.exec("pip3", ["install", "pygithub"]);
	const child_env = { ...process.env, ...{"GITHUB_TOKEN": inputs.get().token} }
	await exec.exec("python3", [scriptPath], {env: child_env});
}

main().catch(error => core.setFailed(error.stack || error));
