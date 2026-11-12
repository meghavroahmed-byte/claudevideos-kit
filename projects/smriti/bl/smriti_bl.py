# smriti_bl.py: Blender Cycles hero shots for the smriti short (hybrid with the three.js render).
# Usage: python smriti_bl.py <shot> <out_dir> [samples=16] [res_pct=100] [frame_start] [frame_end]
#   shots: brain (t 18.97-25.37), hippo (t 31.0-36.5), wall (t 39.5-43.8)
# Z-up. Camera looks toward +Y. Each shot's local frame f maps to video time t = T0 + (f-1)/30.
import bpy, bmesh, math, os, sys, random, addon_utils
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
SHOT, OUT = argv[0], argv[1]
SPP = int(argv[2]) if len(argv) > 2 else 16
PCT = int(argv[3]) if len(argv) > 3 else 100
HERE = os.path.dirname(os.path.abspath(__file__))
SHOTS = {'brain': (18.97, 25.37), 'hippo': (31.0, 36.5), 'wall': (39.5, 43.8)}
T0, T1 = SHOTS[SHOT]
NF = round((T1 - T0) * 30)
F0 = int(argv[4]) if len(argv) > 4 else 1
F1 = int(argv[5]) if len(argv) > 5 else NF
fr = lambda t: 1 + round((t - T0) * 30)          # video time -> local frame
random.seed(1912)

bpy.ops.wm.read_factory_settings(use_empty=True)
addon_utils.enable('cycles', default_set=True)
S = bpy.context.scene
S.render.engine = 'CYCLES'; S.cycles.device = 'CPU'
S.cycles.samples = SPP; S.cycles.use_adaptive_sampling = True; S.cycles.use_denoising = True
S.cycles.max_bounces = 4; S.cycles.diffuse_bounces = 2; S.cycles.glossy_bounces = 2; S.cycles.transmission_bounces = 4
S.render.resolution_x, S.render.resolution_y, S.render.resolution_percentage = 1080, 1920, PCT
S.render.fps = 30; S.frame_start, S.frame_end = 1, NF
S.render.use_persistent_data = True
S.render.use_motion_blur = (SHOT == 'wall'); S.render.motion_blur_shutter = 0.4
S.view_settings.view_transform = 'AgX'; S.view_settings.look = 'AgX - Punchy'
S.render.image_settings.file_format = 'PNG'
S.render.use_overwrite = False; S.render.use_placeholder = True  # resumable: skip frames already on disk

# ---------- helpers ----------
def mat(name, color=(1, 1, 1), rough=0.5, emit=None, estr=0.0, sss=0.0, metal=0.0, alpha=1.0, trans=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if sss: b.inputs['Subsurface Weight'].default_value = sss; b.inputs['Subsurface Radius'].default_value = (0.6, 0.25, 0.2)
    if emit: b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = estr
    if trans: b.inputs['Transmission Weight'].default_value = trans
    if alpha < 1: b.inputs['Alpha'].default_value = alpha
    return m
def bsdf(m): return m.node_tree.nodes['Principled BSDF']
def key(sock_owner, path, f, v):
    setattr(sock_owner, path, v) if not hasattr(sock_owner, 'default_value') else None
def kv(inp, f, v): inp.default_value = v; inp.keyframe_insert('default_value', frame=f)
def obj(name, data, loc=(0, 0, 0), m=None):
    o = bpy.data.objects.new(name, data); bpy.context.collection.objects.link(o); o.location = loc
    if m: o.data.materials.append(m)
    return o
def prim(op, m=None, **kw):
    getattr(bpy.ops.mesh, op)(**kw); o = bpy.context.object
    if m: o.data.materials.append(m)
    return o
def smooth(o):
    for p in o.data.polygons: p.use_smooth = True

# ---------- world: dusk sky + meadow ----------
W = bpy.data.worlds.new('W'); S.world = W; W.use_nodes = True
nt = W.node_tree; sky = nt.nodes.new('ShaderNodeTexSky'); sky.sky_type = 'MULTIPLE_SCATTERING'
sky.sun_elevation = math.radians(4); sky.sun_rotation = math.radians(90); sky.altitude = 200
bg = nt.nodes['Background']; bg.inputs['Strength'].default_value = 0.35
nt.links.new(sky.outputs['Color'], bg.inputs['Color'])
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3.0; sun.color = (1.0, 0.72, 0.5); sun.angle = math.radians(3)
so = obj('sun', sun); so.rotation_euler = (math.radians(84), 0, math.radians(180))
fill = bpy.data.lights.new('fill', 'AREA'); fill.energy = 600; fill.size = 12; fill.color = (0.75, 0.8, 1.0)

gm = bpy.data.materials.new('ground'); gm.use_nodes = True
gn = gm.node_tree.nodes; gb = gn['Principled BSDF']; gb.inputs['Roughness'].default_value = 0.95
noise = gn.new('ShaderNodeTexNoise'); noise.inputs['Scale'].default_value = 0.35; noise.inputs['Detail'].default_value = 6
ramp = gn.new('ShaderNodeValToRGB'); ramp.color_ramp.elements[0].color = (0.10, 0.22, 0.07, 1); ramp.color_ramp.elements[1].color = (0.30, 0.42, 0.12, 1)
gm.node_tree.links.new(noise.outputs['Fac'], ramp.inputs['Fac']); gm.node_tree.links.new(ramp.outputs['Color'], gb.inputs['Base Color'])
bump = gn.new('ShaderNodeBump'); n2 = gn.new('ShaderNodeTexNoise'); n2.inputs['Scale'].default_value = 60
gm.node_tree.links.new(n2.outputs['Fac'], bump.inputs['Height']); gm.node_tree.links.new(bump.outputs['Normal'], gb.inputs['Normal'])
ground = prim('primitive_plane_add', gm, size=400)
# grass: hair particles on a bed around the subjects (the camera only sees the near field; DOF softens it)
bed = prim('primitive_plane_add', gm, size=60, location=(0, 18, 0.005))
grass_m = mat('grass', (0.2, 0.42, 0.1), 0.6); bed.data.materials.append(grass_m)
ps = bed.modifiers.new('grass', 'PARTICLE_SYSTEM').particle_system.settings
ps.type = 'HAIR'; ps.count = 60000; ps.hair_length = 0.32; ps.emit_from = 'FACE'; ps.use_emit_random = True
ps.root_radius = 0.5; ps.tip_radius = 0.0; ps.material = 2; ps.child_type = 'NONE'
bed.particle_systems[0].seed = 3
# trees (background, blurred by DOF)
leaf = mat('leaf', (0.08, 0.2, 0.06), 0.8); bark = mat('bark', (0.12, 0.08, 0.05), 0.9)
for i in range(70):
    side = 1 if i % 2 else -1
    x = side * random.uniform(12, 70); y = random.uniform(5, 140); s = random.uniform(0.8, 1.6)
    t = prim('primitive_cylinder_add', bark, radius=0.3 * s, depth=5 * s, location=(x, y, 2.5 * s))
    for b in range(4):
        c = prim('primitive_ico_sphere_add', leaf, subdivisions=2, radius=random.uniform(1.6, 2.4) * s,
                 location=(x + random.uniform(-1.4, 1.4) * s, y + random.uniform(-1.4, 1.4) * s, (5.2 + random.uniform(-0.5, 1.2)) * s))
        smooth(c)

# ---------- props ----------
stone = mat('stone', (0.36, 0.35, 0.40), 0.75)
def pedestal(x, y, r, col):
    p = prim('primitive_cylinder_add', stone, vertices=6, radius=r, depth=1.2, location=(x, y, 0.6))
    rim = prim('primitive_cylinder_add', mat('rim' + str(x), col, 0.3, col, 5.0), vertices=6, radius=r * 1.012, depth=0.07, location=(x, y, 1.18), end_fill_type='NOTHING')
    return p

def pic_mat(name):
    m = bpy.data.materials.new('pic_' + name); m.use_nodes = True; n = m.node_tree.nodes; b = n['Principled BSDF']
    tx = n.new('ShaderNodeTexImage'); tx.image = bpy.data.images.load(os.path.join(HERE, 'pics', 'pic_%s.png' % name))
    m.node_tree.links.new(tx.outputs['Color'], b.inputs['Base Color']); m.node_tree.links.new(tx.outputs['Color'], b.inputs['Emission Color'])
    b.inputs['Emission Strength'].default_value = 0.35; b.inputs['Roughness'].default_value = 0.4
    return m
frame_m = mat('frame', (0.93, 0.91, 0.86), 0.5)
def polaroid(name, loc, s=1.0):
    root = bpy.data.objects.new('pol_' + name, None); bpy.context.collection.objects.link(root); root.location = loc; root.scale = (s, s, s)
    f = prim('primitive_cube_add', frame_m, size=1); f.scale = (0.5, 0.02, 0.6); f.parent = root
    p = prim('primitive_plane_add', pic_mat(name), size=0.86); p.rotation_euler = (math.radians(90), 0, 0); p.location = (0, -0.025, 0.08); p.parent = root
    f.location = (0, 0, 0)
    return root

def brain(loc, s, col):
    parts = []
    m = mat('brain', col, 0.42, col, 0.0, sss=0.35)
    n = m.node_tree.nodes; geo = n.new('ShaderNodeNewGeometry'); cr = n.new('ShaderNodeValToRGB')
    cr.color_ramp.elements[0].position = 0.47; cr.color_ramp.elements[0].color = (col[0] * 0.35, col[1] * 0.25, col[2] * 0.3, 1)
    cr.color_ramp.elements[1].position = 0.53; cr.color_ramp.elements[1].color = (*col, 1)
    m.node_tree.links.new(geo.outputs['Pointiness'], cr.inputs['Fac']); m.node_tree.links.new(cr.outputs['Color'], bsdf(m).inputs['Base Color'])
    for sx in (-1, 1):
        o = prim('primitive_uv_sphere_add', m, segments=160, ring_count=120, radius=1, location=loc)
        for v in o.data.vertices:
            x, y, z = v.co
            fold = 0.06 * abs(math.sin(11 * x + 5 * math.sin(7 * z)) * math.sin(10 * y + 4 * math.sin(6 * x))) + 0.035 * abs(math.sin(23 * z + 9 * y + 3 * math.sin(8 * x)))
            v.co *= (1 + fold)
        o.scale = (0.55 * s, 1.15 * s, 0.78 * s); o.location = (loc[0] + sx * 0.52 * s, loc[1], loc[2])
        smooth(o); o.modifiers.new('sub', 'SUBSURF').levels = 1; parts.append(o)
    c = prim('primitive_uv_sphere_add', m, segments=48, ring_count=32, radius=1, location=(loc[0], loc[1] + 0.78 * s, loc[2] - 0.62 * s))
    c.scale = (0.75 * s, 0.4 * s, 0.36 * s); smooth(c)
    hm = mat('hippo', (0.3, 0.85, 1.0), 0.3, (0.33, 0.88, 1.0), 0.5)
    for sx in (-1, 1):
        cu = bpy.data.curves.new('hc', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.055 * s; cu.bevel_resolution = 4
        sp = cu.splines.new('BEZIER'); pts = [(0.3, -0.45, -0.35), (0.45, -0.1, -0.3), (0.48, 0.3, -0.15), (0.4, 0.5, 0.1), (0.28, 0.35, 0.25)]
        sp.bezier_points.add(len(pts) - 1)
        for bp, (x, y, z) in zip(sp.bezier_points, pts):
            bp.co = (loc[0] + sx * x * s, loc[1] + y * s, loc[2] + z * s); bp.handle_left_type = bp.handle_right_type = 'AUTO'
        h = obj('hippo%d' % sx, cu, m=hm)
    return m, hm

def camera(name, keys, fstop=2.8, lens=40):
    cd = bpy.data.cameras.new(name); cd.lens = lens; cd.dof.use_dof = True; cd.dof.aperture_fstop = fstop
    co = obj(name, cd); S.camera = co
    tgt = bpy.data.objects.new(name + '_tgt', None); bpy.context.collection.objects.link(tgt)
    tc = co.constraints.new('TRACK_TO'); tc.target = tgt; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
    cd.dof.focus_object = tgt
    for t, p, l in keys:
        co.location = p; co.keyframe_insert('location', frame=fr(t)); tgt.location = l; tgt.keyframe_insert('location', frame=fr(t))
    return co, tgt

def shake(co, t, amp):
    f = fr(t)
    for k in range(0, 14):
        a = amp * (1 - k / 14)
        co.delta_location = (math.sin(k * 2.7) * a, 0, math.cos(k * 3.1) * a); co.keyframe_insert('delta_location', frame=f + k)
    co.delta_location = (0, 0, 0); co.keyframe_insert('delta_location', frame=f + 14)

# ---------- shots ----------
if SHOT in ('brain', 'hippo'):
    BL = (0, 20, 5.2)
    pedestal(0, 20, 3.2, (1.0, 0.55, 0.75))
    bm, hm = brain(BL, 3.0, (0.86, 0.36, 0.52))
    bsdf(bm).inputs['Coat Weight'].default_value = 0.4
    fo = obj('fill', fill, (6, 4, 12)); fo.rotation_euler = (math.radians(55), 0, math.radians(200))

if SHOT == 'brain':
    b = bsdf(bm)
    kv(b.inputs['Emission Strength'], fr(18.97), 0.0); kv(b.inputs['Emission Strength'], fr(19.6), 0.3)
    co, tg = camera('cam', [(18.97, (16, 12.5, 8.0), BL), (22.0, (16.5, 19.5, 8.8), BL), (25.37, (15, 27, 9.4), BL)], fstop=1.6, lens=42)
    shake(co, 19.0, 0.18)
    # REC light
    rec = prim('primitive_uv_sphere_add', mat('rec', (1, 0.1, 0.1), 0.3, (1, 0.12, 0.12), 0.0), radius=0.22, location=(BL[0] + 2.2, BL[1] - 2.0, BL[2] + 2.4))
    rb = bsdf(rec.data.materials[0])
    for f in range(fr(21.4), fr(25.37) + 1, 6):
        kv(rb.inputs['Emission Strength'], f, 25.0 if (f // 6) % 2 else 0.5)
    # memory photos spiral into the brain
    names = ['steps', 'ma', 'cake', 'ball', 'mom', 'home', 'moon']
    for i, n in enumerate(names):
        p = polaroid(n, (0, 0, 0), 1.0)
        for f in range(fr(21.0), fr(25.37) + 1, 2):
            t = T0 + (f - 1) / 30
            k = ((t - 21.6) * 0.45 + i / len(names)) % 1 if t > 21.6 else 0
            a = i * 0.9 + t * 0.6; r = 6.5 * (1 - k)
            p.location = (BL[0] + math.cos(a) * r, BL[1] + math.sin(a) * r * 0.7, BL[2] + math.sin(a * 1.7) * 1.4 * (1 - k))
            sc = 1.0 * (1 - k * 0.8) if t > 21.6 else 0.001
            p.scale = (sc, sc, sc); p.rotation_euler = (0, 0, a * 0.3)
            p.keyframe_insert('location', frame=f); p.keyframe_insert('scale', frame=f); p.keyframe_insert('rotation_euler', frame=f)

if SHOT == 'hippo':
    b = bsdf(bm); b.inputs['Emission Strength'].default_value = 0.25
    b.inputs['Transmission Weight'].default_value = 0.75; b.inputs['Roughness'].default_value = 0.25
    hb = bsdf(hm)
    for f in range(1, NF + 1, 3):
        t = T0 + (f - 1) / 30; kv(hb.inputs['Emission Strength'], f, 4.0 + 2.5 * math.sin(t * 9))
    co, tg = camera('cam', [(31.0, (3.5, 12.0, 6.6), (0.6, 19.8, 4.4)), (36.5, (-2.6, 12.6, 6.2), (-0.4, 20.2, 4.4))], fstop=1.8, lens=50)
    # neurons: emissive specks emitted from the hippocampus, no gravity
    neur_m = mat('neur', (0.7, 0.95, 1), 0.3, (0.55, 0.92, 1.0), 12.0)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1, location=(0, 0, -50)); speck = bpy.context.object; speck.data.materials.append(neur_m)
    for sx in (-1, 1):
        h = bpy.data.objects['hippo%d' % sx]
        bpy.context.view_layer.objects.active = h; h.select_set(True)
        bpy.ops.object.convert(target='MESH'); h = bpy.context.object
        pp = h.modifiers.new('neurons', 'PARTICLE_SYSTEM').particle_system.settings
        pp.count = 2200; pp.frame_start = 1 - 30; pp.frame_end = NF; pp.lifetime = 70; pp.lifetime_random = 0.4
        pp.normal_factor = 0.9; pp.factor_random = 0.6; pp.effector_weights.gravity = 0; pp.render_type = 'OBJECT'; pp.instance_object = speck
        pp.particle_size = 0.035; pp.size_random = 0.6; pp.use_rotations = False
        h.select_set(False)

if SHOT == 'wall':
    WY = 20
    fo = obj('fill', fill, (4, WY - 10, 9)); fo.rotation_euler = (math.radians(60), 0, math.radians(180))
    brick = mat('brick', (0.42, 0.2, 0.12), 0.8)
    newb = mat('newbrick', (0.08, 0.2, 0.3), 0.4, (0.33, 0.88, 1.0), 1.2)
    bpy.ops.rigidbody.world_add(); S.rigidbody_world.point_cache.frame_start = 1; S.rigidbody_world.point_cache.frame_end = NF
    S.rigidbody_world.substeps_per_frame = 10
    bpy.context.view_layer.objects.active = ground; bpy.ops.rigidbody.object_add(type='PASSIVE')
    COLS, ROWS = 14, 9
    for r in range(ROWS):
        for c in range(COLS):
            x = (c - COLS / 2 + 0.5 + (r % 2) * 0.5) * 1.0
            o = prim('primitive_cube_add', brick, size=1, location=(x, WY, 0.25 + r * 0.5)); o.scale = (0.48, 0.24, 0.24)
            bpy.ops.object.transform_apply(scale=True)
            bpy.ops.rigidbody.object_add(type='ACTIVE'); o.rigid_body.mass = 1.0; o.rigid_body.friction = 0.6
            o.rigid_body.use_deactivation = True; o.rigid_body.use_start_deactivated = True
            # new glowing bricks rising behind
            n = prim('primitive_cube_add', newb, size=1, location=(x, WY + 1.2, -4)); n.scale = (0.48, 0.24, 0.24)
            f0 = fr(41.4 + random.uniform(0, 0.35) + r * 0.13)
            n.keyframe_insert('location', frame=f0); n.location.z = 0.25 + r * 0.5; n.keyframe_insert('location', frame=f0 + 12)
    for i, nm in enumerate(['cake', 'mom', 'home']):
        p = polaroid(nm, ((i - 1) * 3.4, WY - 0.3, 2.9), 1.5)
    # ram: invisible kinematic slab that punches through at 39.8 s
    ram = prim('primitive_cube_add', None, size=1, location=(0, WY + 3, 2.2)); ram.scale = (7, 0.5, 2.6); ram.hide_render = True
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.rigidbody.object_add(type='PASSIVE'); ram.rigid_body.kinematic = True
    ram.keyframe_insert('location', frame=fr(39.75)); ram.location.y = WY - 6; ram.keyframe_insert('location', frame=fr(40.1))
    # the photos on the wall fall with keyed tumble
    for i, nm in enumerate(['cake', 'mom', 'home']):
        p = bpy.data.objects['pol_' + nm]
        p.keyframe_insert('location', frame=fr(39.85)); p.keyframe_insert('rotation_euler', frame=fr(39.85))
        p.location = ((i - 1) * 4.2, WY - 3.5, 0.15); p.rotation_euler = (math.radians(85), 0, math.radians((i - 1) * 40))
        p.keyframe_insert('location', frame=fr(40.7)); p.keyframe_insert('rotation_euler', frame=fr(40.7))
    co, tg = camera('cam', [(39.5, (-4, WY - 17, 6.5), (0, WY, 3)), (43.8, (2.5, WY - 14, 7.5), (0, WY, 2.8))], fstop=3.2, lens=36)
    shake(co, 39.8, 0.25)
    bpy.ops.ptcache.bake_all(bake=True)

S.frame_start, S.frame_end = F0, F1
os.makedirs(OUT, exist_ok=True)
S.render.filepath = os.path.join(OUT, '')
print('RENDERING', SHOT, F0, F1, 'of', NF)
bpy.ops.render.render(animation=True)
