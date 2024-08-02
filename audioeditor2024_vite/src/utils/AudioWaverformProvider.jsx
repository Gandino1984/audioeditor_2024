// AudioWaveformProvider.js
import React, { createContext, useContext, useState, useRef } from 'react';

const AudioWaveformContext = createContext();

export const useAudioWaveform = () => useContext(AudioWaveformContext);

export const AudioWaveformProvider = ({ children }) => {
    
    const [showMarkerInput, setShowMarkerInput] = useState(false);
    const [markerDescription, setMarkerDescription] = useState('');
    const [regionsVisible, setRegionsVisible] = useState(true);
    const [isMinimized, setIsMinimized] = useState(false);
    const [infoText, setInfoText] = useState('');
    const [displayFileName, setDisplayFileName] = useState('');
    const wavesurferRef = useRef(null);
    const wavesurferObjRef = useRef(null);
    const timelineRef = useRef(null);
    const regionsPluginRef = useRef(null);
    const envelopeRef = useRef(null);
    const minimapRef = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [playing, setPlaying] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [duration, setDuration] = useState(0);
    const [isTrimming, setIsTrimming] = useState(false);
    const [isTrimmed, setIsTrimmed] = useState(false);
    const [currentAudioURL, setCurrentAudioURL] = useState(null);

    const updateInfoText = (text) => {
        setInfoText(text);
        setTimeout(() => setInfoText(''), 5000);
    };

    const value = {
        showMarkerInput, setShowMarkerInput,
        markerDescription, setMarkerDescription,
        regionsVisible, setRegionsVisible,
        isMinimized, setIsMinimized,
        infoText, setInfoText,
        displayFileName, setDisplayFileName,
        wavesurferRef, wavesurferObjRef,
        timelineRef, regionsPluginRef,
        envelopeRef, minimapRef,
        isReady, setIsReady,
        playing, setPlaying,
        zoom, setZoom,
        duration, setDuration,
        isTrimming, setIsTrimming,
        isTrimmed, setIsTrimmed,
        currentAudioURL, setCurrentAudioURL,
        updateInfoText
    };

    return (
        <AudioWaveformContext.Provider value={value}>
            {children}
        </AudioWaveformContext.Provider>
    );
};