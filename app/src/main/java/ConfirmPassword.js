import bcrypt from 'bcryptjs';

module.exports = ({database}) => {
	let packetHandler = async (password, {connection}) => {
		if (!password || typeof password !== 'string') throw new Error('pass');
		
		let user = connection.user;

		if (password.length > 36) throw new Error('The password must be shorter than 36 characters long')
		let through = !user.profile.password || await bcrypt.compare(password, user.profile.password);

		if (through){
			let time = Date.now();

			connection.lastAuth = () => Date.now() - time < 5000;
		}else{
			connection.lastAuth = null;
		}

		return through;
	};

	return {openPacketHandler: packetHandler};
}