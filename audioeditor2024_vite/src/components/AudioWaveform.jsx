import React, { useState, useEffect, useContext, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import { FileContext } from '../contexts/fileContext';
import './AudioWaveform.css';

const AudioWaveform = () => {
    const wavesurferRef = useRef(null);
    const wavesurferObjRef = useRef(null);
    const timelineRef = useRef(null);
    const { fileURL } = useContext(FileContext);
    const [isReady, setIsReady] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        console.log("AudioWaveform mounted. fileURL:", fileURL);
        console.log("wavesurferRef.current:", wavesurferRef.current);
        console.log("timelineRef.current:", timelineRef.current);

        const createWaveSurfer = async () => {
            if (wavesurferRef.current && !wavesurferObjRef.current) {
                try {
                    wavesurferObjRef.current = WaveSurfer.create({
                        container: wavesurferRef.current,
                        waveColor: '#211027',
                        progressColor: '#69207F',
                        cursorColor: 'violet',
                        plugins: [
                            TimelinePlugin.create({
                                container: timelineRef.current,
                            }),
                            RegionsPlugin.create(),
                        ]
                    });

                    wavesurferObjRef.current.on('ready', () => {
                        console.log('WaveSurfer is ready');
                        setIsReady(true);
                        setDuration(Math.floor(wavesurferObjRef.current.getDuration()));
                    });

                    wavesurferObjRef.current.on('error', (err) => {
                        console.error('WaveSurfer error:', err);
                    });

                    wavesurferObjRef.current.on('play', () => setPlaying(true));
                    wavesurferObjRef.current.on('pause', () => setPlaying(false));
                    wavesurferObjRef.current.on('finish', () => setPlaying(false));

                    if (fileURL) {
                        try {
                            await wavesurferObjRef.current.load(fileURL);
                        } catch (error) {
                            console.error('Error loading audio:', error);
                            setIsReady(false);
                        }
                    }
                } catch (error) {
                    console.error('Error creating WaveSurfer instance:', error);
                }
            }
        };

        createWaveSurfer();

        return () => {
            if (wavesurferObjRef.current) {
                wavesurferObjRef.current.destroy();
                wavesurferObjRef.current = null;
            }
        };
    }, [fileURL]);

    useEffect(() => {
        if (wavesurferObjRef.current && isReady) {
            wavesurferObjRef.current.setVolume(volume);
        }
    }, [volume, isReady]);

    useEffect(() => {
        if (wavesurferObjRef.current && isReady) {
            wavesurferObjRef.current.zoom(zoom);
        }
    }, [zoom, isReady]);

    const handlePlayPause = () => {
        if (wavesurferObjRef.current && isReady) {
            wavesurferObjRef.current.playPause();
        }
    };

    const handleVolumeChange = (e) => {
        setVolume(parseFloat(e.target.value));
    };

    const handleZoomChange = (e) => {
        setZoom(parseInt(e.target.value));
    };

    return (
        <section className='waveform-container'>
            <div ref={wavesurferRef} style={{ width: '100%', height: '128px' }} />
            <div ref={timelineRef} />
            <div className='controls'>
                <button onClick={handlePlayPause} disabled={!isReady}>
                    {playing ? 'Pause' : 'Play'}
                </button>
                <input
                    type='range'
                    min='0'
                    max='1'
                    step='0.05'
                    value={volume}
                    onChange={handleVolumeChange}
                    disabled={!isReady}
                />
                <input
                    type='range'
                    min='1'
                    max='1000'
                    value={zoom}
                    onChange={handleZoomChange}
                    disabled={!isReady}
                />
            </div>
        </section>
    );
};

export default AudioWaveform;