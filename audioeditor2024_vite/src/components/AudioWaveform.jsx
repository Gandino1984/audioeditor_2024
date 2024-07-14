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
    const regionsPluginRef = useRef(null);
    const { fileURL } = useContext(FileContext);
    const [isReady, setIsReady] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        console.log("AudioWaveform mounted. fileURL:", fileURL);

        const createWaveSurfer = async () => {
            if (wavesurferRef.current && !wavesurferObjRef.current) {
                try {
                    regionsPluginRef.current = RegionsPlugin.create();

                    wavesurferObjRef.current = WaveSurfer.create({
                        container: wavesurferRef.current,
                        scrollParent: true,
                        autoCenter: true,
                        cursorColor: 'violet',
                        loopSelection: true,
                        waveColor: '#211027',
                        progressColor: '#69207F',
                        responsive: true,
                        plugins: [
                            TimelinePlugin.create({
                                container: timelineRef.current,
                            }),
                            regionsPluginRef.current,
                        ]
                    });

                    wavesurferObjRef.current.on('ready', () => {
                        console.log('WaveSurfer is ready');
                        setIsReady(true);
                        setDuration(Math.floor(wavesurferObjRef.current.getDuration()));
                        regionsPluginRef.current.enableDragSelection({});
                    });

                    wavesurferObjRef.current.on('play', () => setPlaying(true));
                    wavesurferObjRef.current.on('pause', () => setPlaying(false));
                    wavesurferObjRef.current.on('finish', () => setPlaying(false));

                    regionsPluginRef.current.on('region-updated', () => {
                        const regions = regionsPluginRef.current.getRegions();
                        if (Object.keys(regions).length > 1) {
                            const keys = Object.keys(regions);
                            regions[keys[0]].remove();
                        }
                    });

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

    useEffect(() => {
        if (duration && regionsPluginRef.current) {
            regionsPluginRef.current.addRegion({
                start: Math.floor(duration / 2) - Math.floor(duration) / 5,
                end: Math.floor(duration / 2),
                color: 'hsla(265, 100%, 86%, 0.4)',
            });
        }
    }, [duration]);

    const handlePlayPause = () => {
        if (wavesurferObjRef.current && isReady) {
            wavesurferObjRef.current.playPause();
            setPlaying(!playing);
        }
    };

    const handleReload = () => {
        if (wavesurferObjRef.current && isReady) {
            wavesurferObjRef.current.stop();
            wavesurferObjRef.current.play();
            setPlaying(true);
        }
    };

    const handleVolumeChange = (e) => {
        setVolume(parseFloat(e.target.value));
    };

    const handleZoomChange = (e) => {
        setZoom(parseInt(e.target.value));
    };

    const handleTrim = () => {
        if (wavesurferObjRef.current && isReady && regionsPluginRef.current) {
            const regions = regionsPluginRef.current.getRegions();
            if (Object.keys(regions).length > 0) {
                const regionKey = Object.keys(regions)[0];
                const region = regions[regionKey];
                const start = region.start;
                const end = region.end;

                console.log(`Trimming audio from ${start} to ${end}`);

                // Ensure backend and buffer are defined
                const backend = wavesurferObjRef.current.backend;
                if (!backend) {
                    console.error('Backend is not defined');
                    return;
                }
                if (!backend.buffer) {
                    console.error('Backend buffer is not defined');
                    return;
                }

                // Create a new audio buffer with the trimmed content
                const originalBuffer = backend.buffer;
                const sampleRate = originalBuffer.sampleRate;
                const numberOfChannels = originalBuffer.numberOfChannels;
                const newDuration = end - start;
                const newLength = Math.floor(newDuration * sampleRate);

                const newBuffer = backend.ac.createBuffer(
                    numberOfChannels,
                    newLength,
                    sampleRate
                );

                console.log(`Original buffer duration: ${originalBuffer.duration}`);
                console.log(`New buffer duration: ${newDuration}`);

                // Copy the trimmed part of the audio to the new buffer
                for (let channel = 0; channel < numberOfChannels; channel++) {
                    const oldBufferData = originalBuffer.getChannelData(channel);
                    const newBufferData = newBuffer.getChannelData(channel);
                    for (let i = 0; i < newLength; i++) {
                        newBufferData[i] = oldBufferData[Math.floor(start * sampleRate) + i];
                    }
                }

                console.log('New buffer created and data copied.');

                // Load the new buffer
                wavesurferObjRef.current.loadDecodedBuffer(newBuffer);

                // Reset zoom and remove regions
                setZoom(1);
                wavesurferObjRef.current.zoom(1);
                regionsPluginRef.current.clearRegions();

                // Update duration state
                setDuration(newDuration);

                // Force redraw of waveform
                wavesurferObjRef.current.drawBuffer();

                // Add a new region for the entire trimmed audio
                regionsPluginRef.current.addRegion({
                    start: 0,
                    end: newDuration,
                    color: 'hsla(265, 100%, 86%, 0.4)',
                });

                console.log('Trim completed and waveform updated.');
            }
        }
    };

    return (
        <section className='waveform-container'>
            <div ref={wavesurferRef} style={{ width: '100%', height: '128px' }} />
            <div ref={timelineRef} />
            <div className='all-controls'>
                <div className='left-container'>
                    <button onClick={handlePlayPause} disabled={!isReady}>
                        {playing ? <ion-icon name="pause"></ion-icon> : <ion-icon name="play"></ion-icon>}
                    </button>
                    <button onClick={handleReload} disabled={!isReady}>
                    <ion-icon name="refresh"></ion-icon>
                    </button>
                    <button onClick={handleTrim} disabled={!isReady}>
                        <ion-icon name="cut"></ion-icon>
                    </button>
                </div>
                <div className='right-container'>
                    <div className='volume-slide-container'>
                        <ion-icon name="remove"></ion-icon>
                        <input
                            type='range'
                            min='1'
                            max='1000'
                            value={zoom}
                            onChange={handleZoomChange}
                            className='slider zoom-slider'
                            disabled={!isReady}
                        />
                        <ion-icon name="add"></ion-icon>
                    </div>
                    <div className='volume-slide-container'>
                        {volume > 0 ? (
                            <ion-icon name="volume-high"></ion-icon>
                        ) : (
                            <ion-icon name="volume-low"></ion-icon>
                        )}
                        <input
                            type='range'
                            min='0'
                            max='1'
                            step='0.05'
                            value={volume}
                            onChange={handleVolumeChange}
                            className='slider volume-slider'
                            disabled={!isReady}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AudioWaveform;
