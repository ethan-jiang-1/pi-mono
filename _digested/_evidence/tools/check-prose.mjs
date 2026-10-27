#!/usr/bin/env node
/**
 * Prose guard: corpus pages must not carry line coordinates or the baseline version.
 *
 * Fails on `#L<number>` and on the current baseline tag (from each corpus.json).
 * Skips `_evidence/`, `_coverage/` and blocks marked with `<!-- archive -->`.
 *
 * usage: node check-prose.mjs [--repo <dir>]
 *
 * _digested is intentionally excluded: it is the version-tracking layer and is
 * migrated incrementally. Enable it with --include-digested.
 */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const repo = resolve(args.includes("--repo") ? args[args.indexOf("--repo") + 1] : process.cwd());
const corpora = args.includes("--include-digested")
	? ["_pi_extension_agent_ready_development", "_faq_on_digested", "_digested"]
	: ["_pi_extension_agent_ready_development", "_faq_on_digested"];

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		if (["node_modules", ".git"].includes(entry.name)) continue;
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (entry.name === "_evidence" || entry.name === "_coverage" || entry.name === "_change_log") continue;
			walk(path, out);
		} else if (entry.name.endsWith(".md")) out.push(path);
	}
	return out;
}

const failures = [];
for (const corpus of corpora) {
	const root = join(repo, corpus);
	if (!existsSync(root)) continue;
	const corpusMeta = join(root, "_evidence", "corpus.json");
	const tag = existsSync(corpusMeta) ? JSON.parse(readFileSync(corpusMeta, "utf8")).baseline?.tag : undefined;
	for (const page of walk(root)) {
		const base = page.split("/").pop();
		if (base === "README.md" || base === "00-index.md") continue;
		let archived = false;
		let lineNumber = 0;
		for (const line of readFileSync(page, "utf8").split("\n")) {
			lineNumber += 1;
			if (line.trim() === "<!-- archive -->") archived = true;
			if (line.trim() === "<!-- /archive -->") archived = false;
			if (archived) continue;
			if (/#L\d/.test(line)) failures.push(`${relative(repo, page)}:${lineNumber}: line anchor "${line.match(/#L\d+/)[0]}"`);
			if (tag && line.includes(tag) && !/基线|baseline|\btag\b|release tag/u.test(line)) failures.push(`${relative(repo, page)}:${lineNumber}: baseline version "${tag}"`);
			if (/[（，]\s*:\d{2,4}/u.test(line) || /在\s*:\d{2,4}/u.test(line)) {
				failures.push(`${relative(repo, page)}:${lineNumber}: bare line reference`);
			}
		}
	}
}

if (failures.length === 0) {
	console.log("prose guard: no line anchors or baseline versions in corpus bodies");
} else {
	for (const failure of failures) console.error(`FAIL ${failure}`);
	console.error(`prose guard: ${failures.length} violation(s)`);
	process.exit(1);
}
