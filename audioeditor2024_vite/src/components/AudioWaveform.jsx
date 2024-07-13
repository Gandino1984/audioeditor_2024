import React, { useEffect, useRef, useContext, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { FileContext } from '../contexts/fileContext';

const AudioWaveform = () => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const { fileURL } = useContext(FileContext);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let wavesurfer = null;

    const initWaveSurfer = async () => {
      if (fileURL && waveformRef.current) {
        try {
          wavesurfer = WaveSurfer.create({
            container: waveformRef.current,
            waveColor: '#ddd',
            progressColor: '#531A65',
            responsive: true
          });

          wavesurferRef.current = wavesurfer;

          wavesurfer.on('ready', () => {
            setIsLoaded(true);
          });

          wavesurfer.on('error', (err) => {
            console.error('WaveSurfer error:', err);
            // Handle specific errors here
          });

          await wavesurfer.load(fileURL);
        } catch (err) {
          console.error('Error initializing WaveSurfer:', err);
        }
      }
    };

    initWaveSurfer();

    return () => {
      if (wavesurfer) {
        wavesurfer.destroy();
      }
    };
  }, [fileURL]);

  return (
    <div className="audio-waveform">
      <div ref={waveformRef} />
      {!isLoaded && <p>Loading audio...</p>}
    </div>
  );
};

export default AudioWaveform;