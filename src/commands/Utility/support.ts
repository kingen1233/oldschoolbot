import { CommandStore, KlasaMessage } from 'klasa';

import { BotCommand } from '../../lib/structures/BotCommand';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Shows the support link for the bot.',
			examples: ['+support'],
			categoryFlags: ['utility']
		});
	}

	async run(msg: KlasaMessage) {
		return msg.channel.send('Support Server: http://support.oldschool.gg');
	}
}
