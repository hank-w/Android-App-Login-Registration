import User from '../../../util/dbr/User';

// email regexp from https://emailregex.com/
const EMAIL_REGEX = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

const update = async (database, user, email) => {
	if (typeof email !== 'string') throw new Error('email must be of type string');
	if (!email.match(EMAIL_REGEX)) throw new Error('The email provided is invalid');

	if (user.object('profile').email !== email){
		if (await User.byEmail(database, email)) {
			throw new Error("There is already an account by that email");
		}

		user.object('profile').email = email;
	}
}

const Email = ({database}) => ({packetHandler: async (email, {connection}) => connection.lastAuth() && await update(database, connection.user, email)});
Email.update = update;

export default Email;
