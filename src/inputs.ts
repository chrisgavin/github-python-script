import * as core from "@actions/core";

export class Inputs {
	"token" = core.getInput("token", {required: true});
	"script" = core.getInput("script", {required: true});
}

export function get():Inputs {
	return new Inputs();
}
