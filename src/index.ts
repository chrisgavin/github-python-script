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
	import json, os, pathlib

	class objdict(dict):
		def __getattr__(self, name):
			if name in self:
				return self[name]
			else:
				raise AttributeError("No such attribute: " + name)
		
		def __getitem__(self, key):
			val = super().__getitem__(key)
			if isinstance(val, dict):
				return objdict(val)
			
			return val

	context = objdict({
		"event_name": os.environ["GITHUB_EVENT_NAME"],
		"sha": os.environ["GITHUB_SHA"],
		"ref": os.environ["GITHUB_REF"],
		"workflow": os.environ["GITHUB_WORKFLOW"],
		"action": os.environ["GITHUB_ACTION"],
		"actor": os.environ["GITHUB_ACTOR"],
		"job": os.environ["GITHUB_JOB"],
		"run_number": int(os.environ["GITHUB_RUN_NUMBER"]),
		"run_id": int(os.environ["GITHUB_RUN_ID"]),
		"api_url": os.environ.get("GITHUB_API_URL", "https://api.github.com"),
		"server_url": os.environ.get("GITHUB_SERVER_URL", "https://github.com"),
		"graphql_url": os.environ.get("GITHUB_GRAPHQL_URL", "https://api.github.com/graphql"),
		"payload": json.loads(pathlib.Path(os.environ["GITHUB_EVENT_PATH"]).read_text()),
	})

	token = os.environ["GITHUB_TOKEN"]
	github = Github(token)
	repository_id = os.environ["GITHUB_REPOSITORY_ID"]
	repository = github.get_repo(int(repository_id))

	return {
		"github": github,
		"repository": repository,
		"context": context,
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
