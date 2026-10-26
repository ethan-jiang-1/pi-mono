#!/usr/bin/env node
/**
 * Turns line anchors into candidate ledger entries.
 *
 * Reads a page, finds GitHub blob links and relative links with #Lnnn, extracts the
 * referenced lines from the pinned tag, and prints candidate entries as JSON.
 * It never rewrites the page; review the output and merge it into claims.json.
 *
 * usage: node migrate-anchors.mjs <page.md> --tag <tag> [--repo <dir>] [--prefix E]
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const page = resolve(args[0] ?? "");
function option(name, fallback) {
	const index = args.indexOf(`--${name}`);
	return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}
const repo = resolve(option("repo", process.cwd()));
const tag = option("tag");
const prefix = option("prefix", "E");
if (!args[0] || !tag) {
	console.error("usage: node migrate-anchors.mjs <page.md> --tag <tag> [--repo <dir>]");
	process.exit(2);
}

const text = readFileSync(page, "utf8");
const links = [];
const absolute = /https:\/\/github\.com\/[^/]+\/[^/]+\/blob\/[^/]+\/([^)#\s]+)#L(\d+)(?:-L(\d+))?/g;
for (const match of text.matchAll(absolute)) links.push({ path: match[1], start: Number(match[2]), end: Number(match[3] ?? match[2]) });
const relativeLink = /\]\((?:\.\.\/)+([^)#\s]+)#L(\d+)(?:-L(\d+))?\)/g;
for (const match of text.matchAll(relativeLink)) {
	const resolved = relative(repo, resolve(dirname(page), "../../", match[1]));
	links.push({ path: resolved.split("\\").join("/"), start: Number(match[2]), end: Number(match[3] ?? match[2]) });
}

const normalize = (value) => value.replace(/\s+/gu, " ").trim();
const seen = new Set();
const entries = [];
let index = 0;
for (const link of links) {
	let content;
	try {
		content = execFileSync("git", ["-C", repo, "show", `${tag}:${link.path}`], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
	} catch {
		console.error(`skip missing ${link.path}`);
		continue;
	}
	const lines = content.split("\n");
	const quote = normalize(lines.slice(link.start - 1, link.end).join(" "));
	const key = `${link.path}\n${quote}`;
	if (!quote || seen.has(key)) continue;
	seen.add(key);
	index += 1;
	entries.push({
		id: `${prefix}${String(index).padStart(3, "0")}`,
		page: relative(repo, page).split("\\").join("/").replace(/^_pi_extension_agent_ready_development\//, "").replace(/^_faq_on_digested\//, ""),
		claim: "<待写>",
		checkedAt: tag,
		sources: [{ path: link.path, locator: { kind: "text", value: quote.slice(0, 120) }, quote, hintLine: link.start, volatility: "medium" }],
	});
}
console.log(JSON.stringify({ entries }, null, "\t"));
