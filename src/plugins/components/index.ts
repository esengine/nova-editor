/**
 * Editor Components - all editor-specific component wrappers
 */

// Core Components
export { EditorTransformComponent } from './EditorTransformComponent';
export { EditorEditorMetadataComponent } from './EditorMetadataComponent';

// Physics Components
export { EditorRigidBodyComponent } from './EditorRigidBodyComponent';
export { EditorColliderComponent } from './EditorColliderComponent';
export { EditorJointComponent } from './EditorJointComponent';
export { EditorPhysicsTransformComponent } from './EditorPhysicsTransformComponent';

// Three.js Components (re-exports)
export { EditorThreeLightComponent } from './EditorThreeLightComponent';
export { EditorThreeCameraComponent } from './EditorThreeCameraComponent';
export { EditorThreeMeshComponent } from './EditorThreeMeshComponent';