# sfbulk.py: fill _assets/sf with one good CC0/CC-BY model per entry (skips existing). Picks most-liked candidate with faceCount<200k and glb<=45MB.
import json, os, sys, urllib.request, urllib.parse, subprocess, time
K = os.path.dirname(os.path.abspath(__file__)); A = f'{K}/../_assets/sf'
OK = {'CC Attribution', 'CC0 Public Domain', 'Free Standard'}
H = {'User-Agent': 'asset-fetch/1.0'}
def get(u, auth=False):
    h = dict(H); 
    if auth: h['Authorization'] = 'Token proxy-injected'
    return json.loads(urllib.request.urlopen(urllib.request.Request(u, headers=h), timeout=120).read())
ANIMALS = 'hippo mosquito chameleon honey_bee great_white_shark grizzly_bear octopus african_elephant cheetah anaconda crocodile lion tiger wolf horse cow dog cat ant spider eagle humpback_whale dolphin gorilla chimpanzee deer camel penguin polar_bear frog goldfish jellyfish giraffe zebra rhinoceros kangaroo owl bat scorpion butterfly housefly cockroach sea_turtle chicken snake rabbit pig sheep goat squirrel parrot crow pigeon mouse hamster lizard tarantula'.split()
OTHER = {
 # anatomy
 'human_brain': 'human brain anatomy', 'human_heart': 'human heart anatomy', 'human_skeleton': 'human skeleton', 'human_skull': 'human skull', 'lungs': 'human lungs anatomy',
 'stomach': 'human stomach anatomy', 'human_eye': 'human eye anatomy', 'ear_anatomy': 'human ear anatomy', 'tooth': 'human tooth anatomy', 'hand_bones': 'human hand bones',
 'intestines': 'human intestines anatomy', 'red_blood_cells': 'red blood cells', 'muscles': 'human muscles anatomy', 'kidney': 'kidney anatomy', 'neuron': 'neuron cell', 'virus': 'virus', 'bacteria': 'bacteria', 'dna': 'dna helix',
 # history
 'knight_armor': 'medieval knight armor', 'roman_soldier': 'roman legionary', 'gladiator_helmet': 'gladiator helmet', 'samurai_armor': 'samurai armor', 'katana': 'katana sword',
 'viking_ship': 'viking ship', 'viking_helmet': 'viking helmet', 'sarcophagus': 'egyptian sarcophagus', 'mummy': 'egyptian mummy', 'pyramid': 'egyptian pyramid', 'sphinx': 'sphinx',
 'castle': 'medieval castle', 'catapult': 'medieval catapult', 'trebuchet': 'trebuchet', 'battering_ram': 'battering ram', 'caveman': 'caveman', 'stone_axe': 'stone age axe', 'spear': 'spear',
 'torch_fire': 'torch fire', 'campfire': 'campfire', 'colosseum': 'colosseum', 'plague_doctor': 'plague doctor', 'leech': 'leech', 'stone_block': 'limestone block',
 # vehicles / places
 'airliner': 'passenger airplane boeing', 'airplane_cabin': 'airplane cabin interior', 'car_sedan': 'realistic car', 'ambulance': 'ambulance', 'helicopter': 'helicopter', 'lifeboat': 'life raft',
 'submarine': 'submarine', 'elevator': 'elevator cabin', 'rocket': 'rocket launch', 'astronaut': 'astronaut', 'space_station': 'international space station', 'lunar_module': 'apollo lunar module',
 'earth': 'planet earth', 'moon': 'moon', 'sun': 'sun star', 'black_hole': 'black hole', 'volcano': 'volcano', 'iceberg': 'iceberg', 'mount_everest': 'mount everest', 'house': 'suburban house',
 # everyday
 'coffee_cup': 'coffee cup', 'sugar_cubes': 'sugar cubes', 'donut': 'donut', 'chewing_gum': 'chewing gum', 'smartphone': 'smartphone', 'bed': 'bed realistic', 'toilet': 'toilet', 'toothbrush': 'toothbrush',
 'water_bottle': 'water bottle', 'ice_cream': 'ice cream cone', 'oxygen_tank': 'oxygen tank', 'parachute': 'parachute', 'tent': 'camping tent', 'surfboard': 'surfboard', 'raft': 'inflatable raft',
}
ANIMALS += 'leopard jaguar hyena buffalo moose bison koala panda red_panda sloth otter beaver raccoon fox hedgehog seal walrus sea_lion orca manta_ray stingray swordfish piranha clownfish seahorse starfish crab lobster shrimp squid snail earthworm mantis grasshopper ladybug dragonfly wasp hornet beetle termite tick flea vulture hawk flamingo peacock ostrich hummingbird duck swan goose toucan woodpecker komodo_dragon iguana gecko cobra python_snake rattlesnake alligator tortoise salamander axolotl dinosaur t_rex mammoth sabertooth'.split()
OTHER.update({k: k.replace('_', ' ') for k in '''human_liver human_pancreas spinal_cord human_nose human_tongue vocal_cords human_ribcage human_pelvis femur_bone human_spine blood_vessels white_blood_cell platelet stomach_acid sweat_gland hair_follicle fingernail skin_layers eyeball retina inner_ear eardrum diaphragm_anatomy appendix bladder_anatomy uterus_anatomy fetus
roman_helmet roman_shield gladius_sword spartan_helmet medieval_sword longbow crossbow chainmail shield_medieval siege_tower castle_gate drawbridge cannon_old musket pirate_ship treasure_chest_old egyptian_chariot anubis_statue pharaoh_mask papyrus hieroglyph_wall greek_temple stonehenge totem_pole teepee igloo yurt
fire_truck police_car school_bus bicycle motorcycle tractor train_locomotive subway_train cruise_ship sailboat canoe kayak jet_ski hot_air_balloon fighter_jet cargo_plane drone satellite mars_rover space_shuttle spacesuit_helmet ufo asteroid comet saturn jupiter mars_planet galaxy
skyscraper bridge_suspension lighthouse windmill wind_turbine oil_rig gas_station hospital_bed operating_table wheelchair stethoscope syringe pill_bottle microscope_lab test_tube x_ray_machine mri_machine
pizza burger hot_dog french_fries sandwich sushi ramen_bowl apple_fruit banana_fruit watermelon cake_slice chocolate_bar candy_lollipop soda_can energy_drink milk_carton cereal_box egg_fried bread_loaf cheese_wheel
laptop desktop_computer television_modern headphones camera_dslr alarm_clock_digital light_bulb battery power_outlet microwave refrigerator washing_machine vacuum_cleaner sofa_modern office_chair desk_modern bookshelf
tree_oak palm_tree bamboo cactus mushroom flower_rose sunflower grass_patch rock_cliff waterfall_model cave_entrance desert_dune snowman ice_cube lava_rock crystal_gem gold_bar coin_pile money_stack
football_ball basketball tennis_racket boxing_gloves dumbbell treadmill skateboard surf_wave trophy medal
'''.split()})
todo = [(a, a.replace('_', ' '), True) for a in ANIMALS] + [(k, q, False) for k, q in OTHER.items()]
if len(sys.argv) > 1: todo = [t for t in todo if t[0] in sys.argv[1:]]
os.makedirs(A, exist_ok=True)
for name, q, anim in todo:
    if os.path.exists(f'{A}/{name}.glb'): continue
    done = False
    for extra, minf in ([({'animated': 'true'}, 8000), ({}, 8000), ({'animated': 'true'}, 0)] if anim else [({}, 8000), ({}, 0)]):
        try:
            d = get('https://api.sketchfab.com/v3/search?' + urllib.parse.urlencode({'type': 'models', 'q': q, 'downloadable': 'true', 'count': 24, 'sort_by': '-likeCount', **extra}))
        except Exception as e: print('search fail', name, e); time.sleep(5); continue
        for m in d['results']:
            lic = (m.get('license') or {}).get('label', '')
            if lic not in OK or not (minf <= m.get('faceCount', 0) <= 200000): continue
            try:
                dd = get(f"https://api.sketchfab.com/v3/models/{m['uid']}/download", True)
                if 'glb' not in dd or dd['glb']['size'] > 45e6: continue
            except Exception as e: print('dl info fail', name, e); time.sleep(3); continue
            r = subprocess.run(['python3', f'{K}/getsf.py', 'get', m['uid'], name], capture_output=True, text=True)
            print(name, '<-', m['name'][:40], '|', r.stdout.strip()[:80], r.stderr.strip()[-120:]); done = True; break
        if done: break
    if not done: print('NONE', name)
