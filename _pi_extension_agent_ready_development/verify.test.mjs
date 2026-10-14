#!/usr/bin/env node
/**
 * Negative and positive tests for verify.mjs.
 *
 * Copies the corpus to a fresh temporary directory, then checks:
 * - the untouched copy passes;
 * - an out-of-baseline external link is rejected;
 * - a missing anchor in a relative link is rejected;
 * - a missing trailing newline is rejected;
 * - a directory without README.md is rejected.
 *
 * Runs against the copy only; the corpus itself is never modified.
 * Prints the temporary directory location at exit.
 */

import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import { verifyCorpus } from "./verify.mjs";

const here = fileURLToPath(new URL(".", import.meta.url));
const work = mkdtempSync(join(tmpdir(), "pi-corpus-verify-test-"));
const corpus = join(work, "corpus");
cpSync(here, corpus, { recursive: true });

function mutate(name, fn) {
	const dir = join(work, name);
	cpSync(corpus, dir, { recursive: true });
	fn(dir);
	return dir;
}

// 1. Untouched copy passes.
{
	const { ok, errors } = verifyCorpus(corpus);
	assert.ok(ok, `untouched copy should pass, got: ${errors.join("; ")}`);
}

// 2. External link outside the pinned baseline is rejected.
{
	const dir = mutate("out-of-baseline", (d) => {
		const file = join(d, "README.md");
		writeFileSync(file, `link to [nowhere](https://example.com/other)\n`);
	});
	const { errors } = verifyCorpus(dir);
	assert.ok(errors.some((e) => e.includes("pinned v1.2.0")), `expected pinned-link rejection, got: ${errors.join("; ")}`);
}

// 3. Missing anchor in a relative link is rejected.
{
	const dir = mutate("missing-anchor", (d) => {
		const file = join(d, "README.md");
		writeFileSync(file, `bad anchor to [terms](./extension-development-model/02-terms-and-mental-models.md#no-such-heading)\n`);
	});
	const { errors } = verifyCorpus(dir);
	assert.ok(errors.some((e) => e.includes("anchor #no-such-heading not found")), `expected anchor rejection, got: ${errors.join("; ")}`);
}

// 4. Missing trailing newline is rejected.
{
	const dir = mutate("no-newline", (d) => {
		const file = join(d, "README.md");
		writeFileSync(file, "no trailing newline");
	});
	const { errors } = verifyCorpus(dir);
	assert.ok(errors.some((e) => e.includes("missing trailing newline")), `expected newline rejection, got: ${errors.join("; ")}`);
}

// 5. Directory without README.md is rejected.
{
	const dir = mutate("no-readme", (d) => {
		rmSync(join(d, "_coverage", "README.md"));
	});
	const { errors } = verifyCorpus(dir);
	assert.ok(errors.some((e) => e.includes("_coverage: directory has no README.md")), `expected README rejection, got: ${errors.join("; ")}`);
}

// 6. SVG missing accessibility metadata is rejected.
{
	const dir = mutate("bad-svg", (d) => {
		const file = join(d, "extension-development-model", "figures", "completion-ladder.svg");
		writeFileSync(file, readFileSync(file, "utf8").replace('role="img"', ""));
	});
	const { errors } = verifyCorpus(dir);
	assert.ok(errors.some((e) => e.includes('missing role="img"')), `expected SVG metadata rejection, got: ${errors.join("; ")}`);
}

// 7. Unreferenced figure is rejected.
{
	const dir = mutate("orphan-figure", (d) => {
		writeFileSync(join(d, "extension-development-model", "figures", "orphan.svg"), "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"10\" height=\"10\" viewBox=\"0 0 10 10\" role=\"img\"><title>x</title><desc>x</desc></svg>\n");
	});
	const { errors } = verifyCorpus(dir);
	assert.ok(errors.some((e) => e.includes("orphan.svg: figure is not referenced")), `expected orphan-figure rejection, got: ${errors.join("; ")}`);
}

console.log("All verify.mjs acceptance and rejection tests pass.");
console.log(`Temporary copies retained at: ${work}`);
