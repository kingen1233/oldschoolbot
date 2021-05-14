import { Util } from 'discord.js';
import { Gateway, KlasaClient, Settings } from 'klasa';
import { getConnection } from 'typeorm';

import { client } from '../..';
import { MinigameKey, Minigames } from '../../extendables/User/Minigame';
import { Emoji } from '../constants';
import { MinigameTable } from '../typeorm/MinigameTable.entity';
import { NewUserTable } from '../typeorm/NewUserTable.entity';

export async function getUserSettings(userID: string): Promise<Settings> {
	return (client.gateways.get('users') as Gateway)!
		.acquire({
			id: userID
		})
		.sync(true);
}

export async function getNewUser(id: string): Promise<NewUserTable> {
	let value = await NewUserTable.findOne({ id });
	if (!value) {
		value = new NewUserTable();
		value.id = id;
		await value.save();
	}
	return value;
}

export async function syncNewUserUsername(id: string, username: string) {
	let value = await NewUserTable.findOne({ id });
	if (!value) {
		value = new NewUserTable();
		value.id = id;
		value.username = username;
		value.save();
		return;
	}
	value.username = username;
	value.save();
}

export async function batchSyncNewUserUsernames(client: KlasaClient) {
	await getConnection()
		.createQueryBuilder()
		.insert()
		.into(NewUserTable)
		.values(
			client.users.filter(u => u.hasMinion).map(u => ({ id: u.id, username: u.username }))
		)
		.orUpdate({
			conflict_target: ['id'],
			overwrite: ['username']
		})
		.execute();
}

export async function getMinigameEntity(userID: string): Promise<MinigameTable> {
	let value = await MinigameTable.findOne({ userID });
	if (!value) {
		value = new MinigameTable();
		value.userID = userID;
		await value.save();
	}
	return value;
}

export async function incrementMinigameScore(
	userID: string,
	minigame: MinigameKey,
	amountToAdd = 1
) {
	const game = Minigames.find(m => m.key === minigame)!;
	await getConnection()
		.createQueryBuilder()
		.update(MinigameTable)
		.set({ [minigame]: () => `${game.column} + ${amountToAdd}` })
		.where('userID = :userID', { userID })
		.execute();
}

export async function getMinionName(userID: string): Promise<string> {
	const result = await client.query<{ name?: string; isIronman: boolean; icon?: string }[]>(
		`SELECT "minion.name" as name, "minion.ironman" as isIronman, "minion.icon" as icon FROM users WHERE id = $1;`,
		[userID]
	);
	if (result.length === 0) {
		throw new Error(`No user found in database for minion name.`);
	}

	const [{ name, isIronman, icon }] = result;

	const prefix = isIronman ? Emoji.Ironman : '';

	const displayIcon = icon ?? Emoji.Minion;

	return name
		? `${prefix} ${displayIcon} **${Util.escapeMarkdown(name)}**`
		: `${prefix} ${displayIcon} Your minion`;
}
