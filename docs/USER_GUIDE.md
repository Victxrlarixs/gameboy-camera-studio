# Game Boy Camera Studio: Technical Reference & User Manual

## 1. System Overview
Game Boy Camera Studio is a high-fidelity image capture and processing platform designed to emulate the operational constraints and aesthetic characteristics of 1990s thermal-transfer imaging hardware. The system utilizes a custom real-time processing engine to transform modern high-definition video streams into 2-bit indexed grayscale assets.

## 2. Interface Architecture
The workspace is organized into four primary functional modules:
*   **Imaging Unit (Handheld Controller)**: The central processing hub featuring the LCD display and tactile input controls.
*   **Development Studio (Side Panel)**: A configuration interface for modifying film stock parameters and exposure values.
*   **Asset Archive (Lab Book)**: A persistent storage binder for managing, reviewing, and re-processing captured material.
*   **Service Manual (Utility Panel)**: A technical reference for system specifications and operation instructions.

## 3. Imaging and Development (SHOOT Mode)

### 3.1 Real-time Processing Engine
Incoming optical signals are processed through a multi-stage pipeline:
1.  **Normalization**: Center-cropping of the 4:3 or 16:9 source sensor to a 1:1 square aspect ratio.
2.  **Downsampling**: Reduction of resolution to a native 128x112 pixel matrix.
3.  **Thresholding**: Application of a 4x4 Bayer ordered-dithering matrix.
4.  **Quantization**: Mapping of luminance values to a selected 4-shade indexed palette.
5.  **Composition**: Integration into a 160x144 frame with an authentic hardware border.

### 3.2 Exposure and Calibration
Operators can fine-tune the develop cycle using the following parameters:
*   **Brightness**: Offset of the center point for the dithering threshold.
*   **Contrast**: Scaling of the distribution between the four luminance levels.
*   **Film Stock (Palettes)**: Selection between diverse hardware-emulated profiles including DMG, Pocket, Light, Matrix, Thermal, and CRT.

### 3.3 Tactical Overlays (Stamps)
The system supports 10 real-time decorative stamps that can be overlaid onto the image buffer during shooting:
*   **Standard Selection**: Heart, Star, Smile, Skull, Flower, Ghost.
*   **Technical Selection**: Grid (4x4), Crosshair, Corner Brackets.

## 4. Operational Controls

### 4.1 Manual Hardware Inputs
*   **D-PAD (Directional)**: Navigation through settings. `Up/Down` modifies brightness; `Left/Right` cycles through stamps.
*   **A Button**: Shutter execution. Dispatches the current frame to the Laboratory and initiates a print cycle.
*   **B Button**: Cancellation and return to primary mode.
*   **START Button**: Accesses the Lab Book (Asset Archive).
*   **SELECT Button**: Cycles through available Film Stocks (Palettes).

### 4.2 Desktop Interface (Keyboard)
*   **Arrow Keys**: D-PAD emulation.
*   **Z Key**: Primary action (A).
*   **X Key**: Secondary action (B).
*   **Enter**: System access (START).
*   **Shift**: Parameter cycle (SELECT).

## 5. Persistence and Management (VIEW Mode)

### 5.1 The Laboratory Asset Archive
The Lab Book acts as an industrial repository for all captured material.
*   **Storage Specifications**: Maintains up to 30 high-fidelity assets in a persistent browser-based database (`localStorage`).
*   **Asset Review**: Individual photos can be inspected for metadata and timestamping.
*   **Re-Processing**: Selecting an archived photo triggers a "re-print" cycle, allowing for new exports or shares of historical data.
*   **Data Sanitation**: Individual assets can be permanently purged from the inventory through the secure delete command.

## 6. Output and Synchronization

### 6.1 Thermal Printing Simulation
The system generates a high-contrast "ticket" preview for every print cycle. This module provides a physical-like representation of the asset on vintage thermal paper.

### 6.2 Distribution Methods
*   **System Export**: Generates an 8x upscaled (1280x1152) PNG file with pixel-perfect scaling.
*   **Native Sharing**: Integration with the Web Share API for direct transfer to mobile devices or peripheral applications.
*   **Ejection**: Safely exits the print preview, returning the hardware to a ready-state.

## 7. Audiovisual Specifications

### 7.1 Acoustic Feedback Engine
All system interactions are synchronized with a custom audio synthesis engine that generates hardware-accurate sound profiles:
*   **Synthesis Type**: Multi-layered square, sawtooth, and noise waveforms.
*   **Profiles**: Distinct signatures for UI interaction, shutter mechanics, thermal motor operation, and data confirmation chime.

### 7.2 LED Diagnostics
The hardware features a reactive power system. The LED indicator reflects system status, including power-on states and active processing cycles during print operations.

## 8. Mobile Deployment
On mobile platforms, the system activates a touch-optimized **Mobile Palette Bar**. This interface provides rapid access to environmental configuration and stamps without compromising screen real estate, utilizing a bottom-sheet paradigm for ergonomic control.

## 9. Technical Architecture
The system is built on SOLID principles to ensure operational stability:
*   **Single Responsibility**: Decoupled engines for Sound, Stamps, Camera, and State Management.
*   **Open/Closed Compliance**: The Stamp Registry allows for infinite expansion of overlays without modifying core rendering logic.
*   **Dependency Inversion**: High-level store logic depends on standardized interfaces for audio and persistence.
