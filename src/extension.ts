import * as vscode from 'vscode';
import { PathDefinitionProvider } from './path-definition-provider';
import { attachConfigReloader } from './config';

export function activate(context: vscode.ExtensionContext) {
	attachConfigReloader(context);

	context.subscriptions.push(
		vscode.languages.registerDefinitionProvider(
			{ language: "*", scheme: "file" },
			new PathDefinitionProvider()
		)
	);
}

export function deactivate() {}
