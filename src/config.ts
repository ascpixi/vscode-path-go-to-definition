import * as vscode from 'vscode';

let configStore = parseConfigValues();

/**
 * Retrieves parsed configuration values. 
 */
export const config = () => configStore;

function tryParseRegex(str: string | undefined | null, kind: string) {
    if (!str) {
        return null;
    }

    try {
        return new RegExp(str);
    } catch (ex) {
        vscode.window.showErrorMessage(`Invalid ${kind} regex: ${ex}`);
        return null;
    }
};

function tryParseRegexes(regexes: string[] | undefined, kind: string) {
    if (regexes === undefined) {
        return [];
    }

    const result = [];

    for (const str of regexes) {
        try {
            result.push(new RegExp(str));
        } catch (ex) {
            vscode.window.showErrorMessage(`Invalid ${kind} regex: ${ex}`);
        }
    }

    return result;
};

function parseConfigValues() {
    const cfg = vscode.workspace.getConfiguration("pathGoToDefinition");

    const specific = cfg.get<{
        language: string | null,
        path: string | null,
        projectRootRegex: string | null,
        relativeRegex: string | null,
        pathStringRegex: string | null,
        defaultFile: string | null,
        assumedProjectRoot: string | null
    }[]>("specific");

    return {
        projectRootRegex: tryParseRegex(cfg.get<string>("projectRootRegex"), "project root"),
        relativeRegex: tryParseRegex(cfg.get<string>("relativeRegex"), "relative"),
        langWhitelist: cfg.get<string[]>("langWhitelist") ?? [],
        filenameWhitelist: tryParseRegexes(cfg.get<string[]>("filenameWhitelist"), "filename"),
        specific: specific?.map(x => ({
            language: x.language,
            path: tryParseRegex(x.path, "specific entry path"),
            projectRootRegex: tryParseRegex(x.projectRootRegex, "specific entry project root regex"),
            relativeRegex: tryParseRegex(x.relativeRegex, "specific entry relative"),
            pathStringRegex: tryParseRegex(x.pathStringRegex, "specific path string tokenizer"),
            defaultFile: x.defaultFile,
            assumedProjectRoot: x.assumedProjectRoot
        })) ?? []
    };
}

export function attachConfigReloader(context: vscode.ExtensionContext) {
    const configChangeDisposable = vscode.workspace.onDidChangeConfiguration(event => {
        if (!event.affectsConfiguration("pathGoToDefinition")) {
            return;
        }

        configStore = parseConfigValues();
    });

    context.subscriptions.push(configChangeDisposable);
}