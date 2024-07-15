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
    const envelopeRef = useRef(null); // Reference for Envelope plugin instance
    const { fileURL } = useContext(FileContext);
    const [isReady, setIsReady] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [duration, setDuration] = useState(0);
    const [isTrimming, setIsTrimming] = useState(false);

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
                            // Initialize Envelope plugin
                            EnvelopePlugin.create({
                                volume: 0.8,
                                lineColor: 'rgba(255, 0, 0, 0.5)',
                                lineWidth: 4,
                                dragPointSize: 12, // Adjust as needed
                                dragLine: true, // Adjust as needed
                                dragPointFill: 'rgba(0, 255, 255, 0.8)',
                                dragPointStroke: 'rgba(0, 0, 0, 0.5)',
                                points: [
                                    { time: 11.2, volume: 0.5 },
                                    { time: 15.5, volume: 0.8 },
                                ],
                            }),
                        ],
                    });

                    // Store reference to Envelope plugin instance
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
                    });

                    regionsPluginRef.current.on('region-created', (region) => {
                        console.log("Region created:", region);
                        const regions = regionsPluginRef.current.getRegions();
                        if (regions.length > 1) {
                            regions.slice(0, -1).forEach(r => r.remove());
                        }
                    });

                    regionsPluginRef.current.enableDragSelection({
                        color: 'hsla(210, 100%, 50%, 0.4)',
                        maxRegions: 1,
                    });

                    if (fileURL) {
                        try {
                            await wavesurferObjRef.current.load(fileURL);
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
                const start = region.start;
                const end = region.end;
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
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                console.log("Audio buffer decoded:", audioBuffer);
                let newBuffer;
    
                if (isInnerTrim) {
                    const firstPartLength = Math.floor(start * audioBuffer.sampleRate);
                    const secondPartStart = Math.min(Math.floor(end * audioBuffer.sampleRate), audioBuffer.length);
                    const secondPartLength = audioBuffer.length - secondPartStart;
                    const newLength = firstPartLength + secondPartLength;
    
                    newBuffer = audioContext.createBuffer(
                        audioBuffer.numberOfChannels,
                        newLength,
                        audioBuffer.sampleRate
                    );
    
                    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                        const oldData = audioBuffer.getChannelData(channel);
                        const newData = newBuffer.getChannelData(channel);
    
                        // Copy first part
                        newData.set(oldData.subarray(0, firstPartLength), 0);
                        // Copy second part
                        newData.set(oldData.subarray(secondPartStart), firstPartLength);
                    }
                } else {
                    // Outer trim logic (unchanged)
                    const newLength = Math.floor((end - start) * audioBuffer.sampleRate);
                    newBuffer = audioContext.createBuffer(
                        audioBuffer.numberOfChannels,
                        newLength,
                        audioBuffer.sampleRate
                    );
    
                    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                        const oldData = audioBuffer.getChannelData(channel);
                        const newData = newBuffer.getChannelData(channel);
                        newData.set(oldData.subarray(Math.floor(start * audioBuffer.sampleRate), Math.floor(end * audioBuffer.sampleRate)));
                    }
                }
    
                console.log("New buffer created:", newBuffer);
                const wavBuffer = audioBufferToWav(newBuffer);
                const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' });
                const wavURL = URL.createObjectURL(wavBlob);
    
                wavesurferObjRef.current.load(wavURL);
                wavesurferObjRef.current.on('ready', () => {
                    setDuration(newBuffer.duration);
                    setZoom(1);
                    wavesurferObjRef.current.zoom(1);
                    regionsPluginRef.current.clearRegions();
                    console.log('Trim completed and waveform updated.');
                    setIsTrimming(false);
                });
            })
            .catch(error => {
                console.error('Error trimming audio:', error);
                setIsTrimming(false);
            });
    };

    const audioBufferToWav = (buffer) => {
        let numOfChan = buffer.numberOfChannels,
            length = buffer.length * numOfChan * 2 + 44,
            bufferArray = new ArrayBuffer(length),
            view = new DataView(bufferArray),
            channels = [],
            i,
            sample,
            offset = 0,
            pos = 0;

        // write WAVE header
        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"

        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2); // block-align
        setUint16(16); // 16-bit (hardcoded in this demo)

        setUint32(0x61746164); // "data" - chunk
        setUint32(length - pos - 4); // chunk length

        // write interleaved data
        for (i = 0; i < buffer.numberOfChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        while (pos < length) {
            for (i = 0; i < numOfChan; i++) {
                sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
                sample = (0.5 + sample * 32767) | 0; // scale to 16-bit signed int
                view.setInt16(pos, sample, true); // write 16-bit sample
                pos += 2;
            }
            offset++; // next source sample
        }

        return bufferArray;

        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    };

    return (
        <section className='waveform-container'>
            <div ref={wavesurferRef} style={{ width: '100%', height: '128px' }} />
            <div ref={timelineRef} />
            <div className='all-controls'>
                <div className='left-container'>
                    <button className="button-orange" onClick={handlePlayPause} disabled={!isReady}>
                        {playing ? <ion-icon name="pause" style={{ fontSize: '24px' }}></ion-icon> : <ion-icon name="play" style={{ fontSize: '24px' }}></ion-icon>}
                    </button>
                    <button className="button-orange" onClick={handleReload} disabled={!isReady}>
                        <ion-icon name="refresh" style={{ fontSize: '24px' }}></ion-icon>
                    </button>
                    <button className="button-orange" onClick={handleOuterTrim} disabled={!isReady || isTrimming}>
                        {isTrimming ? 'Trimming...' : 'OUTER TRIM' }
                    </button>
                    <button className="button-orange" onClick={handleInnerTrim} disabled={!isReady || isTrimming}>
                        {isTrimming ? 'Trimming...' : 'INNER TRIM' }
                    </button>
                </div>
                <div className='right-container'>
                    <div className='volume-slide-container'>
                        <span>zoom</span>
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
                        <span>volume</span>
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
