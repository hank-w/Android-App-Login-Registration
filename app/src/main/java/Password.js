import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12;

const includesChars = (str, chars) => {
	for (let i = 0; i < chars.length; i++){
		if (str.indexOf(chars.charAt(i)) >= 0){
			return true;
		}
	}

	return false;
}

const includesUppercase = (str) => {
	for (let i = 0; i < str.length; i++){
		if (str.charAt(i).toUpperCase() === str.charAt(i) && str.charAt(i).toUpperCase() !== str.charAt(i).toLowerCase()){
			return true;
		}
	}

	return false;
}

const update = async (database, user, password) => {
	if (typeof password !== 'string') throw new Error('password must be of type string');

	if (password.length < 8) throw new Error('The password must be at least 8 characters long');
	if (password.length > 72) throw new Error('The password must be shorter than 73 characters long');
	if (!includesUppercase(password)) throw new Error('The password must have at least one uppercase character');
	if (!includesChars(password, '0123456789')) throw new Error('The password must have at least one numeric character');

	let hash = await bcrypt.hash(password, SALT_ROUNDS);

	user.object('profile').password = hash;
	user.sessions = user.untracked('sessions').filter(e => e.active);
}

const Password = ({database}) => ({packetHandler: async (password, {connection}) => {
	let session = connection.user.sessions.find(e => e.id === connection.sessionId);

	if (session.mode === 'passReset' || connection.lastAuth()){
		await update (database, connection.user, password);

		session.mode = null;
	}
}});
Password.update = update;

export default Password;
