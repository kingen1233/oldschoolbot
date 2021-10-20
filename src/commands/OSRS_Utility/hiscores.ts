import { CommandStore, KlasaMessage } from 'klasa';

import { BotCommand } from '../../lib/structures/BotCommand';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Shows the link for the official OSRS hiscores.',
			aliases: ['hs'],
			examples: ['+hs']
		});
	}

	async run(msg: KlasaMessage) {
		return msg.channel.send('https://secure.runescape.com/m=hiscore_oldschool/overall.ws');
	}
}
