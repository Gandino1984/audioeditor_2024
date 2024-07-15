import React from 'react';
import AudioWaveform from '../AudioWaveform';

const EditPage = () => {
	return (
		<div>
			<h1 style={{ textAlign: 'center', margin: '1em 0' }}>
				Single track edit
			</h1>
			<AudioWaveform />
		</div>
	);
};

export default EditPage;
