#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import { pathToFileURL } from "node:url";
import { Command } from "commander";
import type { $ZodType } from "zod/v4/core";
import { generate } from "./codegen/generator";

const program = new Command();

program
  .name("phantom-zone")
  .description("Generate React forms from Zod schemas")
  .version("0.0.1");

program
  .command("generate <schema-path>")
  .description("Generate a form component from a Zod schema")
  .option("-o, --output <path>", "Output file path")
  .option("-n, --name <name>", "Form component name")
  .option("-s, --schema <name>", "Exported schema name", "schema")
  .option("--ui <path>", "UI import path", "@/components/ui")
  .action(async (schemaPath: string, options: GenerateCommandOptions) => {
    try {
      await runGenerate(schemaPath, options);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Error: ${message}`);
      process.exit(1);
    }
  });

program.parse();

interface GenerateCommandOptions {
  output?: string;
  name?: string;
  schema: string;
  ui: string;
}

async function runGenerate(
  schemaPath: string,
  options: GenerateCommandOptions,
): Promise<void> {
  const absoluteSchemaPath = path.resolve(schemaPath);

  if (!fs.existsSync(absoluteSchemaPath)) {
    throw new Error(`Schema file not found: ${absoluteSchemaPath}`);
  }

  const schemaUrl = pathToFileURL(absoluteSchemaPath).href;

  let schemaModule: Record<string, unknown>;
  try {
    schemaModule = await import(schemaUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Failed to load schema file "${absoluteSchemaPath}": ${message}`,
    );
  }

  const schemaExportName = options.schema;
  let schema: unknown = schemaModule[schemaExportName];
  if (!schema && schemaExportName === "schema") {
    schema = schemaModule.default;
  }

  if (!schema) {
    const available = Object.keys(schemaModule)
      .filter((k) => k !== "__esModule")
      .join(", ");
    throw new Error(
      `Export "${schemaExportName}" not found in ${schemaPath}. Available exports: ${available}`,
    );
  }

  if (!schema || typeof schema !== "object" || !("_zod" in schema)) {
    throw new Error(
      `Export "${schemaExportName}" is not a Zod schema. Ensure you are using zod >= 4.0.0`,
    );
  }

  const outputPath = options.output ?? deriveOutputPath(schemaPath);
  const absoluteOutputPath = path.resolve(outputPath);
  const formName = options.name ?? deriveFormName(schemaExportName);
  const schemaImportPath = calculateImportPath(
    absoluteOutputPath,
    absoluteSchemaPath,
  );

  const result = generate({
    schema: schema as $ZodType,
    formName,
    schemaImportPath,
    schemaExportName,
    uiImportPath: options.ui,
  });

  const outputDir = path.dirname(absoluteOutputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(absoluteOutputPath, result.code, "utf-8");

  console.log(`Generated ${absoluteOutputPath}`);
  console.log(`  ${result.fields.length} fields: ${result.fields.join(", ")}`);

  if (result.warnings.length > 0) {
    console.log("\nWarnings:");
    for (const warning of result.warnings) {
      console.log(`  ${warning}`);
    }
  }
}

function deriveOutputPath(schemaPath: string): string {
  const dir = path.dirname(schemaPath);
  const base = path.basename(schemaPath, path.extname(schemaPath));

  // Replace -schema or Schema suffix with -form
  const formBase = base.replace(/-schema$/i, "").replace(/schema$/i, "");

  const finalBase = formBase || base;
  return path.join(dir, `${finalBase}-form.tsx`);
}

function deriveFormName(schemaExportName: string): string {
  const base = schemaExportName
    .replace(/Schema$/i, "")
    .replace(/^./, (s) => s.toUpperCase());

  const finalBase = base || "Generated";
  return `${finalBase}Form`;
}

function calculateImportPath(outputPath: string, schemaPath: string): string {
  const outputDir = path.dirname(outputPath);
  let relativePath = path.relative(outputDir, schemaPath);
  relativePath = relativePath.replace(/\.(ts|tsx)$/, "");
  if (!relativePath.startsWith(".") && !relativePath.startsWith("/")) {
    relativePath = `./${relativePath}`;
  }
  return relativePath;
}
