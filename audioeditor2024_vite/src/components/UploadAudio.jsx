import React, { useState, useEffect, useRef, useContext } from 'react';
import { FileContext } from '../contexts/fileContext';
import { useNavigate } from 'react-router-dom';

export const UploadAudio = () => {
	
  const inputFile = useRef(null);
  const { setFileURL } = useContext(FileContext);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (file) {
      setFileURL(file);
      navigate('/edit');
    }
    return () => {
      if (file) {
        URL.revokeObjectURL(file);
      } 
    };
  }, [file, setFileURL, navigate]);

  const handleButtonClick = () => {
    inputFile.current.click();
  };

  const handleFileUpload = (e) => {
	const file = e.target.files[0];
	if (file) {
	  const url = URL.createObjectURL(file);
	  setFileURL(url);
	  navigate('/edit');
	}
  };

  return (
    <div className='upload-audio'>
      <i style={{ color: '#531A65' }} className='material-icons audio-icon'>
        library_music
      </i>
      <h1>Upload your audio file here</h1>
      <button className='upload-btn' onClick={handleButtonClick}>
        Upload
      </button>
      <input
        type='file'
        id='file'
        ref={inputFile}
        style={{ display: 'none' }}
        accept='audio/*'
        onChange={handleFileUpload}
      />
    </div>
  );
};

export default UploadAudio;
