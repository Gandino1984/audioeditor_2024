    import React, { useState, useEffect, useContext, useRef } from 'react';
    import WaveSurfer from 'wavesurfer.js';
    import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.js';
    import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.js';
    import HoverPlugin from 'wavesurfer.js/dist/plugins/hover.js';
    import { FileContext } from '../contexts/fileContext';
    import './AudioWaveform.css';
    import EnvelopePlugin from 'wavesurfer.js/dist/plugins/envelope.esm.js';
    import { useSpring, animated } from 'react-spring';
    import MinimapPlugin from 'wavesurfer.js/dist/plugins/minimap.js';

    const AudioWaveform = () => {
        const [showMinimap, setShowMinimap] = useState(true);
        const minimapRef = useRef(null);
        const [regionsVisible, setRegionsVisible] = useState(true);
        const [isMinimized, setIsMinimized] = useState(false);
        const [showHover, setShowHover] = useState(true);
        const [infoText, setInfoText] = useState('');
        const [displayFileName, setDisplayFileName] = useState('');
        const wavesurferRef = useRef(null);
        const wavesurferObjRef = useRef(null);
        const timelineRef = useRef(null);
        const regionsPluginRef = useRef(null);
        const envelopeRef = useRef(null);
        // const HoverPluginref = useRef(null);
        
        const { fileURL, fileName} = useContext(FileContext);
        const [isReady, setIsReady] = useState(false);
        const [playing, setPlaying] = useState(false);
        const [volume, setVolume] = useState(0.5);
        const [zoom, setZoom] = useState(1);
        const [duration, setDuration] = useState(0);
        const [isTrimming, setIsTrimming] = useState(false);
        const [isTrimmed, setIsTrimmed] = useState(false);
        const [currentAudioURL, setCurrentAudioURL] = useState(null);


        useEffect(() => {
            if (wavesurferObjRef.current && isReady) {
                const regions = regionsPluginRef.current.getRegions();
                regions.forEach(region => {
                    region.element.style.display = regionsVisible ? 'block' : 'none';
                });
            }
        }, [regionsVisible, isReady]);

        
        const toggleRegionsVisibility = () => {
            if (wavesurferObjRef.current && isReady) {
                const regions = regionsPluginRef.current.getRegions();
                regions.forEach(region => {
                    region.element.style.display = regionsVisible ? 'none' : 'block';
                });
                setRegionsVisible(!regionsVisible);
                updateInfoText(regionsVisible ? 'Region and markers hidden' : 'Region and markers visible');
            }
        };

        const controlsAnimation = useSpring({
            height: isMinimized ? '0px' : '50px', // Adjust the height as needed
            opacity: isMinimized ? 0 : 1,
            overflow: 'hidden',
        });
        
        const toggleMinimize = () => {
            setIsMinimized(!isMinimized);
        };
        

        const updateInfoText = (text) => {
            setInfoText(text);
            setTimeout(() => setInfoText(''), 5000);
        };

        useEffect(() => {
            if (wavesurferObjRef.current && isReady) {
                wavesurferObjRef.current.setVolume(volume);
                updateInfoText(`Volume set to ${volume}`);
            }
        }, [volume, isReady]);

        useEffect(() => {
            if (wavesurferObjRef.current && isReady) {
                wavesurferObjRef.current.zoom(zoom);
                updateInfoText(`Zoom set to ${zoom}`);
            }
        }, [zoom, isReady]);

        useEffect(() => {
            return () => {
                if (currentAudioURL && currentAudioURL !== fileURL) {
                    URL.revokeObjectURL(currentAudioURL);
                }
            };
        }, [currentAudioURL, fileURL]);


        useEffect(() => {
            setCurrentAudioURL(fileURL);
            setDisplayFileName(fileName || 'No file selected');
        }, [fileName, fileURL]);

        useEffect(() => {
            setCurrentAudioURL(fileURL);
        }, [fileURL]);

        useEffect(() => {
            if (!currentAudioURL) {
                console.error("No audio URL provided");
                return;
            }
            let isMounted = true;

            const createWaveSurfer = async () => {
                if (wavesurferRef.current && !wavesurferObjRef.current && isMounted) {
                    try {
                        wavesurferObjRef.current = WaveSurfer.create({
                            container: wavesurferRef.current,
                            scrollParent: true,
                            autoCenter: true,
                            cursorColor: 'orange',
                            loopSelection: true,
                            cursorWidth: 1.5,
                            barWidth: 2,
                            waveColor: '#7b817f',
                            progressColor: '#9c501d',
                            responsive: true,
                            plugins: [
                                TimelinePlugin.create({
                                    container: timelineRef.current,
                                }),
                                regionsPluginRef.current = RegionsPlugin.create(),
                                EnvelopePlugin.create({
                                    volume: 0.8,
                                    lineColor: 'white',
                                    lineWidth: 1.5,
                                    dragPointSize: 9,
                                    dragLine: true,
                                    dragPointFill: 'blue',
                                    dragPointStroke: 'white',
                                    points: [
                                        { time: 3, volume: 0.9 },
                                        { time: 60, volume: 0.9 },
                                    ],
                                
                                }),
                                HoverPlugin.create({
                                    lineColor: '#ff0000',
                                    labelBackground: '#555',
                                    labelColor: '#fff',
                                }),
                                MinimapPlugin.create({
                                    container: minimapRef.current,
                                    waveColor: '#777',
                                    progressColor: '#222',
                                    height: 20,
                                }),
                            ],
                        });

                        wavesurferObjRef.current.on('envelope-point-added', () => {
                            updateInfoText('New volume control point added');
                        });

                        envelopeRef.current = wavesurferObjRef.current.envelope;

                        wavesurferObjRef.current.on('ready', () => {
                            if (isMounted) {
                                console.log('WaveSurfer is ready');
                                setIsReady(true);
                                console.log("isReady set to true");
                                const duration = Math.floor(wavesurferObjRef.current.getDuration());
                                setDuration(duration);
                                regionsPluginRef.current.clearRegions();
                            }
                        });
                        wavesurferObjRef.current.on('play', () => isMounted && setPlaying(true));
                        wavesurferObjRef.current.on('pause', () => isMounted && setPlaying(false));
                        wavesurferObjRef.current.on('finish', () => isMounted && setPlaying(false));

                        regionsPluginRef.current.on('region-updated', (region) => {
                            handleRegionUpdate(region);
                        });

                        regionsPluginRef.current.on('region-created', (region) => {
                            handleRegionCreated(region);
                        });

                        regionsPluginRef.current.enableDragSelection({
                            color: 'hsla(210, 100%, 50%, 0.4)',
                        });

                        if (currentAudioURL) {
                            try {
                                await wavesurferObjRef.current.load(currentAudioURL);
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
        }, [currentAudioURL]);

        const handleRegionUpdate = (region) => {
            console.log("Region updated:", region);
            const regions = regionsPluginRef.current.getRegions();
            const nonMarkerRegions = regions.filter(r => r.end > r.start);
            
            if (region.end > region.start && nonMarkerRegions.length > 1) {
                regions.forEach(r => {
                    if (r !== region && r.end > r.start) {
                        r.remove();
                    }
                });
            }
            
            if (region.end > wavesurferObjRef.current.getDuration()) {
                region.onResize(wavesurferObjRef.current.getDuration());
            }
        };

        const handleRegionCreated = (region) => {
            if (region.end > region.start) {
                updateInfoText('New region added');
                const regions = regionsPluginRef.current.getRegions();
                const nonMarkerRegions = regions.filter(r => r.end > r.start);
                
                if (nonMarkerRegions.length > 1) {
                    nonMarkerRegions.slice(0, -1).forEach(r => r.remove());
                }
            } else {
                updateInfoText('New marker added');
                region.color = 'rgba(255, 0, 0, 0.3)';  // Red color for markers
            }
            
            if (region.end > wavesurferObjRef.current.getDuration()) {
                region.onResize(wavesurferObjRef.current.getDuration());
            }

            region.element.style.display = regionsVisible ? 'block' : 'none';
        };

        const handleRemoveMarkersAndRegions = () => {
            if (wavesurferObjRef.current && isReady && regionsPluginRef.current) {
                const regions = regionsPluginRef.current.getRegions();
                if (regions.length > 0) {
                    regions.forEach(region => region.remove());
                    updateInfoText('All markers and regions removed');
                } else {
                    updateInfoText('No markers or regions to remove');
                }
            } else {
                updateInfoText('WaveSurfer is not ready or regions plugin is not initialized');
            }
        };

        

        const handlePlayPause = () => {
            if (wavesurferObjRef.current && isReady) {
                wavesurferObjRef.current.playPause();
                setPlaying(!playing);
                updateInfoText(playing ? 'Audio paused...' : 'Playing audio...');
            }
        };

        const handleReload = () => {
            if (wavesurferObjRef.current && isReady) {
                wavesurferObjRef.current.stop();
                wavesurferObjRef.current.play();
                setPlaying(true);
                updateInfoText('Audio reloaded and playing from start...');
            }
        };

        const adjustVolume = (delta) => {
            setVolume(prev => Math.max(0, Math.min(1, prev + delta)));
        };
    
        const adjustZoom = (delta) => {
            setZoom(prev => Math.max(1, Math.min(100, prev + delta)));
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

        const handleForward = () => {
            if (wavesurferObjRef.current && isReady) {
                const currentTime = wavesurferObjRef.current.getCurrentTime();
                const newTime = Math.min(currentTime + 10, wavesurferObjRef.current.getDuration());
                wavesurferObjRef.current.seekTo(newTime / wavesurferObjRef.current.getDuration());
                updateInfoText('Play head moved forward 10 seconds');
            } else {
                console.error("Wavesurfer not ready for forward seek");
                updateInfoText('The audio is not ready for forward seek...');
            }
        };
        
        const handleBackward = () => {
            if (wavesurferObjRef.current && isReady) {
                const currentTime = wavesurferObjRef.current.getCurrentTime();
                const newTime = Math.max(0, currentTime - 10);
                wavesurferObjRef.current.seekTo(newTime / wavesurferObjRef.current.getDuration());
                updateInfoText('Play head moved backward 10 seconds');
            } else {
                console.error("Wavesurfer not ready for backward seek");
                updateInfoText('The audio is not ready for backward seek...');
            }
        };

        const handleDownload = () => {
            if (currentAudioURL) {
                const link = document.createElement('a');
                link.href = currentAudioURL;
                link.download = 'edited_audio.wav';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                updateInfoText('Downloading edited audio...');
            }
        };

        const handleAddMarker = () => {
            if (wavesurferObjRef.current && isReady) {
                const markerTime = wavesurferObjRef.current.getCurrentTime();
                regionsPluginRef.current.addRegion({
                    start: markerTime,
                    end: markerTime,
                    color: 'blue',
                    content: `${markerTime.toFixed(1)}s`,
                    drag: false,
                    resize: false
                });
                updateInfoText('Marker added');
            }
        }

        const performTrim = (isInnerTrim) => {
            if (wavesurferObjRef.current && isReady && regionsPluginRef.current) {
                const regions = regionsPluginRef.current.getRegions();
                const trimRegion = regions.find(region => region.end > region.start);
                
                if (trimRegion) {
                    setIsTrimming(true);
                    let start = trimRegion.start;
                    let end = trimRegion.end;
                    const currentDuration = wavesurferObjRef.current.getDuration();
                    
                    if (isTrimmed) {
                        start = (start / currentDuration) * duration;
                        end = (end / currentDuration) * duration;
                    }
                    
                    updateInfoText(`Selected region: start=${start}, end=${end}`);

                    if (end <= start) {
                        updateInfoText('Invalid region selected. End time must be greater than start time.');
                        setIsTrimming(false);
                        return;
                    }

                    updateInfoText(`${isInnerTrim ? "Inner" : "Outer"} trimming audio from ${start.toFixed(1)} to ${end.toFixed(1)}`);
                    trimAudio(start, end, isInnerTrim);
                } else {
                    updateInfoText('No valid region selected for trimming...');
                }
            } else {
                updateInfoText('WaveSurfer is not ready or regions plugin is not initialized...');
            }
        };

        const trimAudio = (start, end, isInnerTrim) => {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            fetch(currentAudioURL)
                .then(response => response.arrayBuffer())
                .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
                .then(audioBuffer => {
                    let newBuffer;
                    const bufferDuration = audioBuffer.duration;
                    const sampleRate = audioBuffer.sampleRate;
                    
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
                            
                            newData.set(oldData.subarray(0, startSamples), 0);
                            
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
                    updateInfoText('Audio trimmed successfully!');
                    wavesurferObjRef.current.load(trimmedAudioURL);
                    setCurrentAudioURL(trimmedAudioURL);
                    setIsTrimmed(true);
                    setIsTrimming(false);
                })
                .catch(error => {
                    console.error("Error trimming audio:", error);
                    updateInfoText("Error trimming audio:", error);
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
                <div className='audio-info'>
                    <h3 className="audio-file-name">{displayFileName}</h3>
                    <div className="info-text">{infoText}</div>
                </div>
                
                <div className="waveform-container">
                    <div ref={wavesurferRef} className="waveform" />
                    <div ref={timelineRef} className="timeline" />
                </div>
                
                <div ref={minimapRef} className="minimap" />

                <div className='waveform-controls'>
                    <button onClick={toggleMinimize} className="control-button minimize-button">
                        {isMinimized ? '+' : '-'}
                    </button>
                    <animated.div style={controlsAnimation}>
                        <div className="controls">
                            <button onClick={handlePlayPause} id="playPauseBtn" disabled={!isReady} className="control-button">
                            {playing ? 'PAUSE' : 'PLAY'}
                                {/* {playing ? <ion-icon name="pause"></ion-icon> : <ion-icon name="play"></ion-icon>} */}
                            </button>
                            <button onClick={handleReload} disabled={!isReady} className="control-button">
                                {/* <ion-icon name="return-up-back"></ion-icon> */}
                                REP
                            </button>
                            <button onClick={handleBackward} disabled={!isReady} className="control-button">
                                {/* <ion-icon name="caret-back">10s</ion-icon>  */}
                                BWD
                            </button>
                            
                            <button onClick={handleForward} disabled={!isReady} className="control-button">
                                {/* <ion-icon name="caret-forward">10s</ion-icon>  */}
                                FWD
                            </button>
                            <button onClick={handleInnerTrim} disabled={!isReady || isTrimming} className="control-button">
                                {/* <ion-icon name="cut"></ion-icon> */}
                                CUT
                            </button>
                            <button onClick={handleOuterTrim} disabled={!isReady || isTrimming} className="control-button">
                                TRIM
                            </button>
                        
                            <div className="volume-control">
                                {/* <ion-icon name="volume-medium"></ion-icon> */}
                                VOLUME
                                <div className="slider-container">
                                    <button onClick={() => adjustVolume(-0.1)} className="slider-button">-</button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="volume-slider"
                                    />
                                    <button onClick={() => adjustVolume(0.1)} className="slider-button">+</button>
                                </div>
                            </div>

                            <div className="zoom-control">
                                {/* <ion-icon name="search"></ion-icon> */}
                                ZOOM
                                <div className="slider-container">
                                    <button onClick={() => adjustZoom(-1)} className="slider-button">-</button>
                                    <input
                                        type="range"
                                        min="1"
                                        max="100"
                                        value={zoom}
                                        onChange={handleZoomChange}
                                        className="zoom-slider"
                                    />
                                    <button onClick={() => adjustZoom(1)} className="slider-button">+</button>
                                </div>
                            </div>

                            
                            <button onClick={handleAddMarker} disabled={!isReady} className="control-button markerBtn">
                                {/* <ion-icon name="pin"></ion-icon> */}
                                MARKER
                            </button>

                            <button onClick={toggleRegionsVisibility} disabled={!isReady}  className="control-button toggleMarkers">
                                {/* {regionsVisible ? <ion-icon name="eye-off"></ion-icon> : <ion-icon name="eye"></ion-icon>} */}
                                {regionsVisible ? 'HIDE' : 'SHOW'}
                            </button>

                            <button onClick={handleRemoveMarkersAndRegions} disabled={!isReady} className="control-button">
                                CLEAR
                            </button>

                            <button onClick={handleDownload} disabled={!isReady} className="control-button">
                                {/* <ion-icon name="download"></ion-icon> */}
                                DOWNLOAD
                            </button>
                            
                        </div>
                    </animated.div>   
                </div>
                
            </div>
        );
    };

    export default AudioWaveform;

