
const update = async (database, user, name) => {
	if (typeof name !== 'string') throw new Error('name must be of type string');

	user.object('profile').name = name;
}

const Username = ({database}) => ({packetHandler: async (name, {connection}) => connection.lastAuth() && await update(database, connection.user, name)});
Username.update = update;

export default Username;
