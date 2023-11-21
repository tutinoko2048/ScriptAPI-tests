import pybedrock as bedrock
import json 

world_path = 'worlds/test'

rawdata = bedrock.loadbinary(world_path, 'scoreboard')
scoreboard = bedrock.readNBT(rawdata)

with open('scoreboard.json', 'w') as f:
    json.dump(scoreboard, f, indent=2)
