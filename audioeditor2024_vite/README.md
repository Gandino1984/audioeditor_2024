# Audio Editing Application

## Overview

This project is a web-based audio editing application built using React. It allows users to upload audio files, visualize the waveform, and interactively add control points to adjust the volume over time.

## Features

- **Upload Audio Files**: Supports MP3, WAV, and OGG file formats.
- **Visualize Waveform**: Displays the waveform of the uploaded audio file.
- **Control Points**: Add points on the waveform to adjust the volume at specific times.
- **Download Edited Audio**: Allows users to download the edited audio file with applied volume adjustments.

## Components

### 1. UploadAudio.jsx

This component handles the file upload functionality, ensuring that only supported audio formats (MP3, WAV, OGG) are accepted. It provides user feedback for unsupported file formats and updates the application state with the selected file.

### 2. AudioWaveform.jsx

This component is responsible for visualizing the waveform of the uploaded audio file and allowing users to interact with it by adding control points for volume adjustment. It uses `wavesurfer.js` to render the waveform and various plugins to enhance functionality.

## Installation

1. Clone the repository:
    ```sh
    git clone <repository-url>
    ```
2. Navigate to the project directory:
    ```sh
    cd <project-directory>
    ```
3. Install dependencies:
    ```sh
    npm install
    ```

## Usage

1. Start the development server:
    ```sh
    npm start
    ```
2. Open your browser and go to `http://localhost:3000`.

## Dependencies

- React
- `wavesurfer.js`
- Other dependencies as listed in `package.json`

## Contributing

Feel free to open issues or submit pull requests if you find any bugs or have suggestions for improvements.

## License

This project is licensed under the Audio Editing Application License. See the [LICENSE](./LICENSE) file for more details.

For permission requests, please contact andinogerman@gmail.com