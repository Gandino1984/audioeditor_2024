import React from 'react';
import UploadAudio from '../UploadAudio.jsx';

const HomePage = ({ history }) => {
	return (
		<div>
			<UploadAudio history={history} />
		</div>
	);
};

export default HomePage;
