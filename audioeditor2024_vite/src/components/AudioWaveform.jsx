import React, { useState, useEffect, useContext, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js'
import { FileContext } from '../contexts/fileContext';
import './AudioWaveform.css';

const AudioWaveform = () => {
    const wavesurferRef = useRef(null);
    const wavesurferObjRef = useRef(null);
    const timelineRef = useRef(null);
    const abortControllerRef = useRef(new AbortController());
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
                        RegionsPlugin.create({}),
                    ]
                });

                wavesurferObjRef.current.on('ready', () => {
                    setIsReady(true);
                    setDuration(Math.floor(wavesurferObjRef.current.getDuration()));
                    if (typeof wavesurferObjRef.current.enableDragSelection === 'function') {
                        wavesurferObjRef.current.enableDragSelection({});
                    }
                });

                wavesurferObjRef.current.on('play', () => setPlaying(true));
                wavesurferObjRef.current.on('pause', () => setPlaying(false));
                wavesurferObjRef.current.on('finish', () => setPlaying(false));

                wavesurferObjRef.current.on('region-update-end', (region) => {
                    const regions = Object.values(wavesurferObjRef.current.regions.list);
                    if (regions.length > 1) {
                        regions.forEach((r, i) => {
                            if (i !== regions.length - 1) r.remove();
                        });
                    }
                });

                if (fileURL) {
                    try {
                        await wavesurferObjRef.current.load(fileURL, null, abortControllerRef.current.signal);
                    } catch (error) {
                        if (error.name !== 'AbortError') {
                            console.error('Error loading audio:', error);
                            setIsReady(false);
                        }
                    }
                }
            }
        };

        createWaveSurfer();

        return () => {
            abortControllerRef.current.abort();
            if (wavesurferObjRef.current) {
                wavesurferObjRef.current.destroy();
                wavesurferObjRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (fileURL && wavesurferObjRef.current) {
            const loadAudio = async () => {
                try {
                    await wavesurferObjRef.current.load(fileURL, null, abortControllerRef.current.signal);
                } catch (error) {
                    if (error.name !== 'AbortError') {
                        console.error('Error loading audio:', error);
                        setIsReady(false);
                    }
                }
            };
            loadAudio();
        }
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
            setPlaying(wavesurferObjRef.current.isPlaying());
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
        if (wavesurferObjRef.current && isReady) {
            const regions = Object.values(wavesurferObjRef.current.regions.list);
            if (regions.length > 0) {
                const region = regions[regions.length - 1];
                console.log("Trimming audio from", region.start, "to", region.end);
                // Implement trimming logic here
            }
        }
    };

    return (
        <section className='waveform-container'>
            <div ref={wavesurferRef} />
            <div ref={timelineRef} />
            <div className='all-controls'>
                <div className='left-container'>
                    <button onClick={handlePlayPause} disabled={!isReady}>
                        {playing ? 'Pause' : 'Play'}
                    </button>
                    <button onClick={handleReload} disabled={!isReady}>Reload</button>
                    <button onClick={handleTrim} disabled={!isReady}>Trim</button>
                </div>
                <div className='right-container'>
                    <div className='volume-slide-container'>
                        <input
                            type='range'
                            min='1'
                            max='1000'
                            value={zoom}
                            onChange={handleZoomChange}
                            className='slider zoom-slider'
                            disabled={!isReady}
                        />
                    </div>
                    <div className='volume-slide-container'>
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