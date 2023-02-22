import * as core from "@actions/core";
import * as exec from "@actions/exec";
import {promises as fsPromises} from "fs";
import * as path from "path";
import sourceMapSupport from "source-map-support";

import * as inputs from "./inputs";

const preamble = `
#!/usr/bin/env python3
from github import Github
import os

token = os.environ["GITHUB_TOKEN"]
github = Github(token)

`;

async function main() {
	sourceMapSupport.install();

	const script = preamble + inputs.get().script;
	const temporaryDirectory = await fsPromises.mkdtemp("github-python-script-");
	const scriptPath = path.join(temporaryDirectory, "script.py");
	await fsPromises.writeFile(scriptPath, script);
	await exec.exec("pip3", ["install", "pygithub"]);
	await exec.exec("python3", [scriptPath], {env: {"GITHUB_TOKEN": inputs.get().token}});
}

main().catch(error => core.setFailed(error.stack || error));
