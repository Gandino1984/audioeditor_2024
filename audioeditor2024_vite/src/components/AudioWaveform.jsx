import React, { useState, useEffect, useContext, useRef } from 'react';
import WaveSurfer from 'wavesurfer.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
import { FileContext } from '../contexts/fileContext';
import './AudioWaveform.css';
import EnvelopePlugin from 'wavesurfer.js/dist/plugins/envelope.esm.js';

const AudioWaveform = () => {
    const wavesurferRef = useRef(null);
    const wavesurferObjRef = useRef(null);
    const timelineRef = useRef(null);
    const regionsPluginRef = useRef(null);
    const envelopeRef = useRef(null);
    const { fileURL } = useContext(FileContext);
    const [isReady, setIsReady] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [duration, setDuration] = useState(0);
    const [isTrimming, setIsTrimming] = useState(false);
    const [isTrimmed, setIsTrimmed] = useState(false);

    useEffect(() => {
        console.log("AudioWaveform mounted. fileURL:", fileURL);
        if (!fileURL) {
            console.error("No file URL provided");
            return;
        }
        let isMounted = true;

        const createWaveSurfer = async () => {
            if (wavesurferRef.current && !wavesurferObjRef.current && isMounted) {
                try {
                    regionsPluginRef.current = RegionsPlugin.create();
                    console.log("Regions plugin created:", regionsPluginRef.current);

                    wavesurferObjRef.current = WaveSurfer.create({
                        container: wavesurferRef.current,
                        scrollParent: true,
                        autoCenter: true,
                        cursorColor: 'orange',
                        loopSelection: true,
                        waveColor: '#7b817f',
                        progressColor: '#9c501d',
                        responsive: true,
                        plugins: [
                            TimelinePlugin.create({
                                container: timelineRef.current,
                            }),
                            regionsPluginRef.current,
                            EnvelopePlugin.create({
                                volume: 0.8,
                                lineColor: 'rgba(255, 0, 0, 0.5)',
                                lineWidth: 4,
                                dragPointSize: 12,
                                dragLine: true,
                                dragPointFill: 'rgba(0, 255, 255, 0.8)',
                                dragPointStroke: 'rgba(0, 0, 0, 0.5)',
                                points: [
                                    { time: 11.2, volume: 0.5 },
                                    { time: 15.5, volume: 0.8 },
                                ],
                            }),
                        ],
                    });

                    envelopeRef.current = wavesurferObjRef.current.envelope;

                    wavesurferObjRef.current.on('ready', () => {
                        if (isMounted) {
                            console.log('WaveSurfer is ready');
                            setIsReady(true);
                            const duration = Math.floor(wavesurferObjRef.current.getDuration());
                            setDuration(duration);
                            regionsPluginRef.current.clearRegions();
                        }
                    });

                    wavesurferObjRef.current.on('play', () => isMounted && setPlaying(true));
                    wavesurferObjRef.current.on('pause', () => isMounted && setPlaying(false));
                    wavesurferObjRef.current.on('finish', () => isMounted && setPlaying(false));

                    regionsPluginRef.current.on('region-updated', (region) => {
                        console.log("Region updated:", region);
                        const regions = regionsPluginRef.current.getRegions();
                        if (regions.length > 1) {
                            regions.slice(0, -1).forEach(r => r.remove());
                        }
                        if (region.end > wavesurferObjRef.current.getDuration()) {
                            region.onResize(wavesurferObjRef.current.getDuration());
                        }
                    });

                    regionsPluginRef.current.on('region-created', (region) => {
                        console.log("Region created:", region);
                        const regions = regionsPluginRef.current.getRegions();
                        if (regions.length > 1) {
                            regions.slice(0, -1).forEach(r => r.remove());
                        }
                        if (region.end > wavesurferObjRef.current.getDuration()) {
                            region.onResize(wavesurferObjRef.current.getDuration());
                        }
                    });

                    regionsPluginRef.current.enableDragSelection({
                        color: 'hsla(210, 100%, 50%, 0.4)',
                        maxRegions: 1,
                    });

                    if (fileURL) {
                        try {
                            await wavesurferObjRef.current.load(fileURL);
                            setIsTrimmed(false);
                        } catch (error) {
                            if (isMounted) {
                                console.error('Error loading audio:', error);
                                setIsReady(false);
                            }
                        }
                    }
                } catch (error) {
                    if (isMounted) {
                        console.error('Error creating WaveSurfer instance:', error);
                    }
                }
            }
        };

        createWaveSurfer();

        return () => {
            isMounted = false;
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

    const handleOuterTrim = () => {
        performTrim(false);
    };

    const handleInnerTrim = () => {
        performTrim(true);
    };

    const performTrim = (isInnerTrim) => {
        console.log(`${isInnerTrim ? "Inner" : "Outer"} Trim button clicked`);
        if (wavesurferObjRef.current && isReady && regionsPluginRef.current) {
            const regions = regionsPluginRef.current.getRegions();
            if (regions.length === 1) {
                setIsTrimming(true);
                const region = regions[0];
                let start = region.start;
                let end = region.end;
                const currentDuration = wavesurferObjRef.current.getDuration();
                
                if (isTrimmed) {
                    start = (start / currentDuration) * duration;
                    end = (end / currentDuration) * duration;
                }
                
                console.log(`Selected region: start=${start}, end=${end}`);

                if (end <= start) {
                    console.error('Invalid region selected. End time must be greater than start time.');
                    setIsTrimming(false);
                    return;
                }

                console.log(`${isInnerTrim ? "Inner" : "Outer"} trimming audio from ${start} to ${end}`);
                trimAudio(start, end, isInnerTrim);
            } else {
                console.log('No region selected for trimming.');
            }
        } else {
            console.log('WaveSurfer is not ready or regions plugin is not initialized.');
        }
    };

    const trimAudio = (start, end, isInnerTrim) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        fetch(fileURL)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                let newBuffer;
                const bufferDuration = audioBuffer.duration;
                const sampleRate = audioBuffer.sampleRate;
                
                // Ensure start and end are within bounds
                start = Math.max(0, Math.min(start, bufferDuration));
                end = Math.max(start, Math.min(end, bufferDuration));
                
                if (isInnerTrim) {
                    const startSamples = Math.floor(start * sampleRate);
                    const endSamples = Math.floor(end * sampleRate);
                    const newLength = startSamples + (audioBuffer.length - endSamples);
                    
                    newBuffer = audioContext.createBuffer(
                        audioBuffer.numberOfChannels,
                        newLength,
                        sampleRate
                    );
                    
                    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                        const oldData = audioBuffer.getChannelData(channel);
                        const newData = newBuffer.getChannelData(channel);
                        
                        // Copy the first part (before the trim)
                        newData.set(oldData.subarray(0, startSamples), 0);
                        
                        // Copy the second part (after the trim)
                        const secondPartStart = Math.min(endSamples, oldData.length);
                        newData.set(oldData.subarray(secondPartStart), startSamples);
                    }
                } else {
                    const startSamples = Math.floor(start * sampleRate);
                    const endSamples = Math.floor(end * sampleRate);
                    const newLength = endSamples - startSamples;
                    
                    newBuffer = audioContext.createBuffer(
                        audioBuffer.numberOfChannels,
                        newLength,
                        sampleRate
                    );
                    
                    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                        const oldData = audioBuffer.getChannelData(channel);
                        const newData = newBuffer.getChannelData(channel);
                        newData.set(oldData.subarray(startSamples, endSamples), 0);
                    }
                }

                const trimmedAudioBlob = audioBufferToWavBlob(newBuffer);
                const trimmedAudioURL = URL.createObjectURL(trimmedAudioBlob);
                console.log("Trimmed audio URL:", trimmedAudioURL);
                wavesurferObjRef.current.load(trimmedAudioURL);
                setIsTrimmed(true);
                setIsTrimming(false);
            })
            .catch(error => {
                console.error("Error trimming audio:", error);
                setIsTrimming(false);
            });
    };

    const audioBufferToWavBlob = (audioBuffer) => {
        const numOfChan = audioBuffer.numberOfChannels,
            length = audioBuffer.length * numOfChan * 2 + 44,
            buffer = new ArrayBuffer(length),
            view = new DataView(buffer),
            channels = [],
            sampleRate = audioBuffer.sampleRate,
            bitDepth = 16;

        let offset = 0;

        writeString(view, offset, 'RIFF'); offset += 4;
        view.setUint32(offset, length - 8, true); offset += 4;
        writeString(view, offset, 'WAVE'); offset += 4;
        writeString(view, offset, 'fmt '); offset += 4;
        view.setUint32(offset, 16, true); offset += 4;
        view.setUint16(offset, 1, true); offset += 2;
        view.setUint16(offset, numOfChan, true); offset += 2;
        view.setUint32(offset, sampleRate, true); offset += 4;
        view.setUint32(offset, sampleRate * numOfChan * 2, true); offset += 4;
        view.setUint16(offset, numOfChan * 2, true); offset += 2;
        view.setUint16(offset, bitDepth, true); offset += 2;
        writeString(view, offset, 'data'); offset += 4;
        view.setUint32(offset, length - offset - 4, true); offset += 4;

        for (let i = 0; i < audioBuffer.numberOfChannels; i++)
            channels.push(audioBuffer.getChannelData(i));

        for (let i = 0; i < audioBuffer.length; i++)
            for (let j = 0; j < numOfChan; j++) {
                const sample = Math.max(-1, Math.min(1, channels[j][i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }

        return new Blob([buffer], { type: 'audio/wav' });

        function writeString(view, offset, string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        }
    };

    return (
        <div className="audio-waveform">
            <div className="waveform-container">
                <div ref={wavesurferRef} className="waveform" />
                <div ref={timelineRef} className="timeline" />
            </div>
            <div className="controls">
                <button onClick={handlePlayPause} disabled={!isReady} className="control-button">
                    {playing ? 'PAUSE' : 'PLAY'}
                </button>
                <button onClick={handleReload} disabled={!isReady} className="control-button">
                    REPLAY
                </button>
                <div className="volume-control">
                    <label>Volume:</label>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="volume-slider"
                    />
                </div>
                <div className="zoom-control">
                    <label>Zoom:</label>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={zoom}
                        onChange={handleZoomChange}
                        className="zoom-slider"
                    />
                </div>
                <button onClick={handleOuterTrim} disabled={!isReady || isTrimming} className="control-button">
                    {isTrimming ? 'Trimming...' : 'OUTER TRIM'}
                </button>
                <button onClick={handleInnerTrim} disabled={!isReady || isTrimming} className="control-button">
                    {isTrimming ? 'Trimming...' : 'INNER TRIM'}
                </button>
            </div>
        </div>
    );
};

export default AudioWaveform;
