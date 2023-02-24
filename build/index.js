"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const fs_1 = require("fs");
const path = __importStar(require("path"));
const source_map_support_1 = __importDefault(require("source-map-support"));
const inputs = __importStar(require("./inputs"));
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
    source_map_support_1.default.install();
    const script = preamble + inputs.get().script;
    const temporaryDirectory = await fs_1.promises.mkdtemp("github-python-script-");
    const scriptPath = path.join(temporaryDirectory, "script.py");
    await fs_1.promises.writeFile(scriptPath, script);
    process.stdout.write("::group::pip3 install pygithub\n");
    await exec.exec("pip3", ["install", "pygithub"]);
    process.stdout.write("::endgroup::\n");
    const child_env = { ...process.env, ...{ "GITHUB_TOKEN": inputs.get().token } };
    await exec.exec("python3", [scriptPath], { env: child_env });
}
main().catch(error => core.setFailed(error.stack || error));
//# sourceMappingURL=index.js.map