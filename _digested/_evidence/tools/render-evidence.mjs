#!/usr/bin/env node
/**
 * Renders <corpus>/_evidence/render.md from claims.json.
 *
 * The rendered file is the only place that carries tag-pinned URLs and quotes.
 * Prose links to its headings (#e001, …), so a tag bump never edits prose.
 *
 * usage: node render-evidence.mjs --corpus <dir> [--out <file>]
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const args = process.argv.slice(2);
function option(name, fallback) {
	const index = args.indexOf(`--${name}`);
	return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const corpus = resolve(option("corpus", process.cwd()));
const meta = JSON.parse(readFileSync(join(corpus, "_evidence", "corpus.json"), "utf8"));
const claims = JSON.parse(readFileSync(join(corpus, "_evidence", "claims.json"), "utf8"));
const tag = meta.baseline?.tag;
const repository = meta.baseline?.repo ?? "earendil-works/pi";
const out = resolve(option("out", join(corpus, "_evidence", "render.md")));

if (!tag) {
	console.error("corpus.json has no baseline.tag");
	process.exit(2);
}

const lines = [
	"# 证据附录（生成物）",
	"",
	`由 \`_evidence/claims.json\` 生成，基线 \`${tag}\`。**不要手改**；改台账后重新运行：`,
	"",
	"```sh",
	"node _digested/_evidence/tools/render-evidence.mjs --corpus <语料目录>",
	"```",
	"",
	"正文的 `[E###]` 指向本文件的对应标题。每条记录给出符号/小节定位、原文引文与核验版本；",
	"行号仅作为人读提示，机器校验不使用行号。",
	"",
];

let currentPage;
for (const entry of claims.entries ?? []) {
	if (entry.page !== currentPage) {
		currentPage = entry.page;
		lines.push(`## ${currentPage}`, "");
	}
	lines.push(`### ${entry.id}`, "");
	lines.push((entry.claim ?? "").replace(/```/gu, "'''"), "");
	for (const source of entry.sources ?? []) {
		const displayValue = source.locator ? String(source.locator.value).replace(/\n/gu, " ").replace(/\[/gu, "［").replace(/\]/gu, "］").replace(/```/gu, "'''") : "";
		const locator = source.locator ? `${source.locator.kind}: \`${displayValue}\`` : "整文件";
		const hint = source.hintLine ? `，提示行 ${source.hintLine}` : "";
		if (source.expect === "absent") {
			lines.push(`- \`${source.path}\`：**${tag} 起不存在**`);
			continue;
		}
		lines.push(
			`- [\`${source.path}\`](https://github.com/${repository}/blob/${tag}/${source.path}) — ${locator}${hint}`,
		);
		if (source.quote) {
			lines.push("", "  ```text", "  " + source.quote.replace(/\n/gu, " ").replace(/```/gu, "'''"), "  ```", "");
		}
	}
	lines.push(`核验：\`${entry.checkedAt ?? tag}\``, "");
}

writeFileSync(out, lines.join("\n").replace(/\n+$/u, "\n"));
console.log(`rendered ${claims.entries?.length ?? 0} entries → ${out}`);
