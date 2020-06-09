import UUID from '/common/libs/UUIDGenerator'
import User from '/backend/util/dbr/User'
import mailer from '/backend/util/email/Mailer'

export default ({database, server, opts}) => {
	let data = [];

	let packetHandler = async ({email}, {connection}) => {
		if (typeof email !== 'string') throw new Error("email must be of type string");

		let entry = {
			email,
			id: UUID().substring(1)
		};

		data.push(entry);

		let url = opts.SSLForward + '/reset/' + entry.id;

		mailer(email, 'Cozii Password Reset', `
			<div style="width: 100%; height: 50; font-size: 20; padding-bottom: 10px;">
				<div style="width: calc(100% - 20px); height: 50; font-size: 20; text-align: center; margin: auto; box-shadow: 3px 3px 15px 0px rgba(50, 50, 50, 0.68);">
					Cozii Password Reset
				</div>
			</div>
			Somebody requested to change your password for your Cozii account. If you did not request this, you can
			safely ignore this email.
			<br>
			<a href="${url}">Reset your password</a>
		`);
	}

	server.get('/reset/*', async (req, res, next) => {
		let id = decodeURIComponent(req.url.substring('/reset/'.length));

		let index = data.findIndex(e => e.id === id);

		if (index >= 0){
			let entry = data.splice(index, 1)[0];
			
			let session = User.createSession();
			let user = await User.byEmail(database, entry.email);

			session.active = false;
			session.mode = 'passReset';
			user.sessions.push(session);

			await user.flush();

			res.set('Set-Cookie', 'sessionId=' + session.id + ';path=/;expires=' + session.expires.toUTCString());
		}

		res.set("Location", '/');
		res.status(301);
		res.end();
	})

	return {openPacketHandler: packetHandler};
}
