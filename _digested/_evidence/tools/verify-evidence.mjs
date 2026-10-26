#!/usr/bin/env node
/**
 * Evidence ledger verifier.
 *
 * Resolves every entry in <corpus>/_evidence/claims.json against a pinned git tag.
 * A source is stale when its path is missing, its locator no longer matches, or its
 * quote no longer appears in the target file. Line numbers are never used.
 *
 * usage: node verify-evidence.mjs --corpus <dir> [--repo <dir>] [--tag <tag>] [--quiet]
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
function option(name, fallback) {
	const index = args.indexOf(`--${name}`);
	return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const corpus = resolve(option("corpus", process.cwd()));
const repo = resolve(option("repo", process.cwd()));
const quiet = args.includes("--quiet");
const corpusMeta = JSON.parse(readFileSync(join(corpus, "_evidence", "corpus.json"), "utf8"));
const tag = option("tag", corpusMeta.baseline?.tag);
const claims = JSON.parse(readFileSync(join(corpus, "_evidence", "claims.json"), "utf8"));

if (!tag) {
	console.error("no tag: pass --tag or set baseline.tag in corpus.json");
	process.exit(2);
}

const normalize = (text) => text.replace(/\s+/gu, " ").trim();

function gitShow(path) {
	try {
		return execFileSync("git", ["-C", repo, "show", `${tag}:${path}`], {
			encoding: "utf8",
			maxBuffer: 32 * 1024 * 1024,
			stdio: ["ignore", "pipe", "ignore"],
		});
	} catch {
		return undefined;
	}
}

function matchLocator(content, locator) {
	if (!locator || !locator.kind) return { ok: false, detail: "missing locator" };
	const value = locator.value ?? "";
	if (locator.kind === "text" || locator.kind === "symbol") {
		return { ok: normalize(content).includes(normalize(value)), detail: `${locator.kind} "${value.slice(0, 60)}"` };
	}
	if (locator.kind === "heading") {
		const headings = [...content.matchAll(/^#{1,6}\s+(.*)$/gmu)].map((m) => normalize(m[1].replace(/`/g, "")));
		return { ok: headings.some((h) => h.toLowerCase().includes(value.toLowerCase())), detail: `heading "${value}"` };
	}
	if (locator.kind === "regex") {
		try {
			return { ok: new RegExp(value, "mu").test(content), detail: `regex /${value.slice(0, 60)}/` };
		} catch (error) {
			return { ok: false, detail: `invalid regex: ${error.message}` };
		}
	}
	return { ok: false, detail: `unknown locator kind "${locator.kind}"` };
}

const failures = [];
let sources = 0;
for (const entry of claims.entries ?? []) {
	for (const source of entry.sources ?? []) {
		sources += 1;
		const where = `${entry.id} (${entry.page ?? "?"}) → ${source.path}`;
		const content = gitShow(source.path);
		if (source.expect === "absent") {
			if (content !== undefined) failures.push(`${where}: expected absent at ${tag}, but the path exists`);
			continue;
		}
		if (content === undefined) {
			failures.push(`${where}: missing at ${tag}`);
			continue;
		}
		if (source.locator) {
			const result = matchLocator(content, source.locator);
			if (!result.ok) failures.push(`${where}: locator not found (${result.detail})`);
		}
		if (source.quote) {
			if (!normalize(content).includes(normalize(source.quote))) {
				failures.push(`${where}: quote not found (${source.quote.slice(0, 80)}…)`);
			}
		}
	}
}

if (!quiet) {
	const byPage = new Map();
	for (const entry of claims.entries ?? []) {
		byPage.set(entry.page ?? "?", (byPage.get(entry.page ?? "?") ?? 0) + 1);
	}
	for (const [page, count] of [...byPage].sort()) console.log(`${String(count).padStart(3)}  ${page}`);
}
console.log(`\ntag ${tag}: ${claims.entries?.length ?? 0} entries, ${sources} sources, ${failures.length} stale`);
for (const failure of failures) console.log(`  STALE ${failure}`);
process.exit(failures.length === 0 ? 0 : 1);
