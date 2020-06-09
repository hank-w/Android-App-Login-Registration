import User from '../../util/dbr/User';
import Email from './update/Email';
import Password from './update/Password';
import Username from './update/Username';
import Image from './update/Image';
import Get from './Get';
import mailer from '/backend/util/email/Mailer';
import UUID from '/common/libs/UUIDGenerator';

export default ({database, opts, server}) => {
	let packetHandler = async (msg, {connection}) => {
		if (connection.user && connection.user.type !== 'temp') throw new Error("already logged in");

		let user, sessionId;

		if (connection.user){
			user = connection.user;
			sessionId = connection.sessionId;
		}else{
			[user, sessionId] = await User.createTemporary(database);
		}
		
		user.type = 'account';
		user.role = 'free';

		try {
			await Email.update(database, user, msg.email);
			await Username.update(database, user, msg.name);
			await Password.update(database, user, msg.password);
			if (msg.image) await Image.update(database, user, msg.image);

			connection.user = user;
			connection.sessionId = sessionId;
		}catch (e){
			user._id = null;

			throw e;
		}
		// send email to Yemi about user info: cozii.mobile@gmail.com
		if (process.env.NODE_ENV === 'production') mailer ('cozii.mobile@gmail.com', 'New User Signup', `
			🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉
			<br>A new User has signed up!
			<br>They signed up on ${opts.SSLForward}
			<br>${mailer.escape(JSON.stringify({...msg, password: null, uuid: user.uuid}, null, 4))}
		`);
		
		// sent email to user for email confirmation
		let id = UUID().substring(1)
		let url = opts.SSLForward + '/confirm/' + id;


		mailer (msg.email, 'Email Verification', `
			🎉🎉🎉🎉🎉🎉🎉🎉🎉🎉
			<br>Thank you for signing up for Cozii's mobile app!
			<br>you signed up with: ${msg.email} 
			<br><a href = "${url}">Please Verify your Email</a>
		`);
		
		user.confirmEmailID = {
			id,
			date: new Date()
		};

		return {
			sessionId,
			expires: +user.sessions.find(e => e.id === sessionId).expires,
			user: await Get.getAccount(database, user),
			sessionToken: connection.sessionToken
		};
	}

	// code that runs after link is clicked
	server.get('/confirm/*', async (req, res, next) => {
		
		let id = decodeURIComponent(req.url.substring('/confirm/'.length));
		let user = await User.byConfirmEmailID(database, id);
		
		if(user){
			if(Date.now() - +user.confirmEmailID.date < 1000*60*60*24 && user.confirmEmailID){
				user.confirmEmailID = null
				await user.flush();
				res.status(200);
				res.end("Your email has been successfully verified! =)");
			}else{
				//implement resend email confirmation
				res.status(200);
				res.end("Your email verification link has expiried, please resend one from your account, sorry for the inconvinience");
			
			}
		}else{
		    res.status(200);
			res.end("This email verification link is invalid or was never valid.");
		}
				
	})

	return {openPacketHandler: packetHandler};
}
