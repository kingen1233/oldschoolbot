import { Monsters } from 'oldschooljs';

import { Time } from '../../../../constants';
import { bosses } from '../../../../data/collectionLog';
import { SkillsEnum } from '../../../../skilling/types';
import itemID from '../../../../util/itemID';
import resolveItems, { deepResolveItems } from '../../../../util/resolveItems';
import { KillableMonster } from '../../../types';

const killableBosses: KillableMonster[] = [
	{
		id: Monsters.GeneralGraardor.id,
		name: Monsters.GeneralGraardor.name,
		aliases: Monsters.GeneralGraardor.aliases,
		timeToFinish: Time.Minute * 5.1,
		table: Monsters.GeneralGraardor,
		emoji: '<:Pet_general_graardor:324127377376673792>',
		wildy: false,
		canBeKilled: true,
		difficultyRating: 7,
		notifyDrops: resolveItems(['Pet general graardor']),
		qpRequired: 75,
		itemInBankBoosts: [
			{
				[itemID('Dragon warhammer')]: 10,
				[itemID('Bandos godsword')]: 5
			}
		],
		groupKillable: true,
		respawnTime: Time.Minute * 1.5,
		levelRequirements: {
			prayer: 43
		},
		uniques: [...resolveItems(['Rune sword']), ...bosses.Bandos, ...bosses.Shards],
		defaultAttackStyles: [SkillsEnum.Attack],
		customMonsterHP: 656,
		combatXpMultiplier: 1.126
	},
	{
		id: Monsters.CommanderZilyana.id,
		name: Monsters.CommanderZilyana.name,
		aliases: Monsters.CommanderZilyana.aliases,
		timeToFinish: Time.Minute * 5.1,
		table: Monsters.CommanderZilyana,
		emoji: '<:Pet_zilyana:324127378248957952>',
		wildy: false,
		canBeKilled: true,
		difficultyRating: 7,
		notifyDrops: resolveItems(['Pet zilyana']),
		qpRequired: 75,
		itemInBankBoosts: [
			{
				[itemID('Ranger boots')]: 3,
				[itemID('Pegasian boots')]: 5
			},
			{
				[itemID('Armadyl crossbow')]: 5,
				[itemID('Twisted bow')]: 10
			}
		],
		groupKillable: true,
		respawnTime: Time.Minute * 1.5,
		levelRequirements: {
			prayer: 43,
			agility: 70
		},
		uniques: [...bosses.Saradomin, ...bosses.Shards],
		itemsRequired: deepResolveItems([
			["Karil's leathertop", 'Armadyl chestplate'],
			["Karil's leatherskirt", 'Armadyl chainskirt']
		]),
		defaultAttackStyles: [SkillsEnum.Ranged],
		customMonsterHP: 723,
		combatXpMultiplier: 1.132
	},
	{
		id: Monsters.Kreearra.id,
		name: Monsters.Kreearra.name,
		aliases: Monsters.Kreearra.aliases,
		timeToFinish: Time.Minute * 5.1,
		table: Monsters.Kreearra,
		emoji: '<:Pet_kreearra:324127377305239555>',
		wildy: false,
		canBeKilled: true,
		difficultyRating: 7,
		notifyDrops: resolveItems(["Pet kree'arra"]),
		qpRequired: 75,
		itemInBankBoosts: [
			{
				[itemID('Armadyl crossbow')]: 5,
				[itemID('Twisted bow')]: 10
			}
		],
		groupKillable: true,
		respawnTime: Time.Minute * 1.5,
		levelRequirements: {
			prayer: 43
		},
		uniques: [...bosses.Arma, ...bosses.Shards],
		itemsRequired: deepResolveItems([
			["Karil's leathertop", 'Armadyl chestplate'],
			["Karil's leatherskirt", 'Armadyl chainskirt']
		]),
		defaultAttackStyles: [SkillsEnum.Ranged],
		disallowedAttackStyles: [SkillsEnum.Attack, SkillsEnum.Strength, SkillsEnum.Magic],
		customMonsterHP: 641,
		combatXpMultiplier: 1.159
	},
	{
		id: Monsters.KrilTsutsaroth.id,
		name: Monsters.KrilTsutsaroth.name,
		aliases: Monsters.KrilTsutsaroth.aliases,
		timeToFinish: Time.Minute * 5.1,
		table: Monsters.KrilTsutsaroth,
		emoji: '<:Pet_kril_tsutsaroth:324127377527406594>',
		wildy: false,
		canBeKilled: true,
		difficultyRating: 7,
		notifyDrops: resolveItems(["Pet k'ril tsutsaroth"]),
		qpRequired: 75,
		itemInBankBoosts: [
			{
				[itemID('Dragon warhammer')]: 10,
				[itemID('Bandos godsword')]: 5,
				[itemID('Dragon claws')]: 3
			}
		],
		groupKillable: true,
		respawnTime: Time.Minute * 1.5,
		levelRequirements: {
			prayer: 43
		},
		uniques: [...bosses.Zammy, ...bosses.Shards],
		itemsRequired: deepResolveItems([
			["Karil's leathertop", 'Armadyl chestplate'],
			["Karil's leatherskirt", 'Armadyl chainskirt']
		]),
		defaultAttackStyles: [SkillsEnum.Attack],
		customMonsterHP: 708,
		combatXpMultiplier: 1.135
	}
];

export default killableBosses;
