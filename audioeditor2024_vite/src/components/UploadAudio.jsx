import React, { useState, useEffect, useRef, useContext } from 'react';
import { FileContext } from '../contexts/fileContext';
import { useNavigate } from 'react-router-dom';

import './UploadAudio.css';

export const UploadAudio = () => {
    const inputFile = useRef(null);
    const { setFileURL } = useContext(FileContext);
    const [file, setFile] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            console.log('File URL created:', url);
            setFileURL(url);
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
        const uploadedFile = e.target.files[0];
        if (uploadedFile) {
            console.log('File selected:', uploadedFile.name);
            setFile(uploadedFile);
        }
    };

    return (
        <div className='upload-audio'>
          
            <h1>Upload your audio file: </h1>
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