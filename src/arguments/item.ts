import { Argument } from 'klasa';
import { Items } from 'oldschooljs';
import { Item } from 'oldschooljs/dist/meta/types';
import { itemNameMap } from 'oldschooljs/dist/structures/Items';

import { cleanString, stringMatches } from '../lib/util';
import getOSItem from '../lib/util/getOSItem';

export default class extends Argument {
	async run(itemName = ''): Promise<Item[]> {
		if (typeof itemName === 'number') {
			let items: Item[] = [];
			const item = getOSItem(itemName);
			if (item) items.push(item);
			return items;
		}

		itemName = itemName.trim();
		if (!itemName) return [];

		// guarantee all characters are numbers
		const parsed = Number(itemName);
		if (!isNaN(parsed)) {
			return [getOSItem(parsed)];
		}
		const osItems = Items.filter(
			i => itemNameMap.get(cleanString(itemName)) === i.id || stringMatches(i.name, itemName)
		).array() as Item[];
		if (!osItems.length) throw "That item doesn't exist.";
		return osItems;
	}
}
