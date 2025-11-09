export const DEFAULT_VERTEX_SHADER = /*glsl*/ `
uniform sampler2D positionTex;
uniform float time;
uniform float sizeMultiplier;

attribute float size;

varying vec3 vColor;
varying float vAge;

void main() {
  vec4 pos = texture2D(positionTex, uv);
  vColor = color;
  vAge = pos.w;
  
  vec4 mvPosition = modelViewMatrix * vec4(pos.xyz, 1.0);
  gl_PointSize = size * sizeMultiplier * (300.0 / -mvPosition.z);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const DEFAULT_FRAGMENT_SHADER = /*glsl*/ `
uniform float opacity;
varying vec3 vColor;
varying float vAge;

void main() {
  // Create circular particles
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);
  
  if (dist > 0.5) discard;
  
  gl_FragColor = vec4(vColor, opacity);
}
`;

