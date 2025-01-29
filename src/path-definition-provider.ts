import {
    CancellationToken,
    Definition,
    DefinitionProvider,
    LocationLink,
    Position,
    ProviderResult,
    TextDocument
} from "vscode";    

import * as vscode from "vscode";
import { knownLanguageProps } from "./known-languages";
import { config } from "./config";

import * as fs from "fs";
import * as fsp from "fs/promises";
import * as path from "path";

interface StringRange {
    start: number;
    end: number;
}

function getStringsOnLine(line: string, quotes: string[], escapes: boolean) {
    if (quotes.length === 0) {
        return [];
    }

    let strings: StringRange[] = [];

    let seekingEnd = false;
    let current = -1;
    let startKind = "?";

    for (let i = 0; i < line.length; i++) {
        if (!seekingEnd) {
            if (!quotes.includes(line[i])) {
                continue;
            }

            // This is an opening quote.
            current = i;
            startKind = line[i];
            seekingEnd = true;
        } else {
            if (line[i] !== startKind) {
                continue; // Only match two of the same kind of quotes.
            }

            // This *might* be a closing quote.
            if (escapes && checkForEscape(line, i)) {
                continue; // The quote is escaped - don't count it.
            }

            strings.push({ start: current + 1, end: i });
            seekingEnd = false;
        }
    }

    return strings;
}

/**
 * Given a position in the middle of a potential string, checks if the character at
 * the given position has been escaped by a `\` character.
 */
function checkForEscape(text: string, i: number) {
    let escapes = 0;

    while (--i >= 0) {
        if (text[i] === "\\") {
            escapes++;
        } else {
            break;
        }
    }

    return escapes % 2 === 1;
}

async function getNavigationResult(fullPath: string, defaultFile: string | null) {
    if (!fs.existsSync(fullPath)) {
        return null;
    }

    const stat = await fsp.lstat(fullPath);
    if (stat.isDirectory()) {
        if (!defaultFile) {
            return null;
        }

        fullPath = path.join(fullPath, defaultFile);
        if (!fs.existsSync(fullPath)) {
            return null;
        }
    }

    const doc = await vscode.workspace.openTextDocument(fullPath);
    return [new vscode.Location(doc.uri, new Position(0, 0))];
}

export class PathDefinitionProvider implements DefinitionProvider {
    provideDefinition(document: TextDocument, position: Position, _token: CancellationToken): ProviderResult<Definition | LocationLink[]> {
        return this.provideDefinitionAsync(document, position);
    }

    async provideDefinitionAsync(document: TextDocument, position: Position) {
        if (
            config().langWhitelist.length !== 0 &&
            !config().langWhitelist.includes(document.languageId)
        ) {
            return [];
        }

        if (
            config().filenameWhitelist.length !== 0 &&
            !config().filenameWhitelist.some(x => x.test(document.fileName))
        ) {
            return [];
        }

        const line = document.lineAt(position).text;

        const props = knownLanguageProps[document.languageId] ??
            {
                // Safe defaults for unknown languages
                escapes: true,
                quotes: ["'", '"']
            };

        let defaultFile: string | null = null;
        let relativeRegex: RegExp | null = null;
        let projectRootRegex: RegExp | null = null;
        let pathStringRegex: RegExp | null = null;
        let projectRoot = vscode.workspace.workspaceFolders?.[0].uri?.fsPath;

        for (const entry of config().specific) {
            let matches = false;
            if (entry.language === document.languageId) {
                matches = true;
            }

            if (!matches && entry.path && entry.path.test(document.fileName)) {
                matches = true;
            }

            if (!matches) {
                continue;
            }

            defaultFile = entry.defaultFile;

            if (entry.relativeRegex) { relativeRegex = entry.relativeRegex; }
            if (entry.projectRootRegex) { projectRootRegex = entry.projectRootRegex; }
            if (entry.pathStringRegex) { pathStringRegex = entry.pathStringRegex; }

            if (entry.assumedProjectRoot) {
                projectRoot = !path.isAbsolute(entry.assumedProjectRoot) 
                    ? path.join(projectRoot ?? "", entry.assumedProjectRoot)
                    : entry.assumedProjectRoot;
            }

            break;
        }

        if (!projectRootRegex) {
            projectRootRegex = config().projectRootRegex;
        }

        if (!relativeRegex) {
            relativeRegex = config().relativeRegex;
        }

        const allStrings = getStringsOnLine(line, props.quotes, props.escapes);
        if (pathStringRegex) {
            allStrings.push(
                ...Array.from(line.matchAll(new RegExp(pathStringRegex.source, "g")))
                    .map(x => x[x.length - 1])
                    .map(x => ({
                        start: line.indexOf(x),
                        end: line.indexOf(x) + x.length
                    }))
            );
        }

        let targetStr: string | null = null;

        for (const str of allStrings) {
            if (str.start <= position.character && str.end >= position.character) {
                targetStr = line.substring(str.start, str.end);
                break;
            }
        }

        if (targetStr === null) {
            return []; // No string found at the position of the cursor.
        }

        if (relativeRegex?.test(targetStr)) {
            let fullPath = path.join(path.dirname(document.fileName), targetStr);

            const result = await getNavigationResult(fullPath, defaultFile);
            if (result) {
                return result;
            }
        }

        if (projectRootRegex?.test(targetStr)) {
            if (!projectRoot) {
                return [];
            }

            let fullPath = path.join(projectRoot, targetStr);

            const result = await getNavigationResult(fullPath, defaultFile);
            if (result) {
                return result;
            }
        }

        return [];
    }
}
