from PIL import Image, ImageDraw, ImageFont
import json

with open('position-data.json', 'r') as file:
    json_data = json.load(file)

scale = 2

offset = 128 * scale

width = float(json_data["width"])/16 * scale
height = float(json_data["height"])/16 * scale
positions = json_data["positions"]
maps = json_data["maps"]
data = json_data["data"]

print(width, height)

background_color = (255, 255, 255)
image = Image.new('RGB', (int(width) + offset*2, int(height) + offset*2),
                  background_color)

draw = ImageDraw.Draw(image)

rectangle_color = (0, 0, 0)

for mapName in positions:
    pos = positions[mapName]
    mapData = maps[mapName]
    mapWidth = int(mapData["mapWidth"]) * scale
    mapHeight = int(mapData["mapHeight"]) * scale
    x1 = float(pos["x"])/16 * scale + offset
    y1 = float(pos["y"])/16 * scale + offset
    x2 = float(x1 + mapWidth)
    y2 = float(y1 + mapHeight)
    draw.rectangle((x1, y1, x2, y2), outline=rectangle_color, width=2*scale)


font = ImageFont.truetype("arial.ttf", 8*scale)  # Specify the font and size
text_color = (0, 0, 255)
text_background_color = (255, 255, 0)

for mapName in positions:
    pos = positions[mapName]
    x1 = float(pos["x"])/16 * scale + offset + 10
    y1 = float(pos["y"])/16 * scale + offset + 10

    text = mapName
    text_bbox = draw.textbbox((x1, y1), text, font=font)

    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]

    background_rectangle = (x1, y1, x1 + text_width, y1 + text_height)

    draw.rectangle(background_rectangle, fill=text_background_color)

    draw.text((x1, y1), text, fill=text_color, font=font)

# Save the image
image.save("mapPositions.png")
