import UploadOctet from '../UploadOctet';

const update = async (database, user, image) => {
	if (!ArrayBuffer.isView(image)) throw new Error('name must be of type string');

	let id = await UploadOctet.upload(user, image);

	user.object('profile').image = id;

	return id;
}

const Image = ({database}) => ({packetHandler: async (name, {connection}) => await update(database, connection.user, name)});
Image.update = update;

export default Image;
