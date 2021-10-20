import { CommandStore, KlasaMessage } from 'klasa';
import { Util } from 'oldschooljs';

import { PerkTier } from '../../lib/constants';
import { BotCommand } from '../../lib/structures/BotCommand';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['estats'],
			perkTier: PerkTier.Two,
			cooldown: 10,
			oneAtTime: true,
			description: 'Shows some statistics about the bot economy.',
			examples: ['+estats'],
			categoryFlags: ['patron', 'minion']
		});
	}

	async run(msg: KlasaMessage) {
		const { dicingBank, duelTaxBank, dailiesAmount, itemSellTaxBank } = (
			this.client.settings.get('economyStats') as any
		).toJSON();

		return msg.channel.send(`**Economy Stats:**
Dicing GP removed (Net amount): ${Util.toKMB(dicingBank * 1_000_000)}
Duel Taxes GP removed: ${Util.toKMB(duelTaxBank * 1_000_000)}
Dailies GP added: ${Util.toKMB(dailiesAmount * 1_000_000)}
Item Sell Tax GP removed (20% tax): ${Util.toKMB(itemSellTaxBank * 1_000_000)}    
`);
	}
}
