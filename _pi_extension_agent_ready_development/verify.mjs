#!/usr/bin/env node
/**
 * Corpus structure verifier for _pi_extension_agent_ready_development.
 *
 * Enforced rules:
 * - Strict UTF-8 (no BOM, no invalid sequences) for every file.
 * - Exactly one trailing newline.
 * - Markdown links: in-corpus relative targets must exist; fragments must match
 *   a heading slug in the target file; external links may only point to the
 *   pinned Pi baseline tag v1.2.0.
 * - Markdown image references must point to an existing .svg in a figures dir.
 * - SVG figures: intrinsic size (width/height/viewBox), accessibility metadata
 *   (role="img", <title>, <desc>), root <svg> element.
 * - Every figure is referenced by at least one Markdown page; every directory
 *   in the corpus has a README.md.
 *
 * Not checked: remote content, semantic accuracy, prose quality, visual layout.
 * Node built-ins only; locates the corpus from this file's own location.
 */

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const CORPUS_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const PINNED_EXTERNAL = /^https:\/\/github\.com\/earendil-works\/pi\/(?:blob|tree)\/v1\.2\.0(?:\/|$)/;
const STRICT_DECODER = new TextDecoder("utf-8", { fatal: true, ignoreBOM: false });

function listFiles(dir) {
	const out = [];
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) out.push(...listFiles(path));
		else out.push(path);
	}
	return out;
}

function listDirs(dir) {
	const out = [dir];
	for (const entry of readdirSync(dir)) {
		const path = join(dir, entry);
		if (statSync(path).isDirectory()) out.push(...listDirs(path));
	}
	return out;
}

/** GitHub-style heading slug: lowercase, drop punctuation, spaces to hyphens. */
function headingSlug(text) {
	return text
		.trim()
		.toLowerCase()
		.replace(/[^\p{L}\p{N}\s-]/gu, "")
		.replace(/\s+/g, "-");
}

function headingSlugs(markdown) {
	const slugs = new Set();
	const duplicates = new Map();
	let inFence = false;
	for (const line of markdown.split("\n")) {
		if (line.trimStart().startsWith("```")) {
			inFence = !inFence;
			continue;
		}
		if (inFence) continue;
		const match = /^(#{1,6})\s+(.*)$/.exec(line);
		if (!match) continue;
		let slug = headingSlug(match[2].replace(/`/g, ""));
		if (duplicates.has(slug)) {
			const n = duplicates.get(slug) + 1;
			duplicates.set(slug, n);
			slug = `${slug}-${n}`;
		} else {
			duplicates.set(slug, 0);
		}
		slugs.add(slug);
	}
	return slugs;
}

function stripCodeFences(markdown) {
	return markdown
		.split("\n")
		.reduce(
			(acc, line) => {
				if (line.trimStart().startsWith("```")) acc.fence = !acc.fence;
				if (!acc.fence) acc.lines.push(line);
				return acc;
			},
			{ fence: false, lines: [] },
		)
		.lines.join("\n");
}

function checkSvg(path, errors) {
	const rel = relative(CORPUS_ROOT, path);
	const text = readFileSync(path, "utf8");
	const trimmed = text.trim();
	if (!trimmed.startsWith("<svg ") || !trimmed.endsWith("</svg>")) {
		errors.push(`${rel}: SVG must be a single root <svg> element`);
		return;
	}
	for (const attr of ["xmlns=", "width=", "height=", "viewBox=", 'role="img"']) {
		if (!text.includes(attr)) errors.push(`${rel}: SVG missing ${attr}`);
	}
	if (!text.includes("<title")) errors.push(`${rel}: SVG missing <title> (accessibility metadata)`);
	if (!text.includes("<desc")) errors.push(`${rel}: SVG missing <desc> (accessibility metadata)`);
}

function checkFile(path, errors) {
	const rel = relative(CORPUS_ROOT, path);
	let bytes;
	try {
		bytes = readFileSync(path);
	} catch (error) {
		errors.push(`${rel}: unreadable (${error.message})`);
		return;
	}
	let text;
	try {
		text = STRICT_DECODER.decode(bytes);
	} catch {
		errors.push(`${rel}: not strict UTF-8`);
		return;
	}
	if (text.startsWith("\uFEFF")) errors.push(`${rel}: has UTF-8 BOM`);
	if (!text.endsWith("\n")) errors.push(`${rel}: missing trailing newline`);
	else if (text.endsWith("\n\n")) errors.push(`${rel}: more than one trailing newline`);

	if (path.endsWith(".svg")) {
		checkSvg(path, errors);
		return;
	}
	if (!path.endsWith(".md")) return;

	for (const match of stripCodeFences(text).matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
		const target = match[1];
		const resolved = resolve(dirname(path), target);
		if (!target.endsWith(".svg")) {
			errors.push(`${rel}: image reference must point to a .svg file: ${target}`);
			continue;
		}
		if (!existsSync(resolved)) {
			errors.push(`${rel}: image reference target does not exist: ${target}`);
			continue;
		}
		if (!resolved.includes(`${sep}figures${sep}`)) {
			errors.push(`${rel}: image reference must live in a figures directory: ${target}`);
		}
	}

	const links = stripCodeFences(text).matchAll(/(?<!\!)\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g);
	for (const match of links) {
		const target = match[1];
		if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith("#")) {
			if (target.startsWith("#")) {
				const slugs = headingSlugs(text);
				if (!slugs.has(target.slice(1))) errors.push(`${rel}: in-page anchor ${target} has no matching heading`);
			} else if (!PINNED_EXTERNAL.test(target)) {
				errors.push(`${rel}: external link outside pinned v1.2.0 baseline: ${target}`);
			}
			continue;
		}
		const [pathPart, fragment] = target.split("#", 2);
		const resolved = resolve(dirname(path), pathPart);
		let targetStat;
		try {
			targetStat = statSync(resolved);
		} catch {
			errors.push(`${rel}: relative link target does not exist: ${target}`);
			continue;
		}
		if (!targetStat.isFile()) {
			errors.push(`${rel}: relative link target is not a file: ${target}`);
			continue;
		}
		if (fragment !== undefined && resolved.endsWith(".md")) {
			const slugs = headingSlugs(STRICT_DECODER.decode(readFileSync(resolved)));
			if (!slugs.has(fragment)) errors.push(`${rel}: anchor #${fragment} not found in ${relative(CORPUS_ROOT, resolved)}`);
		}
	}
}

export function verifyCorpus(root = CORPUS_ROOT) {
	const errors = [];
	for (const dir of listDirs(root)) {
		try {
			if (!statSync(join(dir, "README.md")).isFile()) {
				errors.push(`${relative(root, dir) || "."}: README.md is not a regular file`);
			}
		} catch {
			errors.push(`${relative(root, dir) || "."}: directory has no README.md`);
		}
	}
	const files = listFiles(root);
	for (const file of files) {
		checkFile(file, errors);
	}
	const referenced = new Set();
	for (const file of files) {
		if (!file.endsWith(".md")) continue;
		const text = stripCodeFences(readFileSync(file, "utf8"));
		for (const match of text.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)) {
			referenced.add(resolve(dirname(file), match[1]));
		}
	}
	for (const file of files) {
		if (file.endsWith(".svg") && !referenced.has(file)) {
			errors.push(`${relative(root, file)}: figure is not referenced by any Markdown page`);
		}
	}
	return { ok: errors.length === 0, errors };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const { ok, errors } = verifyCorpus();
	if (!ok) {
		console.error(`Corpus verification failed with ${errors.length} error(s):`);
		for (const error of errors) console.error(`  ${error}`);
		process.exit(1);
	}
	console.log(`Corpus structure verified: ${listFiles(CORPUS_ROOT).length} files, all rules pass.`);
}
