# ArUco Marker Reference Object

This directory contains the ArUco marker reference object used for accurate fish measurement.

## What is an ArUco Marker?

An ArUco marker is a square fiducial marker with a unique pattern that can be detected by computer vision systems with 99%+ accuracy. We use it as a reference object to calibrate photo measurements.

## Specifications

- **Size:** 4" × 4" (10.16 cm × 10.16 cm)
- **Dictionary:** DICT_4X4_250 (ArUco standard)
- **Marker ID:** 23 (default for fish tournament)
- **Print Quality:** 300 DPI minimum
- **Material:** White matte paper (non-glossy to reduce reflections)

## How to Generate the Marker

You can generate the ArUco marker using Python + OpenCV:

```python
import cv2
import numpy as np

# Define the dictionary
aruco_dict = cv2.aruco.Dictionary_get(cv2.aruco.DICT_4X4_250)

# Generate marker ID 23
marker_id = 23
marker_size = 400  # pixels (for 4"x4" at 100 DPI)

# Generate the marker image
marker_image = cv2.aruco.drawMarker(aruco_dict, marker_id, marker_size)

# Add white border (important for detection)
border_size = 40
marker_with_border = cv2.copyMakeBorder(
    marker_image,
    border_size, border_size, border_size, border_size,
    cv2.BORDER_CONSTANT,
    value=255
)

# Save as PNG
cv2.imwrite('aruco_marker_id23_4x4.png', marker_with_border)
print("Marker saved!")
```

## Online Generator

You can also use online generators:
- https://chev.me/arucogen/
  - Select "4x4 (50 markers)" dictionary
  - Choose marker ID 23
  - Download as PDF

## Printing Instructions

1. **Print Settings:**
   - Paper: 8.5" × 11" white matte paper
   - Quality: Best/High (300 DPI minimum)
   - Color Mode: Black and white
   - Scaling: None (100% actual size)

2. **Verification:**
   - Measure the printed marker with a ruler
   - It should be exactly 4.0" × 4.0" (including white border)
   - If it's not exact, adjust printer settings

3. **Lamination (Recommended):**
   - Laminate the marker for water resistance
   - Use matte lamination (not glossy) to prevent glare
   - Verify size after lamination

## How to Use

1. **Placement:**
   - Place the marker flat next to the fish
   - Keep the marker level with the fish (same plane)
   - Ensure the marker is fully visible in the photo
   - Avoid shadows on the marker

2. **Orientation:**
   - The marker can be in any orientation
   - The app will detect it automatically
   - Keep the marker parallel to the fish

3. **Lighting:**
   - Use good, even lighting
   - Avoid harsh shadows
   - Avoid glare/reflections on the marker

## Troubleshooting

### Marker Not Detected
- Ensure marker is fully visible in photo
- Check for shadows or glare
- Verify marker is printed at correct size
- Try better lighting

### Low Confidence Warning
- Marker may be partially obscured
- Check for folds or damage on printed marker
- Ensure marker is flat and level
- Re-print if marker is damaged

## Tournament Distribution

For tournament organizers:

1. **Print Cost:** ~$0.50-1.00 per marker (laminated)
2. **Distribution:** Include in tournament starter kits
3. **Digital:** Provide PDF download link in tournament rules
4. **Backup:** Keep extra markers at weigh-in station

## File Downloads

- `aruco_marker_id23_4x4.png` - Print-ready PNG image
- `aruco_marker_id23_4x4.pdf` - Print-ready PDF (coming soon)
- `aruco_generator.py` - Python script to generate marker

For questions or issues, contact tournament support.
