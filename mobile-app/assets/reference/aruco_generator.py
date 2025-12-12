#!/usr/bin/env python3
"""
ArUco Marker Generator for Fish Tournament App

Generates a 4"x4" ArUco marker (ID 23) for use as a reference object
in computer vision-based fish measurement.

Requirements:
    pip install opencv-contrib-python numpy pillow

Usage:
    python aruco_generator.py

Output:
    - aruco_marker_id23_4x4.png (400x400 px, suitable for printing at 100 DPI)
    - aruco_marker_id23_4x4_high.png (1200x1200 px, for 300 DPI printing)
"""

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import os

# Configuration
MARKER_ID = 23
MARKER_SIZE_INCHES = 4.0
BORDER_RATIO = 0.2  # 20% border around marker

def generate_aruco_marker(marker_id, size_pixels, dpi):
    """Generate ArUco marker with specified parameters"""

    print(f"Generating ArUco marker ID {marker_id} at {size_pixels}x{size_pixels} pixels ({dpi} DPI)")

    # Get ArUco dictionary
    aruco_dict = cv2.aruco.Dictionary_get(cv2.aruco.DICT_4X4_250)

    # Generate marker
    marker_image = cv2.aruco.drawMarker(aruco_dict, marker_id, size_pixels)

    # Calculate border size
    border_size = int(size_pixels * BORDER_RATIO / 2)

    # Add white border
    marker_with_border = cv2.copyMakeBorder(
        marker_image,
        border_size, border_size, border_size, border_size,
        cv2.BORDER_CONSTANT,
        value=255  # White
    )

    return marker_with_border

def add_labels(image, marker_id, size_inches, dpi):
    """Add informational labels to the marker image"""

    # Convert to PIL for easier text rendering
    pil_image = Image.fromarray(image)
    draw = ImageDraw.Draw(pil_image)

    # Try to use a nice font, fall back to default if not available
    try:
        font_large = ImageFont.truetype("arial.ttf", int(dpi * 0.15))
        font_small = ImageFont.truetype("arial.ttf", int(dpi * 0.10))
    except:
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()

    # Image dimensions
    width, height = pil_image.size

    # Add text below marker
    bottom_padding = int(dpi * 0.5)
    new_height = height + bottom_padding

    # Create new image with extra space for text
    labeled_image = Image.new('L', (width, new_height), color=255)
    labeled_image.paste(pil_image, (0, 0))
    draw = ImageDraw.Draw(labeled_image)

    # Add text
    text_y = height + int(dpi * 0.1)

    draw.text(
        (width // 2, text_y),
        f"Fish Tournament Reference Marker",
        fill=0,
        font=font_small,
        anchor="mt"
    )

    draw.text(
        (width // 2, text_y + int(dpi * 0.15)),
        f"ArUco ID {marker_id} | {size_inches}\" × {size_inches}\"",
        fill=0,
        font=font_small,
        anchor="mt"
    )

    draw.text(
        (width // 2, text_y + int(dpi * 0.30)),
        "Print at 100% scale - Do not resize",
        fill=0,
        font=font_small,
        anchor="mt"
    )

    return np.array(labeled_image)

def save_marker(marker_image, filename):
    """Save marker image to file"""
    success = cv2.imwrite(filename, marker_image)
    if success:
        print(f"✓ Saved: {filename}")

        # Get file size
        size_kb = os.path.getsize(filename) / 1024
        print(f"  File size: {size_kb:.1f} KB")
    else:
        print(f"✗ Failed to save: {filename}")

def main():
    print("="* 60)
    print("ArUco Marker Generator for Fish Tournament")
    print("="* 60)
    print()

    # Generate standard resolution marker (100 DPI)
    print("Generating standard resolution marker (100 DPI)...")
    marker_100dpi = generate_aruco_marker(MARKER_ID, 400, 100)
    marker_100dpi_labeled = add_labels(marker_100dpi, MARKER_ID, MARKER_SIZE_INCHES, 100)
    save_marker(marker_100dpi_labeled, "aruco_marker_id23_4x4.png")
    print()

    # Generate high resolution marker (300 DPI)
    print("Generating high resolution marker (300 DPI)...")
    marker_300dpi = generate_aruco_marker(MARKER_ID, 1200, 300)
    marker_300dpi_labeled = add_labels(marker_300dpi, MARKER_ID, MARKER_SIZE_INCHES, 300)
    save_marker(marker_300dpi_labeled, "aruco_marker_id23_4x4_high.png")
    print()

    # Generate marker without labels (for advanced users)
    print("Generating clean marker (no labels)...")
    marker_clean = generate_aruco_marker(MARKER_ID, 1200, 300)
    save_marker(marker_clean, "aruco_marker_id23_4x4_clean.png")
    print()

    print("="* 60)
    print("Generation complete!")
    print("="* 60)
    print()
    print("Next steps:")
    print("1. Print 'aruco_marker_id23_4x4_high.png' at 100% scale")
    print("2. Verify printed marker measures exactly 4.0\" × 4.0\"")
    print("3. Laminate for water resistance (optional)")
    print("4. Distribute to tournament participants")
    print()
    print("For best results:")
    print("- Use white matte paper (not glossy)")
    print("- Print at highest quality setting")
    print("- Do not resize or crop the image")
    print()

if __name__ == "__main__":
    main()
