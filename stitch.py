import os
import argparse
from PIL import Image

def stitch(pano, res, xtiles, ytiles, inputpath, outputpath):
    # Create a new image with the appropriate size
    im = Image.new("RGB", (xtiles * 256, xtiles * 128), (0, 0, 0))  # Fill with black
    
    for x in range(xtiles):
        for y in range(ytiles):
            tile_path = os.path.join(inputpath, pano, str(res), f"{res}.{x}.{y}.jpg")
            if os.path.exists(tile_path):
                tile = Image.open(tile_path)
                im.paste(tile, (x * 256, y * 256))
            else:
                print(f"Tile not found: {tile_path}")

    # Create output directory if it doesn't exist
    newpath = os.path.join(outputpath, pano)
    if not os.path.exists(newpath):
        os.makedirs(newpath)

    # Save the stitched image
    name = os.path.join(newpath, f"{res}.jpg")
    im.save(name)
    print(f"{pano} at resolution {res} saved.")

def main(inputpath, outputpath):
    panos = os.listdir(inputpath)

    for pano in panos:
        resolutions = os.listdir(os.path.join(inputpath, pano))
        for res in resolutions:
            # Determine the maximum indices for x and y tiles
            xtiles = 0
            ytiles = 0
            
            # Find the maximum x index
            while os.path.exists(os.path.join(inputpath, pano, res, f"{res}.{xtiles}.0.jpg")):
                xtiles += 1
            
            # Find the maximum y index
            while os.path.exists(os.path.join(inputpath, pano, res, f"{res}.0.{ytiles}.jpg")):
                ytiles += 1
            
            # Stitch the tiles
            stitch(pano, res, xtiles, ytiles, inputpath, outputpath)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Stitch Yandex panorama tiles into images.")
    parser.add_argument('-input', required=True, help="Input path containing the tiles.")
    parser.add_argument('-output', required=True, help="Output path for stitched images.")
    args = parser.parse_args()

    main(args.input, args.output)
