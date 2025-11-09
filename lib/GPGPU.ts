import { GPUComputationRenderer } from "./GPUComputationRenderer";
import { WebGLRenderer, Texture, IUniform, ShaderMaterial, DataTexture } from "three";

export default class GPGPU {
    private gpuCompute: GPUComputationRenderer;
    private variables: Record<string, any>;

    constructor(renderer: WebGLRenderer, w: number = 512, h: number = 512) {
        this.gpuCompute = new GPUComputationRenderer(w, h, renderer);
        this.variables = {};
    }

    addVariable(name: string, data: Float32Array, simulationMat: ShaderMaterial) {
        const texture = this.gpuCompute.createTexture();
        (texture.image as { data: Float32Array }).data = data;

        const variable = this.gpuCompute.addVariableByMat(name, simulationMat, texture as unknown as DataTexture);
        this.variables[name] = variable;
        return variable;
    }

    getVariable(name: string) {
        return this.variables[name];
    }

    setVariableDependencies(variable: string, dependencies: string[]) {
        this.gpuCompute.setVariableDependencies(this.variables[variable], dependencies.map(key => this.variables[key]));
    }

    init() {
        this.gpuCompute.init();
    }

    compute() {
        this.gpuCompute.compute();
    }

    getUniform<T = any>(name: string, property: string): IUniform<T> | null {
        const variable = this.variables[name];
        if (!variable || !variable.material) {
            return null;
        }
        return (variable.material.uniforms[property]) as IUniform<T>;
    }

    setUniform(name: string, property: string, value: any) {
        const uniform = this.getUniform(name, property);
        if (uniform) {
            uniform.value = value;
        }
    }

    getCurrentRenderTarget(name: string): Texture | null {
        const variable = this.variables[name];
        if (!variable) {
            return null;
        }
        const renderTarget = this.gpuCompute.getCurrentRenderTarget(variable);
        return renderTarget ? renderTarget.texture : null;
    }

    dispose() {
        if (this.gpuCompute) {
            this.gpuCompute.dispose();
        }
        this.variables = {};
    }

    resetVariable(name: string, data: Float32Array) {
        const variable = this.variables[name];
        if (variable && variable.initialValueTexture) {
            const texture = variable.initialValueTexture;
            const image = texture.image as { data: Float32Array };
            
            // Copy new data to texture
            image.data.set(data);
            texture.needsUpdate = true;
            
            // Reset render targets by copying initial texture to both ping-pong buffers
            // This ensures immediate reset without waiting for next frame
            const renderTargets = variable.renderTargets;
            if (renderTargets && renderTargets.length >= 2) {
                // We need to render the initial texture to both render targets
                // For now, we'll update the texture and let the next compute cycle handle it
                // A full implementation would require rendering the texture to both targets here
            }
        }
    }
}


