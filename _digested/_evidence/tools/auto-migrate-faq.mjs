#!/usr/bin/env node
/**
 * Auto-migrates inline #L citations in a FAQ page to ledger markers.
 * usage: node auto-migrate-faq.mjs <page> --tag v1.4.0 --repo . --corpus _faq_on_digested
 */
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const page = resolve(args[0]);
const option = (name, fallback) => {
	const index = args.indexOf(`--${name}`);
	return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const repo = resolve(option("repo", process.cwd()));
const tag = option("tag", "v1.4.0");
const corpus = resolve(repo, option("corpus", "_faq_on_digested"));
const evidenceDir = join(corpus, "_evidence");
mkdirSync(evidenceDir, { recursive: true });
const claimsPath = join(evidenceDir, "claims.json");
const claims = existsSync(claimsPath) ? JSON.parse(readFileSync(claimsPath, "utf8")) : { entries: [] };
writeFileSync(join(evidenceDir, "corpus.json"), JSON.stringify({ baseline: { repo: "earendil-works/pi", tag, commit: "4a080252f" } }, null, "\t") + "\n");

const normalize = (value) => value.replace(/\s+/gu, " ").trim();
const contentCache = new Map();
function content(path) {
	if (!contentCache.has(path)) {
		contentCache.set(path, execFileSync("git", ["-C", repo, "show", `${tag}:${path}`], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }));
	}
	return contentCache.get(path);
}

const pageRel = relative(corpus, page).split("\\").join("/");
let next = claims.entries.reduce((max, entry) => Math.max(max, Number(entry.id.slice(1))), 0) + 1;
const linkRe = /\[([^\]]*)\]\((?:\.\.\/)+([^)#\s]+)#L(\d+)(?:-L(\d+))?\)/g;
const seen = new Map();

let text = readFileSync(page, "utf8");
text = text.replace(linkRe, (match, label, path, startText, endText) => {
	const start = Number(startText);
	const end = Number(endText ?? startText);
	const key = `${path}:${start}:${end}`;
	let id = seen.get(key);
	if (!id) {
		const lines = content(path).split("\n");
		const quote = normalize(lines.slice(start - 1, end).join(" "));
		id = `E${String(next).padStart(3, "0")}`;
		next += 1;
		seen.set(key, id);
		claims.entries.push({
			id,
			page: pageRel,
			claim: `证据：${label}`,
			checkedAt: tag,
			sources: [{ path, locator: { kind: "text", value: quote.slice(0, 120) }, quote, hintLine: start, volatility: "high" }],
		});
	}
	return `[${id}](../_evidence/render.md#${id.toLowerCase()})`;
});

writeFileSync(page, text);
writeFileSync(claimsPath, JSON.stringify(claims, null, "\t") + "\n");
console.log(`${pageRel}: ${seen.size} entries, total ${claims.entries.length}`);
