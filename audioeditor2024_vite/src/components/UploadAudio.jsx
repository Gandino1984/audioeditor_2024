import React, { useRef, useContext, useState } from 'react';
import { FileContext } from '../contexts/fileContext';
import { useNavigate } from 'react-router-dom';
import './UploadAudio.css';

export const UploadAudio = () => {
  const inputFile = useRef(null);
  const { setFile } = useContext(FileContext);
  const [fileError, setFileError] = useState('');
  const navigate = useNavigate();

  const handleButtonClick = () => {
    inputFile.current.click();
  };

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
        const fileExtension = uploadedFile.name.split('.').pop().toLowerCase();
        if (!['mp3', 'wav', 'ogg'].includes(fileExtension)) {
            setFileError('Unsupported file format. Please upload an MP3, WAV, or OGG file.');
        } else {
            setFileError('');
            console.log('File selected:', uploadedFile.name);
            setFile(uploadedFile);  // This should update both URL and name in the context
            navigate('/edit');
        }
    }
};

  return (
    <div className='upload-audio'>
      <h1>Upload your audio file:</h1>
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
      {fileError && <p className='error-message'><ion-icon name="warning-outline"></ion-icon> {fileError}</p>}
    </div>
  );
};

export default UploadAudio;