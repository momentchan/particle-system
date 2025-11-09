// Vertex shader for instanced mesh rendering
export const INSTANCED_VERTEX_SHADER = /*glsl*/ `
uniform sampler2D positionTex;
uniform sampler2D velocityTex;
uniform float time;
uniform float sizeMultiplier;
uniform float instanceCount;

varying vec3 vColor;
varying float vAge;
varying vec3 vVelocity;

void main() {
  // Calculate UV from instance ID (WebGL 2.0)
  float instanceId = float(gl_InstanceID);
  float textureSize = sqrt(instanceCount);
  float u = mod(instanceId, textureSize) / textureSize;
  float v = floor(instanceId / textureSize) / textureSize;
  vec2 uv = vec2(u, v);
  
  vec4 pos = texture2D(positionTex, uv);
  vec4 vel = texture2D(velocityTex, uv);
  
  vColor = color;
  vAge = pos.w;
  vVelocity = vel.xyz;
  
  // Transform vertex by instance matrix, then add position from texture
  vec4 localPos = instanceMatrix * vec4(position * sizeMultiplier, 1.0);
  localPos.xyz += pos.xyz;
  
  vec4 mvPosition = modelViewMatrix * localPos;
  gl_Position = projectionMatrix * mvPosition;
}
`;

// Fragment shader for instanced mesh
export const INSTANCED_FRAGMENT_SHADER = /*glsl*/ `
uniform float opacity;
varying vec3 vColor;
varying float vAge;
varying vec3 vVelocity;

void main() {
  gl_FragColor = vec4(vColor, opacity);
}
`;
