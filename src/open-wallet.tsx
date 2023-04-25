import { openExtensionPreferences, ActionPanel, Action, Grid, Icon } from "@raycast/api";
import { usePromise } from "@raycast/utils";

import { ReactNode } from "react";

import { walletPath, fetchFiles } from "./utils";
import { Card, Pocket } from "./types";

export default function Command() {
	const { isLoading, data } = usePromise(loadGridComponents);

	return (
		<Grid
			columns={5}
			isLoading={isLoading}
			inset={Grid.Inset.Large}
			navigationTitle="Image Wallet"
			searchBarPlaceholder="Search Cards..."
			searchBarAccessory={data?.dropdownNodes}
			actions={
				<ActionPanel>
					{ loadEditActionNodes() }
				</ActionPanel>
			  }
		>
			{ data?.pocketNodes }
		</Grid>
	);
}

async function loadGridComponents() { return(
	fetchFiles(walletPath).then(pockets => {
		const dropdownNodes = loadGridDropdownNodes(pockets)
		const pocketNodes:ReactNode[] = []
		
		pockets.forEach((pocket) => {
			pocketNodes.push(loadPocketNodes(pocket));
		})

		return { pocketNodes, dropdownNodes }
	})
)}

function loadGridDropdownNodes(pockets: Pocket[]) { console.log(pockets); return (
	<Grid.Dropdown tooltip="Pocket">
		<Grid.Dropdown.Item
			title="All Cards"
			value="All Cards"
		/>
		<Grid.Dropdown.Section title="Pockets">
			{pockets.filter(pocket => (pocket.name))
				.map(pocket => (
					<Grid.Dropdown.Item
						title={pocket.name || "Unsorted"}
						value={pocket.name || "Unsorted"}
					/>
				))
			}
		</Grid.Dropdown.Section>
	</Grid.Dropdown>
)}

function loadPocketNodes(pocket:Pocket) { return(
	<Grid.Section title={pocket.name} key={pocket.name || "unsorted"}>
		{pocket.cards.map(card => (
			<Grid.Item
				key={card.path}
				content={card.path}
				title={card.name}
				actions={loadCardActionNodes(card)}
			/>
		))}
	</Grid.Section>
)}

function loadCardActionNodes(item: Card) { return (
	<ActionPanel>
		<ActionPanel.Section>
			<Action.Paste content={{ file: item.path }} />
			<Action.CopyToClipboard content={{ file: item.path }} />
		</ActionPanel.Section>
		{loadEditActionNodes()}
	</ActionPanel>
)}

function loadEditActionNodes() { return (
	<ActionPanel.Section>
		<Action.ShowInFinder
			title="Open Wallet in Finder"
			shortcut={{ modifiers: ["cmd"], key: "e" }}
			path={walletPath}
		/>
		<Action
			title="Change Wallet Directory"
			icon={Icon.Folder}
			shortcut={{ modifiers: ["cmd", "shift"], key: "e" }}
			onAction={openExtensionPreferences}
		/>
	</ActionPanel.Section>
)}