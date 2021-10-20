import { uniqueArr } from 'e';
import { CommandStore, KlasaMessage } from 'klasa';

import { AttackStyles } from '../../lib/minions/functions';
import { SkillsEnum } from '../../lib/skilling/types';
import { BotCommand } from '../../lib/structures/BotCommand';
import { toTitleCase } from '../../lib/util';

const validStyles = [SkillsEnum.Attack, SkillsEnum.Strength, SkillsEnum.Defence, SkillsEnum.Ranged, SkillsEnum.Magic];

function isValidAttackStyle(str: string): str is AttackStyles {
	return (validStyles as string[]).includes(str);
}

const invalidCombinations: [AttackStyles, AttackStyles][] = [
	[SkillsEnum.Attack, SkillsEnum.Magic],
	[SkillsEnum.Strength, SkillsEnum.Magic],
	[SkillsEnum.Attack, SkillsEnum.Ranged],
	[SkillsEnum.Strength, SkillsEnum.Ranged]
];

export default class extends BotCommand {
	public constructor(store: CommandStore, file: string[], directory: string) {
		super(store, file, directory, {
			aliases: ['attackstyle'],
			description: 'Sets your attack style.',
			examples: ['+train defence, attack'],
			categoryFlags: ['minion'],
			usage: '[styles:...str]'
		});
	}

	async run(msg: KlasaMessage, [_styles]: [string]) {
		if (msg.author.minionIsBusy) {
			return msg.channel.send("You can't change your attack style in the middle of a trip.");
		}
		if (!_styles) {
			return msg.channel.send(
				`Your current attack style is ${msg.author
					.getAttackStyles()
					.map(toTitleCase)}, the available styles are: Shared, Attack, Strength, Defence, Magic, Ranged.`
			);
		}
		const parsed = _styles
			.toLowerCase()
			.split(' ')
			.map(i => i.trim());

		if (uniqueArr(parsed).length !== parsed.length || (_styles !== 'shared' && !parsed.every(isValidAttackStyle))) {
			return msg.channel.send(
				'That is not a valid attack style, the available styles are: Shared, Attack, Strength, Defence, Magic, Ranged.'
			);
		}
		const styles: AttackStyles[] =
			_styles === 'shared'
				? [SkillsEnum.Attack, SkillsEnum.Strength, SkillsEnum.Defence]
				: isValidAttackStyle(_styles)
				? [_styles]
				: parsed.filter(isValidAttackStyle);

		for (const comb of invalidCombinations) {
			if (comb.every(i => styles.includes(i))) {
				return msg.channel.send(
					`That's not a valid attack style, you can't train these at the same time: ${comb.join(', ')}.`
				);
			}
		}

		await msg.author.setAttackStyle(styles);

		return msg.channel.send(
			`You're now training: ${styles
				.map(toTitleCase)
				.join(', ')}. When you do PvM, you will receive XP in these skills.`
		);
	}
}
