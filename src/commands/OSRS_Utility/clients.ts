import { CommandStore, KlasaMessage } from 'klasa';

import { BotCommand } from '../../lib/structures/BotCommand';

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			description: 'Shows links to the official OSRS client and Runelite.',
			examples: ['+clients']
		});
	}

	async run(msg: KlasaMessage) {
		return msg.channel.send(`
<:OldSchoolRS:418691700068843521> **Official Client:** Fast, Stable, Light.
<http://www.runescape.com/oldschool/download>


<:RuneLite:418690749719117834> **RuneLite:** Open-source, has plugins. Free. **This is an unofficial client
and is *not* supported by Jagex. Use at your own risk.**
<https://runelite.net/>
`);
	}
}
