import bpy, math, os
from pathlib import Path
try:
    out = str(Path(__file__).resolve().parents[2] / "cinema-booking" / "public" / "models" / "cinema")
except Exception:
    out = r"C:/Users/Admin/Desktop/tlcn/TLCN_test/cinema-booking/public/models/cinema"
os.makedirs(out,exist_ok=True)
original=bpy.context.window.scene
scene=bpy.data.scenes.new('Cinema_Asset_Workshop')
bpy.context.window.scene=scene
fabric=bpy.data.materials.new('Cinema Burgundy Upholstery');fabric.diffuse_color=(.19,.012,.027,1);fabric.use_nodes=True
bs=fabric.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.19,.012,.027,1);bs.inputs['Roughness'].default_value=.72
metal=bpy.data.materials.new('Cinema Black Metal');metal.diffuse_color=(.025,.027,.032,1);metal.use_nodes=True
bs=metal.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(.025,.027,.032,1);bs.inputs['Metallic'].default_value=.65;bs.inputs['Roughness'].default_value=.4
made=[]
def box(name,loc,size,material,bevel=.06,tilt=0):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 o.rotation_euler.x=tilt;o.data.materials.append(material)
 m=o.modifiers.new('Soft upholstery edges','BEVEL');m.width=bevel;m.segments=3
 bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=m.name)
 for face in o.data.polygons:face.use_smooth=True
 made.append(o);return o
try:
 for kind,width in [('standard',.78),('vip',.94),('couple',1.5)]:
  made=[]
  box('Metal pedestal',(0,0,.22),(.38,.48,.44),metal,.025)
  box('Floor plate',(0,0,.035),(width+.12,.72,.07),metal,.02)
  box('Seat cushion',(0,-.05,.5),(width,.73,.24),fabric,.09)
  box('Contoured back',(0,.29,.99),(width,.25,.98),fabric,.1,-.12)
  box('Lumbar cushion',(0,.11,.83),(width*.86,.14,.32),fabric,.055,-.12)
  box('Head cushion',(0,.20,1.32),(width*.85,.18,.25),fabric,.07,-.12)
  for side in [-1,1]:
   x=side*(width/2+.065)
   box('Arm support',(x,0,.52),(.12,.52,.66),metal,.03)
   box('Padded armrest',(x,-.03,.85),(.17,.75,.15),fabric,.05)
   bpy.ops.mesh.primitive_torus_add(major_radius=.052,minor_radius=.012,major_segments=16,minor_segments=6,location=(x,-.27,.94))
   o=bpy.context.object;o.name='Cup holder';o.data.materials.append(metal);made.append(o)
  if kind=='vip':box('Footrest',(0,-.48,.34),(.8,.35,.16),fabric,.06)
  if kind=='couple':box('Center cushion seam',(0,-.06,.63),(.015,.6,.012),metal,.004)
  bpy.ops.object.select_all(action='DESELECT')
  for o in made:o.select_set(True)
  bpy.ops.export_scene.gltf(filepath=os.path.join(out,kind+'.glb'),export_format='GLB',use_selection=True,use_active_scene=True,export_yup=True)
  for o in made:bpy.data.objects.remove(o,do_unlink=True)
 print('EXPORTED',[(f,os.path.getsize(os.path.join(out,f))) for f in ['standard.glb','vip.glb','couple.glb']])
finally:bpy.context.window.scene=original
