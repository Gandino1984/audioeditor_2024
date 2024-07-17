import React, { createContext, useState } from 'react';

const FileContext = createContext();

const FileContextProvider = ({ children }) => {
  const [fileURL, setFileURL] = useState('');
  const [fileName, setFileName] = useState('');

  const setFile = (file) => {
    if (file) {
      setFileURL(URL.createObjectURL(file));
      setFileName(file.name);
    } else {
      setFileURL('');
      setFileName('');
    }
  };

  return (
    <FileContext.Provider value={{ fileURL, fileName, setFile }}>
      {children}
    </FileContext.Provider>
  );
};

export { FileContext, FileContextProvider };