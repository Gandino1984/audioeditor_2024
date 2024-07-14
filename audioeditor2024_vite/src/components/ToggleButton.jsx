import React from 'react';

const ToggleButton = () => {
	return (
		<>
			<label className='switch'>
				<input type='checkbox' id='togBtn' />
				<div className='toggle round'>
					<span className='on'>Customer</span>
					<span className='off'>Agent</span>
				</div>
			</label>
		</>
	);
};

export default ToggleButton;