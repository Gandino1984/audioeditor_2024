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
                    wavesurferObjRef.current.enableDragSelection({});
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
                        await wavesurferObjRef.current.load(fileURL);
                    } catch (error) {
                        console.error('Error loading audio:', error);
                        setIsReady(false);
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
                const start = region.start;
                const end = region.end;
                
                // Create a new audio buffer with the trimmed content
                const originalBuffer = wavesurferObjRef.current.backend.buffer;
                const sampleRate = originalBuffer.sampleRate;
                const channelCount = originalBuffer.numberOfChannels;
                const startOffset = Math.floor(start * sampleRate);
                const endOffset = Math.floor(end * sampleRate);
                const trimmedLength = endOffset - startOffset;
                
                const trimmedBuffer = wavesurferObjRef.current.backend.ac.createBuffer(
                    channelCount,
                    trimmedLength,
                    sampleRate
                );

                for (let channel = 0; channel < channelCount; channel++) {
                    const originalChannelData = originalBuffer.getChannelData(channel);
                    const trimmedChannelData = trimmedBuffer.getChannelData(channel);
                    for (let i = 0; i < trimmedLength; i++) {
                        trimmedChannelData[i] = originalChannelData[i + startOffset];
                    }
                }

                // Create a new Blob from the trimmed buffer
                const wavBlob = bufferToWave(trimmedBuffer, trimmedLength);
                
                // Create a new object URL for the trimmed audio
                const trimmedUrl = URL.createObjectURL(wavBlob);
                
                // Load the trimmed audio into WaveSurfer
                wavesurferObjRef.current.load(trimmedUrl);
                
                // Optionally, you can also trigger a download of the trimmed audio
                downloadTrimmedAudio(wavBlob);
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

function bufferToWave(abuffer, len) {
    const numOfChan = abuffer.numberOfChannels;
    const length = len * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let sample;
    let offset = 0;
    let pos = 0;

    // write WAVE header
    setUint32(0x46464952);                         // "RIFF"
    setUint32(length - 8);                         // file length - 8
    setUint32(0x45564157);                         // "WAVE"

    setUint32(0x20746d66);                         // "fmt " chunk
    setUint32(16);                                 // length = 16
    setUint16(1);                                  // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2);                      // block-align
    setUint16(16);                                 // 16-bit (hardcoded in this demo)

    setUint32(0x61746164);                         // "data" - chunk
    setUint32(length - pos - 4);                   // chunk length

    // write interleaved data
    for(let i = 0; i < abuffer.numberOfChannels; i++)
        channels.push(abuffer.getChannelData(i));

    while(pos < length) {
        for(let i = 0; i < numOfChan; i++) {             // interleave channels
            sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0; // scale to 16-bit signed int
            view.setInt16(pos, sample, true);          // update data chunk
            pos += 2;
        }
        offset++; // next source sample
    }

    // create Blob
    return new Blob([buffer], {type: "audio/wav"});

    function setUint16(data) {
        view.setUint16(pos, data, true);
        pos += 2;
    }

    function setUint32(data) {
        view.setUint32(pos, data, true);
        pos += 4;
    }
}

function downloadTrimmedAudio(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "trimmed_audio.wav";
    a.click();
    window.URL.revokeObjectURL(url);
}

export default AudioWaveform;