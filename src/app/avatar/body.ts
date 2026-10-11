import { BoxGeometry, Color, Group, InstancedMesh, MeshLambertMaterial, Object3D } from 'three';
import { type AvatarPart, avatarParts } from './avatar.model';
import { type Gait, type Move, type Pose, idlePose, movePose, walkPose } from './poses';

/**
 * What the scene needs from a body. The voxel portrait is the only one today; a scanned model will be another
 * implementation (a GLB with an AnimationMixer, its clips named after the gaits and the moves) behind the same four calls.
 */
export interface AvatarBody {
  /** The figure in voxel units: soles at y = 0, centred on x = z = 0, facing +z. The scene turns it. */
  readonly object: Object3D;
  /** Advances by `dt` ms; `look` turns the head (radians); `paused` stops the idle life, not a walk or a move. */
  update(dt: number, gait: Gait, look: number, paused: boolean): void;
  play(move: Move): void;
  /** Colours from the theme: `read` returns a CSS custom property's value. */
  paint(read: (token: string) => string): void;
  dispose(): void;
}

export function voxelBody(): AvatarBody {
  const geometry = new BoxGeometry(0.94, 0.94, 0.94);
  const material = new MeshLambertMaterial();
  const object = new Group();
  // the jump lifts and the spin turns this one; the scene turns `object` to face where it walks
  const body = new Group();
  object.add(body);

  const joints = {} as Record<AvatarPart, Group>;
  const meshes = avatarParts().map(({ part, pivot, voxels }) => {
    const joint = new Group();
    joint.position.set(pivot.x, pivot.y, pivot.z);
    const mesh = new InstancedMesh(geometry, material, voxels.length);
    const dummy = new Object3D();
    voxels.forEach((v, i) => {
      dummy.position.set(v.x + 0.5 - pivot.x, v.y + 0.5 - pivot.y, v.z + 0.5 - pivot.z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    joint.add(mesh);
    body.add(joint);
    joints[part] = joint;
    return { mesh, voxels };
  });

  let idle = 0;
  let walk = 0;
  let move: { name: Move; t: number } | null = null;

  const apply = (pose: Pose, look: number): void => {
    joints.armL.rotation.x = pose.armL;
    joints.armR.rotation.x = pose.armR;
    joints.armR.rotation.z = pose.armRaise;
    joints.legL.rotation.x = pose.legL;
    joints.legR.rotation.x = pose.legR;
    joints.head.rotation.set(pose.nod, look, 0);
    body.rotation.y = pose.spin;
    body.position.y = pose.lift;
  };

  return {
    object,
    update(dt, gait, look, paused) {
      if (!paused) idle += dt;
      walk = gait === 'walk' ? walk + dt : 0;
      let pose = move ? movePose(move.name, (move.t += dt)) : null;
      if (!pose) {
        move = null;
        pose = gait === 'walk' ? walkPose(walk) : idlePose(idle);
      }
      apply(pose, look);
    },
    play(name) {
      move ??= { name, t: 0 };
    },
    paint(read) {
      const color = new Color();
      for (const { mesh, voxels } of meshes) {
        voxels.forEach((v, i) => {
          mesh.setColorAt(i, color.set(read(`--avatar-${v.color}`)));
        });
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      }
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
}
